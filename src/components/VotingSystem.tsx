/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Vote, FilePlus, User, Hand, ThumbsUp, ThumbsDown, Calendar, CheckCircle2, XCircle, ChevronRight, X, AlertCircle } from 'lucide-react';
import { UsulanVoting, UserRole } from '../types';

interface VotingSystemProps {
  usulanList: UsulanVoting[];
  currentRole: UserRole;
  currentWargaKK?: string; // logged-in citizen's KK number if any
  currentWargaName?: string; // logged-in citizen's Name if any
  totalKeluargaAktif: number;
  onAddUsulan: (usulanData: Partial<UsulanVoting>) => void;
  onCastVote: (usulanId: string, pilihan: 'setuju' | 'tolak') => void;
  onDecideUsulan: (usulanId: string, status: 'disetujui_rt' | 'ditolak_rt', catatan: string) => void;
}

export default function VotingSystem({
  usulanList,
  currentRole,
  currentWargaKK,
  currentWargaName,
  totalKeluargaAktif,
  onAddUsulan,
  onCastVote,
  onDecideUsulan
}: VotingSystemProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formJudul, setFormJudul] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formAnggaran, setFormAnggaran] = useState('');

  // Ketua RT Decision Drawer
  const [decidingUsulan, setDecidingUsulan] = useState<UsulanVoting | null>(null);
  const [rtCatatan, setRtCatatan] = useState('');

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  const handleCreateUsulan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formJudul || !formDesc || !formAnggaran) return;

    onAddUsulan({
      judul: formJudul,
      deskripsi: formDesc,
      estimasiAnggaran: Number(formAnggaran),
      pengusulKK: currentWargaKK || '3374012345670001', // defaults to Bpk Yusuf if done by admin/bendahara
      namaPengusul: currentWargaName || 'Yusuf Kalla Jatingaleh'
    });

    setIsFormOpen(false);
    setFormJudul('');
    setFormDesc('');
    setFormAnggaran('');
  };

  const retrieveRtDecision = (usulan: UsulanVoting) => {
    setDecidingUsulan(usulan);
    setRtCatatan('');
  };

  const handleRtResolve = (status: 'disetujui_rt' | 'ditolak_rt') => {
    if (decidingUsulan) {
      onDecideUsulan(decidingUsulan.id, status, rtCatatan);
      setDecidingUsulan(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Introduction banner and launcher */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-600/10 via-blue-500/5 to-slate-100 dark:from-slate-850 dark:to-slate-900 border border-indigo-505/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Vote className="w-4 h-4 text-indigo-500" />
            <span>Sistem Kedaulatan Rembuk Warga RT 04</span>
          </h3>
          <p className="text-xs text-slate-500 max-w-xl">
            Satu kepala keluarga memiliki hak eksklusif 1 (Satu) suara. Pengeluaran baru yang diajukan warga akan otomatis masuk pemungutan suara (voting) sebelum disahkan oleh Ketua RT.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-550 text-white font-bold text-xs rounded-lg shadow-sm transition leading-none cursor-pointer text-nowrap"
        >
          <FilePlus className="w-3.5 h-3.5" />
          <span>Buat Usulan Baru</span>
        </button>
      </div>

      {/* Usulans proposals list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {usulanList.map((usulan) => {
          const totalVotes = usulan.suaraSetuju.length + usulan.suaraTolak.length;
          
          // Calculate percentages
          const pctSetuju = totalVotes > 0 ? Math.round((usulan.suaraSetuju.length / totalVotes) * 100) : 0;
          const pctTolak = totalVotes > 0 ? Math.round((usulan.suaraTolak.length / totalVotes) * 100) : 0;
          
          const isVotedByMe = currentWargaKK 
            ? usulan.suaraSetuju.includes(currentWargaKK) || usulan.suaraTolak.includes(currentWargaKK) 
            : false;

          const isClosed = usulan.status !== 'voting';
          const hasPassedVoting = (usulan.suaraSetuju.length > usulan.suaraTolak.length) && (totalVotes >= Math.ceil(totalKeluargaAktif / 2));

          return (
            <div 
              key={usulan.id} 
              className={`p-6 bg-white dark:bg-slate-800 rounded-2xl border shadow-sm flex flex-col justify-between ${
                isClosed 
                  ? 'border-slate-200 opacity-80' 
                  : 'border-indigo-200 dark:border-indigo-900/40 ring-2 ring-indigo-500/5'
              }`}
            >
              <div>
                
                {/* Header item */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 dark:bg-slate-900/60 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-850">
                      ID Usulan: {usulan.id}
                    </span>
                    <h4 className="font-bold text-slate-950 dark:text-white text-base leading-tight mt-1.5">
                      {usulan.judul}
                    </h4>
                  </div>

                  {/* Status badge */}
                  <div>
                    {usulan.status === 'voting' ? (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-150 text-indigo-750 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300 animate-pulse border border-indigo-200/50">
                        VOTING AKTIF
                      </span>
                    ) : usulan.status === 'lolos' ? (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                        LOLOS VOTING
                      </span>
                    ) : usulan.status === 'disetujui_rt' ? (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        DISETUJUI RT
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 flex items-center gap-0.5">
                        <XCircle className="w-3 h-3 text-rose-500" />
                        DITOLAK RT
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  {usulan.deskripsi}
                </p>

                {/* Anggaran proposal */}
                <div className="flex justify-between items-center text-xs bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg mb-4">
                  <span className="text-slate-400 uppercase font-bold text-[10px]">Estimasi Anggaran:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono text-sm">
                    {formatRupiah(usulan.estimasiAnggaran)}
                  </span>
                </div>

                {/* Voter percentages graph layout */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Partisipasi Keluarga ({totalVotes}/{totalKeluargaAktif} KK)</span>
                    <span className="font-mono">{pctSetuju}% Setuju</span>
                  </div>
                  
                  {/* Progress double bar */}
                  <div className="w-full bg-rose-100 dark:bg-rose-950/40 h-3 rounded-full flex overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${pctSetuju}%` }}></div>
                    <div className="bg-rose-500 h-full transition-all duration-300" style={{ width: `${pctTolak}%` }}></div>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3 text-emerald-500" /> {usulan.suaraSetuju.length} KK Setuju
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsDown className="w-3 h-3 text-rose-500" /> {usulan.suaraTolak.length} KK Menolak
                    </span>
                  </div>
                </div>

                {/* RT feedback / catatan */}
                {usulan.catatanKetua && (
                  <div className="p-3 rounded-lg bg-orange-50/70 dark:bg-orange-950/15 text-orange-850 dark:text-orange-350 text-xs border border-orange-200/40 mb-4 text-left">
                    <span className="font-bold block text-[10px] uppercase text-orange-500">Arahan / Tanggapan Ketua RT:</span>
                    <p className="mt-1 leading-relaxed italic">"{usulan.catatanKetua}"</p>
                  </div>
                )}

              </div>

              {/* Interactions Box */}
              <div className="border-t border-slate-100 dark:border-slate-700/50 pt-3 mt-4 flex flex-col gap-2.5">
                
                {/* 1. If voting active & role allows, citizen votes */}
                {!isClosed && (
                  <div className="flex items-center justify-between gap-2.5">
                    {/* Display who proposed */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <User className="w-3.5 h-3.5" />
                      <span>Oleh: <span className="font-semibold text-slate-700 dark:text-slate-350">{usulan.namaPengusul}</span></span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (!currentWargaKK) {
                            alert("Anda harus memilih/masuk sebagai Warga atau login No KK terlebih dahulu di panel atas!");
                            return;
                          }
                          onCastVote(usulan.id, 'setuju');
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition ${
                          currentWargaKK && usulan.suaraSetuju.includes(currentWargaKK)
                            ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/10'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                        }`}
                        title="Setujui program usulan"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>Setuju</span>
                      </button>

                      <button
                        onClick={() => {
                          if (!currentWargaKK) {
                            alert("Anda harus memilih/masuk sebagai Warga atau login No KK terlebih dahulu di panel atas!");
                            return;
                          }
                          onCastVote(usulan.id, 'tolak');
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition ${
                          currentWargaKK && usulan.suaraTolak.includes(currentWargaKK)
                            ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/10'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-800'
                        }`}
                        title="Tolak program usulan"
                      >
                        <ThumbsDown className="w-3 h-3" />
                        <span>Tolak</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Ketua RT decision trigger */}
                {!isClosed && currentRole === 'ketua_rt' && (
                  <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-300 border border-blue-200/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-left">
                    <div className="space-y-0.5">
                      <span className="font-bold">Otorisasi Diskonf/Persetujuan:</span>
                      <p className="text-slate-500">Voting masih dibuka. Namun Ketua RT dapat memutus hasil rembuk sekarang.</p>
                    </div>
                    <button
                      onClick={() => retrieveRtDecision(usulan)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow-sm scale-100 active:scale-95 duration-100 whitespace-nowrap"
                    >
                      Beri Keputusan RT
                    </button>
                  </div>
                )}

                {/* Deadline info */}
                <span className="text-[10px] text-slate-400 dark:text-slate-500 text-left flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Batas waktu voting: {new Date(usulan.tanggalBatas).toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'})}
                </span>

              </div>

            </div>
          );
        })}
      </div>

      {/* Pop Up Form: Buat Usulan Mewakili Warga */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Ajukan Usulan Rencana Kerja (Rembuk Warga)
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUsulan} className="p-6 space-y-4 text-left">
              
              {currentWargaKK && (
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-300 rounded-lg text-xs flex justify-between">
                  <span>Mewakili KK: <span className="font-bold">{currentWargaName} ({currentWargaKK})</span></span>
                  <span className="font-semibold px-2 py-0.5 rounded bg-white dark:bg-indigo-900 border border-indigo-200 text-indigo-700 dark:text-indigo-300">Hak Suara Aktif</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Judul Usulan Program</label>
                <input
                  type="text"
                  required
                  value={formJudul}
                  onChange={(e) => setFormJudul(e.target.value)}
                  placeholder="Contoh: Pembelian Fogging Massal atau Pengecatan Gapura"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Deskripsi Latar Belakang & Analogi Kerja</label>
                <textarea
                  required
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Terangkan alasan mengapa program ini penting bagi warga RT 04 Kelurahan Jatingaleh..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Estimasi Kebutuhan Anggaran Warga (Rp)</label>
                <input
                  type="number"
                  required
                  value={formAnggaran}
                  onChange={(e) => setFormAnggaran(e.target.value)}
                  placeholder="E.g. 1500000"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100 font-mono"
                />
              </div>

              <div className="border-t border-slate-105 dark:border-slate-800 pt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-550 rounded-lg shadow-md transition"
                >
                  Mulai Ambil Hak Suara (Vote)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RT Final decision modal for proposal */}
      {decidingUsulan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print border-l">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 text-left">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-indigo-50/50 dark:bg-indigo-950/20">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Keputusan Hasil Rembuk RT 04
              </h3>
              <button 
                onClick={() => setDecidingUsulan(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg space-y-1.5">
                <p className="text-xs text-slate-450 uppercase">Judul Rencana:</p>
                <p className="font-bold text-xs text-slate-900 dark:text-white">"{decidingUsulan.judul}"</p>
                
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-550 border-t border-slate-200 dark:border-slate-800 pt-1.5 mt-1.5">
                  <span>Anggaran: Rp{decidingUsulan.estimasiAnggaran.toLocaleString("id-ID")}</span>
                  <span className="text-emerald-600 font-bold">Suara Setuju: {decidingUsulan.suaraSetuju.length} KK</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Catatan Penjelasan Ketua RT (Dicatat Abadi)</label>
                <textarea
                  value={rtCatatan}
                  onChange={(e) => setRtCatatan(e.target.value)}
                  placeholder="Misal: Disetujui karena sangat mendesak & ketersediaan dana kas longgar..."
                  rows={2.5}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100"
                ></textarea>
              </div>

              <div className="border-t border-slate-105 dark:border-slate-800 pt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleRtResolve('ditolak_rt')}
                  className="px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                >
                  Tolak Rencana
                </button>
                <button
                  type="button"
                  onClick={() => handleRtResolve('disetujui_rt')}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-550 rounded-lg shadow-md transition"
                >
                  Setujui & Buat Proyek Target
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
