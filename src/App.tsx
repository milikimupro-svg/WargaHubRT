/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, Wallet, Target, Vote, FileSpreadsheet, Lock, Sparkles, LogIn, Check, X,
  ShieldCheck, ArrowRight, BookOpen, Clock, Printer, CheckCircle, Share2, Smartphone, Landmark, Bell,
  Save, Settings
} from 'lucide-react';

import Header from './components/Header';
import DashboardStats from './components/DashboardStats';
import WargaManager from './components/WargaManager';
import KeuanganLedger from './components/KeuanganLedger';
import TargetManager from './components/TargetManager';
import VotingSystem from './components/VotingSystem';
import InformationScreen from './components/InformationScreen';
import AuditNotificationLogs from './components/AuditNotificationLogs';
import AiAdvisor from './components/AiAdvisor';

import { initAuth, googleSignIn, getAccessToken, googleSignOut } from './googleApi';
import { exportToGoogleSheets } from './googleSheetsApi';
import { saveToGoogleDrive } from './googleDriveApi';
import { createCalendarEvent } from './googleCalendarApi';

import { Warga, Transaksi, TargetDana, UsulanVoting, AuditLog, NotificationLog, ReportOptions } from './types';

const MONTHS_LIST = [
  { key: '2026-01', label: 'Januari' },
  { key: '2026-02', label: 'Februari' },
  { key: '2026-03', label: 'Maret' },
  { key: '2026-04', label: 'April' },
  { key: '2026-05', label: 'Mei' },
  { key: '2026-06', label: 'Juni' },
  { key: '2026-07', label: 'Juli' },
  { key: '2026-08', label: 'Agustus' },
  { key: '2026-09', label: 'September' },
  { key: '2026-10', label: 'Oktober' },
  { key: '2026-11', label: 'November' },
  { key: '2026-12', label: 'Desember' }
];

