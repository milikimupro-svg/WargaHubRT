/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'bendahara' | 'ketua_rt' | 'warga';

export interface UserSession {
  username: string;
  role: UserRole;
  kkNumber?: string; // If role is warga, links to their KK
}

export interface PembayaranIuran {
  bulan: string; // Format: "YYYY-MM" (e.g. "2026-06")
  tanggalBayar: string;
  nominal: number;
  status: 'pending' | 'disetujui' | 'ditolak';
  buktiBayar?: string;
}

export interface Warga {
  kk: string; // Nomor KK (sebagai ID/username warga)
  kepalaKeluarga: string;
  alamat: string;
  noWhatsApp: string;
  status: 'aktif' | 'nonaktif';
  iuranWajib: number; // custom nominal
  jatuhTempo: number; // tanggal jatuh tempo bulanan (1-31, e.g. 10)
  riwayatPembayaran: PembayaranIuran[];
}

export type KategoriPemasukan = 'Iuran Bulanan' | 'Donasi' | 'Denda' | 'Lain-lain';

export type KategoriPengeluaran = 'Kebersihan' | 'Keamanan' | 'Perbaikan Fasilitas' | 'Kegiatan Warga' | 'Administrasi' | 'Darurat' | 'Lainnya';

export interface Transaksi {
  id: string;
  tanggal: string; // YYYY-MM-DD
  nominal: number;
  tipe: 'pemasukan' | 'pengeluaran';
  kategori: string; // KategoriPemasukan atau KategoriPengeluaran
  keterangan: string;
  buktiTransaksi?: string; // Base64 or local URL
  statusPersetujuan: 'disetujui' | 'ditolak' | 'pending'; // Khusus pengeluaran besar, atau iuran pending
  pembuat: string; // username yang menginput
  kkTerkait?: string; // Jika merupakan pembayaran iuran warga tertentu
  bulanIuran?: string; // Jika iuran, untuk bulan apa (YYYY-MM)
}

export interface TargetDana {
  id: string;
  nama: string;
  deskripsi: string;
  estimasiBiaya: number;
  targetTanggal: string; // YYYY-MM-DD
  persentaseAlokasi: number; // % alokasi otomatis dari saldo menganggur
  sudahTerkumpul: number;
  status: 'aktif' | 'tercapai' | 'batal';
}

export interface UsulanVoting {
  id: string;
  judul: string;
  deskripsi: string;
  estimasiAnggaran: number;
  lampiranFoto?: string;
  pengusulKK: string;
  namaPengusul: string;
  suaraSetuju: string[]; // List of KK numbers supporting
  suaraTolak: string[];  // List of KK numbers opposing
  totalKeluarga: number;  // snapshots of total keluarga when voting active
  tanggalBatas: string;  // YYYY-MM-DD
  status: 'voting' | 'lolos' | 'ditolak_voting' | 'disetujui_rt' | 'ditolak_rt';
  catatanKetua?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string; // ISO String
  user: string;
  role: UserRole;
  aktivitas: string;
  kategori: 'login' | 'warga' | 'transaksi' | 'target' | 'voting' | 'persetujuan' | 'system';
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  penerima: string; // No WA atau nama warga
  pesan: string;
  tipe: 'pembayaran' | 'jatuh_tempo' | 'voting' | 'laporan' | 'pengumuman';
  saluran: 'WhatsApp' | 'Email';
  status: 'sent' | 'pending';
}

export interface ReportOptions {
  judul: string;
  pembuat: string;
  pengesah: string;
  catatanKaki: string;
  tampilkanTargetDana: boolean;
  tampilkanTunggakan: boolean;
  tampilkanMusyawarah: boolean;
}
