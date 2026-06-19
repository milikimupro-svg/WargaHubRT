import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

let currentDirname = "";
try {
  currentDirname = __dirname;
} catch (e) {
  currentDirname = path.dirname(fileURLToPath(import.meta.url));
}

const app = express();
const PORT = 3000;

// Enable JSON bodies up to 10mb for proof upload base64 images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database Helper Functions
const DB_PATH = path.join(currentDirname, "data", "db.json");

function readDb(): any {
  try {
    if (!fs.existsSync(DB_PATH)) {
      // Return basic structure if file hasn't been created
      return {
        warga: [],
        transaksi: [],
        targetDana: [],
        usulanVoting: [],
        auditLogs: [],
        notificationLogs: [],
        reportOptions: {
          judul: 'LAPORAN BULANAN PERTANGGUNGJAWABAN BENDAHARA',
          pembuat: 'Bpk. Bendahara RT',
          pengesah: 'Ketua RT 04 Jatingaleh',
          catatanKaki: 'Laporan kas ini bersifat transparan dan diperbarui secara real-time demi kerukunan warga RT 04 Jatingaleh.',
          tampilkanTargetDana: true,
          tampilkanTunggakan: true,
          tampilkanMusyawarah: true
        }
      };
    }
    const data = fs.readFileSync(DB_PATH, "utf-8");
    const db = JSON.parse(data);
    if (!db.reportOptions) {
      db.reportOptions = {
        judul: 'LAPORAN BULANAN PERTANGGUNGJAWABAN BENDAHARA',
        pembuat: 'Bpk. Bendahara RT',
        pengesah: 'Ketua RT 04 Jatingaleh',
        catatanKaki: 'Laporan kas ini bersifat transparan dan diperbarui secara real-time demi kerukunan warga RT 04 Jatingaleh.',
        tampilkanTargetDana: true,
        tampilkanTunggakan: true,
        tampilkanMusyawarah: true
      };
    }
    return db;
  } catch (error) {
    console.error("Error reading database file", error);
    return {
      warga: [],
      transaksi: [],
      targetDana: [],
      usulanVoting: [],
      auditLogs: [],
      notificationLogs: [],
      reportOptions: {
        judul: 'LAPORAN BULANAN PERTANGGUNGJAWABAN BENDAHARA',
        pembuat: 'Bpk. Bendahara RT',
        pengesah: 'Ketua RT 04 Jatingaleh',
        catatanKaki: 'Laporan kas ini bersifat transparan dan diperbarui secara real-time demi kerukunan warga RT 04 Jatingaleh.',
        tampilkanTargetDana: true,
        tampilkanTunggakan: true,
        tampilkanMusyawarah: true
      }
    };
  }
}

function writeDb(data: any): boolean {
  try {
    // Ensure parent dir exists
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Error writing database file", error);
    return false;
  }
}

// Log actions helper
function logAudit(db: any, user: string, role: string, aktivitas: string, kategori: string) {
  const newLog = {
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    user,
    role,
    aktivitas,
    kategori
  };
  db.auditLogs.unshift(newLog); // Place newest at top
}

// ==================== API ENDPOINTS ====================

// 1. Get entire state
app.get("/api/db", (req, res) => {
  const db = readDb();
  res.json(db);
});

// 2. Auth Sim (In-memory, simulation-only for simplified usage and robustness)
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const db = readDb();

  // Rules:
  // - Username: Bendahara / bendahara, password: RT04jaya
  // - Username: Ketua_RT / ketua_rt, password: RT04jaya
  // - Username: <No KK warga>, password: wargart04jaya
  const lowerUser = username ? username.toLowerCase() : "";
  if ((username === "Bendahara" || lowerUser === "bendahara") && password === "RT04jaya") {
    logAudit(db, "Bendahara", "bendahara", "Login berhasil sebagai Bendahara", "login");
    writeDb(db);
    return res.json({
      success: true,
      user: { username: "Bendahara", role: "bendahara" }
    });
  } else if ((username === "Ketua_RT" || lowerUser === "ketua_rt" || username === "Ketua RT") && password === "RT04jaya") {
    logAudit(db, "Ketua RT", "ketua_rt", "Login berhasil sebagai Ketua RT", "login");
    writeDb(db);
    return res.json({
      success: true,
      user: { username: "Ketua RT", role: "ketua_rt" }
    });
  } else {
    // Check if it's a citizen KK
    const matched = db.warga.find((w: any) => w.kk === username);
    if (matched && password === "wargart04jaya") {
      logAudit(db, matched.kepalaKeluarga, "warga", `Login berhasil sebagai warga (KK: ${username})`, "login");
      writeDb(db);
      return res.json({
        success: true,
        user: { username: matched.kepalaKeluarga, role: "warga", kkNumber: matched.kk }
      });
    }
  }

  res.status(401).json({ success: false, message: "Kredensial tidak valid. Gunakan 'Bendahara' / 'RT04jaya', 'Ketua_RT' / 'RT04jaya', atau 'No KK warga' / 'wargart04jaya'." });
});

