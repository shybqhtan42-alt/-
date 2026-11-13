import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Eye, 
  ShieldAlert, 
  Activity, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Wifi, 
  Laptop, 
  Smartphone, 
  Clock, 
  User, 
  BookOpen, 
  Radio, 
  Sparkles,
  Sliders,
  AlertTriangle,
  FileCheck,
  Download,
  Ban,
  Unlock,
  Camera,
  CheckCircle2,
  X,
  FileText,
  Gamepad2,
  Calendar,
  Layers,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  MousePointer
} from 'lucide-react';
import { Student, StudentLiveSession, StudentSuspension, StudentActivityLog, SchoolConfig } from '../types';
import { storageService } from '../services/storageService';

export const formatArabicDayAndTime = (timestamp?: number): { full: string; dayOnly: string; timeOnly: string; dateWithDay: string } => {
  const targetDate = timestamp ? new Date(timestamp) : new Date();
  const now = new Date();
  const isToday = targetDate.toDateString() === now.toDateString();
  const dayName = targetDate.toLocaleDateString('ar-SA', { weekday: 'long', timeZone: 'Asia/Riyadh' });
  const fullDate = targetDate.toLocaleDateString('ar-SA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Riyadh',
  });
  const timeOnly = targetDate.toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Riyadh',
  });

  const dayLabel = isToday ? `اليوم (${dayName}) ${fullDate}` : `${dayName} (${fullDate})`;

  return {
    full: `${dayLabel} • الساعة: ${timeOnly}`,
    dayOnly: dayLabel,
    timeOnly: `الساعة: ${timeOnly}`,
    dateWithDay: `${dayName} - ${fullDate}`,
  };
};

interface StudentScreenVideoPlayerProps {
  cam: any;
  config: SchoolConfig;
  isSelected: boolean;
  scanlines: boolean;
  nightVision: boolean;
}

