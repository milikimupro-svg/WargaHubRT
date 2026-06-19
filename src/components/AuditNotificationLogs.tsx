/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { History, Bell, ClipboardCheck, Smartphone, Send, Mail, UserCheck, ShieldCheck } from 'lucide-react';
import { AuditLog, NotificationLog } from '../types';

interface AuditNotificationLogsProps {
  auditLogs: AuditLog[];
  notificationLogs: NotificationLog[];
  currentRole?: string;
  currentUser?: string;
  currentWargaKK?: string;
}

export default function AuditNotificationLogs({
  auditLogs,
  notificationLogs,
  currentRole = 'bendahara',
  currentUser = '',
  currentWargaKK = ''
}: AuditNotificationLogsProps) {
  const [activeTab, setActiveTab] = useState<'audit' | 'notifications'>('audit');

  // Role-based filtering of logs and notifications
  const displayedAuditLogs = auditLogs.filter(log => {
    if (currentRole === 'bendahara') return true;
    if (currentRole === 'ketua_rt') return true;
    
    // warga can only see logs that they created, or that mention their name or their KK
    const matchesUser = log.user.toLowerCase() === currentUser.toLowerCase();
    const matchesActivity = log.aktivitas.toLowerCase().includes(currentUser.toLowerCase()) || 
                            log.aktivitas.toLowerCase().includes(currentWargaKK.toLowerCase()) ||
                            log.kategori === 'voting' || 
                            log.kategori === 'target';
                            
    return matchesUser || matchesActivity;
  });

  const displayedNotifications = notificationLogs.filter(notif => {
    if (currentRole === 'bendahara') return true;
    if (currentRole === 'ketua_rt') return true;
    
    // warga can only see notifications that are sent specifically to them or public broadcasts
    const matchesUser = notif.penerima.toLowerCase().includes(currentUser.toLowerCase()) ||
                        notif.penerima.toLowerCase().includes(currentWargaKK.toLowerCase()) ||
                        notif.penerima.toLowerCase().includes('seluruh') ||
                        notif.penerima.toLowerCase().includes('grup') ||
                        notif.penerima.toLowerCase().includes('semua');
                        
    return matchesUser;
  });

  const getLogCategoryColor = (cat: string) => {
    switch (cat) {
      case 'login':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300';
      case 'warga':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300';
      case 'transaksi':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
      case 'target':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300';
      case 'voting':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300';
      case 'persetujuan':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
      default:
        return 'bg-slate-100 text-slate-850 dark:bg-slate-900 dark:text-slate-300';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-sm overflow-hidden text-left">
      
      {/* Tab selection menu */}
      <div className="flex border-b border-slate-150 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/40">
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition border-b-2 ${
            activeTab === 'audit' 
              ? 'border-emerald-500 text-slate-900 dark:text-white bg-white dark:bg-slate-800' 
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          <ClipboardCheck className="w-4 h-4 text-emerald-500" />
          <span>Audit Aktivitas (Tak Dapat Diedit)</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-bold uppercase tracking-wider transition border-b-2 ${
            activeTab === 'notifications' 
              ? 'border-emerald-500 text-slate-900 dark:text-white bg-white dark:bg-slate-800' 
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          <Bell className="w-4 h-4 text-emerald-500 animate-swing" />
          <span>Antrean SMS & Notifikasi Terkirim</span>
        </button>
      </div>

      <div className="p-6">
        
        {/* Tab 1: Audit Log Activity trail list representation */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Sesuai standar transparansi laporan keuangan Jatingaleh, database log audit ini ditandatangani digital & terkunci searah.</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-150 dark:border-slate-705 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="pb-3 pl-2">Rentang Waktu</th>
                    <th className="pb-3">User & Kedudukan</th>
                    <th className="pb-3">Kategori</th>
                    <th className="pb-3">Deskripsi Aktivitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
                  {displayedAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition">
                      {/* Timestamp */}
                      <td className="py-3 pl-2 text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleDateString('id-ID', {day: '2-digit', month: 'short'})} • {new Date(log.timestamp).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                      </td>

                      {/* User & role icon mapping */}
                      <td className="py-3 font-semibold text-slate-750 dark:text-slate-205">
                        <span className="block">{log.user}</span>
                        <span className="text-[10px] text-slate-400 font-medium">@{log.role.toUpperCase()}</span>
                      </td>

                      {/* Cate badge */}
                      <td className="py-3">
                        <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded uppercase ${getLogCategoryColor(log.kategori)}`}>
                          {log.kategori}
                        </span>
                      </td>

                      {/* Activity block description */}
                      <td className="py-3 text-slate-500 dark:text-slate-350 leading-relaxed font-sans max-w-sm sm:max-w-md md:max-w-xl">
                        {log.aktivitas}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: WhatsApp Notifications History logs */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 text-xs text-slate-500">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <span>Sistem Notifikasi WargaHubRT Aktif. Semua pemberitahuan dan konfirmasi tagihan tercatat aman dalam server internal.</span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {displayedNotifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic text-xs">Belum ada catatan log notifikasi untuk akun Anda.</div>
              ) : (
                displayedNotifications.map((notif) => (
                  <div key={notif.id} className="p-4 rounded-xl border border-slate-150 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-emerald-500" />
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          Kepada: <span className="underline">{notif.penerima}</span>
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-slate-400">
                        <span>{new Date(notif.timestamp).toLocaleDateString('id-ID')} {new Date(notif.timestamp).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span>
                        <span className="px-1.5 py-0.5 font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 rounded text-[9px]">
                          {notif.status}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg text-xs leading-relaxed text-slate-650 dark:text-slate-300 whitespace-pre-wrap">
                      {notif.pesan}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