// 3. Manage Warga (Create or Update)
app.post("/api/warga", (req, res) => {
  const { kk, kepalaKeluarga, alamat, noWhatsApp, status, iuranWajib, jatuhTempo, editorName, editorRole } = req.body;
  
  if (!kk || !kepalaKeluarga || !alamat || !noWhatsApp) {
    return res.status(400).json({ success: false, message: "Lengkapi semua data utama warga." });
  }

  const db = readDb();
  const existingIndex = db.warga.findIndex((w: any) => w.kk === kk);

  if (existingIndex > -1) {
    // Audit log before changes
    const prev = db.warga[existingIndex];
    let changes = [];
    if (prev.kepalaKeluarga !== kepalaKeluarga) changes.push(`nama ${prev.kepalaKeluarga} -> ${kepalaKeluarga}`);
    if (prev.iuranWajib !== Number(iuranWajib)) changes.push(`iuran Rp${prev.iuranWajib} -> Rp${iuranWajib}`);
    if (prev.status !== status) changes.push(`status ${prev.status} -> ${status}`);
    
    db.warga[existingIndex] = {
      ...db.warga[existingIndex],
      kepalaKeluarga,
      alamat,
      noWhatsApp,
      status,
      iuranWajib: Number(iuranWajib),
      jatuhTempo: Number(jatuhTempo)
    };

    const actionText = `Mengubah data warga KK ${kk} (${changes.join(", ") || "tidak ada perubahan field utama"})`;
    logAudit(db, editorName || "bendahara", editorRole || "bendahara", actionText, "warga");
  } else {
    // Add new
    const newWarga = {
      kk,
      kepalaKeluarga,
      alamat,
      noWhatsApp,
      status: status || 'aktif',
      iuranWajib: Number(iuranWajib) || 50000,
      jatuhTempo: Number(jatuhTempo) || 10,
      riwayatPembayaran: []
    };
    db.warga.push(newWarga);
    
    logAudit(db, editorName || "bendahara", editorRole || "bendahara", `Menambahkan warga baru: ${kepalaKeluarga} (KK: ${kk})`, "warga");
  }

  writeDb(db);
  res.json({ success: true, db });
});

// Delete warga
app.delete("/api/warga/:kk", (req, res) => {
  const { kk } = req.params;
  const { editorName, editorRole } = req.query;
  const db = readDb();
  
  const idx = db.warga.findIndex((w: any) => w.kk === kk);
  if (idx > -1) {
    const name = db.warga[idx].kepalaKeluarga;
    db.warga.splice(idx, 1);
    
    // Integrate deleted citizens with financial reports by deleting associated payments/ledger records
    const initialTxCount = db.transaksi.length;
    db.transaksi = db.transaksi.filter((t: any) => t.kkTerkait !== kk);
    const deletedTxCount = initialTxCount - db.transaksi.length;
    
    logAudit(
      db, 
      (editorName as string) || "bendahara", 
      (editorRole as string) || "bendahara", 
      `Menghapus data warga: ${name} (KK: ${kk}) serta mengintegrasikan data dengan menghapus ${deletedTxCount} transaksi kas terkait.`, 
      "warga"
    );
    writeDb(db);
    res.json({ success: true, db });
  } else {
    res.status(404).json({ success: false, message: "Warga tidak ditemukan." });
  }
});

