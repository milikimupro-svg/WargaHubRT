/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, Users, AlertTriangle, Play, CheckCircle, 
  Calendar, ArrowRight, Vote, Send, FileText, Share2, Sparkles, HelpCircle,
  Upload, FileCheck, X, Check, Info, ShieldAlert 
} from 'lucide-react';
import { Transaksi, Warga, TargetDana, UsulanVoting } from '../types';

interface DashboardStatsProps {
  wargaList: Warga[];
  transaksiList: Transaksi[];
  targetDanaList: TargetDana[];
  currentMonth: string; // "2026-06"
  usulanList: UsulanVoting[];
  onOpenReportModal: () => void;
  onTabSwitch: (tab: 'summary' | 'warga' | 'ledger' | 'targets' | 'voting' | 'logs') => void;
  currentRole?: string;
  currentWargaKK?: string;
  currentWargaName?: string;
  onRefreshDb?: () => void;
}

export default function DashboardStats({
  wargaList,
  transaksiList,
  targetDanaList,
  currentMonth,
  usulanList,
  onOpenReportModal,
  onTabSwitch,
  currentRole = 'bendahara',
  currentWargaKK = '',
  currentWargaName = '',
  onRefreshDb
}: DashboardStatsProps) {
  
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  // Find current logged-in citizen
  const currentWarga = wargaList.find(w => w.kk === currentWargaKK);

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

  // Payment upload state inside citizen banner
  const [selectedBulanPay, setSelectedBulanPay] = useState('2026-06');
  const [payAmount, setPayAmount] = useState(currentWarga?.iuranWajib || 50000);
  const [payFileName, setPayFileName] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showOverdueToast, setShowOverdueToast] = useState(true);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setPayFileName(e.dataTransfer.files[0].name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPayFileName(e.target.files[0].name);
    }
  };

  const handleCitizenPaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWarga) return;
    setUploadError('');
    setUploadSuccess('');
    setUploading(true);

    try {
      const res = await fetch('/api/transaksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nominal: Number(payAmount) || currentWarga.iuranWajib,
          tipe: 'pemasukan',
          kategori: 'Iuran Bulanan',
          keterangan: `Iuran Bulanan - ${currentWarga.kepalaKeluarga} (${selectedBulanPay})`,
          buktiTransaksi: payFileName || 'bukti_transfer_slip.png',
          kkTerkait: currentWarga.kk,
          bulanIuran: selectedBulanPay,
          pembuat: currentWarga.kepalaKeluarga,
          pembuatRole: 'warga'
        })
      });

      if (res.ok) {
        setUploadSuccess(`Sukses! Laporan iuran ${selectedBulanPay} berhasil dikirim ke Bendahara.`);
        setPayFileName('');
        if (onRefreshDb) {
          onRefreshDb();
        }
      } else {
        const data = await res.json();
        setUploadError(data.message || 'Gagal mengirim bukti pembayaran.');
      }
    } catch (err) {
      setUploadError('Gagal menghubungi server.');
    } finally {
      setUploading(false);
    }
  };

  // 1. Calculations
  const totalPemasukanAll = transaksiList
    .filter(t => t.tipe === 'pemasukan' && t.statusPersetujuan === 'disetujui')
    .reduce((sum, t) => sum + t.nominal, 0);

  const totalPengeluaranAll = transaksiList
    .filter(t => t.tipe === 'pengeluaran' && t.statusPersetujuan === 'disetujui')
    .reduce((sum, t) => sum + t.nominal, 0);

  const saldoKas = totalPemasukanAll - totalPengeluaranAll;

  // Monthly stats
  const isThisMonth = (dateStr: string) => {
    return dateStr.startsWith(currentMonth); // "2026-06-XX" matches "2026-06"
  };

  const totalPemasukanBulanIni = transaksiList
    .filter(t => t.tipe === 'pemasukan' && t.statusPersetujuan === 'disetujui' && isThisMonth(t.tanggal))
    .reduce((sum, t) => sum + t.nominal, 0);

  const totalPengeluaranBulanIni = transaksiList
    .filter(t => t.tipe === 'pengeluaran' && t.statusPersetujuan === 'disetujui' && isThisMonth(t.tanggal))
    .reduce((sum, t) => sum + t.nominal, 0);

  // Warga metrics
  const wargaAktifList = wargaList.filter(w => w.status === 'aktif');
  const totalWargaAktif = wargaAktifList.length;

  // Warga menunggak
  const wargaMenunggakList = wargaAktifList.filter(w => {
    const hasApprovedForMonth = w.riwayatPembayaran.some(p => p.bulan === currentMonth && p.status === 'disetujui');
    return !hasApprovedForMonth;
  });
  const totalMenunggak = wargaMenunggakList.length;
  const totalLunas = totalWargaAktif - totalMenunggak;

  // Persentase target active
  const averageTargetProgress = targetDanaList.length > 0
    ? (targetDanaList.reduce((acc, t) => acc + (t.sudahTerkumpul / t.estimasiBiaya * 100), 0) / targetDanaList.length)
    : 0;

  // Get active voting
  const runningVoting = usulanList.find(u => u.status === 'voting') || usulanList[0];

  // Calculate citizens with more than 2 months overdue (more than 2 periods of unpaid dues)
  const citizensOverdueMoreThan2Months = wargaAktifList.filter(w => {
    const monthsRange = MONTHS_LIST.map(m => m.key).filter(k => k <= currentMonth);
    let unpaidCount = 0;
    monthsRange.forEach(m => {
      const isPaid = w.riwayatPembayaran.some(p => p.bulan === m && p.status === 'disetujui');
      if (!isPaid) {
        unpaidCount++;
      }
    });
    return unpaidCount > 2; // "lebih dari 2 bulan" -> strictly more than 2 months unpaid
  });

  return (
    <div className="space-y-6">
      {currentRole === 'bendahara' && showOverdueToast && citizensOverdueMoreThan2Months.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-rose-600 text-white rounded-2xl p-4 shadow-xl flex items-start justify-between gap-4 animate-in slide-in-from-top-4 duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 pointer-events-none"></div>
          <div className="flex gap-3 relative z-10">
            <div className="bg-white/20 p-2 rounded-xl h-fit">
              <ShieldAlert className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <h4 className="font-bold text-sm tracking-tight">Peringatan Tunggakan Kas Bendahara!</h4>
              <p className="text-xs text-amber-100 mt-1 max-w-2xl leading-relaxed">
                Terdapat <span className="font-extrabold text-white underline">{citizensOverdueMoreThan2Months.length} warga aktif</span> yang menunggak iuran kas wajib <span className="font-bold">lebih dari 2 bulan</span>. Harap segera hubungi atau ingatkan Kepala Keluarga bersangkutan untuk keharmonisan kas lingkungan:
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {citizensOverdueMoreThan2Months.map((w) => (
                  <span key={w.kk} className="text-[11px] bg-white/20 px-2.5 py-0.5 rounded-md font-semibold flex items-center gap-1">
                    👨‍👩‍👧‍👦 {w.kepalaKeluarga}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowOverdueToast(false)}
            className="p-1 hover:bg-white/10 rounded-lg transition text-white/80 hover:text-white relative z-10 cursor-pointer self-start"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {currentRole === 'warga' && currentWarga && (
        <div id="citizen-billing-notification" className="bg-gradient-to-br from-rose-50 to-orange-50 dark:from-slate-900/60 dark:to-rose-950/20 border-2 border-rose-200 dark:border-rose-900/40 rounded-3xl p-6 shadow-md relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="flex flex-col lg:flex-row lg:items-start gap-6 relative z-10">
            {/* Left Column: Icon and Text */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-rose-100 dark:bg-rose-950/80 p-2.5 rounded-2xl text-rose-600 dark:text-rose-400">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Pemberitahuan Kewajiban Iuran Warga
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    KK: {currentWarga.kk} • Kepala Keluarga: <span className="font-semibold text-slate-700 dark:text-slate-300 font-sans">{currentWarga.kepalaKeluarga}</span>
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                Halo Bapak/Ibu {currentWarga.kepalaKeluarga}. Menjaga ketertiban bersama di lingkungan RT 04 Jatingaleh dimulai dari kepedulian Anda. Di bawah ini adalah status pembayaran iuran wajib bulanan Anda untuk tahun 2026. Silakan laporkan pembayaran yang belum lunas.
              </p>

              {/* Status grid of months */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-2">
                {MONTHS_LIST.map((m) => {
                  const payment = currentWarga.riwayatPembayaran.find(p => p.bulan === m.key);
                  const isPaid = payment?.status === 'disetujui';
                  const isPending = payment?.status === 'pending';
                  
                  return (
                    <div 
                      key={m.key} 
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col justify-between items-center ${
                        isPaid 
                          ? 'bg-emerald-500/10 border-emerald-300/60 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' 
                          : isPending 
                          ? 'bg-amber-500/10 border-amber-300/60 dark:border-amber-800 text-amber-700 dark:text-amber-400 animate-pulse' 
                          : 'bg-rose-500/10 border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400'
                      }`}
                    >
                      <span className="text-[10px] font-bold tracking-wider uppercase font-mono">{m.label.substring(0, 3)}</span>
                      <div className="mt-1 flex items-center gap-1">
                        {isPaid ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        ) : isPending ? (
                          <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        )}
                        <span className="text-[10px] font-extrabold capitalize">
                          {isPaid ? 'Lunas' : isPending ? 'Pending' : 'Belum'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Mini Interactive Quick Payment Receipt Submission */}
            <div className="w-full lg:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <form onSubmit={handleCitizenPaySubmit} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <Upload className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Laporkan Pembayaran</span>
                </div>

                {uploadSuccess && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold leading-snug">
                    {uploadSuccess}
                  </div>
                )}

                {uploadError && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl text-[11px] text-rose-800 dark:text-rose-350 font-semibold leading-snug">
                    {uploadError}
                  </div>
                )}

                {/* Dropdowns */}
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-slate-500 mb-1">Periode Bulan</label>
                  <select 
                    value={selectedBulanPay}
                    onChange={(e) => setSelectedBulanPay(e.target.value)}
                    className="w-full text-xs font-semibold p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    {MONTHS_LIST.map(m => {
                      const payState = currentWarga.riwayatPembayaran.find(p => p.bulan === m.key);
                      const isLunas = payState?.status === 'disetujui';
                      return (
                        <option key={m.key} value={m.key} disabled={isLunas}>
                          {m.label} 2026 {isLunas ? '(Lunas)' : payState?.status === 'pending' ? '(Verifikasi / Pending)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-slate-500 mb-1">Nominal Iuran Wajib</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">Rp</span>
                    <input 
                      type="number"
                      value={payAmount}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                      className="w-full text-xs font-semibold pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono focus:outline-none"
                    />
                  </div>
                </div>

                {/* Receipt Upload Dropzone */}
                <div>
                  <label className="block text-[10px] uppercase font-extrabold text-slate-500 mb-1">Unggah Slip / Bukti Bayar</label>
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border border-dashed rounded-lg p-2.5 text-center cursor-pointer transition ${
                      dragActive ? 'border-rose-500 bg-rose-500/5' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-805/50'
                    }`}
                  >
                    <input 
                      type="file" 
                      id="citizen-receipt-upload" 
                      onChange={handleFileChange} 
                      className="hidden" 
                      accept="image/*"
                    />
                    <label htmlFor="citizen-receipt-upload" className="cursor-pointer">
                      {payFileName ? (
                        <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                          <FileCheck className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-[10px] font-bold truncate max-w-[150px]">{payFileName}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
                          <span className="text-[9px] text-slate-500 leading-none font-medium">Klik / seret bukti slip</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-2 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white rounded-lg text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {uploading ? 'Mengirim...' : 'Kirim Bukti Pembayaran'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Primary Bento Layout Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in">
        
        {/* BLOCK 1: Main Balance & Breakdown Card (Large) - Takes 8 columns on large, all on small */}
        <section id="bento-balance" className="md:col-span-12 lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[340px] hover:shadow-md transition-shadow duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 dark:bg-emerald-950/20 rounded-full -mr-20 -mt-20 opacity-50 z-0 pointer-events-none"></div>
          
          <div className="relative z-10">
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-1 text-sm">Total Saldo Kas RT Saat Ini</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">{formatRupiah(saldoKas)}</h2>
            
            <div className="flex flex-wrap gap-4 mt-5">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-200/50 dark:border-emerald-800/30">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+12.4% bln ini</span>
              </div>
              <p className="text-slate-400 dark:text-slate-500 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Terakhir diperbarui: Hari ini, waktu real-time
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10 mt-8">
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:scale-[1.01] transition-transform duration-200">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black mb-1 tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-blue-500"></span>
                Pemasukan Juni
              </p>
              <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400">{formatRupiah(totalPemasukanBulanIni)}</p>
              <span className="text-[10px] text-slate-450 dark:text-slate-500">Iuran rutin & dana gotong-royong</span>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:scale-[1.01] transition-transform duration-200">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black mb-1 tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-rose-500"></span>
                Pengeluaran Juni
              </p>
              <p className="text-xl font-extrabold text-rose-500 dark:text-rose-400">{formatRupiah(totalPengeluaranBulanIni)}</p>
              <span className="text-[10px] text-slate-450 dark:text-slate-500">Biaya operasional & pemeliharaan</span>
            </div>
          </div>
        </section>

        {/* BLOCK 2: Resident Status & Participation (Tall) - Takes 4 columns */}
        <section id="bento-residents" className="md:col-span-12 lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white mb-5 flex justify-between items-center text-base tracking-tight">
              <span>Status Iuran Warga</span>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-slate-500 dark:text-slate-450 font-bold">Total {totalWargaAktif} KK</span>
            </h3>
            
            <div className="flex flex-col gap-3">
              {/* Lunas Box */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500 text-white rounded-xl shadow-sm shadow-blue-500/10">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-blue-950 dark:text-blue-300 block text-xs leading-none">Lunas Iuran</span>
                    <span className="text-[10px] text-blue-500 mt-1 block">Telah melunasi bulan berjalan</span>
                  </div>
                </div>
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{totalLunas}</span>
              </div>

              {/* Menunggak Box */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100/50 dark:border-orange-900/30">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-orange-500 text-white rounded-xl shadow-sm shadow-orange-500/10">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-orange-950 dark:text-orange-300 block text-xs leading-none">Belum Lunas</span>
                    <span className="text-[10px] text-orange-500 mt-1 block">Menunggu iuran masuk</span>
                  </div>
                </div>
                <span className="text-2xl font-black text-orange-600 dark:text-orange-400">{totalMenunggak}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => onTabSwitch('warga')}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-950 rounded-xl font-bold text-xs shadow-sm transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kelola Piutang & Pengingat WA</span>
            </button>
          </div>
        </section>

        {/* BLOCK 3: Target Fund Achievement Panel (Medium-Wide) - Takes 5 columns */}
        <section id="bento-targets" className="md:col-span-12 lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-slate-800 dark:text-white text-base tracking-tight">Capaian Target Dana</h3>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                Sisa Kas Aman
              </span>
            </div>

            <div className="space-y-4 max-h-[178px] overflow-y-auto custom-scrollbar pr-1">
              {targetDanaList.slice(0, 3).map((target) => {
                const allocatedFromSal = (saldoKas * (target.persentaseAlokasi / 100)) + target.sudahTerkumpul;
                const actualProgress = Math.min(100, Math.round((allocatedFromSal / target.estimasiBiaya) * 100));
                
                return (
                  <div key={target.id} className="text-left">
                    <div className="flex justify-between items-end mb-1">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{target.nama}</p>
                        <p className="text-[10px] text-slate-400">Target: {formatRupiah(target.estimasiBiaya)}</p>
                      </div>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{actualProgress}%</span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/30 dark:border-slate-900">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${actualProgress}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              
              {targetDanaList.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-4">Belum ada target pembangunan kas aktif.</p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-xs text-slate-500">
            <span className="text-[10px] text-slate-400">Dukungan Iuran Gotong Royong</span>
            <button 
              onClick={() => onTabSwitch('targets')}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-0.5 hover:underline"
            >
              <span>Detail Proyek</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </section>

        {/* BLOCK 4: High-impact Highlighted Voting Card - Takes 4 columns */}
        <section id="bento-voting" className="md:col-span-12 lg:col-span-4 bg-emerald-600 dark:bg-emerald-850 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden flex flex-col justify-between hover:scale-[1.005] transition duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-8 -mt-8 rotate-45 transform scale-125"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <span className="px-2.5 py-1 bg-emerald-500 dark:bg-emerald-700 text-[9px] font-black uppercase tracking-wider rounded-lg border border-white/10">
                Aspirasi Warga
              </span>
              <span className="text-[10px] text-emerald-100 font-semibold">Tebat 1 KK = 1 Suara</span>
            </div>

            {runningVoting ? (
              <>
                <h4 className="text-lg font-bold leading-tight mb-2 line-clamp-2">{runningVoting.judul}</h4>
                <p className="text-xs text-emerald-100/90 line-clamp-2 mb-4 leading-relaxed">{runningVoting.deskripsi}</p>
                
                <div className="space-y-1 mt-3">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span>Capaian Suara Setuju</span>
                    {runningVoting.suaraSetuju && (
                      <span>
                        {Math.round((runningVoting.suaraSetuju.length / (runningVoting.suaraSetuju.length + runningVoting.suaraTolak.length || 1)) * 100)}%
                      </span>
                    )}
                  </div>
                  <div className="w-full h-1.5 bg-emerald-700 dark:bg-emerald-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full" 
                      style={{ 
                        width: `${Math.round((runningVoting.suaraSetuju?.length / (runningVoting.suaraSetuju?.length + runningVoting.suaraTolak?.length || 1)) * 100) || 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h4 className="text-lg font-bold leading-tight mb-1">Rembuk Fogging Mandiri</h4>
                <p className="text-xs text-emerald-100/90 mb-4">Usulan pengadaan semprot fogging mandiri anti nyamuk demam berdarah.</p>
                <div className="mt-4 py-1.5 px-3 bg-white/10 rounded-xl text-center text-xs">
                  Semua voting telah diselesaikan
                </div>
              </>
            )}
          </div>

          <div className="mt-6 relative z-10">
            <button 
              onClick={() => onTabSwitch('voting')}
              className="w-full py-2.5 bg-white text-emerald-700 dark:text-emerald-950 rounded-xl font-bold text-xs shadow hover:bg-emerald-50 transition duration-150 cursor-pointer"
            >
              Ikut Ambil Suara
            </button>
          </div>
        </section>

        {/* BLOCK 5: Quick Action Grid - Takes 3 columns */}
        <section id="bento-actions" className="md:col-span-12 lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-white text-base tracking-tight mb-4">Aksi Cepat</h3>
            
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => onTabSwitch('ledger')}
                className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-blue-50/50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold text-xs border border-blue-100/30 dark:border-blue-900/20 hover:scale-[1.01] transition duration-150 cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <span>Unggah Bukti Kas</span>
              </button>

              <button 
                onClick={onOpenReportModal}
                className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200/50 dark:border-slate-800/80 hover:scale-[1.01] transition duration-150 cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-950 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <span>Ekspor Bulanan</span>
              </button>

              <button 
                onClick={onOpenReportModal}
                className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-emerald-50/50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-100/30 dark:border-emerald-900/20 hover:scale-[1.01] transition duration-150 cursor-pointer text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <span>Bagikan WA Grup</span>
              </button>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-950 dark:bg-slate-950 rounded-2xl text-center border border-slate-800/40">
            <p className="text-white font-black text-[10.5px] uppercase tracking-wider mb-0.5">Televisi RT</p>
            <p className="text-[9px] text-slate-450 leading-tight">Optimasi Layar Rapat Rukun Tetangga</p>
          </div>
        </section>

      </div>

      {/* Decorative Cash ledger summary - Refined pure SVG diagram */}
      {(() => {
        // Dynamic Real-time Calculations for April, Mei, Juni cash flows
        const getMonthlyTotal = (monthKey: string, type: 'pemasukan' | 'pengeluaran') => {
          return transaksiList
            .filter(t => t.tipe === type && t.statusPersetujuan === 'disetujui' && t.tanggal.startsWith(monthKey))
            .reduce((sum, t) => sum + t.nominal, 0);
        };

        const aprInc = getMonthlyTotal('2026-04', 'pemasukan');
        const aprExp = getMonthlyTotal('2026-04', 'pengeluaran');

        const meiInc = getMonthlyTotal('2026-05', 'pemasukan');
        const meiExp = getMonthlyTotal('2026-05', 'pengeluaran');

        const junInc = getMonthlyTotal('2026-06', 'pemasukan');
        const junExp = getMonthlyTotal('2026-06', 'pengeluaran');

        const maxVal = Math.max(100000, aprInc, aprExp, meiInc, meiExp, junInc, junExp);

        // Height helper in percentage
        const getBarHeightPercent = (val: number) => {
          const percent = Math.min(100, Math.max(4, (val / maxVal) * 100));
          return `${percent}%`;
        };

        return (
          <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 w-full shadow-sm hover:shadow-md transition duration-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Visualisasi Aliran Kas Real-Time</h3>
                <p className="text-xs text-slate-500 dark:text-slate-450">Statistik tren penerimaan iuran & pengeluaran operasional per kuartal</p>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500"></span>
                  <span>Penerimaan Kas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-rose-500"></span>
                  <span>Belanja / Pengeluaran</span>
                </div>
              </div>
            </div>

            {/* Custom Premium Mini SVG Bar Chart */}
            <div className="h-44 flex items-end justify-around px-4 pt-6 border-b border-slate-100 dark:border-slate-850 relative">
              <div className="absolute top-8 left-0 right-0 border-t border-slate-100 dark:border-slate-800/60 border-dashed"></div>
              <div className="absolute top-20 left-0 right-0 border-t border-slate-100 dark:border-slate-800/60 border-dashed"></div>
              <div className="absolute top-32 left-0 right-0 border-t border-slate-100 dark:border-slate-800/60 border-dashed"></div>
              
              {/* April */}
              <div className="flex flex-col items-center w-24 gap-1 group relative z-10">
                <div className="flex items-end gap-2 h-28 w-full justify-center">
                  <div 
                    className="w-5 bg-emerald-500/80 hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-t-lg transition duration-150 cursor-pointer" 
                    style={{ height: getBarHeightPercent(aprInc) }}
                    title={`Pemasukan April: ${formatRupiah(aprInc)}`}
                  ></div>
                  <div 
                    className="w-5 bg-rose-500/80 hover:bg-rose-505 dark:bg-rose-600 dark:hover:bg-rose-500 rounded-t-lg transition duration-150 cursor-pointer" 
                    style={{ height: getBarHeightPercent(aprExp) }}
                    title={`Pengeluaran April: ${formatRupiah(aprExp)}`}
                  ></div>
                </div>
                <span className="text-xs text-slate-450 hover:text-slate-800 dark:text-slate-400 font-bold mt-1">April</span>
                <span className="text-[9px] text-slate-400 font-mono">+{formatRupiah(aprInc - aprExp)}</span>
              </div>

              {/* Mei */}
              <div className="flex flex-col items-center w-24 gap-1 group relative z-10">
                <div className="flex items-end gap-2 h-28 w-full justify-center">
                  <div 
                    className="w-5 bg-emerald-500/80 hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-t-lg transition duration-150 cursor-pointer" 
                    style={{ height: getBarHeightPercent(meiInc) }}
                    title={`Pemasukan Mei: ${formatRupiah(meiInc)}`}
                  ></div>
                  <div 
                    className="w-5 bg-rose-500/80 hover:bg-rose-500 dark:bg-rose-600 dark:hover:bg-rose-500 rounded-t-lg transition duration-150 cursor-pointer" 
                    style={{ height: getBarHeightPercent(meiExp) }}
                    title={`Pengeluaran Mei: ${formatRupiah(meiExp)}`}
                  ></div>
                </div>
                <span className="text-xs text-slate-450 hover:text-slate-800 dark:text-slate-400 font-bold mt-1">Mei</span>
                <span className="text-[9px] text-slate-400 font-mono">+{formatRupiah(meiInc - meiExp)}</span>
              </div>

              {/* Juni */}
              <div className="flex flex-col items-center w-24 gap-1 group relative z-10">
                <div className="flex items-end gap-2 h-28 w-full justify-center">
                  <div 
                    className="w-5 bg-emerald-500/80 hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-t-lg transition duration-150 cursor-pointer" 
                    style={{ height: getBarHeightPercent(junInc) }}
                    title={`Pemasukan Juni: ${formatRupiah(junInc)}`}
                  ></div>
                  <div 
                    className="w-5 bg-rose-500/80 hover:bg-rose-505 dark:bg-rose-600 dark:hover:bg-rose-500 rounded-t-lg transition duration-150 cursor-pointer" 
                    style={{ height: getBarHeightPercent(junExp) }}
                    title={`Pengeluaran Juni: ${formatRupiah(junExp)}`}
                  ></div>
                </div>
                <span className="text-xs text-slate-450 hover:text-slate-800 dark:text-slate-400 font-bold mt-1">Juni (Skrg)</span>
                <span className="text-[9px] text-slate-450 dark:text-slate-400 font-mono font-bold">{formatRupiah(junInc - junExp)}</span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

