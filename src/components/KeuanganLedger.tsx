/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Filter, FileSpreadsheet, FileText, Check, X, ShieldAlert, Upload, Search, HelpCircle, FileCheck, ExternalLink, Share2, Calendar, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { Transaksi, UserRole, Warga } from '../types';

interface KeuanganLedgerProps {
  transaksiList: Transaksi[];
  wargaList?: Warga[];
  currentMonth?: string;
  currentRole: UserRole;
  currentUser: string;
  onAddTransaksi: (txData: Partial<Transaksi>) => void;
  onEditTransaksi?: (id: string, txData: Partial<Transaksi>) => void;
  onDeleteTransaksi?: (id: string) => void;
  onApproveTransaksi: (id: string, status: 'disetujui' | 'ditolak', catatan: string) => void;
  onDirectIuranLunas?: (kk: string, bulan: string, nominal: number) => Promise<{ success: boolean; message: string }>;
  onOpenReportModal: () => void;
  onSyncGoogleSheets?: () => void;
}

export default function KeuanganLedger({
  transaksiList,
  wargaList = [],
  currentMonth = 'Juni 2026',
  currentRole,
  currentUser,
  onAddTransaksi,
  onEditTransaksi,
  onDeleteTransaksi,
  onApproveTransaksi,
  onDirectIuranLunas,
  onOpenReportModal,
  onSyncGoogleSheets
}: KeuanganLedgerProps) {
  const [filterType, setFilterType] = useState<'all' | 'pemasukan' | 'pengeluaran'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Recording Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaksi | null>(null);
  const [txTipe, setTxTipe] = useState<'pemasukan' | 'pengeluaran'>('pemasukan');
  const [txKategori, setTxKategori] = useState('Iuran Bulanan');
  const [txNominal, setTxNominal] = useState('');
  const [txKeterangan, setTxKeterangan] = useState('');
  const [txBukti, setTxBukti] = useState<string>(''); // mock filename / base64
  const [dragActive, setDragActive] = useState(false);
  const [successTxMessage, setSuccessTxMessage] = useState<string | null>(null);

  // Review states (Ketua RT decision)
  const [reviewingTx, setReviewingTx] = useState<Transaksi | null>(null);
  const [reviewCatatan, setReviewCatatan] = useState('');

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
  };

  // Helper categories options
  const kategoriPemasukan = ['Iuran Bulanan', 'Donasi', 'Denda', 'Lain-lain'];
  const kategoriPengeluaran = ['Kebersihan', 'Keamanan', 'Perbaikan Fasilitas', 'Kegiatan Warga', 'Administrasi', 'Darurat', 'Lainnya'];

  // Handle transaction submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txNominal || !txKeterangan) return;

    if (editingTx) {
      if (onEditTransaksi) {
        onEditTransaksi(editingTx.id, {
          nominal: Number(txNominal),
          tipe: txTipe,
          kategori: txKategori,
          keterangan: txKeterangan,
          buktiTransaksi: txBukti || 'bukti_berkas_rt.png'
        });
      }
    } else {
      onAddTransaksi({
        nominal: Number(txNominal),
        tipe: txTipe,
        kategori: txKategori,
        keterangan: txKeterangan,
        buktiTransaksi: txBukti || 'bukti_berkas_rt.png',
        pembuat: currentUser
      });
    }

    // Reset Form
    setIsFormOpen(false);
    setEditingTx(null);
    setTxNominal('');
    setTxKeterangan('');
    setTxBukti('');
  };

  const handleEditClick = (tx: Transaksi) => {
    setEditingTx(tx);
    setTxTipe(tx.tipe);
    setTxKategori(tx.kategori);
    setTxNominal(tx.nominal.toString());
    setTxKeterangan(tx.keterangan);
    setTxBukti(tx.buktiTransaksi || '');
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus transaksi ini? Hubungan dengan iuran lunas warga (jika ada) juga akan otomatis dihapus.")) {
      if (onDeleteTransaksi) {
        onDeleteTransaksi(id);
      }
    }
  };

  // Drag and drop events
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
      const file = e.dataTransfer.files[0];
      setTxBukti(file.name);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTxBukti(e.target.files[0].name);
    }
  };

  const openReviewModal = (tx: Transaksi) => {
    setReviewingTx(tx);
    setReviewCatatan('');
  };

  const handleDecision = (status: 'disetujui' | 'ditolak') => {
    if (reviewingTx) {
      onApproveTransaksi(reviewingTx.id, status, reviewCatatan);
      setReviewingTx(null);
    }
  };

  // Filter application
  const filteredTransaksi = transaksiList.filter(tx => {
    const term = searchTerm.toLowerCase();
    const matchSearch = tx.keterangan.toLowerCase().includes(term) || 
                        tx.kategori.toLowerCase().includes(term) ||
                        tx.id.toLowerCase().includes(term);
    const matchType = filterType === 'all' || tx.tipe === filterType;
    const matchCat = filterCategory === 'all' || tx.kategori === filterCategory;

    return matchSearch && matchType && matchCat;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Ledger toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 no-print">
        
        {/* Left side search & filter buttons */}
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari transaksi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as any);
                setFilterCategory('all');
              }}
              className="text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700 dark:text-slate-300"
            >
              <option value="all">Semua Tipe</option>
              <option value="pemasukan">Pemasukan Only</option>
              <option value="pengeluaran">Pengeluaran Only</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700 dark:text-slate-300"
            >
              <option value="all">Semua Kategori</option>
              {filterType === 'pemasukan' && kategoriPemasukan.map(c => <option key={c} value={c}>{c}</option>)}
              {filterType === 'pengeluaran' && kategoriPengeluaran.map(c => <option key={c} value={c}>{c}</option>)}
              {filterType === 'all' && [...kategoriPemasukan, ...kategoriPengeluaran].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Action button for adding & report export */}
        <div className="flex items-center gap-3 justify-end">
          {onSyncGoogleSheets && currentRole === 'bendahara' && (
            <button
              onClick={onSyncGoogleSheets}
              className="flex items-stretch focus:ring-2 focus:ring-green-500/50 rounded-lg overflow-hidden group shadow-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-green-300 transition-colors"
            >
              <div className="bg-green-500 text-white flex items-center justify-center pl-3 pr-2.5">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="px-3 py-2 flex items-center bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition">
                Sync ke Google Sheets
              </div>
            </button>
          )}

          <button
            onClick={onOpenReportModal}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-lg transition"
            title="Cetak & bagikan laporan PDF resmi RT"
          >
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span>Ekspor & Cetak PDF</span>
          </button>

          {currentRole === 'bendahara' && (
            <button
              onClick={() => {
                setTxTipe('pemasukan');
                setTxKategori('Iuran Bulanan');
                setIsFormOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-550 text-white font-bold text-xs rounded-lg shadow shadow-emerald-500/10 transition leading-none cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Input Transaksi</span>
            </button>
          )}
        </div>
      </div>

      {/* Ledger Table rendering */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/40 border-b border-slate-150 dark:border-slate-700/60 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                <th className="p-4 pl-6">ID Transaksi & Tanggal</th>
                <th className="p-4">Kategori & Keterangan</th>
                <th className="p-4 text-right">Nominal</th>
                <th className="p-4">Bukti Lampir</th>
                <th className="p-4 text-center">Status RT</th>
                {currentRole === 'ketua_rt' && <th className="p-4 text-center">Tindakan RT</th>}
                {currentRole === 'bendahara' && <th className="p-4 text-center">Aksi Bendahara</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-sm">
              {filteredTransaksi.length === 0 ? (
                <tr>
                  <td colSpan={currentRole === 'ketua_rt' ? 6 : currentRole === 'bendahara' ? 6 : 5} className="p-8 text-center text-slate-400 italic">
                    Belum ada catatan transaksi keuangan yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredTransaksi.map((tx) => {
                  const isIncome = tx.tipe === 'pemasukan';
                  const isLargePending = tx.tipe === 'pengeluaran' && tx.statusPersetujuan === 'pending';

                  return (
                    <tr 
                      key={tx.id} 
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition ${
                        isLargePending ? 'bg-amber-500/5 dark:bg-amber-550/5' : ''
                      }`}
                    >
                      {/* ID & date */}
                      <td className="p-4 pl-6">
                        <span className="block font-mono text-xs font-semibold text-slate-400 dark:text-slate-550">
                          {tx.id}
                        </span>
                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(tx.tanggal).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}
                        </span>
                      </td>

                      {/* Cate & Desc */}
                      <td className="p-4 max-w-sm">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mb-1.5 ${
                          isIncome 
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' 
                            : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                        }`}>
                          {tx.kategori}
                        </span>
                        <p className="text-slate-700 dark:text-slate-200 font-medium text-xs md:text-sm leading-tight">
                          {tx.keterangan}
                        </p>
                        {tx.bulanIuran && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase mt-1 block">
                            Periode Iuran: {tx.bulanIuran}
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className={`p-4 font-bold text-right text-xs md:text-sm ${
                        isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'
                      }`}>
                        {isIncome ? '+' : '-'} {formatRupiah(tx.nominal)}
                      </td>

                      {/* Attachment */}
                      <td className="p-4">
                        {tx.buktiTransaksi ? (
                          <div className="flex items-center gap-1.5 group select-none">
                            <span className="text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded border border-slate-250 truncate block max-w-[124px]">
                              {tx.buktiTransaksi}
                            </span>
                            <span className="text-[10px] text-blue-500 font-bold group-hover:underline flex items-center cursor-pointer">
                              Lihat <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Tanpa bukti</span>
                        )}
                      </td>

                      {/* Approval Status */}
                      <td className="p-4 text-center">
                        {tx.statusPersetujuan === 'disetujui' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Disetujui
                          </span>
                        ) : tx.statusPersetujuan === 'ditolak' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1 rounded-full">
                            Ditolak
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-full animate-pulse">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                            Menunggu RT
                          </span>
                        )}
                      </td>

                      {/* RT Decisions */}
                      {currentRole === 'ketua_rt' && (
                        <td className="p-4 text-center">
                          {isLargePending ? (
                            <button
                              onClick={() => openReviewModal(tx)}
                              className="px-3 py-1 bg-gradient-to-tr from-amber-500 to-amber-600 text-white font-bold text-[11px] rounded shadow-sm hover:from-amber-600 hover:to-amber-700 transition cursor-pointer scale-100 active:scale-95 duration-100"
                            >
                              Tinjau Bukti
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                      )}

                      {/* Bendahara Actions */}
                      {currentRole === 'bendahara' && (
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditClick(tx)}
                              className="p-1 px-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
                              title="Ubah Transaksi Keuangan"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Ubah</span>
                            </button>
                            <button
                              onClick={() => handleDeleteClick(tx.id)}
                              className="p-1 px-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
                              title="Hapus Transaksi Keuangan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </td>
                      )}

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pop Up Form: Mencatat Transaksi */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {editingTx ? 'Formulir Modifikasi Keuangan RT' : 'Formulir Pencatatan Keuangan RT'}
              </h3>
              <button 
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingTx(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Type toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Macam Aliran</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setTxTipe('pemasukan');
                      setTxKategori('Iuran Bulanan');
                    }}
                    className={`py-1.5 rounded text-xs font-bold transition ${txTipe === 'pemasukan' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'}`}
                  >
                    📈 Pemasukan (Kas Masuk)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTxTipe('pengeluaran');
                      setTxKategori('Kebersihan');
                    }}
                    className={`py-1.5 rounded text-xs font-bold transition ${txTipe === 'pengeluaran' ? 'bg-white dark:bg-slate-800 text-rose-500 shadow-sm' : 'text-slate-500'}`}
                  >
                    📉 Pengeluaran (Kas Keluar)
                  </button>
                </div>
              </div>

              {/* Category selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Kategori Transaksi</label>
                  <select
                    value={txKategori}
                    onChange={(e) => setTxKategori(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none text-slate-800 dark:text-slate-100"
                  >
                    {txTipe === 'pemasukan' 
                      ? kategoriPemasukan.map(c => <option key={c} value={c}>{c}</option>)
                      : kategoriPengeluaran.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Nomor Nominal (Rupiah)</label>
                  <input
                    type="number"
                    required={txKategori !== 'Iuran Bulanan'}
                    value={txNominal}
                    onChange={(e) => setTxNominal(e.target.value)}
                    placeholder="E.g. 50000"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              {/* Citizen fast checklist for Iuran Bulanan category */}
              {txTipe === 'pemasukan' && txKategori === 'Iuran Bulanan' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <span className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Cukup Centang Warga Yang Membayar ({currentMonth})
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Mencentang warga di bawah ini otomatis mencatat kas masuk dan mengubah status iuran warga menjadi *Lunas* secara instan.
                  </p>
                  
                  {successTxMessage && (
                    <div className="p-2.5 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg font-semibold flex items-center gap-1.5 animate-pulse">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span>{successTxMessage}</span>
                    </div>
                  )}

                  <div className="max-h-44 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {wargaList.filter(w => w.status === 'aktif').map(w => {
                      const isLunas = w.riwayatPembayaran.some(p => p.bulan === currentMonth && p.status === 'disetujui');
                      
                      return (
                        <div key={w.kk} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-150 dark:border-slate-800/60 shadow-xs">
                          <div className="flex flex-col text-left">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{w.kepalaKeluarga}</span>
                            <span className="text-[10px] text-slate-400 font-mono">KK {w.kk.substring(0, 8)}... ({formatRupiah(w.iuranWajib)})</span>
                          </div>

                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isLunas}
                              disabled={isLunas}
                              onChange={async () => {
                                if (!isLunas && onDirectIuranLunas) {
                                  const res = await onDirectIuranLunas(w.kk, currentMonth, w.iuranWajib);
                                  if (res.success) {
                                    setSuccessTxMessage(res.message);
                                    setTimeout(() => setSuccessTxMessage(null), 5000);
                                  } else {
                                    alert(res.message);
                                  }
                                }
                              }}
                              className={`w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded border-slate-300 dark:border-slate-700 ${isLunas ? 'cursor-not-allowed text-emerald-600 bg-emerald-100' : 'cursor-pointer'}`}
                            />
                            <span className={`text-[11px] font-bold ${isLunas ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}>
                              {isLunas ? 'Lunas (v)' : 'Bayar'}
                            </span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Deskripsi / Peruntukan Keterangan</label>
                <textarea
                  required={txKategori !== 'Iuran Bulanan'}
                  value={txKeterangan}
                  onChange={(e) => setTxKeterangan(e.target.value)}
                  placeholder="Contoh: Pembelian 3 kg paku semen & bensin mesin rumput RT"
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100"
                ></textarea>
              </div>

              {/* Drag and Drop Upload file simulation */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Unggah Bukti Transaksi Resmi (Usahakan Ada)</label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-4 text-center transition ${
                    dragActive 
                      ? 'border-emerald-500 bg-emerald-500/10' 
                      : txBukti 
                      ? 'border-emerald-300 bg-emerald-50/20 dark:bg-emerald-950/10' 
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    id="receipt-file"
                    onChange={handleFileInput}
                    className="hidden"
                    accept="image/*,.pdf"
                  />
                  
                  {txBukti ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <FileCheck className="w-8 h-8 text-emerald-500" />
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{txBukti}</p>
                      <button 
                        type="button" 
                        onClick={() => setTxBukti('')} 
                        className="text-[10px] text-slate-400 underline hover:text-slate-650"
                      >
                        Ganti Berkas
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="receipt-file" className="cursor-pointer flex flex-col items-center gap-1">
                      <Upload className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Seret berkas ke sini atau <span className="text-blue-500 font-bold underline">pilih berkas</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Format PDF, JPG, PNG (Max 5MB)</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Notice for RT approval check limits */}
              {txTipe === 'pengeluaran' && Number(txNominal) >= 1500000 && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2 border border-amber-200 dark:border-amber-900/40">
                  <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Informasi: </span>
                    Pengeluaran bernominal &gt;= Rp1.500.000 akan otomatis berstatus *Pending* dan memerlukan ketukan persetujuan Ketua RT sebelum resmi mengurangi saldo kas utama.
                  </div>
                </div>
              )}

              <div className="border-t border-slate-105 dark:border-slate-800 pt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingTx(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-550 rounded-lg shadow-md transition"
                >
                  {editingTx ? 'Perbarui Transaksi' : 'Selesaikan & Catat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pop Up Form: Review Pending Expense (Ketua RT Screen) */}
      {reviewingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 text-left">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-amber-50/50 dark:bg-amber-950/20">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <span>Otoritas Persetujuan Ketua RT</span>
              </h3>
              <button 
                onClick={() => setReviewingTx(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 uppercase">Pengeluaran Dari:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">Bendahara (Kas RT)</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 uppercase">Kategori:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{reviewingTx.kategori}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 uppercase">Estimasi Terbuang:</span>
                  <span className="font-bold text-rose-500">{formatRupiah(reviewingTx.nominal)}</span>
                </div>
                <div className="border-t border-slate-150 dark:border-slate-800 pt-2 mt-2">
                  <span className="text-[10px] text-slate-400 uppercase block">Keterangan:</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                    "{reviewingTx.keterangan}"
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Tambahkan Catatan / Arahan Ketua RT</label>
                <textarea
                  value={reviewCatatan}
                  onChange={(e) => setReviewCatatan(e.target.value)}
                  placeholder="Opsional: Tulis alasan setuju atau catatan perbaikan jalan..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100"
                ></textarea>
              </div>

              <div className="border-t border-slate-105 dark:border-slate-800 pt-5 flex justify-end gap-3.5">
                <button
                  type="button"
                  onClick={() => handleDecision('ditolak')}
                  className="px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                >
                  Tolak Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision('disetujui')}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-550 rounded-lg shadow-md transition"
                >
                  Setujui & Cairkan Kas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
