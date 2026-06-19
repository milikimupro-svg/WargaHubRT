/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, User, Users, LogOut, Sun, Moon, Sparkles, Tv, Bell, RefreshCw } from 'lucide-react';
import { UserRole } from '../types';

interface HeaderProps {
  currentRole: UserRole;
  currentUser: string;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onLogout: () => void;
  onOpenLayarRapat: () => void;
  onFastSwitchRole: (role: UserRole) => void;
  notificationCount: number;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function Header({
  currentRole,
  currentUser,
  darkMode,
  setDarkMode,
  onLogout,
  onOpenLayarRapat,
  onFastSwitchRole,
  notificationCount,
  onRefresh,
  isRefreshing
}: HeaderProps) {
  
  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'bendahara':
        return { label: 'Bendahara Keuangan', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' };
      case 'ketua_rt':
        return { label: 'Ketua RT 04', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800' };
      case 'warga':
        return { label: 'Warga / Kepala Keluarga', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800' };
    }
  };

  const badge = getRoleLabel(currentRole);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md transition-colors no-print">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-blue-500 flex items-center justify-center text-white font-bold leading-none shadow-md shadow-emerald-500/10">
            <span className="text-lg">WH</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-slate-900 dark:text-white leading-tight">WargaHubRT</span>
              <span className="text-[10px] uppercase font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">RT 04/04</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none">Jatingaleh, Semarang</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 md:gap-4">
          
          {/* Quick Info Screen Switcher */}
          <button
            onClick={onOpenLayarRapat}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
            title="Sediakan Mode Layar TV Rapat Warga"
          >
            <Tv className="w-4 h-4 text-blue-500" />
            <span className="hidden sm:inline">Layar Rapat</span>
          </button>

          {/* Sync status */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition ${isRefreshing ? 'animate-spin' : ''}`}
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Light/Dark Mode Switcher */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition"
            title="Ubah Mode Tampilan"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* User Status / Card */}
          <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-3 md:pl-4">
            <div className="hidden md:block text-right">
              <div className="flex items-center justify-end gap-1">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{currentUser}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${badge.color}`}>
                  {badge.label}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Sesi Aktif</span>
            </div>

            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 relative">
              <User className="w-4 h-4" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {notificationCount}
                </span>
              )}
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
              title="Keluar dari Akun"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
