/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Target, Plus, AlertCircle, HelpCircle, BellRing, Sparkles, Trash2, Edit, X, Calendar, Percent } from 'lucide-react';
import { TargetDana, UserRole } from '../types';

interface TargetManagerProps {
  targetDanaList: TargetDana[];
  runningKas: number; // current balance
  avgIncomePerMonth: number; // average income rate (calculated from state, e.g. Rp 3,000,000)
  currentRole: UserRole;
  onSaveTarget: (targetData: Partial<TargetDana>) => void;
  onDeleteTarget: (id: string) => void;
  onAddToCalendar?: (target: TargetDana) => void;
}

export default function TargetManager({
  targetDanaList,
  runningKas,
  avgIncomePerMonth,
  currentRole,
  onSaveTarget,
  onDeleteTarget,
  onAddToCalendar
}: TargetManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<TargetDana | null>(null);

  // Form states
  const [formNama, setFormNama] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formBiaya, setFormBiaya] = useState('');
  const [formTanggal, setFormTanggal] = useState('');
  const [formAlokasi, setFormAlokasi] = useState(10);
  const [formStatus, setFormStatus] = useState<'aktif' | 'tercapai' | 'batal'>('aktif');

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  const handleEdit = (t: TargetDana) => {
    setEditingTarget(t);
    setFormNama(t.nama);
    setFormDesc(t.deskripsi);
    setFormBiaya(t.estimasiBiaya.toString());
    setFormTanggal(t.targetTanggal);
    setFormAlokasi(t.persentaseAlokasi);
    setFormStatus(t.status);
    setIsFormOpen(true);
  };

  const handleOpenForm = () => {
    setEditingTarget(null);
    setFormNama('');
    setFormDesc('');
    setFormBiaya('');
    setFormTanggal('');
    setFormAlokasi(10);
    setFormStatus('aktif');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveTarget({
      id: editingTarget?.id,
      nama: formNama,
      deskripsi: formDesc,
      estimasiBiaya: Number(formBiaya),
      targetTanggal: formTanggal,
      persentaseAlokasi: Number(formAlokasi),
      status: formStatus
    });
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Target allocation introduction */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600/10 via-emerald-600/5 to-slate-100 dark:from-sky-950/20 dark:via-emerald-950/10 dark:to-slate-900 border border-blue-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Percent className="w-4 h-4 text-emerald-500" />
            <span>Mesin Alokasi Otomatis Kas Aktif</span>
          </h3>
          <p className="text-xs text-slate-500 max-w-2xl">
            Sistem mengalokasikan persentase tertentu dari Saldo Kas RT Menganggur secara real-time untuk mempercepat pencapaian target fisik lingkungan, tanpa mengorbankan likuiditas operasional harian.
          </p>
        </div>

        {currentRole === 'bendahara' && (
          <button
            onClick={handleOpenForm}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-550 text-white font-bold text-xs rounded-lg shadow shadow-blue-500/10 transition leading-none cursor-pointer text-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Target Baru</span>
          </button>
        )}
      </div>

      {/* Target cards list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {targetDanaList.map((target) => {
          // Dynamic calculation
          const allocatedFromSurplus = runningKas * (target.persentaseAlokasi / 100);
          const totalAccumulated = target.sudahTerkumpul + allocatedFromSurplus;
          const progress = Math.min(100, Math.round((totalAccumulated / target.estimasiBiaya) * 100));
          const deficit = Math.max(0, target.estimasiBiaya - totalAccumulated);

          // Smart trend analysis based on average monthly income rates
          // monthlyContributionForThisTarget = avgIncomePerMonth * (target.persentaseAlokasi / 100)
          const monthlyCont = avgIncomePerMonth * (target.persentaseAlokasi / 100);
          let estMonthsRemaining = 'Tidak terhingga (Alokasi 0%)';
          if (monthlyCont > 0 && deficit > 0) {
            const months = Math.ceil(deficit / monthlyCont);
            estMonthsRemaining = `± ${months} Bulan (${months * 30} Hari) berdasarkan tren pemasukan`;
          } else if (deficit <= 0) {
            estMonthsRemaining = 'Telah Tercapai / Siap Dicairkan';
          } else if (target.persentaseAlokasi === 0) {
            estMonthsRemaining = 'Menunggu alokasi kas bulanan / donatur khusus';
          }

          // Alerts checks
          const isNearlyComplete = progress >= 90 && progress < 100;
          const isOverdueAndIncomplete = new Date(target.targetTanggal) < new Date() && progress < 100;

          return (
            <div key={target.id} className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-sm hover:shadow-md transition flex flex-col justify-between relative overflow-hidden">
              <div>
                
                {/* Visual Accent indicators */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center">
                      <Target className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm md:text-base leading-tight">
                        {target.nama}
                      </h4>
                      <span className="text-[10px] font-mono font-bold text-slate-400">ID: {target.id}</span>
                    </div>
                  </div>

                  {currentRole === 'bendahara' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(target)}
                        className="p-1 text-slate-400 hover:text-blue-500 transition"
                        title="Ubah Target"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus target "${target.nama}"?`)) onDeleteTarget(target.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500 transition"
                        title="Hapus Target"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                  {target.deskripsi}
                </p>

                {/* Warning / Alerts to satisfy requested mechanics */}
                {isNearlyComplete && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-900/40 mb-3.5 animate-pulse">
                    <BellRing className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span><span className="font-bold">Hampir Tercapai!</span> Dana proyek sudah mencapai {progress}%. Siap lapor rapat warga.</span>
                  </div>
                )}

                {isOverdueAndIncomplete && (
                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-1.5 border border-rose-200 dark:border-rose-900/40 mb-3.5">
                    <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span><span className="font-bold">Pengingat Penting:</span> Proyek melewati estimasi tanggal ({new Date(target.targetTanggal).toLocaleDateString('id-ID')}) namun belum tercapai.</span>
                  </div>
                )}

                {/* Progress calculation UI */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-slate-400 font-bold">Progress Pendanaan</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        progress < 40 ? 'bg-amber-500' : progress < 90 ? 'bg-blue-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Financial details breakdown */}
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-700/50 pt-4 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Biaya Anggaran Target:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{formatRupiah(target.estimasiBiaya)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dialokasikan Dari Kas RT ({target.persentaseAlokasi}%):</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">+{formatRupiah(allocatedFromSurplus)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tabungan Dana Khusus:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-350">{formatRupiah(target.sudahTerkumpul)}</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-slate-100 dark:border-slate-700 pt-1.5">
                    <span className="text-slate-400 font-bold">Kekurangan Sisa Dana:</span>
                    <span className="font-bold text-rose-600">{formatRupiah(deficit)}</span>
                  </div>
                </div>

              </div>

              {/* Add to Google Calendar Action */}
              {onAddToCalendar && currentRole === 'bendahara' && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                   <button
                     onClick={() => onAddToCalendar(target)}
                     className="w-full flex justify-center items-center gap-1.5 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                   >
                     <Calendar className="w-3.5 h-3.5" />
                     Beri Penanda di Google Calendar
                   </button>
                </div>
              )}

              {/* Dynamic estimates based on cash flow projections */}
              <div className="border-t border-slate-100 dark:border-slate-700/50 pt-3 mt-4 flex items-center justify-between text-[11px] bg-slate-50 dark:bg-slate-900/30 p-2.5 rounded-lg">
                <span className="text-slate-400 font-semibold uppercase font-mono">Estimasi Waktu:</span>
                <span className="text-slate-750 dark:text-slate-200 font-bold truncate max-w-[210px]" title={estMonthsRemaining}>
                  {estMonthsRemaining}
                </span>
              </div>

            </div>
          );
        })}
      </div>

      {/* Pop Up Form Editor for Target */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {editingTarget ? 'Modifikasi Target Pengeluaran' : 'Buat Target Pembangunan RT Baru'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Nama Proyek Target</label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Pengadaan 5 Unit CCTV Sudut Komplek"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Penjelasan / Deskripsi Rencana</label>
                <textarea
                  required
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Deskripsikan secara detail agar warga mengerti urgensi program..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Estimasi Anggaran Biaya (Rp)</label>
                  <input
                    type="number"
                    required
                    value={formBiaya}
                    onChange={(e) => setFormBiaya(e.target.value)}
                    placeholder="E.g. 4500000"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Target Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Persen Alokasi Kas Menganggur</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      value={formAlokasi}
                      onChange={(e) => setFormAlokasi(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100 pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Status Proyek</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="tercapai">Sudah Tercapai / Rampung</option>
                    <option value="batal">Dibatalkan</option>
                  </select>
                </div>
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
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-550 rounded-lg shadow-md transition"
                >
                  {editingTarget ? 'Simpan Perubahan' : 'Buat Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
