/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Tv, Wallet, Users, TrendingUp, TrendingDown, Target, Landmark, ArrowRight } from 'lucide-react';
import { Transaksi, Warga, TargetDana, UsulanVoting } from '../types';

interface InformationScreenProps {
  wargaList: Warga[];
  transaksiList: Transaksi[];
  targetDanaList: TargetDana[];
  usulanList: UsulanVoting[];
  onClose: () => void;
  currentMonth: string;
}

export default function InformationScreen({
  wargaList,
  transaksiList,
  targetDanaList,
  usulanList,
  onClose,
  currentMonth
}: InformationScreenProps) {
  
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  // Stats recalculations with extra large font layouts
  const totalPemasukanAll = transaksiList
    .filter(t => t.tipe === 'pemasukan' && t.statusPersetujuan === 'disetujui')
    .reduce((sum, t) => sum + t.nominal, 0);

  const totalPengeluaranAll = transaksiList
    .filter(t => t.tipe === 'pengeluaran' && t.statusPersetujuan === 'disetujui')
    .reduce((sum, t) => sum + t.nominal, 0);

  const saldoKas = totalPemasukanAll - totalPengeluaranAll;

  const totalPemasukanBulanIni = transaksiList
    .filter(t => t.tipe === 'pemasukan' && t.statusPersetujuan === 'disetujui' && t.tanggal.startsWith(currentMonth))
    .reduce((sum, t) => sum + t.nominal, 0);

  const totalPengeluaranBulanIni = transaksiList
    .filter(t => t.tipe === 'pengeluaran' && t.statusPersetujuan === 'disetujui' && t.tanggal.startsWith(currentMonth))
    .reduce((sum, t) => sum + t.nominal, 0);

  const totalWargaAktif = wargaList.filter(w => w.status === 'aktif').length;
  const totalMenunggak = wargaList.filter(w => w.status === 'aktif' && !w.riwayatPembayaran.some(p => p.bulan === currentMonth && p.status === 'disetujui')).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white overflow-y-auto custom-scrollbar p-6 md:p-10 flex flex-col justify-between">
      
      {/* Top bar header for Layar Rapat */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-xl text-white">
            <span>TR</span>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <span>Layar Informasi Rembuk RT 04</span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500 text-white font-bold tracking-normal uppercase">Mode TV / Proyektor</span>
            </h1>
            <p className="text-xs text-slate-400">Kas Transparan Real-Time • RT 04 RW 04 Kelurahan Jatingaleh, Semarang</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="p-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition flex items-center gap-1 text-sm font-semibold cursor-pointer"
        >
          <X className="w-4 h-4" />
          <span>Tutup (ESC)</span>
        </button>
      </div>

      {/* Main Grid View in extra large fonts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-8 flex-1">
        
        {/* Left Side: Massive cash card & Monthly Cash movements */}
        <div className="space-y-6 flex flex-col justify-between lg:col-span-1">
          
          {/* Cash Card */}
          <div className="p-8 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl flex flex-col justify-between h-48 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-44 h-44 bg-white/5 rounded-full -mr-12 -mt-12"></div>
            <div>
              <span className="text-emerald-100 uppercase font-black tracking-widest text-[11px]">SALDO UTAMA KAS RT</span>
              <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tight mt-2 font-mono">
                {formatRupiah(saldoKas)}
              </h2>
            </div>
            <p className="text-emerald-100/75 text-xs font-semibold flex items-center gap-1.5 pt-4 border-t border-white/10">
              <Landmark className="w-4 h-4" />
              Surat Pertanggungjawaban Bulanan Masuk Kas
            </p>
          </div>

          {/* Mini Statistics grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-[10px] text-slate-500 block font-bold uppercase mb-1">Pemasukan Juni</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">
                {formatRupiah(totalPemasukanBulanIni)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">Lunas {totalWargaAktif - totalMenunggak} KK</span>
            </div>
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-[10px] text-slate-500 block font-bold uppercase mb-1">Pengeluaran Juni</span>
              <span className="text-xl font-bold text-rose-400 font-mono">
                {formatRupiah(totalPengeluaranBulanIni)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">Gaji Sampah & Operasional</span>
            </div>
          </div>

          {/* QR Code and access guidelines details */}
          <div className="p-5 bg-slate-900/60 border border-slate-850 rounded-2xl flex items-center gap-4">
            
            {/* Native stylish SVG QR Code */}
            <div className="w-24 h-24 bg-white p-1 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 29 29" className="w-full h-full text-black">
                {/* Outer anchor top left */}
                <rect x="0" y="0" width="7" height="7" fill="currentColor"/>
                <rect x="1" y="1" width="5" height="5" fill="white"/>
                <rect x="2" y="2" width="3" height="3" fill="currentColor"/>
                {/* Outer anchor top right */}
                <rect x="22" y="0" width="7" height="7" fill="currentColor"/>
                <rect x="23" y="1" width="5" height="5" fill="white"/>
                <rect x="24" y="2" width="3" height="3" fill="currentColor"/>
                {/* Outer anchor bottom left */}
                <rect x="0" y="22" width="7" height="7" fill="currentColor"/>
                <rect x="1" y="23" width="5" height="5" fill="white"/>
                <rect x="2" y="24" width="3" height="3" fill="currentColor"/>
                
                {/* Simulated random blocks */}
                <rect x="9" y="1" width="2" height="2" fill="currentColor"/>
                <rect x="13" y="1" width="1" height="3" fill="currentColor"/>
                <rect x="17" y="0" width="3" height="1" fill="currentColor"/>
                <rect x="15" y="4" width="2" height="2" fill="currentColor"/>
                <rect x="10" y="8" width="4" height="1" fill="currentColor"/>
                <rect x="8" y="12" width="2" height="3" fill="currentColor"/>
                <rect x="13" y="15" width="3" height="2" fill="currentColor"/>
                <rect x="18" y="10" width="4" height="4" fill="currentColor"/>
                <rect x="19" y="11" width="2" height="2" fill="white"/>
                <rect x="24" y="14" width="2" height="4" fill="currentColor"/>
                <rect x="2" y="10" width="3" height="1" fill="currentColor"/>
                <rect x="4" y="15" width="2" height="3" fill="currentColor"/>
                <rect x="10" y="20" width="3" height="2" fill="currentColor"/>
                <rect x="20" y="21" width="4" height="3" fill="currentColor"/>
                <rect x="15" y="24" width="3" height="1" fill="currentColor"/>
              </svg>
            </div>

            <div className="text-left">
              <h5 className="text-xs font-bold text-slate-100 uppercase tracking-wide">Scan & Pantau dari HP Anda</h5>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                Buka Kamera HP, arahkan ke QR Code ini untuk masuk ke aplikasi WargaHubRT secara simultan sewaktu rapat warga berlangsung.
              </p>
            </div>

          </div>

        </div>

        {/* Mid Panel: Target dana strategis project list */}
        <div className="space-y-5 lg:col-span-1 border-l border-r border-slate-800/40 px-0 lg:px-6 text-left">
          <div>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest block mb-1">TARGET DANA AKTIF</span>
            <h3 className="text-lg font-bold text-slate-200">Realisasi Pembangunan Infrastruktur</h3>
          </div>

          <div className="space-y-4">
            {targetDanaList.map((target) => {
              const allocated = (saldoKas * (target.persentaseAlokasi / 100)) + target.sudahTerkumpul;
              const progress = Math.min(100, Math.round((allocated / target.estimasiBiaya) * 100));

              return (
                <div key={target.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      {target.nama}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500">PROG {progress}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden mb-3">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        progress < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Estimasi Anggaran: <span className="font-bold text-slate-100">{formatRupiah(target.estimasiBiaya)}</span></span>
                    <span>Tgl Selesai: <span className="font-bold text-slate-100">{new Date(target.targetTanggal).toLocaleDateString('id-ID', {month: 'short', year: 'numeric'})}</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Proposals Voting Outcomes and Citizens logs */}
        <div className="space-y-5 lg:col-span-1 text-left">
          <div>
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest block mb-1">USULAN REMBUK AKTIF</span>
            <h3 className="text-lg font-bold text-slate-200 font-mono">Status Pengambilan Suara</h3>
          </div>

          {usulanList.filter(u => u.status === 'voting').length === 0 ? (
            <div className="p-5 bg-slate-900/40 border border-slate-850 rounded-2xl text-slate-500 text-xs italic text-center">
              Tidak ada usulan voting aktif yang sedang berjalan saat ini.
            </div>
          ) : (
            <div className="space-y-4">
              {usulanList.filter(u => u.status === 'voting').map((u) => {
                const total = u.suaraSetuju.length + u.suaraTolak.length;
                const setujuPct = total > 0 ? Math.round((u.suaraSetuju.length / total) * 100) : 0;

                return (
                  <div key={u.id} className="p-5 bg-slate-950 border border-slate-800/80 rounded-2xl relative">
                    <h4 className="font-bold text-sm text-slate-200 mb-1 leading-snug">"{u.judul}"</h4>
                    <span className="text-[10px] text-slate-500">Pengusul: {u.namaPengusul} • Est: {formatRupiah(u.estimasiAnggaran)}</span>
                    
                    {/* Progress Bar double block */}
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mt-3 flex">
                      <div className="bg-emerald-500 h-full" style={{ width: `${setujuPct}%` }}></div>
                      <div className="bg-rose-500 h-full" style={{ width: `${100 - setujuPct}%` }}></div>
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-400 mt-2">
                      <span className="text-emerald-400 font-bold">{u.suaraSetuju.length} KK Setuju ({setujuPct}%)</span>
                      <span className="text-rose-450 font-bold text-rose-400">{u.suaraTolak.length} KK Menolak</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Clean running alert advice */}
          <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 text-emerald-300 rounded-xl text-xs flex items-start gap-2 leading-relaxed">
            <span className="text-lg leading-none mt-0.5">💡</span>
            <div>
              <span className="font-bold text-emerald-200">Gotong Royong RT 04 Jatingaleh:</span> Jika Bapak/Ibu belum melakukan setoran iuran bulan Juni, silakan lapor langsung ke Bpk. Bendahara atau mengunggah slip iuran via WargaHubRT di HP demi optimalisasi pembangunan CCTV pos ronda warga!
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Footer block */}
      <div className="pt-6 border-t border-slate-850 flex items-center justify-between text-xs text-slate-500 leading-normal">
        <div>
          <span>Waktu Sistem: {new Date().toLocaleDateString('id-ID', {weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'})}</span>
          <span className="mx-2">•</span>
          <span>Sistem Transparansi Digital Kas Kelurahan Jatingaleh</span>
        </div>
        <div>
          <span>Semua Data Terverifikasi LUNAS & Akuntabel</span>
        </div>
      </div>

    </div>
  );
}