// 4. Record Transaction
app.post("/api/transaksi", (req, res) => {
  const { nominal, tipe, kategori, keterangan, buktiTransaksi, kkTerkait, bulanIuran, pembuat, pembuatRole } = req.body;
  if (!nominal || !tipe || !kategori || !keterangan) {
    return res.status(400).json({ success: false, message: "Nominal, tipe, kategori, dan keterangan wajib diisi." });
  }

  const db = readDb();
  const id = `TX-${Date.now()}`;
  
  // Rules:
  // - If it is an expense ('pengeluaran') and >= Rp 1,500,000, it requires approval from Ketua RT
  const isLargeExpense = tipe === 'pengeluaran' && Number(nominal) >= 1500000;
  const statusPersetujuan = isLargeExpense ? 'pending' : 'disetujui';

  const newTx = {
    id,
    tanggal: new Date().toISOString().split("T")[0],
    nominal: Number(nominal),
    tipe,
    kategori,
    keterangan,
    buktiTransaksi: buktiTransaksi || null,
    statusPersetujuan,
    pembuat: pembuat || "bendahara",
    kkTerkait: kkTerkait || null,
    bulanIuran: bulanIuran || null
  };

  db.transaksi.unshift(newTx);

  // If this was a warga's own payment submission (warga uploading proof of iuran)
  if (kkTerkait && tipe === 'pemasukan' && kategori === 'Iuran Bulanan' && bulanIuran) {
    const idx = db.warga.findIndex((w: any) => w.kk === kkTerkait);
    if (idx > -1) {
      // Look for same month to update or push new
      const historyIndex = db.warga[idx].riwayatPembayaran.findIndex((p: any) => p.bulan === bulanIuran);
      const pemb = {
        bulan: bulanIuran,
        tanggalBayar: newTx.tanggal,
        nominal: Number(nominal),
        status: 'pending' as const, // Bendahara must approve iuran
        buktiBayar: buktiTransaksi || "bukti_manual.png"
      };

      if (historyIndex > -1) {
        db.warga[idx].riwayatPembayaran[historyIndex] = pemb;
      } else {
        db.warga[idx].riwayatPembayaran.push(pemb);
      }
    }
  }

  logAudit(
    db, 
    pembuat || "bendahara", 
    pembuatRole || "bendahara", 
    `Mencatat ${tipe} [${kategori}]: Rp${Number(nominal).toLocaleString("id-ID")} - ${keterangan}${isLargeExpense ? " (Menunggu Persetujuan Ketua RT)" : ""}`, 
    "transaksi"
  );

  writeDb(db);
  res.json({ success: true, isLargeExpense, db });
});

// Appreciate/Approve large expense transaction by Chairman (Ketua RT)
app.post("/api/transaksi/:id/approve", (req, res) => {
  const { id } = req.params;
  const { status, catatan, editorName, editorRole } = req.body; // status: 'disetujui' | 'ditolak'
  const db = readDb();

  const idx = db.transaksi.findIndex((t: any) => t.id === id);
  if (idx > -1) {
    db.transaksi[idx].statusPersetujuan = status;
    const desc = db.transaksi[idx].keterangan;
    const nominal = db.transaksi[idx].nominal;
    
    logAudit(
      db, 
      editorName || "ketua_rt", 
      editorRole || "ketua_rt", 
      `Ketua RT ${status === 'disetujui' ? 'MENYETUJUI' : 'MENOLAK'} pengeluaran: Rp${nominal.toLocaleString("id-ID")} untuk "${desc}". Catatan: ${catatan || "-"}`, 
      "persetujuan"
    );
    writeDb(db);
    res.json({ success: true, db });
  } else {
    res.status(404).json({ success: false, message: "Transaksi tidak ditemukan." });
  }
});

// Update/Edit transaction
app.put("/api/transaksi/:id", (req, res) => {
  const { id } = req.params;
  const { nominal, tipe, kategori, keterangan, buktiTransaksi, statusPersetujuan, editorName, editorRole } = req.body;
  const db = readDb();

  const idx = db.transaksi.findIndex((t: any) => t.id === id);
  if (idx > -1) {
    const oldTx = db.transaksi[idx];
    
    // Update fields if provided
    if (nominal !== undefined) db.transaksi[idx].nominal = Number(nominal);
    if (tipe !== undefined) db.transaksi[idx].tipe = tipe;
    if (kategori !== undefined) db.transaksi[idx].kategori = kategori;
    if (keterangan !== undefined) db.transaksi[idx].keterangan = keterangan;
    if (buktiTransaksi !== undefined) db.transaksi[idx].buktiTransaksi = buktiTransaksi;
    if (statusPersetujuan !== undefined) db.transaksi[idx].statusPersetujuan = statusPersetujuan;

    // Handle updating of Warga payment logs too, so everything is beautifully synced/integrated
    if (db.transaksi[idx].kategori === 'Iuran Bulanan' && db.transaksi[idx].kkTerkait && db.transaksi[idx].bulanIuran) {
      const wIdx = db.warga.findIndex((w: any) => w.kk === db.transaksi[idx].kkTerkait);
      if (wIdx > -1) {
        const pIdx = db.warga[wIdx].riwayatPembayaran.findIndex((p: any) => p.bulan === db.transaksi[idx].bulanIuran);
        if (pIdx > -1) {
          db.warga[wIdx].riwayatPembayaran[pIdx].nominal = db.transaksi[idx].nominal;
          if (statusPersetujuan !== undefined) {
            db.warga[wIdx].riwayatPembayaran[pIdx].status = statusPersetujuan;
          }
        }
      }
    }

    logAudit(
      db,
      editorName || "bendahara",
      editorRole || "bendahara",
      `Mengubah data keuangan transaksi ${id}: dari Rp${oldTx.nominal} menjadi Rp${db.transaksi[idx].nominal} (${db.transaksi[idx].keterangan})`,
      "transaksi"
    );

    writeDb(db);
    res.json({ success: true, db });
  } else {
    res.status(404).json({ success: false, message: "Transaksi tidak ditemukan." });
  }
});