export default function App() {
  // Theme State
  const [darkMode, setDarkMode] = useState(false);

  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false); // default to secure login screen
  const [currentRole, setCurrentRole] = useState<'bendahara' | 'ketua_rt' | 'warga'>('bendahara');
  const [currentUser, setCurrentUser] = useState('Bendahara');
  const [currentWargaKK, setCurrentWargaKK] = useState<string>('');
  const [currentWargaName, setCurrentWargaName] = useState<string>('');

  // Input states for login panel
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Primary Database State synced from backend
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
  const [targetDanaList, setTargetDanaList] = useState<TargetDana[]>([]);
  const [usulanList, setUsulanList] = useState<UsulanVoting[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'summary' | 'warga' | 'ledger' | 'targets' | 'voting' | 'logs'>('summary');
  
  const [layarRapatOpen, setLayarRapatOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [googleNeedsAuth, setGoogleNeedsAuth] = useState(true);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isExportingGoogle, setIsExportingGoogle] = useState(false);

  useEffect(() => {
    initAuth(
      (user) => {
        setGoogleUser(user);
        setGoogleNeedsAuth(false);
      },
      () => {
        setGoogleUser(null);
        setGoogleNeedsAuth(true);
      }
    );
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await googleSignIn();
    } catch(err) {
      alert('Gagal otentikasi Google Workspace');
    }
  };

  // Modal Cetak Laporan
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('2026-06'); // Juni 2026
  const [waSharedSimOpen, setWaSharedSimOpen] = useState(false);
  const [reportOptions, setReportOptions] = useState<ReportOptions>({
    judul: 'LAPORAN BULANAN PERTANGGUNGJAWABAN BENDAHARA',
    pembuat: 'Bpk. Bendahara RT',
    pengesah: 'Ketua RT 04 Jatingaleh',
    catatanKaki: 'Laporan kas ini bersifat transparan dan diperbarui secara real-time demi kerukunan warga RT 04 Jatingaleh.',
    tampilkanTargetDana: true,
    tampilkanTunggakan: true,
    tampilkanMusyawarah: true
  });
  const [editedOptions, setEditedOptions] = useState<ReportOptions>({
    judul: 'LAPORAN BULANAN PERTANGGUNGJAWABAN BENDAHARA',
    pembuat: 'Bpk. Bendahara RT',
    pengesah: 'Ketua RT 04 Jatingaleh',
    catatanKaki: 'Laporan kas ini bersifat transparan dan diperbarui secara real-time demi kerukunan warga RT 04 Jatingaleh.',
    tampilkanTargetDana: true,
    tampilkanTunggakan: true,
    tampilkanMusyawarah: true
  });

  useEffect(() => {
    if (reportOptions) {
      setEditedOptions(reportOptions);
    }
  }, [reportOptions]);

  // Hardcoded constant configurations
  const CURRENT_MONTH = '2026-06';

  // Toggle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Sync state from backend
  const syncDatabase = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/db');
      if (res.ok) {
        const data = await res.json();
        setWargaList(data.warga || []);
        setTransaksiList(data.transaksi || []);
        setTargetDanaList(data.targetDana || []);
        setUsulanList(data.usulanVoting || []);
        setAuditLogs(data.auditLogs || []);
        setNotificationLogs(data.notificationLogs || []);
        if (data.reportOptions) {
          setReportOptions(data.reportOptions);
        }
      }
    } catch (error) {
      console.error("Gagal sinkronisasi data ke server", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    syncDatabase();
    
    // Add Esc handler for closing Layar Informasi Rapat
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLayarRapatOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle regular authentication form
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCurrentRole(data.user.role);
          setCurrentUser(data.user.username);
          if (data.user.role === 'warga' && data.user.kkNumber) {
            setCurrentWargaKK(data.user.kkNumber);
            setCurrentWargaName(data.user.username);
          }
          setIsLoggedIn(true);
          syncDatabase();
        }
      } else {
        const errData = await res.json();
        setLoginError(errData.message || "Username atau password salah.");
      }
    } catch (err) {
      setLoginError("Koneksi gagal ke server full-stack.");
    }
  };

  // Switch role directly from sandbox bar
  const handleFastSwitch = (role: 'bendahara' | 'ketua_rt' | 'warga') => {
    setCurrentRole(role);
    if (role === 'bendahara') {
      setCurrentUser('Bendahara RT 04');
    } else if (role === 'ketua_rt') {
      setCurrentUser('Ketua RT 04');
    } else {
      // Find Bpk Yusuf's KK from seeding
      setCurrentUser('Yusuf Kalla Jatingaleh');
      setCurrentWargaKK('3374012345670001');
      setCurrentWargaName('Yusuf Kalla Jatingaleh');
    }
  };

  // Sign out
  const handleSignOut = () => {
    setIsLoggedIn(false);
    setUsernameInput('');
    setPasswordInput('');
  };

  // Save report settings / options
  const saveReportOptions = async (newOptions: ReportOptions) => {
    try {
      const res = await fetch('/api/report-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          options: newOptions,
          editorName: currentUser,
          editorRole: currentRole
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reportOptions) {
          setReportOptions(data.reportOptions);
        }
        syncDatabase(); // sync audits & updates
        return true;
      }
    } catch (err) {
      console.error("Gagal menyimpan opsi laporan keuangan", err);
    }
    return false;
  };

  // Create or Update citizen parameters
  const saveWargaData = async (wData: Partial<Warga>) => {
    try {
      const res = await fetch('/api/warga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...wData,
          editorName: currentUser,
          editorRole: currentRole
        })
      });
      if (res.ok) {
        syncDatabase();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete citizen
  const deleteWargaData = async (kk: string) => {
    try {
      const res = await fetch(`/api/warga/${kk}?editorName=${encodeURIComponent(currentUser)}&editorRole=${currentRole}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        syncDatabase();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Record Transaction
  const addTransaksiData = async (txData: Partial<Transaksi>) => {
    try {
      const res = await fetch('/api/transaksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...txData,
          pembuat: currentUser,
          pembuatRole: currentRole
        })
      });
      if (res.ok) {
        syncDatabase();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Approve large expense
  const approveTransaksiData = async (id: string, status: 'disetujui' | 'ditolak', catatan: string) => {
    try {
      const res = await fetch(`/api/transaksi/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, catatan, editorName: currentUser, editorRole: currentRole })
      });
      if (res.ok) {
        syncDatabase();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Approve citizen fee payments
  const approveWargaIuran = async (kk: string, bulan: string, status: 'disetujui' | 'ditolak') => {
    try {
      const res = await fetch(`/api/transaksi/approve-iuran`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kk, bulan, status, editorName: currentUser, editorRole: currentRole })
      });
      if (res.ok) {
        syncDatabase();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Mark iuran as LUNAS directly via checkbox
  const directWargaIuranLunas = async (kk: string, bulan: string, nominal: number) => {
    try {
      const res = await fetch(`/api/transaksi/direct-iuran-lunas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kk, bulan, nominal, editorName: currentUser, editorRole: currentRole })
      });
      if (res.ok) {
        const data = await res.json();
        syncDatabase();
        return { success: true, message: data.message };
      }
      return { success: false, message: 'Gagal memproses pembayaran iuran.' };
    } catch (e) {
      console.error(e);
      return { success: false, message: 'Terjadi kesalahan jaringan.' };
    }
  };

  // Edit/Update Transaction
  const editTransaksiData = async (id: string, txData: Partial<Transaksi>) => {
    try {
      const res = await fetch(`/api/transaksi/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...txData,
          editorName: currentUser,
          editorRole: currentRole
        })
      });
      if (res.ok) {
        syncDatabase();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Transaction
  const deleteTransaksiData = async (id: string) => {
    try {
      const res = await fetch(`/api/transaksi/${id}?editorName=${encodeURIComponent(currentUser)}&editorRole=${currentRole}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        syncDatabase();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save strategic development targets
  const saveTargetData = async (tgtData: Partial<TargetDana>) => {
    try {
      const res = await fetch('/api/target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...tgtData,
          editorName: currentUser,
          editorRole: currentRole
        })
      });
      if (res.ok) {
        syncDatabase();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete strategic target
  const deleteTargetData = async (id: string) => {
    try {
      const res = await fetch(`/api/target/${id}?editorName=${encodeURIComponent(currentUser)}&editorRole=${currentRole}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        syncDatabase();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Citizen voting proposal addition
  const addUsulanData = async (uData: Partial<UsulanVoting>) => {
    try {
      const res = await fetch('/api/usulan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...uData,
          kkTerkait: currentWargaKK || '3374012345670001',
          namaPengusul: currentWargaName || 'Yusuf Kalla Jatingaleh'
        })
      });
      if (res.ok) {
        syncDatabase();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Cast vote on citizen proposals
  const castVoteData = async (usulanId: string, pilihan: 'setuju' | 'tolak') => {
    try {
      const res = await fetch(`/api/usulan/${usulanId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kk: currentWargaKK || '3374012345670001',
          pilihan,
          kepalaKeluarga: currentWargaName || 'Yusuf Kalla Jatingaleh'
        })
      });
      if (res.ok) {
        syncDatabase();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Ketua RT decide proposal voting outcomes
  const decideUsulanData = async (usulanId: string, status: 'disetujui_rt' | 'ditolak_rt', catatan: string) => {
    try {
      const res = await fetch(`/api/usulan/${usulanId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, catatan, editorName: currentUser, editorRole: currentRole })
      });
      if (res.ok) {
        syncDatabase();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Dispatch simulated custom WhatsApp API Notifications
  const pushSimulatedNotification = async (penerima: string, pesan: string, tipe: any) => {
    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ penerima, pesan, tipe, saluran: 'WhatsApp' })
      });
      if (res.ok) {
        syncDatabase();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Call Gemini optimize AI counselor
  const triggerAIOptimize = async () => {
    try {
      const res = await fetch('/api/ai/optimize', {
        method: 'POST'
      });
      return await res.json();
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  // Helper calculation of average income per month (for target forecasting)
  const averageIncomePerMonth = () => {
    if (transaksiList.length === 0) return 3000000;
    const incomes = transaksiList.filter(t => t.tipe === 'pemasukan' && t.statusPersetujuan === 'disetujui');
    if (incomes.length === 0) return 3000000;
    const total = incomes.reduce((sum, t) => sum + t.nominal, 0);
    // Rough estimate of monthly velocity
    return Math.max(1500000, Math.round(total / 3)); 
  };

  // Simulation of WhatsApp Report sharing
  const handleConfirmWAShare = () => {
    pushSimulatedNotification(
      'Grup WhatsApp RT 04 / Jatingaleh',
      `*[LAPORAN KEUANGAN KAS RT 04 - TRANSPARAN]*\n\nSelamat Pagi Bpk/Ibu Warga RT 04 RW 04 Kelurahan Jatingaleh. Kami merilis laporan kas komprehensif periode *${reportPeriod}*.\n\nUnduh salinan PDF lengkap & pantau real-time di:\n✨ *WargaHubRT*: ${window.location.origin}\n\nMari jaga kebersamaan!`,
      'laporan'
    );
    setWaSharedSimOpen(false);
    setIsReportModalOpen(false);
  };

  // Google Workspace Handlers
  const handleSyncGoogleSheets = async () => {
    if (googleNeedsAuth) return alert('Hubungkan Google Workspace di Dashboard terlebih dahulu.');
    setIsExportingGoogle(true);
    try {
      const headers = ['ID', 'Tanggal', 'Keterangan', 'Nominal', 'Tipe', 'Kategori', 'KK Terkait'];
      const rows = transaksiList.map(tx => [
        tx.id, tx.tanggal, tx.keterangan, tx.nominal, tx.tipe, tx.kategori, tx.kkTerkait || '-'
      ]);
      const url = await exportToGoogleSheets(`Backup Laporan RT04 - ${new Date().toISOString()}`, headers, rows);
      alert(`Berhasil sinkronisasi ke Google Sheets!\nURL: ${url}`);
    } catch(err: any) {
      alert(`Gagal sync Google Sheets: ${err.message}`);
    } finally {
      setIsExportingGoogle(false);
    }
  };

  const handleUploadGoogleDrive = async () => {
    if (googleNeedsAuth) return alert('Hubungkan Google Workspace di Dashboard terlebih dahulu.');
    setIsExportingGoogle(true);
    try {
      // Simulate exporting actual report JSON or Markdown to drive
      const content = JSON.stringify({
         periode: reportPeriod,
         transaksi: transaksiList,
         warga: wargaList
      }, null, 2);
      const url = await saveToGoogleDrive(`Arsip_Laporan_RT04_${reportPeriod}.json`, content, 'application/json');
      alert(`Berkas tersimpan aman di Google Drive!\nURL: ${url}`);
    } catch(err: any) {
      alert(`Gagal upload Google Drive: ${err.message}`);
    } finally {
      setIsExportingGoogle(false);
    }
  };

  const handleAddTargetToCalendar = async (target: TargetDana) => {
    if (googleNeedsAuth) return alert('Hubungkan Google Workspace di Dashboard terlebih dahulu.');
    setIsExportingGoogle(true);
    try {
      const url = await createCalendarEvent(
        `Batas Pencapaian: ${target.nama}`,
        `Target Pengumpulan Dana RT04.\nDeskripsi: ${target.deskripsi}\nTotal Dibutuhkan: Rp${target.estimasiBiaya}`,
        target.targetTanggal
      );
      alert(`Berhasil! Agenda ditambahkan ke Google Calendar.\nURL: ${url}`);
    } catch(err: any) {
      alert(`Gagal ke Google Calendar: ${err.message}`);
    } finally {
      setIsExportingGoogle(false);
    }
  };

  // Calculations for PDF / Print preview
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  const totalMasukReport = transaksiList
    .filter(t => t.tipe === 'pemasukan' && t.statusPersetujuan === 'disetujui' && t.tanggal.startsWith(reportPeriod))
    .reduce((sum, t) => sum + t.nominal, 0);

  const totalKeluarReport = transaksiList
    .filter(t => t.tipe === 'pengeluaran' && t.statusPersetujuan === 'disetujui' && t.tanggal.startsWith(reportPeriod))
    .reduce((sum, t) => sum + t.nominal, 0);

  const rawUnpaidWarga = wargaList.filter(w => w.status === 'aktif' && !w.riwayatPembayaran.some(p => p.bulan === reportPeriod && p.status === 'disetujui'));

  // If Layar informasi rapat is fullscreen, focus entirely on it
  if (layarRapatOpen) {
    return (
      <InformationScreen
        wargaList={wargaList}
        transaksiList={transaksiList}
        targetDanaList={targetDanaList}
        usulanList={usulanList}
        onClose={() => setLayarRapatOpen(false)}
        currentMonth={CURRENT_MONTH}
      />
    );
  }

  // Not Logged in view - Custom visual login screen with sample citizens
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors font-sans">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-8 relative overflow-hidden flex flex-col justify-between text-left">
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full -mr-8 -mt-8 rotate-45 transform scale-125"></div>
          
          <div>
            {/* Shield Logo header */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-blue-500 flex items-center justify-center text-white font-black hover:scale-105 duration-200">
                <span className="text-xl">WH</span>
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                  <span>WargaHubRT</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded uppercase">v1.2</span>
                </h2>
                <p className="text-xs text-slate-500 leading-tight">Pengelolaan Kas & Transparansi RT 04 Jatingaleh</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Mulai pencatatan kas aman, setujui iuran warga, ajukan usulan gotong royong, dan diskusikan laporan keuangan real-time demi kemajuan lingkungan rukun tetangga.
            </p>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Username / Nomor KK</label>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Contoh: Bendahara, Ketua_RT, atau Nomor KK"
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Kata Sandi Sesi</label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Sandi keamanan Anda"
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100 font-mono"
                />
              </div>

              {loginError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-lg font-semibold">
                  ⚠️ {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-tr from-emerald-600 to-emerald-500 hover:from-emerald-750 text-white font-bold rounded-xl shadow shadow-emerald-500/10 hover:shadow-md transition duration-150 flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <span>Masuk Aplikasi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors font-sans pb-16">
      
      {/* 1. Universal header with sandbox toolbars */}
      <div className="no-print">
        <Header
          currentRole={currentRole}
          currentUser={currentUser}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onLogout={handleSignOut}
          onOpenLayarRapat={() => setLayarRapatOpen(true)}
          onFastSwitchRole={handleFastSwitch}
          notificationCount={notificationLogs.length}
          onRefresh={syncDatabase}
          isRefreshing={isRefreshing}
        />
      </div>

      {/* Main Container contents */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-8 no-print">
        
        {googleNeedsAuth && currentRole === 'bendahara' && (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Workspace Dinonaktifkan</h4>
                <p className="text-xs text-slate-500">Hubungkan akun Google Anda untuk mensinkronisasi Keuangan ke Google Sheets & Arsip Drive.</p>
              </div>
            </div>
            
            <button
               onClick={handleGoogleSignIn}
               disabled={isExportingGoogle}
               className="bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold text-xs py-2 px-4 rounded-lg border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
             >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                <span>{isExportingGoogle ? 'Menghubungkan...' : 'Sign in with Google'}</span>
             </button>
          </div>
        )}

        {/* Navigation Tabs bar */}
        <div className="p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-nowrap overflow-x-auto gap-1 md:gap-1.5 no-print shadow-sm custom-scrollbar">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 text-xs md:text-sm font-bold flex items-center shrink-0 gap-2 rounded-xl transition duration-150 cursor-pointer ${
              activeTab === 'summary' 
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/40'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('warga')}
            className={`px-4 py-2 text-xs md:text-sm font-bold flex items-center shrink-0 gap-2 rounded-xl transition duration-150 cursor-pointer ${
              activeTab === 'warga' 
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/40'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Warga & Iuran</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2 text-xs md:text-sm font-bold flex items-center shrink-0 gap-2 rounded-xl transition duration-150 cursor-pointer ${
              activeTab === 'ledger' 
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/40'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Laporan Keuangan</span>
          </button>

          <button
            onClick={() => setActiveTab('targets')}
            className={`px-4 py-2 text-xs md:text-sm font-bold flex items-center shrink-0 gap-2 rounded-xl transition duration-150 cursor-pointer ${
              activeTab === 'targets' 
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/40'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Target Dana</span>
          </button>

          <button
            onClick={() => setActiveTab('voting')}
            className={`px-4 py-2 text-xs md:text-sm font-bold flex items-center shrink-0 gap-2 rounded-xl transition duration-150 cursor-pointer ${
              activeTab === 'voting' 
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/40'
            }`}
          >
            <Vote className="w-4 h-4" />
            <span>Voting Usulan</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 text-xs md:text-sm font-bold flex items-center shrink-0 gap-2 rounded-xl transition duration-150 cursor-pointer ${
              activeTab === 'logs' 
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/40'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Audit & Notif</span>
          </button>
        </div>

        {/* Dynamic sub-tab screen routers */}
        <div className="space-y-6">
          
          {activeTab === 'summary' && (
            <div className="space-y-6">
              
              {/* Intelligent AI advice segment */}
              <AiAdvisor onTriggerOptimize={triggerAIOptimize} />

              <DashboardStats
                wargaList={wargaList}
                transaksiList={transaksiList}
                targetDanaList={targetDanaList}
                currentMonth={CURRENT_MONTH}
                usulanList={usulanList}
                onOpenReportModal={() => setIsReportModalOpen(true)}
                onTabSwitch={setActiveTab}
                currentRole={currentRole}
                currentWargaKK={currentWargaKK}
                currentWargaName={currentWargaName}
                onRefreshDb={syncDatabase}
              />
            </div>
          )}

          {activeTab === 'warga' && (
            <WargaManager
              wargaList={wargaList}
              currentRole={currentRole}
              onSaveWarga={saveWargaData}
              onDeleteWarga={deleteWargaData}
              onApproveIuran={approveWargaIuran}
              onDirectIuranLunas={directWargaIuranLunas}
              onPushNotification={pushSimulatedNotification}
              currentMonth={CURRENT_MONTH}
            />
          )}

          {activeTab === 'ledger' && (
            <KeuanganLedger
              transaksiList={transaksiList}
              wargaList={wargaList}
              currentMonth={CURRENT_MONTH}
              currentRole={currentRole}
              currentUser={currentUser}
              onAddTransaksi={addTransaksiData}
              onEditTransaksi={editTransaksiData}
              onDeleteTransaksi={deleteTransaksiData}
              onApproveTransaksi={approveTransaksiData}
              onDirectIuranLunas={directWargaIuranLunas}
              onOpenReportModal={() => setIsReportModalOpen(true)}
              onSyncGoogleSheets={handleSyncGoogleSheets}
            />
          )}

          {activeTab === 'targets' && (
            <TargetManager
              targetDanaList={targetDanaList}
              runningKas={transaksiList.filter(t=>t.tipe==='pemasukan'&&t.statusPersetujuan==='disetujui').reduce((acc,cur)=>acc+cur.nominal,0) - transaksiList.filter(t=>t.tipe==='pengeluaran'&&t.statusPersetujuan==='disetujui').reduce((acc,cur)=>acc+cur.nominal,0)}
              avgIncomePerMonth={averageIncomePerMonth()}
              currentRole={currentRole}
              onSaveTarget={saveTargetData}
              onDeleteTarget={deleteTargetData}
              onAddToCalendar={handleAddTargetToCalendar}
            />
          )}

          {activeTab === 'voting' && (
            <VotingSystem
              usulanList={usulanList}
              currentRole={currentRole}
              currentWargaKK={currentWargaKK}
              currentWargaName={currentWargaName}
              totalKeluargaAktif={wargaList.filter(w=>w.status === 'aktif').length}
              onAddUsulan={addUsulanData}
              onCastVote={castVoteData}
              onDecideUsulan={decideUsulanData}
            />
          )}

          {activeTab === 'logs' && (
            <AuditNotificationLogs
              auditLogs={auditLogs}
              notificationLogs={notificationLogs}
              currentRole={currentRole}
              currentUser={currentUser}
              currentWargaKK={currentWargaKK}
            />
          )}

        </div>

      </main>

      {/* Pop Up Modal: PDF Report Preview & WhatsApp Share generator */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto print-modal-overlay">
          <div className="w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden text-left flex flex-col justify-between max-h-[90vh]">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 no-print">
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-emerald-500" />
                <span>Dokumen PDF Laporan Resmi Kas RT</span>
              </h3>
              
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-semibold">Pilih Periode:</span>
                <select
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  {MONTHS_LIST.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label} 2026
                    </option>
                  ))}
                </select>
                
                <button 
                  onClick={() => setIsReportModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Split Options Panel & Print Area Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 overflow-y-auto flex-1 custom-scrollbar min-h-0">
              
              {/* Left Column Options Form for Bendahara */}
              {currentRole === 'bendahara' && (
                <div className="lg:col-span-4 bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-4 no-print flex flex-col justify-between h-fit lg:sticky lg:top-0">
                  <div className="space-y-4 flex-1">
                    <div className="border-b border-slate-800 pb-2">
                      <h4 className="font-bold text-white text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <Settings className="w-3.5 h-3.5" />
                        <span>Pengaturan Laporan Kas</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Edit konten & visibilitas elemen dalam cetakan kertas laporan RT.</p>
                    </div>

                    {/* Judul Laporan */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Judul Surat Laporan</label>
                      <input
                        type="text"
                        value={editedOptions.judul}
                        onChange={(e) => setEditedOptions({ ...editedOptions, judul: e.target.value })}
                        className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                        placeholder="Contoh: LAPORAN BULANAN PERTANGGUNGJAWABAN"
                      />
                    </div>

                    {/* Nama Pembuat / Bendahara */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Nama Bendahara (Pembuat)</label>
                      <input
                        type="text"
                        value={editedOptions.pembuat}
                        onChange={(e) => setEditedOptions({ ...editedOptions, pembuat: e.target.value })}
                        className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                      />
                    </div>

                    {/* Nama Pengesah / Ketua RT */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Nama RT (Pengesah)</label>
                      <input
                        type="text"
                        value={editedOptions.pengesah}
                        onChange={(e) => setEditedOptions({ ...editedOptions, pengesah: e.target.value })}
                        className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                      />
                    </div>

                    {/* Memo Catatan Kaki */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Catatan Kaki (Memo Laporan)</label>
                      <textarea
                        value={editedOptions.catatanKaki || ''}
                        onChange={(e) => setEditedOptions({ ...editedOptions, catatanKaki: e.target.value })}
                        rows={3}
                        className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none font-medium text-slate-300"
                        placeholder="Catatan tambahan di atas tanda tangan..."
                      />
                    </div>

                    {/* Toggles */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Visibilitas Elemen Cetak</span>
                      
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editedOptions.tampilkanTargetDana}
                          onChange={(e) => setEditedOptions({ ...editedOptions, tampilkanTargetDana: e.target.checked })}
                          className="rounded text-emerald-600 focus:ring-emerald-500/20 w-3.5 h-3.5 bg-slate-800 border-slate-700"
                        />
                        <span className="text-xs text-slate-300 font-medium font-sans">Tampilkan Target Konstruksi RT</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editedOptions.tampilkanTunggakan}
                          onChange={(e) => setEditedOptions({ ...editedOptions, tampilkanTunggakan: e.target.checked })}
                          className="rounded text-emerald-600 focus:ring-emerald-500/20 w-3.5 h-3.5 bg-slate-800 border-slate-700"
                        />
                        <span className="text-xs text-slate-300 font-medium font-sans">Tampilkan Daftar Tunggakan Warga</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={editedOptions.tampilkanMusyawarah}
                          onChange={(e) => setEditedOptions({ ...editedOptions, tampilkanMusyawarah: e.target.checked })}
                          className="rounded text-emerald-600 focus:ring-emerald-500/20 w-3.5 h-3.5 bg-slate-800 border-slate-700"
                        />
                        <span className="text-xs text-slate-300 font-medium font-sans">Tampilkan Keputusan Musyawarah</span>
                      </label>
                    </div>

                  </div>

                  <div className="pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        saveReportOptions(editedOptions);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer text-xs shadow-md transition-all active:scale-[0.98]"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan & Log Aktivitas</span>
                    </button>
                    <p className="text-[9px] text-center text-slate-500 mt-2 font-medium font-mono">Modifikasi terekam otomatis di log aktivitas</p>
                  </div>
                </div>
              )}

              {/* Right Paper Container */}
              <div className={`${currentRole === 'bendahara' ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white text-slate-950 p-8 md:p-12 rounded-xl overflow-y-auto shadow-inner custom-scrollbar`} id="print-area">
              
              {/* OFFICIAL RT HEADER (LOGO KELURAHAN JATINGALEH STYLE) */}
              <div className="text-center border-b-4 border-double border-slate-900 pb-4 mb-6">
                <h4 className="font-extrabold text-lg uppercase tracking-wide">RUKUN TETANGGA 04 RUKUN WARGA 04</h4>
                <h4 className="font-bold text-base uppercase">KELURAHAN JATINGALEH • KECAMATAN CANDISARI</h4>
                <p className="text-xs uppercase tracking-wider text-slate-500">Kota Semarang, Jawa Tengah • Kode Pos 50254</p>
              </div>

              {/* REPORT TITLE */}
              <div className="text-center mb-6">
                <h3 className="font-bold text-base underline uppercase">{reportOptions.judul}</h3>
                <p className="text-xs font-mono font-bold uppercase text-slate-600 mt-1">
                  Periode: {MONTHS_LIST.find(m => m.key === reportPeriod)?.label || 'Juni'} 2026
                </p>
              </div>

              {/* CASH SUMMARY METRICS LIST */}
              <div className="grid grid-cols-3 gap-4 border border-slate-350 p-4 rounded-lg bg-slate-50/50 mb-6 text-xs">
                <div>
                  <span className="text-slate-500 block uppercase text-[10px]">Total Penerimaan</span>
                  <span className="font-bold text-emerald-600 text-base">{formatRupiah(totalMasukReport)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[10px]">Total Belanja</span>
                  <span className="font-bold text-rose-600 text-base">{formatRupiah(totalKeluarReport)}</span>
                </div>
                <div className="border-l pl-4 border-slate-300">
                  <span className="text-slate-500 block uppercase text-[10px]">Saldo Kas RT</span>
                  <span className="font-extrabold text-blue-800 text-base">{formatRupiah(totalMasukReport - totalKeluarReport)}</span>
                </div>
              </div>

              {/* TRANSACTION LEDGER IN PDF */}
              <div className="space-y-4 text-xs mb-6">
                <h5 className="font-bold uppercase border-b pb-1">1. Rekapitulasi Rincian Pembukuan Transaksi</h5>
                <table className="w-full text-left font-sans text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-950 font-bold bg-slate-100">
                      <th className="p-1 pl-2">Tanggal</th>
                      <th className="p-1">ID & Keterangan</th>
                      <th className="p-1">Kategori</th>
                      <th className="p-1 text-right pr-2">Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const periodTx = transaksiList.filter((tx) => tx.tanggal.startsWith(reportPeriod) && tx.statusPersetujuan === 'disetujui');
                      if (periodTx.length === 0) {
                        return (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-slate-500 italic">
                              Belum ada catatan transaksi disetujui pada periode ini.
                            </td>
                          </tr>
                        );
                      }
                      return periodTx.map((tx) => (
                        <tr key={tx.id} className="border-b border-slate-100">
                          <td className="p-1.5 pl-2 whitespace-nowrap">{tx.tanggal}</td>
                          <td className="p-1.5 font-medium">{tx.keterangan} <span className="text-slate-400 font-mono">({tx.id})</span></td>
                          <td className="p-1.5">{tx.kategori}</td>
                          <td className={`p-1.5 text-right font-bold pr-2 ${tx.tipe === 'pemasukan' ? 'text-emerald-600' : 'text-slate-800'}`}>
                            {tx.tipe === 'pemasukan' ? '+' : '-'} {formatRupiah(tx.nominal)}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>

              {/* ACTIVE PHYSICAL TARGET METRICS */}
              {reportOptions.tampilkanTargetDana && targetDanaList.length > 0 && (
                <div className="space-y-4 text-xs mb-6">
                  <h5 className="font-bold uppercase border-b pb-1">2. Target Dana Program Realisasi Konstruksi</h5>
                  <div className="space-y-2">
                    {targetDanaList.map(t => (
                      <div key={t.id} className="flex justify-between items-center text-[11px] bg-slate-50 p-2 rounded">
                        <span className="font-bold">🎯 {t.nama} (Batas: {t.targetTanggal})</span>
                        <span className="font-mono">Angg: {formatRupiah(t.estimasiBiaya)} | Alokasi: {t.persentaseAlokasi}% Kas</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* UNPAID MEMBERS CITIZENS */}
              {reportOptions.tampilkanTunggakan && (
                <div className="space-y-4 text-xs mb-6">
                  <h5 className="font-bold uppercase border-b pb-1">3. Daftar Tunggakan Iuran Wajib (Jatuh Tempo)</h5>
                  {rawUnpaidWarga.length === 0 ? (
                    <p className="text-[11px] italic text-slate-500">Hebat! Semua keluarga aktif telah melunasi kewajiban iuran tepat waktu.</p>
                  ) : (
                    <table className="w-full text-left font-sans text-[11px] border-collapse">
                      <thead>
                        <tr className="border-b border-slate-400 font-bold bg-slate-100">
                          <th className="p-1 pl-2">Nama Kepala Keluarga</th>
                          <th className="p-1">Alamat Rumah</th>
                          <th className="p-1 text-right pr-2">Jumlah Tunggakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rawUnpaidWarga.map((w) => (
                          <tr key={w.kk}>
                            <td className="p-1.5 pl-2 font-bold">{w.kepalaKeluarga}</td>
                            <td className="p-1.5">{w.alamat}</td>
                            <td className="p-1.5 text-right text-rose-600 font-bold pr-2">{formatRupiah(w.iuranWajib)} ({MONTHS_LIST.find(m => m.key === reportPeriod)?.label || 'Bulan'})</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* REMBUK HASIL VOTING DANA */}
              {reportOptions.tampilkanMusyawarah && usulanList.length > 0 && (
                <div className="space-y-4 text-xs mb-6">
                  <h5 className="font-bold uppercase border-b pb-1">4. Hasil Musyawarah & Gotong Royong (Remuk Usulan)</h5>
                  <div className="space-y-2">
                    {usulanList.map(u => (
                      <div key={u.id} className="text-[11px] text-left leading-relaxed">
                        <span className="font-bold">[{u.status.toUpperCase()}] "{u.judul}"</span> 
                        <p className="text-slate-500 ml-4 italic">"Hasil: {u.suaraSetuju.length} KK Setuju vs {u.suaraTolak.length} KK Menolak. Arahan RT: {u.catatanKetua || '-'}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MEMO FOOTNOTE */}
              {reportOptions.catatanKaki && (
                <div className="text-[10.5px] border-l-2 border-emerald-500 pl-3 py-1 italic text-slate-600 mb-6 leading-relaxed">
                  {reportOptions.catatanKaki}
                </div>
              )}

              {/* SIGNATURE SECTION */}
              <div className="grid grid-cols-2 text-center text-xs pt-8 border-t border-slate-300">
                <div>
                  <p>Mengetahui & Mengesahkan,</p>
                  <p className="font-bold uppercase mt-12">{reportOptions.pengesah}</p>
                  <p className="text-[10px] text-slate-400">Kepala Rukun Tetangga 04</p>
                </div>
                <div>
                  <p>Dibuat Oleh,</p>
                  <p className="font-bold uppercase mt-12">{reportOptions.pembuat}</p>
                  <p className="text-[10px] text-slate-400">Pengurus Bidang Finansial</p>
                </div>
              </div>

            </div>

          </div>

          {/* Print toolbar actions */}
            <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs no-print">
              <span className="text-slate-400 font-medium">Tips: Di menu browser berikutnya, pilih "Simpan sebagai PDF" / "Save as PDF" untuk mengunduh berkas laporan.</span>
              
              <div className="flex gap-2 w-full sm:w-auto overflow-hidden">
                <button
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Simpan PDF</span>
                </button>

                <button
                  onClick={handleUploadGoogleDrive}
                  disabled={isExportingGoogle}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white font-bold rounded-lg cursor-pointer"
                  title="Simpan JSON Laporan Keuangan ke Google Drive"
                >
                  {isExportingGoogle ? 'Menyimpan...' : 'Simpan ke Drive'}
                </button>

                <button
                  onClick={() => setWaSharedSimOpen(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                  title="Bagikan Laporan ke WhatsApp Grup RT"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Bagikan ke WhatsApp</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Simulated WhatsApp Share window */}
      {waSharedSimOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 no-print">
          <div className="w-full max-w-lg bg-[#efeae2] rounded-2xl border border-emerald-900 shadow-2xl overflow-hidden text-slate-800">
            <div className="bg-[#005c4b] text-white p-4 flex items-center justify-between">
              <h4 className="font-bold text-sm">Bagikan Laporan ke WhatsApp Grup RT 04</h4>
              <button onClick={() => setWaSharedSimOpen(false)} className="text-emerald-100 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 h-48 overflow-y-auto custom-scrollbar flex flex-col justify-end bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-contain">
              <div className="bg-white p-3 shadow max-w-[85%] self-end relative rounded-xl rounded-tr-none text-xs text-left">
                <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px] mb-1">
                  🌐 broadcast_laporan_jatingaleh.pdf
                </span>
                <p className="whitespace-pre-line text-slate-700">
                  {`*[LAPORAN TRANSPARANSI RT 04 - BULAN JUNI 2026]*\n\nYth. Bapak/Ibu Warga RT 04 RW 04 Kelurahan Jatingaleh.\nLaporan resmi kas, detail transaksi bulanan, target strategis CCTV, serta hasil voting warga telah dirilis.\n\nUnduh salinan PDF & cek real-time kas di:\n✨ WargaHubRT: ${window.location.origin}\n\nTerima kasih atas partisipasi aktif seluruh warga!`}
                </p>
              </div>
            </div>

            <div className="bg-[#f0f2f5] p-4 flex items-center justify-between gap-3 border-t">
              <span className="text-[10px] text-slate-400 text-left">Mensimulasikan integrasi API WhatsApp Web Jatingaleh.</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setWaSharedSimOpen(false)}
                  className="px-4 py-1.5 text-xs text-slate-600 bg-white border rounded-lg hover:bg-slate-50 font-bold"
                >
                  Batal
                </button>
                <button 
                  onClick={handleConfirmWAShare}
                  className="px-4 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg font-bold shadow flex items-center gap-1"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Kirim ke Grup RT</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