const StudentScreenVideoPlayer: React.FC<StudentScreenVideoPlayerProps> = ({
  cam,
  config,
  isSelected,
  scanlines,
  nightVision,
}) => {
  // Map student's real-time telemetry to the real matching scene:
  // 0: الرئيسية (الصفحة الرئيسية مع ملخصات معتمدة لثاني متوسط)
  // 1: بوابة ثاني متوسط (بوابة ملخصات ثاني متوسط والمقررات)
  // 2: نافذة دخول الطالب (Student Login Modal)
  // 3: قسم المواد والمقررات الدراسية (Subjects Grid with Science, Math, etc.)
  // 4: ورقة العمل وملخص المادة (Worksheet Preview with clean content & logo)
  // 5: قسم الألعاب (لعبة دورية أمن الطرق التعليمية)
  const getRealSceneFromTelemetry = (): number => {
    const theme = cam.snapshotTheme;
    const sec = (cam.currentSection || '').toLowerCase();
    if (theme === 'login' || sec.includes('نافذة') || sec.includes('دخول')) return 2;
    if (theme === 'materials' || sec.includes('قسم المواد') || sec.includes('المقررات') || sec.includes('المواد')) return 3;
    if (theme === 'portal' || sec.includes('بوابة')) return 1;
    if (theme === 'download' || theme === 'summary' || sec.includes('تنزيل') || sec.includes('ورقة') || sec.includes('معاينة') || sec.includes('ملخص')) return 4;
    if (theme === 'game' || sec.includes('ألعاب') || sec.includes('لعبة') || sec.includes('دورية')) return 5;
    return 0; // Default: الصفحة الرئيسية (Home Page)
  };

  const [manualScene, setManualScene] = useState<number | null>(null);
  const activeScene = manualScene !== null ? manualScene : getRealSceneFromTelemetry();
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [timecode, setTimecode] = useState<number>(0);
  const [motionPhase, setMotionPhase] = useState<number>(0);
  const [liveNow, setLiveNow] = useState<Date>(new Date());

  // Continuous animation loop so the camera feed is a live, self-moving clip ("مقطع يتحرك من نفسه")
  useEffect(() => {
    if (!isPlaying || !cam.isLive || cam.isSuspended) return;
    const interval = setInterval(() => {
      setTimecode((t) => t + 1);
      setMotionPhase((p) => (p + 1) % 6);
      setLiveNow(new Date());
    }, 1400);
    return () => clearInterval(interval);
  }, [isPlaying, cam.isLive, cam.isSuspended]);

  // Motion state per scene giving smooth realistic browsing movement and scroll
  const getSceneMotion = (scene: number, phase: number) => {
    if (scene === 0) {
      // Scene 0: Home Page (الصفحة الرئيسية)
      const phases = [
        { cursor: { x: 75, y: 32, isClicking: false }, scrollY: 0, activeIndex: 0 },
        { cursor: { x: 50, y: 55, isClicking: false }, scrollY: 0, activeIndex: 1 },
        { cursor: { x: 50, y: 72, isClicking: true }, scrollY: 0, activeIndex: 2 },
        { cursor: { x: 65, y: 65, isClicking: false }, scrollY: -35, activeIndex: 3 },
        { cursor: { x: 30, y: 70, isClicking: false }, scrollY: -55, activeIndex: 4 },
        { cursor: { x: 50, y: 40, isClicking: false }, scrollY: 0, activeIndex: 0 },
      ];
      return phases[phase % phases.length];
    }
    if (scene === 3) {
      // Scene 3: Subjects & Materials (قسم المواد والمقررات)
      const phases = [
        { cursor: { x: 35, y: 45, isClicking: false }, scrollY: 0, activeIndex: 0 },
        { cursor: { x: 35, y: 45, isClicking: true }, scrollY: 0, activeIndex: 0 },
        { cursor: { x: 70, y: 45, isClicking: false }, scrollY: 0, activeIndex: 1 },
        { cursor: { x: 50, y: 65, isClicking: false }, scrollY: -30, activeIndex: 2 },
        { cursor: { x: 35, y: 70, isClicking: false }, scrollY: -48, activeIndex: 3 },
        { cursor: { x: 50, y: 35, isClicking: false }, scrollY: 0, activeIndex: 0 },
      ];
      return phases[phase % phases.length];
    }
    if (scene === 4) {
      // Scene 4: Download & Worksheet (قسم التنزيل وأوراق العمل والمطويات)
      const phases = [
        { cursor: { x: 50, y: 25, isClicking: false }, scrollY: 0, activeIndex: 0 },
        { cursor: { x: 65, y: 40, isClicking: false }, scrollY: 0, activeIndex: 1 },
        { cursor: { x: 50, y: 60, isClicking: false }, scrollY: -30, activeIndex: 2 },
        { cursor: { x: 50, y: 88, isClicking: false }, scrollY: -45, activeIndex: 3 },
        { cursor: { x: 50, y: 88, isClicking: true }, scrollY: -45, activeIndex: 3 },
        { cursor: { x: 50, y: 30, isClicking: false }, scrollY: 0, activeIndex: 0 },
      ];
      return phases[phase % phases.length];
    }
    if (scene === 1) {
      // Scene 1: Portal (بوابة ثاني متوسط)
      const phases = [
        { cursor: { x: 50, y: 35, isClicking: false }, scrollY: 0, activeIndex: 0 },
        { cursor: { x: 50, y: 40, isClicking: true }, scrollY: 0, activeIndex: 0 },
        { cursor: { x: 50, y: 65, isClicking: false }, scrollY: -20, activeIndex: 1 },
        { cursor: { x: 50, y: 80, isClicking: false }, scrollY: -35, activeIndex: 2 },
        { cursor: { x: 50, y: 80, isClicking: true }, scrollY: -35, activeIndex: 2 },
        { cursor: { x: 50, y: 30, isClicking: false }, scrollY: 0, activeIndex: 0 },
      ];
      return phases[phase % phases.length];
    }
    if (scene === 2) {
      // Scene 2: Login modal (نافذة الدخول)
      const phases = [
        { cursor: { x: 50, y: 45, isClicking: false }, scrollY: 0, activeIndex: 0 },
        { cursor: { x: 50, y: 60, isClicking: false }, scrollY: 0, activeIndex: 1 },
        { cursor: { x: 50, y: 72, isClicking: false }, scrollY: 0, activeIndex: 2 },
        { cursor: { x: 50, y: 86, isClicking: true }, scrollY: 0, activeIndex: 3 },
        { cursor: { x: 50, y: 86, isClicking: false }, scrollY: 0, activeIndex: 3 },
        { cursor: { x: 50, y: 50, isClicking: false }, scrollY: 0, activeIndex: 0 },
      ];
      return phases[phase % phases.length];
    }
    // Scene 5: Games
    const phases = [
      { cursor: { x: 30, y: 40, isClicking: false }, scrollY: 0, activeIndex: 0 },
      { cursor: { x: 70, y: 50, isClicking: false }, scrollY: -15, activeIndex: 1 },
      { cursor: { x: 50, y: 70, isClicking: true }, scrollY: -30, activeIndex: 2 },
      { cursor: { x: 50, y: 40, isClicking: false }, scrollY: 0, activeIndex: 0 },
      { cursor: { x: 40, y: 60, isClicking: false }, scrollY: -20, activeIndex: 1 },
      { cursor: { x: 60, y: 50, isClicking: true }, scrollY: 0, activeIndex: 2 },
    ];
    return phases[phase % phases.length];
  };

  const motion = getSceneMotion(activeScene, motionPhase);
  const cursorPos = motion.cursor;
  const scrollOffsetY = motion.scrollY;

  const currentLiveDate = liveNow.toLocaleDateString('ar-SA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Riyadh',
  });
  const currentLiveClock = liveNow.toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Riyadh',
  });

  if (cam.isSuspended) {
    return (
      <div className="w-full h-full rounded-xl bg-gradient-to-b from-rose-950 via-slate-900 to-rose-950 border-2 border-rose-600 flex flex-col items-center justify-center p-4 text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-rose-900 text-rose-300 flex items-center justify-center shadow-lg border border-rose-500 animate-pulse">
          <Ban className="w-6 h-6" />
        </div>
        <div className="text-sm font-black text-white">تم إخراج الطالب من المنصة</div>
        <p className="text-[11px] text-rose-200 max-w-xs">
          {cam.suspension?.reason || 'بأمر من إدارة المدرسة'}
        </p>
        <div className="text-xs font-mono font-bold bg-black/60 text-amber-400 px-3 py-1 rounded-full border border-amber-500/40">
          {cam.suspension?.expiresAt && cam.suspension.expiresAt > 0
            ? `الإيقاف ينتهي: ${new Date(cam.suspension.expiresAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'Asia/Riyadh' })}`
            : 'موقوف حتى يفتح له المدير يدوياً'}
        </div>
      </div>
    );
  }

  if (!cam.isLive) {
    return (
      <div className="w-full h-full rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-4 text-center space-y-2 relative">
        <div className="w-12 h-12 rounded-full bg-slate-900 text-slate-500 flex items-center justify-center border border-slate-700">
          <User className="w-6 h-6" />
        </div>
        <div className="text-xs font-bold text-slate-300">الطالب غير متاح حالياً (خارج المنصة)</div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 w-full max-w-xs space-y-1 text-center">
          <div className="text-[10px] font-bold text-amber-300 flex items-center justify-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>التاريخ 📅: {cam.lastSeenDay}</span>
          </div>
          <div className="text-[10px] font-bold text-emerald-400 font-mono flex items-center justify-center gap-1">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>الساعة 🕒: {cam.lastSeenTime}</span>
          </div>
        </div>
        <p className="text-[10px] text-slate-400">
          آخر صفحة كان فيها: <strong className="text-slate-200">{cam.currentSection || 'الصفحة الرئيسية'}</strong>
        </p>
        <div className="text-[9px] font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
          ⚪ غير متاح • كاميرا الاستعداد
        </div>
      </div>
    );
  }

  const sceneTitles = [
    'الصفحة الرئيسية: ملخصات معتمدة لثاني متوسط فقط',
    'بوابة ثاني متوسط: اختيار المقررات الدراسية',
    'نافذة دخول الطالب: إدخال الرمز المعتمد',
    'قسم المواد: استعراض المقررات وأوراق العمل',
    'قسم التنزيل: معاينة ورقة العمل والمطوية',
    'قسم الألعاب: دورية أمن الطرق التعليمية',
  ];

  return (
    <div className="w-full h-full rounded-xl bg-slate-950 border border-slate-700 overflow-hidden flex flex-col relative select-none">
      {/* Top Camera Status & REC Banner */}
      <div className="h-6 bg-slate-900/95 border-b border-slate-800 px-2 flex items-center justify-between text-[9px] font-mono text-slate-300 z-20">
        <div className="flex items-center gap-1.5 text-red-400 font-bold shrink-0">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          <span>🔴 REC LIVE (مقطع متحرك)</span>
        </div>
        <div className="text-emerald-400 font-bold truncate max-w-[210px] text-center">
          {manualScene !== null ? `معاينة: ${sceneTitles[activeScene]}` : `شاشة الطالب: ${cam.currentSection || sceneTitles[activeScene]}`}
        </div>
        <div className="flex items-center gap-1 text-slate-400 font-mono shrink-0">
          <span>00:{String(timecode % 60).padStart(2, '0')}</span>
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="hover:text-white transition cursor-pointer p-0.5"
            title={isPlaying ? 'إيقاف الفيديو مؤقتاً' : 'تشغيل الفيديو'}
          >
            {isPlaying ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
          </button>
        </div>
      </div>

      {/* Live OSD HUD Stamped directly on Camera Viewport (Date 📅 & Time 🕒) */}
      <div className="bg-slate-950/90 border-b border-slate-800/80 px-2 py-0.5 flex items-center justify-between text-[8px] font-mono text-slate-200 z-20">
        <div className="flex items-center gap-1 text-amber-300 font-bold">
          <Calendar className="w-2.5 h-2.5 text-amber-400 shrink-0" />
          <span>📅 {currentLiveDate}</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-400 font-bold">
          <Clock className="w-2.5 h-2.5 text-emerald-400 shrink-0 animate-pulse" />
          <span>🕒 {currentLiveClock}</span>
        </div>
      </div>

      {/* Screen Video Container matching user video Screen_Recording_________________Chrome_c425aaa3.mp4 */}
      <div className="flex-1 bg-slate-900 relative overflow-hidden flex flex-col justify-between">
        {/* Moving Radar / Laser Scan Sweep Line */}
        <div
          className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent pointer-events-none z-20 shadow-[0_0_8px_rgba(52,211,153,0.9)]"
          style={{
            top: `${((motionPhase * 18 + timecode * 6) % 92) + 4}%`,
            transition: 'top 1.1s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />

        {/* Real Student Screen View based on real telemetry */}
        {activeScene === 0 && (
          /* SCENE 0: Real Home Page (الصفحة الرئيسية) - مقطع متحرك يتصفح وينزل ويصعد تلقائياً */
          <div
            className="w-full min-h-[145%] bg-gradient-to-b from-slate-100 via-white to-slate-200 p-2 flex flex-col justify-between text-slate-800 text-right transition-transform duration-700 ease-out select-none"
            style={{ transform: `translateY(${scrollOffsetY}px)` }}
          >
            {/* Top Navbar */}
            <div className="bg-white rounded-lg p-1.5 shadow-xs border border-slate-200 flex items-center justify-between text-[8px] font-bold shrink-0">
              <span className="text-emerald-800 font-black">{config.platformTitle || 'منصة البشير التعليمي'}</span>
              <div className="flex items-center gap-1">
                <span className="bg-emerald-600 text-white px-2 py-0.5 rounded">الرئيسية</span>
                <span className="text-slate-600 px-1.5 py-0.5">ثاني متوسط</span>
                <span className="text-slate-600 px-1.5 py-0.5">المواد</span>
              </div>
            </div>

            {/* White Hero Card */}
            <div className="bg-white rounded-xl p-2.5 shadow-md border border-slate-200 space-y-1.5 my-1.5 text-center shrink-0">
              <span className="inline-block bg-emerald-100 text-emerald-800 text-[8px] font-bold px-2 py-0.5 rounded-full">
                {config.schoolName || 'مدرسة عبد الملك بن مروان'}
              </span>
              <div className="text-xs font-black text-emerald-900">{config.platformTitle || 'منصة البشير التعليمي'}</div>
              <div className="text-[8.5px] font-black text-emerald-700 bg-emerald-50 py-0.5 px-2 rounded-md inline-block border border-emerald-200">
                ملخصات معتمدة لثاني متوسط فقط
              </div>
              <div className="text-[8px] text-slate-500 font-bold">إعداد وتطوير: {config.authorName || 'أ. صهيب القحطاني'}</div>
              <p className="text-[7px] text-slate-600 leading-relaxed max-w-xs mx-auto">
                البيئة المعتمدة لطلاب المدرسة لتصفح الملخصات وأوراق العمل المعتمدة لثاني متوسط فقط.
              </p>

              {/* Action Buttons */}
              <div className="space-y-1 pt-1">
                <div
                  className={`w-full py-1 px-2 rounded-lg text-[8px] font-black flex items-center justify-center gap-1 transition ${
                    cursorPos.isClicking && activeScene === 0
                      ? 'bg-emerald-800 text-white scale-95 shadow-inner ring-2 ring-emerald-400'
                      : 'bg-emerald-600 text-white shadow-xs'
                  }`}
                >
                  <span>دخول ملخصات ثاني متوسط</span>
                  <span>←</span>
                </div>
                <div className="w-full py-1 px-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-[7px] font-bold flex items-center justify-center gap-1">
                  <span>تسجيل دخول الطالب / المدير</span>
                </div>
              </div>
            </div>

            {/* Scrolling Sub-sections: Subjects quick cards */}
            <div className="space-y-1 pt-1 shrink-0">
              <div className="text-[7.5px] font-bold text-slate-500 flex items-center justify-between">
                <span>المقررات المتاحة لثاني متوسط:</span>
                <span className="text-emerald-700 font-mono font-bold">1448 هـ / 2026 م</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[7px]">
                <div className={`p-1 rounded border text-right transition ${motion.activeIndex === 1 ? 'bg-emerald-100 border-emerald-500 font-black' : 'bg-white border-slate-200'}`}>
                  🧪 مادة العلوم (معتمد)
                </div>
                <div className={`p-1 rounded border text-right transition ${motion.activeIndex === 2 ? 'bg-emerald-100 border-emerald-500 font-black' : 'bg-white border-slate-200'}`}>
                  📐 مادة الرياضيات (معتمد)
                </div>
              </div>
            </div>

            {/* Feature tags */}
            <div className="bg-white/90 rounded-lg p-1 text-[7px] font-bold text-slate-600 flex items-center justify-around mt-1.5 shrink-0">
              <span>✓ ملخصات معتمدة لثاني متوسط فقط</span>
              <span>✓ رمز مشفر</span>
              <span>✓ متابعة حية</span>
            </div>
          </div>
        )}

        {activeScene === 1 && (
          /* SCENE 1: Second-Intermediate Portal (بوابة ثاني متوسط) */
          <div
            className="w-full min-h-[135%] bg-slate-100 p-2 flex flex-col justify-between text-slate-800 text-right transition-transform duration-700 ease-out select-none"
            style={{ transform: `translateY(${scrollOffsetY}px)` }}
          >
            {/* Top Green Banner */}
            <div className="bg-emerald-900 text-white rounded-xl p-2 space-y-1 shadow-sm shrink-0">
              <div className="text-[8px] text-emerald-300 font-bold">
                {config.schoolName || 'مدرسة عبد الملك بن مروان'} • إشراف: {config.authorName || 'أ. صهيب القحطاني'}
              </div>
              <div className="text-[11px] font-black">منصة البشير التعليمي - ثاني متوسط</div>
              <div
                className={`py-1 px-2 bg-white text-emerald-900 rounded-lg text-[8px] font-black text-center shadow-xs transition ${
                  cursorPos.isClicking && activeScene === 1
                    ? 'scale-95 bg-emerald-100 ring-2 ring-emerald-500'
                    : ''
                }`}
              >
                تسجيل الدخول للمنصة
              </div>
            </div>

            {/* Grade Selector */}
            <div className="bg-white p-1.5 rounded-xl border border-slate-200 space-y-1 my-1 shrink-0">
              <div className="text-[8px] font-bold text-slate-500">الصف الدراسي المعتمد:</div>
              <div className="flex items-center justify-center gap-1">
                <span className="text-[7px] px-2 py-0.5 bg-emerald-600 text-white font-black rounded shadow-xs">
                  ثاني متوسط (معتمد فقط) ✓
                </span>
              </div>
            </div>

            {/* Step 1 Box */}
            <div className="bg-white p-2 rounded-xl border border-slate-200 text-center my-1 shrink-0">
              <div className="text-[8px] font-black text-emerald-800">الخطوة 1: اختيار المادة لصف ثاني متوسط</div>
              <div className="text-[7px] text-slate-500 mt-0.5">انقر على المادة لعرض الملخصات وأوراق العمل</div>
            </div>

            <div className="grid grid-cols-2 gap-1 text-[7px] shrink-0">
              <div className="bg-white p-1 rounded border border-slate-200 font-bold text-emerald-900">
                📚 6 مقررات معتمدة
              </div>
              <div className="bg-white p-1 rounded border border-slate-200 font-bold text-slate-700">
                📄 مطويات جاهزة
              </div>
            </div>
          </div>
        )}

        {activeScene === 2 && (
          /* SCENE 2: Student Login Modal (نافذة دخول الطالب المعتمد) */
          <div className="w-full h-full bg-slate-900/90 relative p-2 flex items-center justify-center text-right overflow-hidden select-none">
            {/* Modal Dialog Card */}
            <div className="w-full max-w-[240px] bg-white rounded-xl shadow-2xl border border-slate-200 p-2.5 space-y-1.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                <span className="text-[9px] font-black text-emerald-900">{config.platformTitle || 'منصة البشير التعليمي'}</span>
                <span className="text-[7px] text-slate-400">دخول الطالب</span>
              </div>

              {/* Warning box */}
              <div className="bg-emerald-50 border border-emerald-200 p-1 rounded text-[7px] text-emerald-900 font-bold leading-tight">
                تنبيه: يتطلب الدخول اسم المستخدم وكلمة المرور مع رمز المدرسة المعتمد.
              </div>

              {/* Form Input fields */}
              <div className="space-y-1 text-[7px]">
                <div>
                  <div className="text-slate-500 font-bold mb-0.5">اسم المستخدم:</div>
                  <div className="bg-slate-100 p-1 rounded border border-slate-300 font-bold text-slate-800">
                    {cam.studentName}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 font-bold mb-0.5">كلمة المرور:</div>
                  <div className="bg-slate-100 p-1 rounded border border-slate-300 font-mono text-slate-800">
                    ••••••••
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 font-bold mb-0.5">رمز المدرسة للطلاب:</div>
                  <div className="bg-slate-100 p-1 rounded border border-slate-300 font-mono font-bold text-emerald-800">
                    {config.studentSchoolCode || '27274'}
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <div
                className={`py-1 rounded-lg text-[8px] font-black text-white text-center transition ${
                  cursorPos.isClicking && activeScene === 2
                    ? 'bg-emerald-800 scale-95 shadow-inner ring-2 ring-emerald-400'
                    : 'bg-emerald-600 shadow-xs'
                }`}
              >
                دخول الطالب إلى المنصة
              </div>
            </div>
          </div>
        )}

        {activeScene === 3 && (
          /* SCENE 3: Subjects Section (قسم المواد الحقيقي في الموقع لثاني متوسط) */
          <div
            className="w-full min-h-[140%] bg-slate-100 p-2 flex flex-col justify-between text-slate-800 text-right transition-transform duration-700 ease-out select-none"
            style={{ transform: `translateY(${scrollOffsetY}px)` }}
          >
            {/* Top Header */}
            <div className="bg-white p-1.5 rounded-xl border border-slate-200 flex items-center justify-between text-[8px] font-bold shrink-0">
              <span className="text-emerald-800 font-black">المقررات الدراسية - ثاني متوسط</span>
              <span className="bg-emerald-700 text-white px-2 py-0.5 rounded shadow-xs text-[7px]">
                معتمدة لثاني متوسط
              </span>
            </div>

            {/* Real Platform Subjects Grid */}
            <div className="grid grid-cols-2 gap-1.5 my-2 shrink-0">
              {[
                { name: 'العلوم', desc: 'الطاقة وتحولاتها (ورقة معتمدة)' },
                { name: 'الرياضيات', desc: 'الجبر والمعادلات الخطية' },
                { name: 'لغتي الخالدة', desc: 'الفاعل والمفعول به والقواعد' },
                { name: 'الدراسات الإسلامية', desc: 'التوحيد والحديث والفقه' },
                { name: 'الاجتماعيات', desc: 'تاريخ المملكة والوطن' },
                { name: 'اللغة الإنجليزية', desc: 'English Super Goal 2' },
              ].map((sub, i) => {
                const isActive = (cam.currentSubject && sub.name.includes(cam.currentSubject)) || motion.activeIndex === i;
                return (
                  <div
                    key={i}
                    className={`p-1.5 rounded-lg border text-right transition ${
                      isActive
                        ? 'bg-emerald-50 border-emerald-500 shadow-xs ring-2 ring-emerald-400 scale-[1.02]'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="text-[8px] font-black text-emerald-900 flex items-center justify-between">
                      <span>{sub.name}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>}
                    </div>
                    <div className="text-[6.5px] text-slate-500 truncate">{sub.desc}</div>
                  </div>
                );
              })}
            </div>

            <div className="bg-emerald-900 text-white rounded-lg p-1 text-[7px] font-bold text-center shrink-0">
              قسم المواد والملخصات المعتمدة • {config.schoolName || 'مدرسة عبد الملك بن مروان'}
            </div>
          </div>
        )}

        {activeScene === 4 && (
          /* SCENE 4: Worksheet Document with Al-Basheer Logo (No stamps on sheet!) */
          <div
            className="w-full min-h-[148%] bg-white p-2 flex flex-col justify-between text-slate-800 text-right transition-transform duration-700 ease-out select-none"
            style={{ transform: `translateY(${scrollOffsetY}px)` }}
          >
            {/* Document Header Banner */}
            <div className="bg-emerald-900 text-white p-1.5 rounded-lg flex items-center justify-between text-[7px] shrink-0">
              <div>
                <div className="font-black text-[8px]">{config.schoolName || 'مدرسة عبد الملك بن مروان'} • {config.platformTitle || 'منصة البشير التعليمية'}</div>
                <div className="text-emerald-200 truncate max-w-[220px]">
                  {cam.currentSection?.includes('ورقة') || cam.currentSection?.includes('معاينة')
                    ? cam.currentSection
                    : `ورقة عمل وملخص دراسي معتمد: ${cam.currentSubject || 'العلوم'} • ثاني متوسط`}
                </div>
              </div>
              <div className="bg-emerald-800 px-1.5 py-0.5 rounded text-[7px] font-bold">
                ملخص دراسي رسمي
              </div>
            </div>

            {/* Student Documentation Info Box with Al-Basheer Platform Logo */}
            <div className="bg-amber-50/80 border border-amber-300 rounded-lg p-1.5 flex items-center justify-between gap-1 text-[7px] my-1 shrink-0">
              <div className="space-y-0.5">
                <div className="font-bold text-amber-900">بيانات توثيق الطالب والملف :</div>
                <div>اسم الطالب : <strong className="text-emerald-900 font-black">{cam.studentName}</strong></div>
                <div>المدرسة : <strong>{config.schoolName || 'مدرسة عبد الملك بن مروان'}</strong></div>
                <div>المعلم المشرف : <strong>{config.authorName || 'أ. صهيب القحطاني'}</strong> • الصف : <strong>ثاني متوسط</strong> • المادة : <strong>{cam.currentSubject || 'العلوم'}</strong></div>
              </div>
              <div className="bg-emerald-900 text-white px-2 py-1 rounded text-center shrink-0 border border-amber-400">
                <div className="text-[6px] text-amber-300 font-bold">شعار المنصة</div>
                <div className="text-[7px] font-black">منصة البشير</div>
              </div>
            </div>

            {/* Clean Realistic Worksheet Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 space-y-1 my-1 shrink-0">
              {cam.currentSubject?.includes('اجتماعيات') || cam.currentSection?.includes('الاجتماعية') ? (
                <>
                  <div className="bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded text-center font-black text-[8px] border border-emerald-300">
                    ورقة عمل مادة الدراسات الاجتماعية - محلول
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[6.5px]">
                    <div className="bg-white border border-slate-200 p-1 rounded text-right">
                      <div className="font-bold text-emerald-800">الوحدة الأولى: الدولة السعودية</div>
                      <div className="text-slate-500">الأسئلة والتمارين المحلولة المعتمدة</div>
                    </div>
                    <div className="bg-white border border-slate-200 p-1 rounded text-right">
                      <div className="font-bold text-blue-800">نماذج الأسئلة الموضوعية</div>
                      <div className="text-slate-500">صح وخطأ واختيار من متعدد</div>
                    </div>
                  </div>
                </>
              ) : cam.currentSubject?.includes('رياضيات') || cam.currentSection?.includes('فيثاغورس') ? (
                <>
                  <div className="bg-blue-100 text-blue-950 px-2 py-0.5 rounded text-center font-black text-[8px] border border-blue-300">
                    ملخص نظرية فيثاغورس والأعداد الحقيقية
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[6.5px]">
                    <div className="bg-white border border-slate-200 p-1 rounded text-right">
                      <div className="font-bold text-blue-800">المثلث القائم والوتر</div>
                      <div className="text-slate-500">ج² = أ² + ب² والأعداد النسبية</div>
                    </div>
                    <div className="bg-white border border-slate-200 p-1 rounded text-right">
                      <div className="font-bold text-emerald-800">ثلاثيات فيثاغورس الشهيرة</div>
                      <div className="text-slate-500">(3، 4، 5) و (5، 12، 13)</div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-amber-100 text-amber-950 px-2 py-0.5 rounded text-center font-black text-[8px] border border-amber-300">
                    نشاطات تمهيدية • الطاقة وتحولاتها
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[6.5px]">
                    <div className="bg-orange-50 border border-orange-200 p-1 rounded text-center">
                      <div className="font-black text-orange-800">💡 ما أعرفه</div>
                      <div className="text-slate-600 mt-0.5">الطاقة في كل مكان ولها أشكال متعددة</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 p-1 rounded text-center">
                      <div className="font-black text-blue-800">❓ ما أود معرفته</div>
                      <div className="text-slate-600 mt-0.5">كيف تتحول الطاقة من شكل لآخر؟</div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 p-1 rounded text-center">
                      <div className="font-black text-emerald-800">🌱 ما تعلمته</div>
                      <div className="text-slate-600 mt-0.5">القدرة على بذل شغل وإحداث تغيير</div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Document Footer Line */}
            <div className="text-[6.5px] text-emerald-800 font-bold border-t border-slate-200 pt-0.5 text-center shrink-0">
              مطوية وورقة عمل دراسية معتمدة • {config.platformTitle || 'منصة البشير التعليمية'} • {config.schoolName || 'مدرسة عبد الملك بن مروان'}
            </div>

            {/* Download Button with tactile click animation */}
            <div
              className={`py-1 rounded-lg text-[7px] font-black text-white text-center transition mt-1 shrink-0 ${
                cursorPos.isClicking && activeScene === 4
                  ? 'bg-emerald-800 scale-95 shadow-inner ring-2 ring-emerald-400'
                  : 'bg-emerald-600 shadow-xs'
              }`}
            >
              📥 تنزيل ورقة العمل والمطوية المعتمدة
            </div>
          </div>
        )}

        {activeScene === 5 && (
          /* SCENE 5: Educational Game Checkpoint (دورية أمن الطرق) */
          <div
            className="w-full min-h-[130%] bg-slate-900 p-2 flex flex-col justify-between text-white text-right transition-transform duration-700 ease-out select-none"
            style={{ transform: `translateY(${scrollOffsetY}px)` }}
          >
            <div className="bg-slate-800 p-1.5 rounded-lg flex items-center justify-between text-[8px] shrink-0">
              <span className="text-amber-400 font-black">🚔 لعبة دورية أمن الطرق التعليمية</span>
              <span className="text-slate-300 text-[7px]">محطة الفحص المدرسي</span>
            </div>
            <div className="bg-slate-950 border border-amber-500/40 rounded-xl p-2.5 text-center my-2 space-y-1 shrink-0">
              <div className="text-[9px] font-black text-amber-300">نقطة تفتيش دورية أمن الطرق</div>
              <div className="text-[7.5px] text-slate-400">فحص رخصة القيادة والأسئلة التعليمية لثاني متوسط</div>
              <div className="inline-block px-2 py-0.5 bg-emerald-900/80 text-emerald-300 text-[7px] rounded-full border border-emerald-600">
                الطالب يجيب على الأسئلة في المحطة
              </div>
            </div>
            <div className="text-center text-[7px] text-slate-400 shrink-0">
              قسم الألعاب التعليمية الهادفة • {config.schoolName || 'مدرسة عبد الملك بن مروان'}
            </div>
          </div>
        )}


        {/* Animated Interactive Student Pointer / Cursor */}
        <div
          className="absolute pointer-events-none z-30 transition-all duration-700 ease-out flex items-center gap-1"
          style={{
            left: `${cursorPos.x}%`,
            top: `${cursorPos.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Cursor Icon */}
          <div className="relative">
            <MousePointer className="w-4 h-4 text-amber-400 drop-shadow-md fill-amber-400 rotate-[-45deg]" />
            {cursorPos.isClicking && (
              <span className="absolute -inset-2 rounded-full border-2 border-amber-300 animate-ping opacity-75"></span>
            )}
          </div>
          {/* Student Name Bubble */}
          <div className="bg-black/85 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-lg border border-amber-400/60 whitespace-nowrap">
            🎯 {cam.studentName}
          </div>
        </div>

        {/* Bottom Scene Shortcuts / Manual Jump Controls */}
        <div className="h-6 bg-slate-950/95 border-t border-slate-800 px-1.5 flex items-center justify-between text-[7px] font-bold text-slate-400 z-20">
          <div className="flex items-center gap-1">
            {manualScene !== null ? (
              <button
                type="button"
                onClick={() => setManualScene(null)}
                className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-black flex items-center gap-1 animate-pulse cursor-pointer shadow-xs"
                title="العودة لمتابعة شاشة الطالب الفعلية في الوقت الحقيقي"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                <span>العودة للبث الحي لشاشة الطالب</span>
              </button>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>مباشر من شاشة الطالب الحالية</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            {['1: الرئيسية', '2: البوابة', '3: الدخول', '4: المواد', '5: الورقة', '6: الألعاب'].map((label, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setManualScene(idx)}
                className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                  activeScene === idx
                    ? 'bg-emerald-600 text-white font-black'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setManualScene(null)}
            className="text-slate-400 hover:text-white transition cursor-pointer p-0.5"
            title="إعادة ضبط للبث المباشر لشاشة الطالب"
          >
            <RotateCcw className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface CCTVMonitorRoomProps {
  students: Student[];
  onlineStudentIds?: string[];
  onlineSessions: StudentLiveSession[];
  suspensions?: StudentSuspension[];
  config: SchoolConfig;
  onRefresh?: () => void;
}

export const CCTVMonitorRoom: React.FC<CCTVMonitorRoomProps> = ({
  students,
  onlineStudentIds = [],
  onlineSessions,
  suspensions = [],
  config,
  onRefresh,
}) => {
  const [selectedCam, setSelectedCam] = useState<string | null>(null);
  const [nightVision, setNightVision] = useState(false);
  const [scanlines, setScanlines] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [recordingSeconds, setRecordingSeconds] = useState(1420);

  // Kick / Suspension Modal State
  const [suspensionModalStudent, setSuspensionModalStudent] = useState<{ id: string; name: string } | null>(null);
  const [kickDuration, setKickDuration] = useState<number>(5); // 5, 15, 30, 60, or 0 (permanent)
  const [kickReason, setKickReason] = useState<string>('مراجعة إدارية ونظام المنصة');
  const [isSubmittingKick, setIsSubmittingKick] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Activity logs from server
  const [logs, setLogs] = useState<StudentActivityLog[]>([]);

  const fetchLogs = async () => {
    const list = await storageService.getStudentActivityLogs();
    setLogs(list);
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('ar-SA', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: 'Asia/Riyadh',
        })
      );
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const showNotification = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const formatRecTime = (sec: number) => {
    const h = Math.floor(sec / 3600).toString().padStart(2, '0');
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Kick student action handler
  const handleKickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspensionModalStudent) return;
    setIsSubmittingKick(true);

    const success = await storageService.kickStudent(
      suspensionModalStudent.id,
      suspensionModalStudent.name,
      kickDuration,
      kickReason
    );

    setIsSubmittingKick(false);
    if (success) {
      showNotification(
        kickDuration > 0
          ? `تم إخراج الطالب (${suspensionModalStudent.name}) من المنصة لمدة ${kickDuration} دقيقة بنجاح!`
          : `تم إيقاف حساب الطالب (${suspensionModalStudent.name}) حتى تفتح له الموقع يدوياً!`
      );
      setSuspensionModalStudent(null);
      fetchLogs();
      if (onRefresh) onRefresh();
    } else {
      showNotification('حدث خطأ أثناء تنفيذ الإخراج');
    }
  };

  // Unkick / restore student handler
  const handleUnkick = async (studentId: string, studentName: string) => {
    const success = await storageService.unkickStudent(studentId);
    if (success) {
      showNotification(`تم فك الحظر وإعادة فتح الموقع للطالب (${studentName}) فوراً!`);
      fetchLogs();
      if (onRefresh) onRefresh();
    }
  };

  // Download chronological activity report for a single student or all students
  const handleDownloadStudentLog = (studentId?: string, studentName?: string) => {
    const targetLogs = studentId ? logs.filter((l) => l.studentId === studentId) : logs;
    const now = new Date();
    const dateStr = now.toLocaleDateString('ar-SA', { timeZone: 'Asia/Riyadh', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'Asia/Riyadh' });

    let report = `================================================================================
تقرير رصد وتحركات الطلاب الحية - نظام كاميرات المراقبة المدرسية
مدرسة: ${config.schoolName}
العام الدراسي: ${config.yearHijri || '1448'} هـ / ${config.yearGregorian || '2026'} م
تاريخ وتوقيت التقرير: ${dateStr} م - ${timeStr}
المشرف: ${config.authorName || 'أ. صهيب القحطاني'}
================================================================================
${studentName ? `الطالب المستهدف: ${studentName} (رقم المعرّف: ${studentId})` : 'التقرير الشامل لكافة الطلاب المتصلين والزوار'}
إجمالي الحركات المسجلة: ${targetLogs.length} حركة وتفاعل
================================================================================

`;

    if (targetLogs.length === 0) {
      report += `• لا توجد حركات مسجلة للطالب في الجلسة الحالية حتى الآن.\n`;
    } else {
      targetLogs.forEach((l, idx) => {
        const num = (idx + 1).toString().padStart(2, '0');
        report += `[${num}] التوقيت: ${l.timeFormatted || timeStr}\n`;
        report += `    الطالب: ${l.studentName}\n`;
        report += `    النشاط والحركة: ${l.action}\n`;
        report += `    القسم المتصفح: ${l.section}\n`;
        if (l.subject) report += `    المادة الدراسية: ${l.subject}\n`;
        if (l.deviceType) report += `    نوع الجهاز: ${l.deviceType}\n`;
        report += `--------------------------------------------------------------------------------\n`;
      });
    }

    report += `\n================================================================================
نهاية التقرير الأمني المعتمد • تم استخراجه من لوحة تحكم كاميرات المراقبة المدرسية
================================================================================\n`;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const filename = studentName
      ? `تقرير_تحركات_الطالب_${studentName.replace(/[/\\?%*:|"<>]/g, '_')}_${Date.now()}.txt`
      : `تقرير_رصد_تحركات_الطلاب_الشامل_${Date.now()}.txt`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10000);

    showNotification(`تم تنزيل سجل تحركات الطالب بنجاح!`);
  };

  // Build combined camera list: registered students mapped to cameras + guest sessions
  const registeredCameras = students.map((st: Student, idx: number) => {
    const camCode = `CAM-0${idx + 1}`;
    // Match strictly by exact authenticated studentId from server's active sessions
    const activeSession = onlineSessions.find((s: StudentLiveSession) => s.studentId === st.id);
    const isLive = onlineStudentIds.includes(st.id) || Boolean(activeSession);

    // Check if student is suspended / kicked
    const activeSuspension = suspensions.find((sp: StudentSuspension) => sp.studentId === st.id);
    const isSuspended = Boolean(
      activeSuspension && (activeSuspension.expiresAt === 0 || Date.now() < activeSuspension.expiresAt)
    );

    const theme = activeSession?.snapshotTheme || 'home';
    const lastSeenTs = activeSession?.lastSeen || st.lastSeenTimestamp || Date.now();
    const dateInfo = formatArabicDayAndTime(lastSeenTs);

    return {
      camCode,
      studentId: st.id,
      studentName: st.fullName,
      grade: st.grade || config.defaultGrade || 'ثاني متوسط',
      isLive,
      isSuspended,
      suspension: activeSuspension,
      currentSection: activeSession?.currentSection || (isLive ? 'الصفحة الرئيسية' : 'خارج المنصة حالياً'),
      currentSubject: activeSession?.currentSubject || (isLive ? 'عام' : 'غير متصل'),
      currentAction: activeSession?.currentAction || (isLive ? 'يتصفح الصفحة الرئيسية' : 'غادر المنصة للتو'),
      deviceType: activeSession?.deviceType || 'هاتف ذكي (أندرويد)',
      lastSeen: new Date(lastSeenTs).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'Asia/Riyadh' }),
      lastSeenDayTime: dateInfo.full,
      lastSeenDay: dateInfo.dayOnly,
      lastSeenTime: dateInfo.timeOnly,
      pingMs: isLive ? 22 : 0,
      avatarColor:
        idx % 3 === 0
          ? 'from-emerald-600 to-teal-800'
          : idx % 3 === 1
          ? 'from-blue-600 to-indigo-800'
          : 'from-amber-600 to-orange-800',
      snapshotTheme: theme,
    };
  });

  // Guest sessions mapped to cameras (excluding registered students)
  const guestSessions = onlineSessions.filter(
    (s: StudentLiveSession) => !students.some((st: Student) => st.id === s.studentId)
  );

  const guestCameras = guestSessions.map((gs: StudentLiveSession, idx: number) => {
    const camCode = `CAM-G${idx + 1}`;
    const isLive = true; // Server /api/sync already filters onlineSessions by activeThreshold
    const activeSuspension = suspensions.find((sp: StudentSuspension) => sp.studentId === gs.studentId);
    const isSuspended = Boolean(
      activeSuspension && (activeSuspension.expiresAt === 0 || Date.now() < activeSuspension.expiresAt)
    );
    const dateInfo = formatArabicDayAndTime(gs.lastSeen);

    return {
      camCode,
      studentId: gs.studentId,
      studentName: gs.studentName || 'زائر / طالب جديد',
      grade: gs.grade || config.defaultGrade || 'ثاني متوسط',
      isLive,
      isSuspended,
      suspension: activeSuspension,
      currentSection: gs.currentSection || (isLive ? 'الصفحة الرئيسية' : 'خارج المنصة حالياً'),
      currentSubject: gs.currentSubject || 'عام',
      currentAction: gs.currentAction || (isLive ? 'يتصفح الصفحة الرئيسية' : 'غادر المنصة للتو'),
      deviceType: gs.deviceType || 'متصفح الجوال',
      lastSeen: new Date(gs.lastSeen).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZone: 'Asia/Riyadh' }),
      lastSeenDayTime: dateInfo.full,
      lastSeenDay: dateInfo.dayOnly,
      lastSeenTime: dateInfo.timeOnly,
      pingMs: 30,
      avatarColor: 'from-purple-600 to-slate-800',
      snapshotTheme: gs.snapshotTheme || 'home',
    };
  });

  const allCameras = [...registeredCameras, ...guestCameras];
  const liveCount = allCameras.filter((c) => c.isLive).length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Toast Notification Banner */}
      {actionMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-black px-6 py-3 rounded-2xl shadow-2xl border-2 border-white flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* CCTV Control Room Command Header */}
      <div className="bg-slate-950 text-white rounded-2xl p-4 sm:p-6 shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-red-600 via-emerald-500 to-blue-600"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-500 relative shrink-0">
              <Camera className="w-6 h-6 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-black text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800/80 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  REC [{formatRecTime(recordingSeconds)}]
                </span>
                <span className="text-xs text-slate-400 font-mono">CCTV LIVE SNAPSHOT V5.2</span>
                <span className="text-xs font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/80 flex items-center gap-1">
                  <span>📷 تصوير حي للشاشات</span>
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1 flex items-center gap-2">
                <span>غرفة مراقبة وتحركات الطلاب (كاميرات الصور الحية)</span>
                <span className="text-xs font-normal text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                  بث لحظي 24/7
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                مشاهدة صورة شاشة البرنامج لكل طالب أثناء دخوله وخروجه، وتنزيل سجل تحركاته في أي وقت، وإمكانية إخراجه من الصفحة بأمر المدير
              </p>
            </div>
          </div>

          {/* Quick HUD Metrics & Master Controls */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Live Count */}
            <div className="bg-slate-900 border border-slate-700/80 px-3.5 py-2 rounded-xl flex items-center gap-2.5 text-xs">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <div>
                <div className="text-[10px] text-slate-400">الطلاب داخل المنصة</div>
                <div className="font-mono font-bold text-emerald-400">{liveCount} متصل حي</div>
              </div>
            </div>

            {/* Live Date HUD badge */}
            <div className="bg-slate-900 border border-slate-700/80 px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400">التاريخ اليوم 📅</div>
                <div className="font-mono font-bold text-amber-300">
                  {new Date().toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Riyadh' })}
                </div>
              </div>
            </div>

            {/* Time */}
            <div className="bg-slate-900 border border-slate-700/80 px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs">
              <Clock className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400">الساعة وتوقيت البث 🕒</div>
                <div className="font-mono font-bold text-emerald-300">{currentTime || '14:45:00'}</div>
              </div>
            </div>

            {/* Master Download All Logs Button */}
            <button
              onClick={() => handleDownloadStudentLog()}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white shadow-md cursor-pointer active:scale-95 border border-emerald-500"
              title="تنزيل ملف تقرير كامل لتحركات كافة الطلاب"
            >
              <Download className="w-4 h-4" />
              <span>تنزيل تحركات كافة الطلاب</span>
            </button>

            {/* Night vision & scanline toggles */}
            <button
              onClick={() => setNightVision(!nightVision)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                nightVision
                  ? 'bg-emerald-900/80 border-emerald-500 text-emerald-200'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
              }`}
              title="تفعيل نمط الرؤية الليلية بالأشعة تحت الحمراء"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{nightVision ? 'رؤية ليلية: نشطة' : 'نمط عادي'}</span>
            </button>

            <button
              onClick={() => setScanlines(!scanlines)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                scanlines
                  ? 'bg-blue-950/80 border-blue-500 text-blue-200'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
              }`}
              title="تأثير خطوط شاشات المراقبة التلفزيونية CRT"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>خطوط الشاشة: {scanlines ? 'مفعلة' : 'معطلة'}</span>
            </button>

            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition cursor-pointer"
                title="تحديث إشارات الكاميرات"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CCTV Cameras Grid with REAL SCREEN SNAPSHOT PHOTOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {allCameras.map((cam) => {
          const isSelected = selectedCam === cam.camCode;

          return (
            <div
              key={cam.camCode}
              className={`group relative rounded-2xl overflow-hidden border-2 transition-all shadow-xl flex flex-col ${
                isSelected
                  ? 'border-red-500 ring-4 ring-red-500/20 col-span-1 md:col-span-2 xl:col-span-3'
                  : cam.isSuspended
                  ? 'border-rose-600 bg-slate-950 ring-2 ring-rose-600/40'
                  : cam.isLive
                  ? 'border-emerald-600 hover:border-emerald-400 bg-slate-950'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950 opacity-95'
              } ${nightVision ? 'hue-rotate-90 contrast-125 saturate-150' : ''}`}
            >
              {/* CCTV Camera HUD Header Bar */}
              <div className="bg-slate-900/95 px-3.5 py-2.5 flex items-center justify-between text-xs border-b border-slate-800 select-none">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-black text-red-500 flex items-center gap-1 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                    {cam.camCode}
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="font-bold text-slate-100 truncate">{cam.studentName}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {cam.isSuspended ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-rose-300 bg-rose-950 border border-rose-700 px-2.5 py-0.5 rounded-full animate-pulse">
                      <Ban className="w-3 h-3 text-rose-400" />
                      موقوف بأمر المدير
                    </span>
                  ) : cam.isLive ? (
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>متاح (متصل الآن)</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-900 border border-slate-700 px-2.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                      <span>غير متاح (خارج المنصة)</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedCam(isSelected ? null : cam.camCode)}
                    className="p-1 rounded text-slate-400 hover:text-white transition cursor-pointer"
                    title={isSelected ? 'تصغير الكاميرا' : 'تكبير الشاشة الكاملة'}
                  >
                    {isSelected ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* REAL PHOTO CAMERA VIEWPORT (شاشة البرنامج الحقيقية وكأنها كاميرا صورة 📷) */}
              <div className="relative bg-slate-950 overflow-hidden flex flex-col justify-between select-none">
                {/* CRT Scanline Overlay */}
                {scanlines && (
                  <div
                    className="absolute inset-0 pointer-events-none opacity-15 z-20"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(0deg, #000, #000 2px, transparent 2px, transparent 4px)',
                    }}
                  ></div>
                )}

                {/* Viewfinder HUD Overlays */}
                <div className="absolute top-2 left-2 right-2 z-30 flex items-center justify-between text-[10px] font-mono text-slate-200 pointer-events-none">
                  <div className="bg-black/70 px-2 py-0.5 rounded border border-white/10 flex items-center gap-1.5 text-red-400 font-bold">
                    <Camera className="w-3 h-3 text-red-500" />
                    <span>PHOTO CAPTURE • {cam.camCode}</span>
                  </div>
                  <div className="bg-black/70 px-2 py-0.5 rounded border border-white/10 text-emerald-400 font-mono">
                    1/125s • F2.8 • ISO 200
                  </div>
                </div>

                {/* Viewfinder Target Brackets */}
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400 z-30 pointer-events-none"></div>
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400 z-30 pointer-events-none"></div>
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400 z-30 pointer-events-none"></div>
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400 z-30 pointer-events-none"></div>

                {/* REAL SCREEN VIDEO FEED (بث فيديو حي متحرك لشاشة الطالب وتنقلاته طبقاً لتسجيل الشاشة) */}
                <div className={`relative w-full ${isSelected ? 'h-80 sm:h-[420px]' : 'h-56 sm:h-64'} bg-slate-900 overflow-hidden flex items-center justify-center p-1.5`}>
                  <StudentScreenVideoPlayer
                    cam={cam}
                    config={config}
                    isSelected={isSelected}
                    scanlines={scanlines}
                    nightVision={nightVision}
                  />
                </div>

                {/* Telemetry info bar */}
                <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span className="font-semibold text-slate-400">الصفحة والمكان الفعلي:</span>
                    <span className="font-bold text-emerald-400 truncate max-w-[210px]">{cam.currentSection}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span className="font-semibold text-slate-400">النشاط المرصود:</span>
                    <span className="font-bold text-amber-300 truncate max-w-[210px]">{cam.currentAction}</span>
                  </div>

                  {/* Explicit Last Seen Day & Hour/Minute/Second */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span>التاريخ المعتمد 📅:</span>
                      </span>
                      <span className="font-bold text-amber-300 font-mono text-[11px]" dir="rtl">
                        {cam.lastSeenDay}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>الساعة وتوقيت الظهور 🕒:</span>
                      </span>
                      <span className="font-mono font-bold text-emerald-400 text-[11px]" dir="rtl">
                        {cam.lastSeenTime}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1 truncate">
                      <Smartphone className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{cam.deviceType}</span>
                    </span>
                    <span className="text-slate-300 font-bold">{cam.isLive ? '🟢 متاح الآن' : '⚪ غير متاح'}</span>
                  </div>

                  {/* Operational Action Buttons: Download Logs & Kick / Unkick */}
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                    {/* Download this student's movements */}
                    <button
                      type="button"
                      onClick={() => handleDownloadStudentLog(cam.studentId, cam.studentName)}
                      className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[11px] transition flex items-center justify-center gap-1 border border-slate-700 cursor-pointer active:scale-95"
                      title="تنزيل تقرير مفصل بجميع حركات وتحركات هذا الطالب"
                    >
                      <Download className="w-3 h-3 text-emerald-400" />
                      <span>تنزيل تحركاته</span>
                    </button>

                    {/* Kick / Unkick Button */}
                    {cam.isSuspended ? (
                      <button
                        type="button"
                        onClick={() => handleUnkick(cam.studentId, cam.studentName)}
                        className="flex-1 py-1.5 px-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold text-[11px] transition flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95"
                        title="إلغاء الإيقاف وإعادة فتح الموقع للطالب فوراً"
                      >
                        <Unlock className="w-3 h-3" />
                        <span>فك الحظر (فتح)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setSuspensionModalStudent({
                            id: cam.studentId,
                            name: cam.studentName,
                          })
                        }
                        className="flex-1 py-1.5 px-2 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-lg font-bold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                        title="إخراج الطالب من الصفحة وتعليق دخوله للمدة التي تختارها"
                      >
                        <Ban className="w-3 h-3 text-rose-400" />
                        <span>إخراج الطالب</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Operations Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 text-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">سجل العمليات وتحركات الطلاب المباشرة</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadStudentLog()}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تنزيل التقرير كاملاً (TXT)</span>
            </button>
            <span className="text-xs text-slate-400 font-mono">LIVE FEED STREAM</span>
          </div>
        </div>

        <div className="mt-3 space-y-2 text-xs max-h-72 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="p-4 text-center text-slate-500">لا توجد عمليات مسجلة حتى الآن</div>
          ) : (
            logs.slice(0, 15).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800/80"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-emerald-400 font-bold">
                    {new Date(log.timestamp || Date.now()).toLocaleTimeString('ar-SA', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: true,
                      timeZone: 'Asia/Riyadh',
                    })}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      log.type === 'kicked'
                        ? 'bg-rose-500 animate-ping'
                        : log.type === 'download_file'
                        ? 'bg-blue-400'
                        : 'bg-emerald-400'
                    }`}
                  ></span>
                  <span className="font-semibold text-slate-300">
                    <strong className="text-white">{log.studentName}:</strong> {log.action}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">{log.section}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* KICK / SUSPENSION MODAL (إخراج الطالب وتحديد المدة) */}
      {suspensionModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in" dir="rtl">
          <div className="bg-slate-900 border-2 border-rose-600 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-600 flex items-center justify-center text-rose-400">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">إخراج الطالب من المنصة</h3>
                  <p className="text-xs text-rose-300">الطالب المستهدف: {suspensionModalStudent.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSuspensionModalStudent(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleKickSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-2">
                  حدد مدة إخراج الطالب من الصفحة:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '5 دقائق', value: 5 },
                    { label: '15 دقيقة', value: 15 },
                    { label: '30 دقيقة', value: 30 },
                    { label: 'ساعة كاملة (60 دقيقة)', value: 60 },
                    { label: 'مفتوح (حتى أفتح له يدوياً)', value: 0 },
                  ].map((dur) => (
                    <button
                      key={dur.value}
                      type="button"
                      onClick={() => setKickDuration(dur.value)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                        kickDuration === dur.value
                          ? 'bg-rose-700 text-white border-rose-500 shadow-md ring-2 ring-rose-500/30'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  سبب الإخراج (يظهر للطالب في شاشته):
                </label>
                <input
                  type="text"
                  value={kickReason}
                  onChange={(e) => setKickReason(e.target.value)}
                  placeholder="مثال: مراجعة إدارية بأمر من مدير المدرسة"
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium focus:border-rose-500 outline-none"
                  required
                />
              </div>

              <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-200 text-[11px] leading-relaxed">
                💡 فور التأكيد، سيتم قفل صفحة الطالب فوراً وإظهار إشعار الإيقاف مع عداد الوقت، ولن يتمكن من التصفح حتى تنتهي المدة أو تقوم أنت بفك الحظر وإعادة فتح الموقع له.
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingKick}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Ban className="w-4 h-4" />
                  <span>{isSubmittingKick ? 'جارٍ الإخراج...' : 'تأكيد إخراج الطالب الآن'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSuspensionModalStudent(null)}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