// Delete individual transaction
app.delete("/api/transaksi/:id", (req, res) => {
  const { id } = req.params;
  const { editorName, editorRole } = req.query;
  const db = readDb();

  const idx = db.transaksi.findIndex((t: any) => t.id === id);
  if (idx > -1) {
    const tx = db.transaksi[idx];
    db.transaksi.splice(idx, 1);

    // If it is related to citizen fee payment, also revert their paid status to have fully integrated state!
    if (tx.kategori === 'Iuran Bulanan' && tx.kkTerkait && tx.bulanIuran) {
      const wIdx = db.warga.findIndex((w: any) => w.kk === tx.kkTerkait);
      if (wIdx > -1) {
        const pIdx = db.warga[wIdx].riwayatPembayaran.findIndex((p: any) => p.bulan === tx.bulanIuran);
        if (pIdx > -1) {
          // Splice from riwayatPembayaran too so they show as "belum lunas"
          db.warga[wIdx].riwayatPembayaran.splice(pIdx, 1);
        }
      }
    }

    logAudit(
      db,
      (editorName as string) || "bendahara",
      (editorRole as string) || "bendahara",
      `Menghapus transaksi keuangan ${id}: Rp${tx.nominal.toLocaleString("id-ID")} - ${tx.keterangan}`,
      "transaksi"
    );

    writeDb(db);
    res.json({ success: true, db });
  } else {
    res.status(404).json({ success: false, message: "Transaksi tidak ditemukan." });
  }
});

// Approve warga payment submission by Bendahara
app.post("/api/transaksi/approve-iuran", (req, res) => {
  const { kk, bulan, status, editorName, editorRole } = req.body; // status: 'disetujui' | 'ditolak'
  const db = readDb();

  const wIdx = db.warga.findIndex((w: any) => w.kk === kk);
  if (wIdx > -1) {
    const pIdx = db.warga[wIdx].riwayatPembayaran.findIndex((p: any) => p.bulan === bulan);
    if (pIdx > -1) {
      db.warga[wIdx].riwayatPembayaran[pIdx].status = status;
      const nominal = db.warga[wIdx].riwayatPembayaran[pIdx].nominal;
      const nama = db.warga[wIdx].kepalaKeluarga;

      if (status === 'disetujui') {
        // If approved, verify or insert real transaction in the main ledger if not already there
        const alreadyInLedger = db.transaksi.some((t: any) => t.kkTerkait === kk && t.bulanIuran === bulan && t.tipe === 'pemasukan');
        if (!alreadyInLedger) {
          db.transaksi.unshift({
            id: `TX-IUR-${Date.now()}`,
            tanggal: new Date().toISOString().split("T")[0],
            nominal: nominal,
            tipe: 'pemasukan',
            kategori: 'Iuran Bulanan',
            keterangan: `Iuran Bulanan disetujui - ${nama} (${bulan})`,
            statusPersetujuan: 'disetujui',
            pembuat: editorName || "bendahara",
            kkTerkait: kk,
            bulanIuran: bulan
          });
        }
      }

      logAudit(
        db, 
        editorName || "bendahara", 
        editorRole || "bendahara", 
        `Bendahara ${status === 'disetujui' ? 'MENYETUJUI' : 'MENOLAK'} iuran ${nama} periode ${bulan} sebesar Rp${nominal.toLocaleString("id-ID")}`, 
        "transaksi"
      );

      // Create a Simulated WhatsApp Notification Confirming Receipt!
      if (status === 'disetujui') {
        const messageText = `*[KONFIRMASI PEMBAYARAN]* Terima kasih Bpk / Ibu *${nama}*. Pembayaran iuran wajib bulanan periode *${bulan}* senilai *Rp${nominal.toLocaleString("id-ID")}* telah diverifikasi dan masuk kas RT. Transparansi kas real-time dapat diakses di WargaHubRT.`;
        db.notificationLogs.unshift({
          id: `NOTIF-${Date.now()}`,
          timestamp: new Date().toISOString(),
          penerima: `${nama} (${db.warga[wIdx].noWhatsApp})`,
          pesan: messageText,
          tipe: 'pembayaran',
          saluran: 'WhatsApp',
          status: 'sent'
        });
      }

      writeDb(db);
      res.json({ success: true, db });
    } else {
      res.status(404).json({ success: false, message: "Riwayat pembayaran bulan ini tidak ditemukan untuk warga ini." });
    }
  } else {
    res.status(404).json({ success: false, message: "Warga tidak ditemukan." });
  }
});

