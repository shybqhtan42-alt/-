import React, { useState } from 'react';
import { CurrentUser, SchoolConfig } from '../types';
import { BookOpen, User, ShieldCheck, LogOut, QrCode, Gamepad2 } from 'lucide-react';
import { APP_IMAGES } from '../assets/images';

interface HeaderProps {
  currentUser: CurrentUser;
  config: SchoolConfig;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenQR: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  config,
  onOpenLogin,
  onLogout,
  onOpenQR,
  activeTab,
  setActiveTab,
}) => {
  const [emblemError, setEmblemError] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-6">
        {/* Zone 1: Brand title with emblem */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2 sm:gap-3.5 cursor-pointer min-w-0 group"
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl overflow-hidden shadow-xs border border-emerald-100 flex items-center justify-center bg-emerald-50 shrink-0">
            {!emblemError ? (
              <img
                src={config.customLogoUrl || APP_IMAGES.emblem}
                alt="شعار البشير التعليمي"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== APP_IMAGES.emblem && target.src !== window.location.origin + APP_IMAGES.publicEmblem) {
                    target.src = APP_IMAGES.emblem;
                  } else if (target.src !== window.location.origin + APP_IMAGES.publicEmblem) {
                    target.src = APP_IMAGES.publicEmblem;
                  } else {
                    setEmblemError(true);
                  }
                }}
              />
            ) : (
              <BookOpen className="w-5 h-5 text-emerald-800" />
            )}
          </div>

          <div className="min-w-0">
            <div className="text-sm sm:text-lg md:text-xl font-black text-emerald-950 tracking-tight leading-tight group-hover:text-emerald-700 transition-colors truncate">
              {config.platformTitle}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-700 font-bold leading-none mt-1 truncate max-w-[130px] sm:max-w-none">
              {config.schoolName}
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-sm font-bold text-slate-800">
          <button
            onClick={() => setActiveTab('home')}
            className={`transition-colors whitespace-nowrap pb-1 ${
              activeTab === 'home'
                ? 'text-emerald-900 border-b-2 border-emerald-800 font-black'
                : 'hover:text-emerald-800'
            }`}
          >
            الرئيسية
          </button>

          <button
            onClick={() => setActiveTab('second-intermediate')}
            className={`transition-colors whitespace-nowrap pb-1 ${
              activeTab === 'second-intermediate'
                ? 'text-emerald-900 border-b-2 border-emerald-800 font-black'
                : 'hover:text-emerald-800'
            }`}
          >
            ثاني متوسط
          </button>

          <button
            onClick={() => setActiveTab('summaries')}
            className={`transition-colors whitespace-nowrap pb-1 ${
              activeTab === 'summaries'
                ? 'text-emerald-900 border-b-2 border-emerald-800 font-black'
                : 'hover:text-emerald-800'
            }`}
          >
            الملخصات
          </button>

        {Boolean(config.isGamesTabEnabled) && (
            <button
              onClick={() => setActiveTab('games')}
              className={`transition-colors whitespace-nowrap pb-1 flex items-center gap-1.5 ${
                activeTab === 'games'
                  ? 'text-blue-900 border-b-2 border-blue-800 font-black'
                  : 'text-blue-800 hover:text-blue-950 font-bold'
              }`}
            >
              <Gamepad2 className="w-4 h-4 text-blue-700" />
              <span>خانة الألعاب (الملازم أنس)</span>
            </button>
          )}

          {currentUser.role === 'manager' && (
            <button
              onClick={() => setActiveTab('manager-panel')}
              className={`transition-colors whitespace-nowrap pb-1 flex items-center gap-1.5 ${
                activeTab === 'manager-panel'
                  ? 'text-emerald-900 border-b-2 border-emerald-800 font-black'
                  : 'text-amber-800 hover:text-amber-950 font-bold'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>لوحة تحكم المدير</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('about')}
            className={`transition-colors whitespace-nowrap pb-1 ${
              activeTab === 'about'
                ? 'text-emerald-900 border-b-2 border-emerald-800 font-black'
                : 'hover:text-emerald-800'
            }`}
          >
            عن المنصة
          </button>
        </nav>

        {/* Zone 3: Actions & Auth */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Quick QR code button */}
          <button
            onClick={onOpenQR}
            className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors whitespace-nowrap shrink-0"
            title="عرض الباركود ورابط المنصة"
          >
            <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700" />
            <span className="hidden sm:inline text-xs">باركود الموقع</span>
          </button>

          {currentUser.role === 'guest' ? (
            <button
              onClick={onOpenLogin}
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-95 rounded-lg shadow-xs transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>تسجيل الدخول</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                  {currentUser.role === 'manager'
                    ? 'إدارة المنصة (المدير)'
                    : currentUser.student?.fullName || 'حساب طالب'}
                </div>
                <div className="text-[10px] text-slate-500">
                  {currentUser.role === 'manager' ? 'مدير النظام' : 'طالب مسجل'}
                </div>
              </div>

              <button
                onClick={onLogout}
                className="p-1.5 sm:p-2 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                title="تسجيل الخروج"
                aria-label="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile nav sub-bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-200 px-2 py-2 text-xs font-bold text-slate-800 bg-white/95 backdrop-blur-md">
        <button
          onClick={() => setActiveTab('home')}
          className={`px-2.5 py-1.5 rounded-lg transition-colors ${activeTab === 'home' ? 'text-emerald-950 font-black bg-emerald-100 border border-emerald-300/60 shadow-2xs' : 'hover:bg-slate-100'}`}
        >
          الرئيسية
        </button>
        <button
          onClick={() => setActiveTab('second-intermediate')}
          className={`px-2.5 py-1.5 rounded-lg transition-colors ${activeTab === 'second-intermediate' ? 'text-emerald-950 font-black bg-emerald-100 border border-emerald-300/60 shadow-2xs' : 'hover:bg-slate-100'}`}
        >
          ثاني متوسط
        </button>
        <button
          onClick={() => setActiveTab('summaries')}
          className={`px-2.5 py-1.5 rounded-lg transition-colors ${activeTab === 'summaries' ? 'text-emerald-950 font-black bg-emerald-100 border border-emerald-300/60 shadow-2xs' : 'hover:bg-slate-100'}`}
        >
          الملخصات
        </button>
        {Boolean(config.isGamesTabEnabled) && (
          <button
            onClick={() => setActiveTab('games')}
            className={`px-2.5 py-1.5 rounded-lg text-blue-900 font-black transition-colors ${activeTab === 'games' ? 'bg-blue-100 border border-blue-300/60 shadow-2xs' : 'hover:bg-blue-50'}`}
          >
            الألعاب 🎮
          </button>
        )}
        {currentUser.role === 'manager' && (
          <button
            onClick={() => setActiveTab('manager-panel')}
            className={`px-2.5 py-1.5 rounded-lg text-amber-950 font-black transition-colors ${activeTab === 'manager-panel' ? 'bg-amber-100 border border-amber-300/60 shadow-2xs' : 'hover:bg-amber-50'}`}
          >
            لوحة المدير
          </button>
        )}
      </div>
    </header>
  );
};
