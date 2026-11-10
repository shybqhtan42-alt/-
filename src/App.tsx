import React, { useState, useEffect } from 'react';
import { SchoolConfig, Student, SummaryItem, CurrentUser, StudentLiveSession, StudentSuspension } from './types';
import { storageService, DEFAULT_CONFIG } from './services/storageService';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LoginModal } from './components/LoginModal';
import { QRCodeModal } from './components/QRCodeModal';
import { StudentPortal } from './components/StudentPortal';
import { ManagerDashboard } from './components/ManagerDashboard';
import { AboutSection } from './components/AboutSection';
import { SummaryDetailModal } from './components/SummaryDetailModal';
import { LtAnasGame } from './components/LtAnasGame';
import { APP_IMAGES } from './assets/images';
import { 
  BookOpen, 
  GraduationCap, 
  ShieldCheck, 
  Sparkles, 
  ArrowLeft, 
  CheckCircle2, 
  Layers, 
  QrCode, 
  FileText, 
  School,
  Gamepad2,
  Siren,
  ExternalLink,
  Compass,
  Ban,
  Clock,
  AlertTriangle
} from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<SchoolConfig>(() => storageService.getConfig());
  const [students, setStudents] = useState<Student[]>(() => storageService.getStudents());
  const [summaries, setSummaries] = useState<SummaryItem[]>(() => storageService.getSummaries());
  const [currentUser, setCurrentUser] = useState<CurrentUser>({ role: 'guest' });
  const [favorites, setFavorites] = useState<string[]>(() => storageService.getFavorites());
  const [onlineStudentIds, setOnlineStudentIds] = useState<string[]>([]);
  const [onlineSessions, setOnlineSessions] = useState<StudentLiveSession[]>([]);
  const [suspensions, setSuspensions] = useState<StudentSuspension[]>([]);

  const [activeTab, setActiveTab] = useState<string>('home');
  const [navigatingBtnId, setNavigatingBtnId] = useState<string | null>(null);

  const activeGrade = currentUser.role === 'student' && currentUser.student?.grade
    ? currentUser.student.grade
    : (config.defaultGrade || 'ثاني متوسط');

  // Modals
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<SummaryItem | null>(null);

  // Check if current user is suspended / kicked by manager
  const currentSuspension = suspensions.find(
    (s) =>
      (currentUser.student && s.studentId === currentUser.student.id) ||
      (currentUser.student && s.studentName.toLowerCase() === currentUser.student.fullName?.toLowerCase())
  );
  const isStudentSuspended = Boolean(
    currentUser.role === 'student' &&
      currentSuspension &&
      (currentSuspension.expiresAt === 0 || Date.now() < currentSuspension.expiresAt)
  );

  const [remainingSuspensionSeconds, setRemainingSuspensionSeconds] = useState<number>(0);

  useEffect(() => {
    if (!currentSuspension || currentSuspension.expiresAt === 0) return;
    const updateCountdown = () => {
      const diff = Math.max(0, Math.floor((currentSuspension.expiresAt - Date.now()) / 1000));
      setRemainingSuspensionSeconds(diff);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [currentSuspension]);

  const formatSuspensionCountdown = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Tactile animated navigation handler
  const handleNavigateWithAnimation = (id: string, action: () => void) => {
    setNavigatingBtnId(id);
    // Tactile micro-animation: scales slightly and pulses color, then smoothly scrolls and routes
    setTimeout(() => {
      action();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setNavigatingBtnId(null);
    }, 180);
  };

  // Initialize data from local storage and sync with central server
  useEffect(() => {
    // 1. Instant local load (already initialized synchronously, but refresh if storage updated)
    setConfig(storageService.getConfig());
    setStudents(storageService.getStudents());
    setSummaries(storageService.getSummaries());
    setFavorites(storageService.getFavorites());

    // 2. Fetch latest live state from server (sync across all phones)
    const doSync = async () => {
      const serverState = await storageService.fetchServerState();
      if (serverState && serverState.config) {
        setConfig((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(serverState.config)) {
            return prev;
          }
          return serverState.config;
        });

        // If manager hid games tab, return to home view if non-manager student was on games tab
        if (!serverState.config.isGamesTabEnabled) {
          setActiveTab((currTab) => (currTab === 'games' ? 'home' : currTab));
        }

        setStudents((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(serverState.students)) {
            return prev;
          }
          return serverState.students;
        });

        setSummaries((prev) => {
          const clean = storageService.deduplicateSummaries(serverState.summaries);
          if (JSON.stringify(prev) === JSON.stringify(clean)) {
            return prev;
          }
          return clean;
        });

        if (Array.isArray(serverState.onlineStudentIds)) {
          setOnlineStudentIds(serverState.onlineStudentIds);
        }

        if (Array.isArray(serverState.onlineSessions)) {
          setOnlineSessions(serverState.onlineSessions);
        }

        if (Array.isArray(serverState.suspensions)) {
          setSuspensions(serverState.suspensions);
        }
      }
    };

    doSync();

    // 3. Periodic real-time background sync (every 2 seconds) so changes and presence publish live to all phones
    const intervalId = setInterval(doSync, 2000);

    // 4. Sync immediately when student switches tabs or unlocks phone or local storage updates
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        doSync();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', doSync);
    window.addEventListener('storage', doSync);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', doSync);
      window.removeEventListener('storage', doSync);
    };
  }, []);

  // Heartbeat effect: Continuously sends live telemetry for the CCTV surveillance system
  useEffect(() => {
    const studentId = currentUser.role === 'student' && currentUser.student?.id
      ? currentUser.student.id
      : 'guest_user';

    const getTelemetry = () => ({
      studentName: currentUser.role === 'student'
        ? (currentUser.student?.fullName || 'طالب مسجل')
        : 'زائر / طالب يتصفح',
      grade: currentUser.role === 'student'
        ? (currentUser.student?.grade || config.defaultGrade || 'ثاني متوسط')
        : (config.defaultGrade || 'ثاني متوسط'),
      currentSection: isLoginModalOpen
        ? 'نافذة تسجيل دخول الطالب'
        : selectedSummary
        ? `معاينة ورقة: ${selectedSummary.title}`
        : activeTab === 'second-intermediate'
        ? `بوابة ملخصات ${config.defaultGrade || 'ثاني متوسط'}`
        : activeTab === 'summaries'
        ? 'قسم المواد والملخصات'
        : activeTab === 'games'
        ? 'قسم الألعاب - لعبة دورية أمن الطرق'
        : activeTab === 'about'
        ? 'عن المنصة'
        : 'الصفحة الرئيسية',
      currentSubject: selectedSummary
        ? selectedSummary.subject
        : (activeTab === 'summaries' || activeTab === 'second-intermediate' ? 'المواد الدراسية' : 'تصفح عام'),
      currentAction: isLoginModalOpen
        ? 'يقوم بتسجيل الدخول للمنصة'
        : selectedSummary
        ? `يطلع على ورقة: ${selectedSummary.title}`
        : activeTab === 'second-intermediate'
        ? 'يتصفح بوابة ثاني متوسط'
        : activeTab === 'summaries'
        ? 'يستعرض قسم المواد والملخصات'
        : activeTab === 'games'
        ? 'يلعب في دورية أمن الطرق'
        : 'يتصفح الصفحة الرئيسية',
      deviceType: /Android/i.test(navigator.userAgent)
        ? 'جوال ذكي (أندرويد)'
        : /iPhone|iPad/i.test(navigator.userAgent)
        ? 'جوال آيفون (iOS)'
        : 'كمبيوتر / لابتوب',
      snapshotTheme: isLoginModalOpen
        ? 'login' as const
        : selectedSummary
        ? 'summary' as const
        : activeTab === 'second-intermediate'
        ? 'portal' as const
        : activeTab === 'summaries'
        ? 'materials' as const
        : activeTab === 'games'
        ? 'game' as const
        : 'home' as const,
    });

    storageService.sendHeartbeat(studentId, getTelemetry());

    const heartbeatInterval = setInterval(() => {
      storageService.sendHeartbeat(studentId, getTelemetry());
    }, 2500);

    const handleUnload = () => {
      storageService.sendOffline(studentId);
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [currentUser, activeTab, selectedSummary, isLoginModalOpen, config.defaultGrade]);

  const handleUpdateConfig = (newConfig: SchoolConfig) => {
    setConfig(newConfig);
    storageService.saveConfig(newConfig);
  };

  const handleRefreshStudents = async () => {
    setStudents(storageService.getStudents());
    const live = await storageService.fetchServerState();
    if (live) {
      setStudents(live.students);
      setSummaries(live.summaries);
      setConfig(live.config);
    }
  };

  const handleRefreshSummaries = async () => {
    setSummaries(storageService.getSummaries());
    const live = await storageService.fetchServerState();
    if (live) {
      setStudents(live.students);
      setSummaries(live.summaries);
      setConfig(live.config);
    }
  };

  const handleLoginSuccess = (role: 'student' | 'manager', student?: Student) => {
    setCurrentUser({ role, student });
    if (role === 'student' && student?.id) {
      storageService.sendHeartbeat(student.id);
    }
    if (role === 'manager') {
      setActiveTab('manager-panel');
    } else {
      setActiveTab('second-intermediate');
    }
  };

  const handleLogout = () => {
    if (currentUser.role === 'student' && currentUser.student?.id) {
      storageService.sendOffline(currentUser.student.id);
    }
    setCurrentUser({ role: 'guest' });
    setActiveTab('home');
  };

  const handleToggleFavorite = (id: string) => {
    storageService.toggleFavorite(id);
    setFavorites(storageService.getFavorites());
  };

  return (
    <div className="min-h-screen relative flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-emerald-600 selection:text-white">
      {/* Full App Background with Calm Educational Atmosphere */}
      {config.isAppBackgroundEnabled !== false && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
          {/* Background Image: High resolution, serene study books & window */}
          <img
            src={config.appBackgroundUrl || '/images/calm_study_window_books.jpg'}
            alt=""
            className="w-full h-full object-cover object-center scale-105 transition-all duration-500 ease-in-out"
            style={{
              opacity: (() => {
                const raw = config.appBackgroundOpacity;
                if (typeof raw !== 'number') return 0.9;
                return raw > 1 ? raw / 100 : raw;
              })(),
              filter: `blur(${config.appBackgroundBlur !== undefined ? config.appBackgroundBlur : 0}px)`,
            }}
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== '/images/calm_study_window_books.jpg' && target.src !== window.location.origin + '/images/calm_study_window_books.jpg') {
                target.src = '/images/calm_study_window_books.jpg';
              }
            }}
          />
          {/* Subtle gentle adaptive tint: allows 100% clarity to shine vividly while keeping soft warmth */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 via-transparent to-slate-900/15" />
          {/* Ambient lighting glows for educational warmth */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        </div>
      )}

      {/* Top Navigation Bar */}
      <div className="relative z-10">
        <Header
          currentUser={currentUser}
          config={config}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          onOpenQR={() => setIsQRModalOpen(true)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 overflow-hidden">
        {/* VIEW 1: HOME PAGE */}
        {activeTab === 'home' && (
          <div className="space-y-8 sm:space-y-12">
            {/* Hero Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
              {/* Text & CTAs */}
              <div className="lg:col-span-7 flex flex-col justify-center space-y-5 sm:space-y-6 bg-white/96 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 text-xs font-black text-emerald-900 bg-emerald-100/90 px-3 py-1.5 rounded-lg w-fit border border-emerald-200/80">
                    <School className="w-4 h-4 text-emerald-700" />
                    <span>{config.schoolName}</span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-950 leading-[1.25] tracking-tight break-words">
                    منصة <span className="text-emerald-800">{config.platformTitle}</span>
                  </h1>

                  <div className="text-xs sm:text-sm font-extrabold text-slate-800 pt-1">
                    إعداد وتطوير: <span className="text-slate-950 font-black">{config.authorName}</span>
                  </div>

                  <p className="text-xs sm:text-base text-slate-800 font-semibold leading-relaxed max-w-xl pt-1 sm:pt-2">
                    البيئة المعتمدة لطلاب <strong className="text-slate-950 font-black">{config.schoolName}</strong>. المنصة مرتبة ومنظمة وخالية من أي بيانات عشوائية، توفر ملخصات ومذكرات وافية لكافة مواد <strong className="text-slate-950 font-black">الصف الثاني المتوسط</strong>، مع ميزة حصرية للمسجلين للوصول إلى <strong className="text-emerald-900 font-black">الملخصات المهمة</strong>.
                  </p>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('second-intermediate')}
                    className="flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all text-center"
                  >
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    <span>دخول ملخصات ثاني متوسط</span>
                    <ArrowLeft className="w-4 h-4 mr-1 shrink-0" />
                  </button>

                  {currentUser.role === 'guest' ? (
                    <button
                      onClick={() => setIsLoginModalOpen(true)}
                      className="flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-300 font-black text-xs sm:text-sm rounded-xl transition-colors shadow-xs text-center"
                    >
                      <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700 shrink-0" />
                      <span>تسجيل دخول الطالب / المدير</span>
                    </button>
                  ) : currentUser.role === 'manager' ? (
                    <button
                      onClick={() => setActiveTab('manager-panel')}
                      className="flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs sm:text-sm rounded-xl transition-colors shadow-xs text-center"
                    >
                      <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                      <span>فتح لوحة تحكم المدير</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveTab('second-intermediate')}
                      className="flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-black text-xs sm:text-sm rounded-xl transition-colors text-center border border-emerald-200"
                    >
                      <span>متابعة دراستك ({currentUser.student?.fullName})</span>
                    </button>
                  )}
                </div>

                {/* Quick Trust badges */}
                <div className="pt-4 border-t border-slate-200/90 flex flex-wrap items-center gap-6 text-xs sm:text-sm text-slate-800 font-bold">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>ملخصات معتمدة لثاني متوسط</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>دخول مشفر برمز المدرسة</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>إشراف: <span className="text-slate-950 font-black">{config.authorName}</span></span>
                  </div>
                </div>
              </div>

              {/* Hero Visual Media Card */}
              <div className="lg:col-span-5 flex items-center justify-center">
                <div className="w-full h-full min-h-[320px] rounded-3xl overflow-hidden border border-slate-200 shadow-lg relative group bg-emerald-950">
                  <img
                    src={config.customBannerUrl || APP_IMAGES.banner}
                    alt="منصة البشير التعليمية"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== APP_IMAGES.banner && target.src !== window.location.origin + APP_IMAGES.publicBanner) {
                        target.src = APP_IMAGES.banner;
                      } else if (target.src !== window.location.origin + APP_IMAGES.publicBanner) {
                        target.src = APP_IMAGES.publicBanner;
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                    <span className="text-xs font-semibold text-emerald-300">
                      {config.customBannerSubtitle || config.schoolName}
                    </span>
                    <h3 className="text-lg font-bold">
                      {config.customBannerTitle || 'ملخصات وافية وشاملة لكل مواد الفصل'}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Navigation Buttons (أزرار التنقل السريع في الشاشة الرئيسية) */}
            {config.isHomeNavButtonsEnabled !== false && (
              <section className="bg-white/95 backdrop-blur-md p-4 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-xs shrink-0">
                      <Compass className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-black text-slate-950 flex items-center gap-2">
                        <span>أزرار ومحطات التنقل السريع</span>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                          انتقال حركي تفاعلي
                        </span>
                      </h2>
                      <p className="text-[11px] sm:text-xs text-slate-500 font-semibold">
                        انقر على أي زر للانتقال بسلاسة وحركة انسيابية للقسم المطلوب داخل التطبيق
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
                  {/* Button 1: ثاني متوسط */}
                  <div
                    onClick={() => handleNavigateWithAnimation('second-intermediate', () => setActiveTab('second-intermediate'))}
                    className={`group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 ease-out cursor-pointer select-none text-right shadow-2xs hover:shadow-md ${
                      navigatingBtnId === 'second-intermediate'
                        ? 'scale-105 ring-2 ring-emerald-500 bg-emerald-50 border-emerald-400 shadow-md'
                        : 'bg-emerald-50/60 hover:bg-emerald-100/70 border-emerald-200/80 hover:border-emerald-400 hover:scale-[1.03] active:scale-95'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:rotate-2 transition-transform duration-300">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-black text-emerald-950">
                          ثاني متوسط
                        </h3>
                        <p className="text-[10px] text-emerald-800 font-semibold line-clamp-1 mt-0.5">
                          المقررات والدروس المعتمدة
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 mt-2 border-t border-emerald-200/70 flex items-center justify-between text-[11px] font-black text-emerald-800">
                      <span>دخول القسم</span>
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>

                  {/* Button 2: بنك الملخصات وأوراق العمل */}
                  <div
                    onClick={() => handleNavigateWithAnimation('summaries', () => setActiveTab('summaries'))}
                    className={`group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 ease-out cursor-pointer select-none text-right shadow-2xs hover:shadow-md ${
                      navigatingBtnId === 'summaries'
                        ? 'scale-105 ring-2 ring-sky-500 bg-sky-50 border-sky-400 shadow-md'
                        : 'bg-sky-50/60 hover:bg-sky-100/70 border-sky-200/80 hover:border-sky-400 hover:scale-[1.03] active:scale-95'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-sky-700 text-white flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:rotate-2 transition-transform duration-300">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-black text-sky-950">
                          الملخصات وأوراق العمل
                        </h3>
                        <p className="text-[10px] text-sky-800 font-semibold line-clamp-1 mt-0.5">
                          أحدث المواد والشروحات
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 mt-2 border-t border-sky-200/70 flex items-center justify-between text-[11px] font-black text-sky-800">
                      <span>عرض المواد</span>
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>

                  {/* Button 3: لعبة الملازم أنس (إذا كانت مفعلة) */}
                  {Boolean(config.isGamesTabEnabled) && (
                    <div
                      onClick={() => handleNavigateWithAnimation('games', () => setActiveTab('games'))}
                      className={`group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 ease-out cursor-pointer select-none text-right shadow-2xs hover:shadow-md ${
                        navigatingBtnId === 'games'
                          ? 'scale-105 ring-2 ring-indigo-500 bg-indigo-50 border-indigo-400 shadow-md'
                          : 'bg-indigo-50/60 hover:bg-indigo-100/70 border-indigo-200/80 hover:border-indigo-400 hover:scale-[1.03] active:scale-95'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-indigo-700 text-white flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:rotate-2 transition-transform duration-300">
                          <Gamepad2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-xs sm:text-sm font-black text-indigo-950">
                            لعبة الملازم أنس
                          </h3>
                          <p className="text-[10px] text-indigo-800 font-semibold line-clamp-1 mt-0.5">
                            أمن الطرق ونظام ساهر
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 mt-2 border-t border-indigo-200/70 flex items-center justify-between text-[11px] font-black text-indigo-800">
                        <span>بدء اللعبة</span>
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-300" />
                      </div>
                    </div>
                  )}

                  {/* Button 4: بوابة دخول الطلاب / الحساب */}
                  <div
                    onClick={() =>
                      handleNavigateWithAnimation('auth-student', () => {
                        if (currentUser.role === 'guest') {
                          setIsLoginModalOpen(true);
                        } else {
                          setActiveTab('second-intermediate');
                        }
                      })
                    }
                    className={`group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 ease-out cursor-pointer select-none text-right shadow-2xs hover:shadow-md ${
                      navigatingBtnId === 'auth-student'
                        ? 'scale-105 ring-2 ring-amber-500 bg-amber-50 border-amber-400 shadow-md'
                        : 'bg-amber-50/60 hover:bg-amber-100/70 border-amber-200/80 hover:border-amber-400 hover:scale-[1.03] active:scale-95'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:rotate-2 transition-transform duration-300">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-black text-amber-950 line-clamp-1">
                          {currentUser.role === 'student' ? currentUser.student?.fullName : 'دخول الطلاب'}
                        </h3>
                        <p className="text-[10px] text-amber-800 font-semibold line-clamp-1 mt-0.5">
                          {currentUser.role === 'student' ? 'حساب الطالب نشط ومتاح' : 'بالاسم والرمز المدرسي'}
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 mt-2 border-t border-amber-200/70 flex items-center justify-between text-[11px] font-black text-amber-800">
                      <span>{currentUser.role === 'guest' ? 'تسجيل الدخول' : 'فتح مقرراتك'}</span>
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>

                  {/* Button 5: منصة مدرستي الرسمية */}
                  <div
                    onClick={() =>
                      handleNavigateWithAnimation('madrasati', () => {
                        window.open(config.madrasatiUrl || 'https://schools.madrasati.sa', '_blank');
                      })
                    }
                    className={`group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 ease-out cursor-pointer select-none text-right shadow-2xs hover:shadow-md ${
                      navigatingBtnId === 'madrasati'
                        ? 'scale-105 ring-2 ring-teal-500 bg-teal-50 border-teal-400 shadow-md'
                        : 'bg-teal-50/60 hover:bg-teal-100/70 border-teal-200/80 hover:border-teal-400 hover:scale-[1.03] active:scale-95'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:rotate-2 transition-transform duration-300">
                        <ExternalLink className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-black text-teal-950">
                          منصة مدرستي
                        </h3>
                        <p className="text-[10px] text-teal-800 font-semibold line-clamp-1 mt-0.5">
                          البوابة الرسمية المعتمدة
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 mt-2 border-t border-teal-200/70 flex items-center justify-between text-[11px] font-black text-teal-800">
                      <span>زيارة المنصة</span>
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>

                  {/* Button 6: لوحة تحكم المدير */}
                  <div
                    onClick={() =>
                      handleNavigateWithAnimation('manager', () => {
                        if (currentUser.role === 'manager') {
                          setActiveTab('manager-panel');
                        } else {
                          setIsLoginModalOpen(true);
                        }
                      })
                    }
                    className={`group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 ease-out cursor-pointer select-none text-right shadow-2xs hover:shadow-md ${
                      navigatingBtnId === 'manager'
                        ? 'scale-105 ring-2 ring-slate-700 bg-slate-100 border-slate-400 shadow-md'
                        : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200/80 hover:border-slate-400 hover:scale-[1.03] active:scale-95'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:rotate-2 transition-transform duration-300">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-black text-slate-950">
                          لوحة المدير
                        </h3>
                        <p className="text-[10px] text-slate-600 font-semibold line-clamp-1 mt-0.5">
                          {currentUser.role === 'manager' ? 'التحكم والإدارة' : 'دخول الإدارة المدرسية'}
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 mt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] font-black text-slate-700">
                      <span>{currentUser.role === 'manager' ? 'فتح اللوحة' : 'تسجيل الدخول'}</span>
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Latest Published Materials Spotlight */}
            {Boolean(config.isLatestSpotlightEnabled) && summaries.length > 0 && (
              <div className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-emerald-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <Sparkles className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900">
                        أحدث أوراق العمل والملخصات المنشورة
                      </h3>
                      <p className="text-[11px] text-slate-500 font-semibold">
                        منشورة ومعممة فورياً عبر الخادم لجميع الجوالات
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('second-intermediate')}
                    className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 cursor-pointer"
                  >
                    <span>تصفح الكل</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {summaries.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedSummary(item)}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 transition-all cursor-pointer group flex flex-col justify-between space-y-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                            {item.subject}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                            {item.category || 'ملخص'}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-1">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {item.summaryText}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-emerald-800">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          <span>فتح واستعراض الملف</span>
                        </span>
                        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Access to ثاني متوسط & الملخصات */}
            <div className="space-y-4">
              <div className="bg-white/95 backdrop-blur-md px-5 py-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg sm:text-2xl font-black text-slate-950 tracking-tight">
                    أقسام المنصة السريعة
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-700 font-bold mt-0.5">
                    انقر على أي قسم للانتقال الفوري إلى الدروس والملخصات
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('second-intermediate')}
                  className="text-xs sm:text-sm font-black text-emerald-900 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all shrink-0"
                >
                  <span>عرض الكل</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className={`grid grid-cols-1 sm:grid-cols-2 ${Boolean(config.isGamesTabEnabled) ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
                {/* Card 1: ثاني متوسط */}
                <div
                  onClick={() => setActiveTab('second-intermediate')}
                  className="bg-white/96 backdrop-blur-xs p-5 rounded-2xl border border-slate-200/90 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-slate-950 text-sm sm:text-base group-hover:text-emerald-800 transition-colors">
                    ثاني متوسط (الرئيسي)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 font-semibold mt-1.5 leading-relaxed line-clamp-2">
                    المكتبة الشاملة لملخصات ثاني متوسط مع الشرح الوافي.
                  </p>
                  <div className="mt-3 text-xs sm:text-sm font-black text-emerald-800 flex items-center gap-1">
                    <span>تصفح الملخصات</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Card 2: بنك الملخصات */}
                <div
                  onClick={() => setActiveTab('summaries')}
                  className="bg-white/96 backdrop-blur-xs p-5 rounded-2xl border border-slate-200/90 hover:border-teal-500 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center mb-3 group-hover:bg-teal-700 group-hover:text-white transition-colors">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-slate-950 text-sm sm:text-base group-hover:text-teal-800 transition-colors">
                    خانة الملخصات
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 font-semibold mt-1.5 leading-relaxed line-clamp-2">
                    العلوم، الرياضيات، لغتي، الاجتماعيات، والدراسات الإسلامية.
                  </p>
                  <div className="mt-3 text-xs sm:text-sm font-black text-teal-800 flex items-center gap-1">
                    <span>قراءة الملخصات ({summaries.length})</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Card 3: خانة الألعاب (لعبة الملازم أَنَس) - يمين خانة المدير */}
                {Boolean(config.isGamesTabEnabled) && (
                  <div
                    onClick={() => setActiveTab('games')}
                    className="bg-linear-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl border-2 border-indigo-500/50 hover:border-amber-400 hover:shadow-xl hover:shadow-indigo-900/30 transition-all cursor-pointer group relative overflow-hidden"
                  >
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/40 rounded-full text-[10px] font-bold">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>+10 نقاط</span>
                    </div>

                    <div className="w-10 h-10 rounded-xl bg-indigo-500/30 text-amber-400 flex items-center justify-center mb-3 group-hover:bg-amber-400 group-hover:text-slate-900 transition-colors">
                      <Gamepad2 className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-white text-sm sm:text-base group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                      <span>لعبة الملازم أَنَس</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    </h3>
                    <p className="text-xs sm:text-sm text-indigo-100 font-semibold mt-1.5 leading-relaxed line-clamp-2">
                      محاكاة أمن الطرق وساهر وتفتيش المركبات بالعرض الكامل مع الأصدقاء.
                    </p>
                    <div className="mt-3 text-xs sm:text-sm font-black text-amber-400 flex items-center gap-1">
                      <span>العب الآن بالعرض الكامل</span>
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </div>
                )}

                {/* Card 4: لوحة تحكم المدير */}
                <div
                  onClick={() => {
                    if (currentUser.role === 'manager') {
                      setActiveTab('manager-panel');
                    } else {
                      setIsLoginModalOpen(true);
                    }
                  }}
                  className="bg-white/96 backdrop-blur-xs p-5 rounded-2xl border border-slate-200/90 hover:border-amber-500 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-slate-950 text-sm sm:text-base group-hover:text-amber-800 transition-colors">
                    لوحة تحكم المدير
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 font-semibold mt-1.5 leading-relaxed line-clamp-2">
                    تسجيل وتعديل أسماء الطلاب، وتغيير رمز المدرسة وإضافة الملفات والتحكم بالألعاب.
                  </p>
                  <div className="mt-3 text-xs sm:text-sm font-black text-amber-800 flex items-center gap-1">
                    <span>دخول المدير</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Card 5: باركود ورابط المنصة */}
                <div
                  onClick={() => setIsQRModalOpen(true)}
                  className="bg-white/96 backdrop-blur-xs p-5 rounded-2xl border border-slate-200/90 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-3 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-slate-950 text-sm sm:text-base group-hover:text-slate-900 transition-colors">
                    رابط وباركود المنصة
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 font-semibold mt-1.5 leading-relaxed line-clamp-2">
                    امسح الباركود بهاتفك أو انسخ الرابط الصحيح لمشاركته مع الطلاب.
                  </p>
                  <div className="mt-3 text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1">
                    <span>فتح الباركود والنسخ</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* خانة منصة مدرستي: تحت رابط وباركود المنصة في الصفحة الرئيسية فقط */}
              <div className="mt-4 p-4 sm:p-5 bg-white/96 backdrop-blur-xs rounded-2xl border border-slate-200/90 hover:border-emerald-500/80 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                  {/* صورة مدرستي في اليمين */}
                  <div className="h-14 sm:h-16 w-24 sm:w-32 shrink-0 bg-white rounded-xl p-1 border border-slate-100 flex items-center justify-center shadow-xs overflow-hidden">
                    <img
                      src="/assets/aistudio/Screenshot_________________Chrome_f68c47cb.jpg"
                      alt="منصة مدرستي"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  {/* منصة مدرستي يسار الصورة */}
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black text-slate-950">
                        منصة مدرستي
                      </h3>
                      <span className="px-2 py-0.5 text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md">
                        المنصة المعتمدة
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-1">
                      تسجيل الدخول المباشر لحساب الطالب ومتابعة الدروس والواجبات والحصص
                    </p>
                  </div>
                </div>

                {/* زر الدخول يسار منصة مدرستي */}
                <a
                  href={config.madrasatiUrl?.trim() || "https://schools.madrasati.sa/login?Language=1"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto shrink-0 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-black px-6 py-3 rounded-xl text-sm sm:text-base flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <span>الدخول</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* تحت خانة المدير: بطاقة عريضة تفاعلية لـ لعبة الملازم أنس مع كامل الصلاحيات */}
              {Boolean(config.isGamesTabEnabled) && (
                <div className="mt-5 p-5 bg-linear-to-r from-slate-950 via-indigo-950 to-slate-900 rounded-3xl border border-indigo-500/40 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 text-amber-400 shadow-inner">
                      <Siren className="w-7 h-7 text-amber-400 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md">
                          محاكاة واقعية سعودية بالعرض الكامل
                        </span>
                        <span className="text-[11px] text-amber-300 font-bold">
                          +10 نقاط لكل فترة التزام مروري
                        </span>
                      </div>
                      <h4 className="text-base font-extrabold text-white flex items-center gap-2">
                        <span>خانة الألعاب: لعبة الملازم أَنَس (أمن الطرق & ساهر & نقطة التفتيش)</span>
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
                        عِش تجربة دوريات أمن الطرق، كاميرات ساهر (-100 نقطة للمخالفة)، وتفتيش المركبات وكشف هويات السائقين.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                    <button
                      onClick={() => setActiveTab('games')}
                      className="w-full md:w-auto px-6 py-3 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.02] cursor-pointer"
                    >
                      <Gamepad2 className="w-4 h-4" />
                      <span>تشغيل اللعبة بالعرض (Landscape)</span>
                    </button>
                    {currentUser.role === 'manager' && (
                      <button
                        onClick={() => setActiveTab('manager-panel')}
                        className="px-3 py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors border border-white/10"
                        title="إعدادات اللعبة في لوحة المدير"
                      >
                        إدارة
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: GAMES / LT ANAS GAME */}
        {activeTab === 'games' && Boolean(config.isGamesTabEnabled) && (
          <LtAnasGame
            currentUser={currentUser}
            config={config}
            onUpdateConfig={handleUpdateConfig}
            onBack={() => setActiveTab('home')}
          />
        )}

        {/* VIEW 2 & 3: ثاني متوسط / الملخصات */}
        {(activeTab === 'second-intermediate' || activeTab === 'summaries') && (
          <StudentPortal
            summaries={summaries}
            currentUser={currentUser}
            config={config}
            onSelectSummary={(sum) => setSelectedSummary(sum)}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onOpenLogin={() => setIsLoginModalOpen(true)}
          />
        )}

        {/* VIEW 4: MANAGER DASHBOARD */}
        {activeTab === 'manager-panel' && (
          currentUser.role === 'manager' ? (
            <ManagerDashboard
              config={config}
              onUpdateConfig={handleUpdateConfig}
              students={students}
              onRefreshStudents={handleRefreshStudents}
              summaries={summaries}
              onRefreshSummaries={handleRefreshSummaries}
              onlineStudentIds={onlineStudentIds}
              onlineSessions={onlineSessions}
              suspensions={suspensions}
            />
          ) : (
            <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center max-w-lg mx-auto space-y-4 shadow-sm">
              <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                تسجيل دخول المدير مطلوب
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                للوصول إلى لوحة تحكم المدير وتعديل الأسماء ورمز المدرسة وإضافة الملفات، يرجى إدخال رمز مدرسة المدير الخاص بك.
              </p>
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
              >
                إدخال رمز مدرسة المدير
              </button>
            </div>
          )
        )}

        {/* VIEW 5: ABOUT SECTION */}
        {activeTab === 'about' && (
          <AboutSection
            config={config}
            onGoToSecondIntermediate={() => setActiveTab('second-intermediate')}
          />
        )}
      </main>

      {/* Footer */}
      <div className="relative z-10">
        <Footer config={config} onOpenQR={() => setIsQRModalOpen(true)} />
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        config={config}
        onLoginSuccess={handleLoginSuccess}
      />

      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        config={config}
        onUpdateConfig={handleUpdateConfig}
      />

      <SummaryDetailModal
        summary={selectedSummary}
        currentUser={currentUser}
        onOpenLogin={() => {
          setSelectedSummary(null);
          setIsLoginModalOpen(true);
        }}
        onClose={() => setSelectedSummary(null)}
        isFavorite={selectedSummary ? favorites.includes(selectedSummary.id) : false}
        onToggleFavorite={handleToggleFavorite}
        isFilePreviewEnabled={config.isFilePreviewEnabled !== false}
        config={config}
      />

      {/* Student Suspended / Kicked by Manager Lockout Overlay */}
      {isStudentSuspended && currentSuspension && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 text-center select-none animate-fade-in" dir="rtl">
          <div className="bg-slate-900 border-2 border-rose-600 rounded-3xl max-w-md w-full p-6 sm:p-8 text-white shadow-2xl space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-950 border border-rose-500/80 flex items-center justify-center text-rose-400 mx-auto shadow-lg animate-pulse">
              <Ban className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-300 bg-rose-950/80 border border-rose-800 px-3 py-1 rounded-full">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>إشعار إداري عاجل</span>
              </div>
              <h2 className="text-xl font-black text-white">
                تم إيقاف دخولك إلى المنصة مؤقتاً
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                عزيزي الطالب <strong className="text-emerald-400 font-bold">{currentUser.student?.fullName}</strong>، تم تعليق صلاحية دخولك للصفحة بأمر من مدير المدرسة لمتابعة النشاط الدراسي.
              </p>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-1.5 text-right">
              <div className="flex justify-between text-slate-400">
                <span>المدرسة:</span>
                <span className="font-bold text-white">{config.schoolName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>سبب الإجراء:</span>
                <span className="font-bold text-rose-300">{currentSuspension.reason || 'بأمر من إدارة المدرسة'}</span>
              </div>
            </div>

            {/* Live Countdown Timer if duration set */}
            {currentSuspension.expiresAt > 0 ? (
              <div className="p-4 bg-rose-950/50 border border-rose-700/60 rounded-2xl">
                <div className="text-[11px] text-rose-200 font-semibold mb-1">الوقت المتبقي لفك التعليق والعودة للمنصة تلقائياً:</div>
                <div className="text-3xl font-mono font-black text-amber-400 tracking-wider">
                  {formatSuspensionCountdown(remainingSuspensionSeconds)}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-amber-300 font-bold">
                🔒 حالة الحساب: معلق حتى يقوم مدير المدرسة بفك الحظر وإعادة فتح الموقع لك.
              </div>
            )}

            <p className="text-[11px] text-slate-500">
              فور انتهاء الوقت أو قيام المدير بفك الحظر، ستفتح لك الصفحة تلقائياً دون الحاجة لإعادة الدخول.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
