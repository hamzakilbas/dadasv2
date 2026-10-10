import React from 'react';
import {
  UtensilsCrossed,
  History,
  FileSpreadsheet,
  Settings
} from 'lucide-react';
import { AppSettings } from '../types/pos';

export type ActiveNavTab = 'waiter' | 'history' | 'reports' | 'management';

interface NavbarProps {
  activeTab: ActiveNavTab;
  onTabChange: (tab: ActiveNavTab) => void;
  settings: AppSettings;
  openOrdersCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  settings,
  openOrdersCount
}) => {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <div
            onClick={() => onTabChange('waiter')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-orange-600 to-rose-600 flex items-center justify-center text-white shadow-md shadow-amber-200 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-slate-900 group-hover:text-amber-600 transition-colors">
                  Dadaş Tatlıcı
                </span>
                <span className="bg-amber-50 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-200">
                  POS & STOK
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-[180px] sm:max-w-none">
                Restoran & Kafe Sistemi
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Desktop Center/Left) */}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => onTabChange('waiter')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'waiter'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Masalar & POS</span>
              {openOrdersCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    activeTab === 'waiter'
                      ? 'bg-white text-blue-700'
                      : 'bg-rose-500 text-white'
                  }`}
                >
                  {openOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('history')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Sipariş Geçmişi</span>
            </button>

            <button
              onClick={() => onTabChange('reports')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Raporlar (Gün Sonu & Aylık)</span>
            </button>
          </div>

          {/* Sağ Kısım: Yönetim Butonu */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => onTabChange('management')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'management'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
              }`}
              title="Yönetim Paneli ve Ayarlar"
            >
              <Settings className="w-4 h-4" />
              <span>Yönetim</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden border-t border-slate-100 py-1.5 justify-around">
          <button
            onClick={() => onTabChange('waiter')}
            className={`p-2 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 ${
              activeTab === 'waiter' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Masalar</span>
          </button>

          <button
            onClick={() => onTabChange('history')}
            className={`p-2 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 ${
              activeTab === 'history' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Geçmiş</span>
          </button>

          <button
            onClick={() => onTabChange('reports')}
            className={`p-2 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 ${
              activeTab === 'reports' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Raporlar</span>
          </button>

          <button
            onClick={() => onTabChange('management')}
            className={`p-2 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 ${
              activeTab === 'management' ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Yönetim</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