// Approve/mark citizen fee payments as LUNAS directly via checkbox
app.post("/api/transaksi/direct-iuran-lunas", (req, res) => {
  const { kk, bulan, nominal, editorName, editorRole } = req.body;
  const db = readDb();

  const wIdx = db.warga.findIndex((w: any) => w.kk === kk);
  if (wIdx > -1) {
    const warga = db.warga[wIdx];
    const amount = Number(nominal) || warga.iuranWajib || 50000;
    
    // Check or append riwayatPembayaran
    const pIdx = warga.riwayatPembayaran.findIndex((p: any) => p.bulan === bulan);
    if (pIdx > -1) {
      warga.riwayatPembayaran[pIdx].status = 'disetujui';
      warga.riwayatPembayaran[pIdx].nominal = amount;
      warga.riwayatPembayaran[pIdx].tanggalBayar = new Date().toISOString().split("T")[0];
    } else {
      warga.riwayatPembayaran.push({
        bulan: bulan,
        tanggalBayar: new Date().toISOString().split("T")[0],
        nominal: amount,
        status: 'disetujui',
        buktiBayar: "Diterima langsung (Cash/Checklist)"
      });
    }

    // Insert real transaction to ledger
    const alreadyInLedger = db.transaksi.some((t: any) => t.kkTerkait === kk && t.bulanIuran === bulan && t.tipe === 'pemasukan');
    if (!alreadyInLedger) {
      db.transaksi.unshift({
        id: `TX-IUR-${Date.now()}`,
        tanggal: new Date().toISOString().split("T")[0],
        nominal: amount,
        tipe: 'pemasukan',
        kategori: 'Iuran Bulanan',
        keterangan: `Iuran Bulanan disetujui - ${warga.kepalaKeluarga} (${bulan})`,
        statusPersetujuan: 'disetujui',
        pembuat: editorName || "bendahara",
        kkTerkait: kk,
        bulanIuran: bulan
      });
    }

    logAudit(
      db,
      editorName || "bendahara",
      editorRole || "bendahara",
      `Centang Lunas iuran ${warga.kepalaKeluarga} periode ${bulan} sebesar Rp${amount.toLocaleString("id-ID")}`,
      "transaksi"
    );

    // Create a Simulated WhatsApp Notification Confirming Receipt!
    const messageText = `*[KONFIRMASI PEMBAYARAN]* Terima kasih Bpk / Ibu *${warga.kepalaKeluarga}*. Pembayaran iuran wajib bulanan periode *${bulan}* senilai *Rp${amount.toLocaleString("id-ID")}* telah diverifikasi dan masuk kas RT. Transparansi kas real-time dapat diakses di WargaHubRT.`;
    db.notificationLogs.unshift({
      id: `NOTIF-${Date.now()}`,
      timestamp: new Date().toISOString(),
      penerima: `${warga.kepalaKeluarga} (${warga.noWhatsApp})`,
      pesan: messageText,
      tipe: 'pembayaran',
      saluran: 'WhatsApp',
      status: 'sent'
    });

    writeDb(db);
    res.json({
      success: true,
      db,
      message: `Laporan pemasukan dari ${warga.kepalaKeluarga} berupa iuran bulanan (Rp${amount.toLocaleString("id-ID")}) berhasil`
    });
  } else {
    res.status(404).json({ success: false, message: "Warga tidak ditemukan." });
  }
});

