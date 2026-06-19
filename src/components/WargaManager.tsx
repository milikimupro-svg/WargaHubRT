/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, UserPlus, FileText, Send, Check, X, Edit, Trash2, ShieldAlert, BadgeHelp, CheckCircle, ChevronDown, ChevronUp, Calendar, Clock } from 'lucide-react';
import { Warga, PembayaranIuran, UserRole } from '../types';

interface WargaManagerProps {
  wargaList: Warga[];
  currentRole: UserRole;
  onSaveWarga: (wargaData: Partial<Warga>) => void;
  onDeleteWarga: (kk: string) => void;
  onApproveIuran: (kk: string, bulan: string, status: 'disetujui' | 'ditolak') => void;
  onDirectIuranLunas?: (kk: string, bulan: string, nominal: number) => Promise<{ success: boolean; message: string }>;
  onPushNotification: (penerima: string, pesan: string, tipe: any) => void;
  currentMonth: string;
}

export default function WargaManager({
  wargaList,
  currentRole,
  onSaveWarga,
  onDeleteWarga,
  onApproveIuran,
  onDirectIuranLunas,
  onPushNotification,
  currentMonth
}: WargaManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'aktif' | 'nonaktif' | 'menunggak'>('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // States for adding / editing warga
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWarga, setEditingWarga] = useState<Partial<Warga> | null>(null);
  
  // Form fields
  const [formKK, setFormKK] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formAlamat, setFormAlamat] = useState('');
  const [formWhatsApp, setFormWhatsApp] = useState('');
  const [formStatus, setFormStatus] = useState<'aktif' | 'nonaktif'>('aktif');
  const [formIuran, setFormIuran] = useState(50000);
  const [formJatuhTempo, setFormJatuhTempo] = useState(10);

  const [expandedBillingKk, setExpandedBillingKk] = useState<string | null>(null);

  const MONTHS_LIST = [
    { key: '2026-01', label: 'Jan' },
    { key: '2026-02', label: 'Feb' },
    { key: '2026-03', label: 'Mar' },
    { key: '2026-04', label: 'Apr' },
    { key: '2026-05', label: 'Mei' },
    { key: '2026-06', label: 'Jun' },
    { key: '2026-07', label: 'Jul' },
    { key: '2026-08', label: 'Agt' },
    { key: '2026-09', label: 'Sep' },
    { key: '2026-10', label: 'Okt' },
    { key: '2026-11', label: 'Nov' },
    { key: '2026-12', label: 'Des' }
  ];

  // Set up edit mode
  const handleEdit = (w: Warga) => {
    setEditingWarga(w);
    setFormKK(w.kk);
    setFormNama(w.kepalaKeluarga);
    setFormAlamat(w.alamat);
    setFormWhatsApp(w.noWhatsApp);
    setFormStatus(w.status);
    setFormIuran(w.iuranWajib);
    setFormJatuhTempo(w.jatuhTempo);
    setIsFormOpen(true);
  };

  const handleOpenNewForm = () => {
    setEditingWarga(null);
    setFormKK('');
    setFormNama('');
    setFormAlamat('');
    setFormWhatsApp('');
    setFormStatus('aktif');
    setFormIuran(50000);
    setFormJatuhTempo(10);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveWarga({
      kk: formKK,
      kepalaKeluarga: formNama,
      alamat: formAlamat,
      noWhatsApp: formWhatsApp,
      status: formStatus,
      iuranWajib: Number(formIuran),
      jatuhTempo: Number(formJatuhTempo)
    });
    setIsFormOpen(false);
  };

  const handleDirectCheck = async (w: Warga) => {
    if (onDirectIuranLunas) {
      const res = await onDirectIuranLunas(w.kk, currentMonth, w.iuranWajib);
      if (res.success) {
        setSuccessMessage(res.message);
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        alert(res.message);
      }
    }
  };

  const handleDirectCheckMonth = async (kk: string, bulan: string, nominal: number) => {
    if (onDirectIuranLunas) {
      const res = await onDirectIuranLunas(kk, bulan, nominal);
      if (res.success) {
        setSuccessMessage(res.message);
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        alert(res.message);
      }
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  // Helper check if citizen has unpaid bills for the currentMonth
  const checkStatusTunggakan = (w: Warga) => {
    if (w.status === 'nonaktif') return 'lunas';
    const approvedThisMonth = w.riwayatPembayaran.some(p => p.bulan === currentMonth && p.status === 'disetujui');
    const pendingThisMonth = w.riwayatPembayaran.some(p => p.bulan === currentMonth && p.status === 'pending');
    if (approvedThisMonth) return 'lunas';
    if (pendingThisMonth) return 'pending';
    return 'menunggak';
  };

  // Filter list
  const filteredWarga = wargaList.filter(w => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = w.kepalaKeluarga.toLowerCase().includes(term) || 
                          w.kk.includes(term) ||
                          w.alamat.toLowerCase().includes(term);
    
    const tunggakanStatus = checkStatusTunggakan(w);
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'aktif') return matchesSearch && w.status === 'aktif';
    if (statusFilter === 'nonaktif') return matchesSearch && w.status === 'nonaktif';
    if (statusFilter === 'menunggak') return matchesSearch && w.status === 'aktif' && tunggakanStatus === 'menunggak';
    return matchesSearch;
  });



  return (
    <div className="space-y-6">
      
      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl flex items-center justify-between text-sm text-emerald-800 dark:text-emerald-300 font-medium animate-fade-in shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>{successMessage}</span>
          </div>
          <button 
            onClick={() => setSuccessMessage(null)} 
            className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 font-extrabold text-xs px-2 py-1 transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kepala keluarga, KK, alamat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center bg-slate-150 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md font-medium transition ${statusFilter === 'all' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter('aktif')}
              className={`px-3 py-1 rounded-md font-medium transition ${statusFilter === 'aktif' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Aktif
            </button>
            <button
              onClick={() => setStatusFilter('menunggak')}
              className={`px-3 py-1 rounded-md font-medium transition ${statusFilter === 'menunggak' ? 'bg-rose-500 text-white shadow-sm' : 'text-rose-500 hover:text-rose-600'}`}
            >
              Tunggak
            </button>
            <button
              onClick={() => setStatusFilter('nonaktif')}
              className={`px-3 py-1 rounded-md font-medium transition ${statusFilter === 'nonaktif' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Nonaktif
            </button>
          </div>

          {currentRole === 'bendahara' && (
            <button
              onClick={handleOpenNewForm}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-550 text-white font-medium text-xs rounded-lg shadow-sm transition leading-none cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Tambah Warga</span>
            </button>
          )}
        </div>
      </div>

      {/* Citizen Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWarga.map((w) => {
          const tunggakanStatus = checkStatusTunggakan(w);
          
          return (
            <div 
              key={w.kk} 
              className={`p-5 rounded-2xl border bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition relative overflow-hidden flex flex-col justify-between ${
                w.status === 'nonaktif' 
                  ? 'border-slate-200 opacity-65' 
                  : tunggakanStatus === 'menunggak' 
                  ? 'border-rose-200 dark:border-rose-950/50 ring-2 ring-rose-500/5' 
                  : 'border-slate-200 dark:border-slate-850'
              }`}
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between mb-3.5">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 dark:text-slate-500">
                      KK {w.kk.substring(0, 8)}...
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                      {w.kepalaKeluarga}
                    </h3>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-col items-end gap-1">
                    {w.status === 'nonaktif' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-400">
                        NONAKTIF
                      </span>
                    ) : tunggakanStatus === 'lunas' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                        LUNAS JUNI
                      </span>
                    ) : tunggakanStatus === 'pending' ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 animate-pulse">
                        PENDING VERIF
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                        MENUNGGAK
                      </span>
                    )}
                  </div>
                </div>

                {/* Sub-details */}
                <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4">
                  <div className="flex justify-between">
                    <span>Alamat:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{w.alamat}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>No WhatsApp:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 font-mono">{w.noWhatsApp}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                    <span>Iuran Wajib:</span>
                    <span>{formatRupiah(w.iuranWajib)} / bln</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jatuh Tempo:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">Tgl {w.jatuhTempo}</span>
                  </div>
                </div>



                {/* Current month verification list */}
                <div className="border-t border-slate-100 dark:border-slate-700/50 pt-3 mt-3 ">
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 mb-2">Persetujuan & Riwayat Iuran</h4>
                  
                  {w.riwayatPembayaran.length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic">Belum ada catatan pembayaran iuran.</div>
                  ) : (
                    <div className="space-y-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                      {w.riwayatPembayaran.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800/60">
                          <span className="font-mono text-slate-600 dark:text-slate-300 font-medium">{p.bulan}</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{formatRupiah(p.nominal)}</span>
                          
                          {p.status === 'disetujui' ? (
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Disetujui
                            </span>
                          ) : p.status === 'pending' ? (
                            <div className="flex items-center gap-1">
                              {currentRole === 'bendahara' ? (
                                <>
                                  <button
                                    onClick={() => onApproveIuran(w.kk, p.bulan, 'disetujui')}
                                    className="p-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition"
                                    title="Setujui Pembayaran"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => onApproveIuran(w.kk, p.bulan, 'ditolak')}
                                    className="p-1 rounded bg-rose-500 hover:bg-rose-600 text-white shadow-sm transition"
                                    title="Tolak Pembayaran"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] text-amber-500 animate-pulse font-medium">Bukt Verif...</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-0.5">
                              <X className="w-3 h-3" /> Ditolak
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>                    {/* Collapsible Yearly Billing Status */}
                    {w.status === 'aktif' && (
                      <div className="mt-4 border-t border-slate-150 dark:border-slate-700/50 pt-3">
                        <button
                          onClick={() => setExpandedBillingKk(expandedBillingKk === w.kk ? null : w.kk)}
                          className="w-full flex items-center justify-between text-xs font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                        >
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            Detail Tagihan 1 Tahun (2026)
                          </span>
                          {expandedBillingKk === w.kk ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </button>

                        {expandedBillingKk === w.kk && (
                          <div className="mt-2.5 grid grid-cols-3 gap-1.5 bg-slate-50 dark:bg-slate-900/35 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                            {MONTHS_LIST.map((m) => {
                              const pembayaran = w.riwayatPembayaran.find(p => p.bulan === m.key);
                              const isLunas = pembayaran?.status === 'disetujui';
                              const isPending = pembayaran?.status === 'pending';

                              return (
                                <div 
                                  key={m.key} 
                                  onClick={() => {
                                    if (currentRole === 'bendahara' && !isLunas && !isPending) {
                                      handleDirectCheckMonth(w.kk, m.key, w.iuranWajib);
                                    }
                                  }}
                                  className={`p-2 rounded-xl border text-xs flex flex-col justify-between h-[52px] transition duration-150 select-none ${
                                    isLunas 
                                      ? 'bg-emerald-500/10 border-emerald-300 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300' 
                                      : isPending
                                      ? 'bg-amber-500/10 border-amber-300 dark:border-amber-850/80 text-amber-800 dark:text-amber-350'
                                      : currentRole === 'bendahara'
                                      ? 'bg-white hover:bg-emerald-50/50 dark:bg-slate-800 dark:hover:bg-emerald-950/20 border-slate-200 hover:border-emerald-300 dark:border-slate-700 cursor-pointer shadow-xs active:scale-[0.98]'
                                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                                  }`}
                                  title={currentRole === 'bendahara' && !isLunas && !isPending ? `Klik untuk mencentang Lunas iuran ${m.label}` : undefined}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-[11px]">
                                      {m.label}
                                    </span>
                                    
                                    <input
                                      type="checkbox"
                                      checked={isLunas}
                                      disabled={isLunas || isPending || currentRole !== 'bendahara'}
                                      onChange={() => {}} // Managed by parent click event
                                      className={`w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 dark:border-slate-700 cursor-pointer focus:ring-emerald-500 ${
                                        isLunas 
                                          ? 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950' 
                                          : 'bg-white dark:bg-slate-900'
                                      }`}
                                    />
                                  </div>

                                  <div className="flex items-center justify-between text-[9px]">
                                    {isLunas ? (
                                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                        Lunas (v)
                                      </span>
                                    ) : isPending ? (
                                      <span className="font-semibold text-amber-500 animate-pulse">
                                        Verif...
                                      </span>
                                    ) : currentRole === 'bendahara' ? (
                                      <span className="font-bold text-slate-400 group-hover:text-emerald-500 transition-colors">
                                        Bayar
                                      </span>
                                    ) : (
                                      <span className="font-medium text-slate-400">
                                        Belum
                                      </span>
                                    )}
                                    <span className="text-[8px] text-slate-400 font-mono">
                                      {m.key.split('-')[1]}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
              </div>

              {/* Action Buttons */}
              {currentRole === 'bendahara' && (
                <div className="flex items-center justify-end border-t border-slate-100 dark:border-slate-700/50 pt-3 mt-4">
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => handleEdit(w)}
                      className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition"
                      title="Edit Data Warga"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if(confirm(`Yakin ingin menghapus warga ${w.kepalaKeluarga}? Semua riwayat iurannya juga akan dihapus.`)) {
                          onDeleteWarga(w.kk);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition"
                      title="Hapus Warga"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              </div>

            );
          })}
      </div>

      {/* Pop Up Form Editor for Warga */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-250">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {editingWarga ? 'Modifikasi Parameter Warga' : 'Registrasi Kepala Keluarga Baru'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Nomor KK (Sebagai Username)</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingWarga}
                    value={formKK}
                    onChange={(e) => setFormKK(e.target.value)}
                    placeholder="337401xxxxxxxx"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Nama Kepala Keluarga</label>
                  <input
                    type="text"
                    required
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    placeholder="Contoh: Yusuf Kalla"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Alamat Rumah Lengkap</label>
                <input
                  type="text"
                  required
                  value={formAlamat}
                  onChange={(e) => setFormAlamat(e.target.value)}
                  placeholder="Contoh: Gg. IV No 12"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">No WhatsApp (Aktif)</label>
                  <input
                    type="text"
                    required
                    value={formWhatsApp}
                    onChange={(e) => setFormWhatsApp(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Status Kehadiran</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100"
                  >
                    <option value="aktif">Aktif (Wajib Iuran)</option>
                    <option value="nonaktif">Nonaktif / Pindah</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Iuran Wajib Bulanan</label>
                  <input
                    type="number"
                    required
                    value={formIuran}
                    onChange={(e) => setFormIuran(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Tanggal Jatuh Tempo Bulanan</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={formJatuhTempo}
                    onChange={(e) => setFormJatuhTempo(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100 font-mono"
                  />
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
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-550 rounded-lg shadow-md transition"
                >
                  {editingWarga ? 'Perbarui Parameter' : 'Daftarkan Warga'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



    </div>
  );
}
