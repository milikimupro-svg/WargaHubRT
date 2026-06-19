/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, Brain, Cpu, MessageSquare, ChevronUpSquare, RefreshCw, Send } from 'lucide-react';

interface AiAdvisorProps {
  onTriggerOptimize: () => Promise<{ success: boolean; text?: string; message?: string }>;
}

export default function AiAdvisor({ onTriggerOptimize }: AiAdvisorProps) {
  const [recommendations, setRecommendations] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  const handleTrigger = async () => {
    setIsLoading(true);
    setErrorText('');
    try {
      const response = await onTriggerOptimize();
      if (response.success && response.text) {
        setRecommendations(response.text);
      } else {
        setErrorText(response.message || "Gagal memperoleh data. Silakan coba kembali.");
      }
    } catch (err: any) {
      setErrorText("Gagal memperoleh data cerdas. Periksa kunci integrasi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 border border-indigo-500/10 rounded-2xl text-white shadow-xl text-left relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition duration-500"></div>
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-400/20">
            <Brain className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-slate-100 flex items-center gap-1.5 text-sm md:text-base">
              <span>Rekomendasi Cerdas Gemini AI</span>
              <span className="text-[10px] bg-indigo-500 text-white font-bold px-1.5 py-0.5 rounded uppercase font-mono">Experimental</span>
            </h4>
            <p className="text-xs text-indigo-300">Asisten Alokasi Kas & Perencanaan Finansial RT 04</p>
          </div>
        </div>

        <button
          onClick={handleTrigger}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white font-bold text-xs rounded-xl shadow transition duration-200 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Membaca Pola Kas...</span>
            </>
          ) : (
            <>
              <Cpu className="w-3.5 h-3.5" />
              <span>Optimalkan Alokasi Kas</span>
            </>
          )}
        </button>
      </div>

      {recommendations ? (
        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-xs md:text-sm leading-relaxed text-slate-300 space-y-3 whitespace-pre-wrap animate-in fade-in duration-300">
          {recommendations}
        </div>
      ) : errorText ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
          ⚠️ {errorText}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-950/20 border border-slate-850 text-xs text-slate-400 italic">
          Klik tombol "Optimalkan Alokasi Kas" di atas untuk memanggil kecerdasan buatan Gemini guna menghitung kecepatan dana, menganalisis status tunggakan iuran, dan memberikan 3 arahan keputusan taktis untuk rapat warga.
        </div>
      )}

      {/* Helpful compliance tip */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-1.5 text-[10px] text-slate-500">
        <MessageSquare className="w-4 h-4 text-slate-400" />
        <span>Rekomendasi berdasar statistik peredaran uang kas RT 04 Jatingaleh bulan berjalan.</span>
      </div>

    </div>
  );
}