// 5. Manage Target Dana
app.post("/api/target", (req, res) => {
  const { id, nama, deskripsi, estimasiBiaya, targetTanggal, persentaseAlokasi, status, editorName, editorRole } = req.body;
  if (!nama || !estimasiBiaya || !targetTanggal) {
    return res.status(400).json({ success: false, message: "Nama target, estimasi biaya, dan tanggal selesai wajib diisi." });
  }

  const db = readDb();
  
  if (id) {
    // Update
    const idx = db.targetDana.findIndex((t: any) => t.id === id);
    if (idx > -1) {
      db.targetDana[idx] = {
        ...db.targetDana[idx],
        nama,
        deskripsi,
        estimasiBiaya: Number(estimasiBiaya),
        targetTanggal,
        persentaseAlokasi: Number(persentaseAlokasi) || 0,
        status: status || db.targetDana[idx].status
      };
      logAudit(db, editorName || "bendahara", editorRole || "bendahara", `Mengubah target dana "${nama}"`, "target");
    }
  } else {
    // Create new
    const newTarget = {
      id: `TGT-${Date.now().toString().slice(-4)}`,
      nama,
      deskripsi,
      estimasiBiaya: Number(estimasiBiaya),
      targetTanggal,
      persentaseAlokasi: Number(persentaseAlokasi) || 0,
      sudahTerkumpul: 0,
      status: 'aktif'
    };
    db.targetDana.push(newTarget);
    logAudit(db, editorName || "bendahara", editorRole || "bendahara", `Membuat target dana strategis RT baru: "${nama}" dengan alokasi otomatis ${persentaseAlokasi}%`, "target");
  }

  // Recalculate automatic alokasi based on current idle surplus if requested (we can do it dynamically on front or lock it here)
  writeDb(db);
  res.json({ success: true, db });
});

app.delete("/api/target/:id", (req, res) => {
  const { id } = req.params;
  const { editorName, editorRole } = req.query;
  const db = readDb();

  const idx = db.targetDana.findIndex((t: any) => t.id === id);
  if (idx > -1) {
    const name = db.targetDana[idx].nama;
    db.targetDana.splice(idx, 1);
    logAudit(db, (editorName as string) || "bendahara", (editorRole as string) || "bendahara", `Menghapus target dana strategis RT: "${name}"`, "target");
    writeDb(db);
    res.json({ success: true, db });
  } else {
    res.status(404).json({ success: false, message: "Target tidak ditemukan" });
  }
});

// 6. Citizen Voting proposals (Usulkan Target Dana Baru)
app.post("/api/usulan", (req, res) => {
  const { judul, deskripsi, estimasiAnggaran, kkTerkait, namaPengusul, lampiranFoto } = req.body;
  if (!judul || !deskripsi || !estimasiAnggaran || !kkTerkait) {
    return res.status(400).json({ success: false, message: "Judul, deskripsi, estimasi anggaran, dan KK wajib diisi." });
  }

  const db = readDb();
  const id = `VSL-${Date.now().toString().slice(-4)}`;
  
  // Voting is active for 7 days
  const now = new Date();
  now.setDate(now.getDate() + 7);
  const tanggalBatas = now.toISOString().split("T")[0];

  const totalKeluarga = db.warga.filter((w: any) => w.status === 'aktif').length;

  const newUsulan = {
    id,
    judul,
    deskripsi,
    estimasiAnggaran: Number(estimasiAnggaran),
    lampiranFoto: lampiranFoto || null,
    pengusulKK: kkTerkait,
    namaPengusul: namaPengusul || "Warga RT 04",
    suaraSetuju: [kkTerkait], // Auto votes yes for their own proposal
    suaraTolak: [],
    totalKeluarga,
    tanggalBatas,
    status: 'voting'
  };

  db.usulanVoting.unshift(newUsulan);

  logAudit(db, namaPengusul, "warga", `Mengusulkan target pengeluaran baru hasil rembuk: "${judul}" senilai Rp${Number(estimasiAnggaran).toLocaleString("id-ID")} (Voting dimulai otomatis)`, "voting");

  // Multi-push WA notification
  db.notificationLogs.unshift({
    id: `NOTIF-${Date.now()}`,
    timestamp: new Date().toISOString(),
    penerima: "Grup WhatsApp RT 04",
    pesan: `*[USULAN BARU & VOTING DI BUKA]* Yth. Warga RT 04 RW 04 Kelurahan Jatingaleh, terdapat usulan target dana baru dari Bpk/Ibu *${namaPengusul}* untuk: *"${judul}"* (Est: Rp${Number(estimasiAnggaran).toLocaleString("id-ID")}). Silakan masuk ke aplikasi WargaHubRT untuk mempelajari detail & memberikan hak suara (voting) keluarga Anda sebelum tanggal *${tanggalBatas}*!`,
    tipe: 'voting',
    saluran: 'WhatsApp',
    status: 'sent'
  });

  writeDb(db);
  res.json({ success: true, db });
});

// Citizens cast their family vote
app.post("/api/usulan/:id/vote", (req, res) => {
  const { id } = req.params;
  const { kk, pilihan, kepalaKeluarga } = req.body; // pilihan: 'setuju' | 'tolak'
  if (!kk || !pilihan) {
    return res.status(400).json({ success: false, message: "Nomor KK dan pilihan vote wajib diisi." });
  }

  const db = readDb();
  const idx = db.usulanVoting.findIndex((u: any) => u.id === id);
  if (idx > -1) {
    const usulan = db.usulanVoting[idx];
    if (usulan.status !== 'voting') {
      return res.status(400).json({ success: false, message: "Voting untuk usulan ini sudah ditutup." });
    }

    // A family can only vote once. Clear previous votes first to allow toggle
    usulan.suaraSetuju = usulan.suaraSetuju.filter((v: string) => v !== kk);
    usulan.suaraTolak = usulan.suaraTolak.filter((v: string) => v !== kk);

    if (pilihan === 'setuju') {
      usulan.suaraSetuju.push(kk);
    } else {
      usulan.suaraTolak.push(kk);
    }

    // Auto calculate if voting threshold is met
    const totalVoted = usulan.suaraSetuju.length + usulan.suaraTolak.length;
    
    logAudit(db, kepalaKeluarga || `KK ${kk}`, "warga", `Memberikan suara ${pilihan.toUpperCase()} untuk usulan "${usulan.judul}"`, "voting");

    // Check if limits exceeded or dynamic update
    writeDb(db);
    return res.json({ success: true, db });
  } else {
    res.status(404).json({ success: false, message: "Usulan voting tidak ditemukan." });
  }
});

// Ketua RT approves/rejects a passing vote
app.post("/api/usulan/:id/decide", (req, res) => {
  const { id } = req.params;
  const { status, catatan, editorName, editorRole } = req.body; // status: 'disetujui_rt' | 'ditolak_rt'
  const db = readDb();

  const idx = db.usulanVoting.findIndex((u: any) => u.id === id);
  if (idx > -1) {
    const usulan = db.usulanVoting[idx];
    
    // Close voting state
    usulan.status = status;
    usulan.catatanKetua = catatan || "";

    logAudit(db, editorName || "ketua_rt", editorRole || "ketua_rt", `Ketua RT mengubah keputusan usulan "${usulan.judul}" menjadi: [${status.replace("_", " ").toUpperCase()}]. Catatan: ${catatan || "-"}`, "persetujuan");

    // If approved by RT, automatically initialize it as an Active Target Project too!
    if (status === 'disetujui_rt') {
      const alreadyTarget = db.targetDana.some((t: any) => t.nama.toLowerCase().includes(usulan.judul.toLowerCase()));
      if (!alreadyTarget) {
        db.targetDana.push({
          id: `TGT-${Date.now().toString().slice(-4)}`,
          nama: usulan.judul,
          deskripsi: `Prospek pembangunan hasil voting warga: ${usulan.deskripsi}`,
          estimasiBiaya: usulan.estimasiAnggaran,
          targetTanggal: usulan.tanggalBatas,
          persentaseAlokasi: 0,
          sudahTerkumpul: 0,
          status: 'aktif'
        });
      }
    }

    // Broadcast WhatsApp
    db.notificationLogs.unshift({
      id: `NOTIF-${Date.now()}`,
      timestamp: new Date().toISOString(),
      penerima: "Grup WhatsApp RT 04",
      pesan: `*[HASIL USULAN WARGA]* Ketua RT 04 RW 04 Kelurahan Jatingaleh telah *${status === 'disetujui_rt' ? 'MENYETUJUI' : 'MENOLAK'}* usulan warga: *"${usulan.judul}"*. Catatan Ketua RT: "${catatan || '-'}"`,
      tipe: 'voting',
      saluran: 'WhatsApp',
      status: 'sent'
    });

    writeDb(db);
    res.json({ success: true, db });
  } else {
    res.status(404).json({ success: false, message: "Usulan tidak ditemukan." });
  }
});

// 7. Sim Send Notifications
app.post("/api/notifications/send", (req, res) => {
  const { penerima, pesan, tipe, saluran } = req.body;
  const db = readDb();

  const newNotif = {
    id: `NOTIF-${Date.now()}`,
    timestamp: new Date().toISOString(),
    penerima: penerima || "Semua Warga",
    pesan: pesan || "Pengumuman Kas Transparansi RT 04 Jatingaleh.",
    tipe: tipe || "pengumuman",
    saluran: saluran || "WhatsApp",
    status: "sent" as const
  };

  db.notificationLogs.unshift(newNotif);
  logAudit(db, "Sistem Otomatis", "system", `Mengirimkan notifikasi [${tipe}] via ${saluran} kepada "${penerima}"`, "system");
  writeDb(db);

  res.json({ success: true, db, newNotif });
});

// 8. Update Report Settings Options
app.post("/api/report-options", (req, res) => {
  const { options, editorName, editorRole } = req.body;
  const db = readDb();
  
  if (!options) {
    return res.status(400).json({ success: false, message: "Options are required." });
  }

  db.reportOptions = options;
  logAudit(db, editorName || "Bendahara", editorRole || "bendahara", `Mengubah Opsi Laporan Keuangan: judul="${options.judul || ''}", pembuat="${options.pembuat || ''}"`, "keuangan");
  writeDb(db);
  
  res.json({ success: true, db, reportOptions: db.reportOptions });
});

// Support Gemini API calls server-side safely
app.post("/api/ai/optimize", async (req, res) => {
  // We can let the user get smart budgeting recommendations using Gemini API.
  // We initialize the client inside this route to follow safety and lazy init rules.
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.status(200).json({ 
        success: false, 
        message: "Kunci API Gemini tidak terkonfigurasi di pengaturan. Analisis cerdas dinonaktifkan sementara." 
      });
    }

    const db = readDb();
    
    // Calculate simple stats
    const totalPemasukan = db.transaksi
      .filter((t: any) => t.tipe === "pemasukan" && t.statusPersetujuan === "disetujui")
      .reduce((sum: number, t: any) => sum + t.nominal, 0);

    const totalPengeluaran = db.transaksi
      .filter((t: any) => t.tipe === "pengeluaran" && t.statusPersetujuan === "disetujui")
      .reduce((sum: number, t: any) => sum + t.nominal, 0);

    const saldoKas = totalPemasukan - totalPengeluaran;
    const targetAktifCount = db.targetDana.filter((t: any) => t.status === 'aktif').length;

    // We can run a beautiful generation
    // Since we don't need to bloat with massive imports, we load @google/genai or do a simple fetch
    // Let's use lazy loading for @google/genai
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const promptText = `
    Anda adalah asisten keuangan pintar "WargaHubRT" untuk RT 04 RW 04 Kelurahan Jatingaleh.
    Berikan 3 rekomendasi taktis, ringkas, dan memotivasi (Maksimal 250 kata dalam bahasa Indonesia profesional namun ramah) berdasarkan data keuangan berikut:
    - Saldo Kas Aktif: Rp${saldoKas.toLocaleString("id-ID")}
    - Total Pemasukan Terkumpul: Rp${totalPemasukan.toLocaleString("id-ID")}
    - Total Pengeluaran: Rp${totalPengeluaran.toLocaleString("id-ID")}
    - Jumlah Target Dana Aktif: ${targetAktifCount} proyek strategis.
    
    Fokuskan pada:
    1. Cara mengoptimalkan alokasi kas menganggur untuk target aktif.
    2. Pentingnya keterlibatan warga dalam pembayaran iuran tepat waktu.
    3. Hubungan transparansi kas dengan ketertiban warga Kelurahan Jatingaleh.
    Sajikan dalam bentuk poin-poin yang mudah dipahami warga sewaktu rapat.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
    });

    const recommendation = response.text || "Gagal membangkitkan rekomendasi.";
    res.json({ success: true, text: recommendation });
  } catch (error: any) {
    console.error("Gemini optimization error:", error);
    res.status(500).json({ success: false, message: error.message || "Gagal melakukan penghitungan kecerdasan buatan." });
  }
});


// ==================== VITE & STATIC SERVING ====================

async function startSystem() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server WargaHubRT running on http://0.0.0.0:${PORT}`);
  });
}

startSystem().catch((err) => {
  console.error("Gagal memulai server WargaHubRT:", err);
});
