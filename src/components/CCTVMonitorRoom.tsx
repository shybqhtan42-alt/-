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

interface CCTVMonitorRoomProps {
  students: Student[];
  onlineSessions: StudentLiveSession[];
  suspensions?: StudentSuspension[];
  config: SchoolConfig;
  onRefresh?: () => void;
}

export const CCTVMonitorRoom: React.FC<CCTVMonitorRoomProps> = ({
  students,
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
    const dateStr = now.toLocaleDateString('ar-SA');
    const timeStr = now.toLocaleTimeString('ar-SA');

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
  const registeredCameras = students.map((st, idx) => {
    const camCode = `CAM-0${idx + 1}`;
    // Check if this student has an active session in the last 25 seconds
    const activeSession = onlineSessions.find(
      (s) => s.studentId === st.id || s.studentName.toLowerCase() === st.fullName.toLowerCase()
    );
    const isLive = Boolean(activeSession && Date.now() - activeSession.lastSeen < 25000);

    // Check if student is suspended / kicked
    const activeSuspension = suspensions.find(
      (sp) => sp.studentId === st.id || sp.studentName.toLowerCase() === st.fullName.toLowerCase()
    );
    const isSuspended = Boolean(
      activeSuspension && (activeSuspension.expiresAt === 0 || Date.now() < activeSuspension.expiresAt)
    );

    const theme = activeSession?.snapshotTheme || (isLive ? 'portal' : 'home');

    return {
      camCode,
      studentId: st.id,
      studentName: st.fullName,
      grade: st.grade || config.defaultGrade || 'ثاني متوسط',
      isLive,
      isSuspended,
      suspension: activeSuspension,
      currentSection: activeSession?.currentSection || (isLive ? 'بوابة ملخصات ثاني متوسط' : 'خارج المنصة حالياً'),
      currentSubject: activeSession?.currentSubject || (isLive ? 'العلوم' : 'غير متصل'),
      currentAction: activeSession?.currentAction || (isLive ? 'يتصفح الملخصات المعتمدة' : 'غادر المنصة للتو'),
      deviceType: activeSession?.deviceType || 'هاتف ذكي (أندرويد)',
      lastSeen: activeSession ? new Date(activeSession.lastSeen).toLocaleTimeString('ar-SA') : 'منذ قليل',
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

  // Guest sessions mapped to cameras
  const guestSessions = onlineSessions.filter(
    (s) => !students.some((st) => st.id === s.studentId || st.fullName.toLowerCase() === s.studentName.toLowerCase())
  );

  const guestCameras = guestSessions.map((gs, idx) => {
    const camCode = `CAM-G${idx + 1}`;
    const isLive = Date.now() - gs.lastSeen < 25000;
    const activeSuspension = suspensions.find((sp) => sp.studentId === gs.studentId);
    const isSuspended = Boolean(
      activeSuspension && (activeSuspension.expiresAt === 0 || Date.now() < activeSuspension.expiresAt)
    );

    return {
      camCode,
      studentId: gs.studentId,
      studentName: gs.studentName || 'زائر / طالب جديد',
      grade: gs.grade || config.defaultGrade || 'ثاني متوسط',
      isLive,
      isSuspended,
      suspension: activeSuspension,
      currentSection: gs.currentSection || 'تصفح المنصة',
      currentSubject: gs.currentSubject || 'عام',
      currentAction: gs.currentAction || 'اطلاع على الملخصات',
      deviceType: gs.deviceType || 'متصفح الجوال',
      lastSeen: new Date(gs.lastSeen).toLocaleTimeString('ar-SA'),
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

            {/* Time */}
            <div className="bg-slate-900 border border-slate-700/80 px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs">
              <Clock className="w-4 h-4 text-blue-400" />
              <div>
                <div className="text-[10px] text-slate-400">توقيت البث المباشر</div>
                <div className="font-mono font-bold text-slate-200">{currentTime || '14:45:00'}</div>
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
                    <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      داخل المنصة (LIVE)
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                      غادر المنصة
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

                {/* REAL SCREEN PHOTO MOCKUP (الصورة الحية لشاشة البرنامج التي يشاهدها الطالب الآن) */}
                <div className={`relative w-full ${isSelected ? 'h-72 sm:h-96' : 'h-52 sm:h-60'} bg-slate-900 overflow-hidden flex items-center justify-center p-2`}>
                  {cam.isSuspended ? (
                    /* Suspended Screen State */
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
                          ? `الإيقاف ينتهي: ${new Date(cam.suspension.expiresAt).toLocaleTimeString('ar-SA')}`
                          : 'موقوف حتى يفتح له المدير يدوياً'}
                      </div>
                    </div>
                  ) : cam.isLive ? (
                    /* Live Screen Photo of Application */
                    <div className="w-full h-full rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex flex-col shadow-inner relative">
                      {/* Mini App Top Header Bar */}
                      <div className="h-6 bg-emerald-900 px-2 flex items-center justify-between text-[9px] text-emerald-100 font-bold border-b border-emerald-800">
                        <div className="flex items-center gap-1 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                          <span>{config.schoolName}</span>
                        </div>
                        <div className="font-mono text-emerald-300">{cam.grade}</div>
                      </div>

                      {/* Mini App View Content (Dynamic based on student current section) */}
                      <div className="flex-1 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-2.5 flex flex-col justify-between overflow-hidden">
                        {cam.snapshotTheme === 'game' || cam.currentSection.includes('الألعاب') ? (
                          /* Police Patrol Game View Snapshot */
                          <div className="w-full h-full rounded-lg bg-indigo-950/90 border border-indigo-500/40 p-2 flex flex-col justify-between relative overflow-hidden">
                            <div className="flex items-center justify-between text-[10px] text-indigo-200">
                              <span className="font-bold flex items-center gap-1">
                                <Gamepad2 className="w-3 h-3 text-amber-400" />
                                لعبة الملازم أنس
                              </span>
                              <span className="bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded text-[8px]">
                                دورية أمن الطرق
                              </span>
                            </div>
                            <div className="my-auto flex flex-col items-center">
                              <div className="w-16 h-8 bg-indigo-800 rounded-lg border border-indigo-400 flex items-center justify-center text-[10px] font-black text-amber-300 shadow-md">
                                🚔 دورية 996
                              </div>
                              <span className="text-[9px] text-slate-300 mt-1">نقطة تفتيش المركبات</span>
                            </div>
                            <div className="h-1.5 w-full bg-amber-400/40 rounded-full"></div>
                          </div>
                        ) : cam.currentAction.includes('ورقة') || cam.currentAction.includes('تنزيل') || cam.currentAction.includes('ملخص') ? (
                          /* Worksheet & Summary Viewer Snapshot */
                          <div className="w-full h-full rounded-lg bg-white text-slate-900 p-2 flex flex-col justify-between border border-slate-300 shadow-sm">
                            <div className="border-b border-emerald-600 pb-1 flex items-center justify-between">
                              <span className="text-[9px] font-black text-emerald-800">ورقة عمل معتمدة</span>
                              <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded">
                                {cam.currentSubject}
                              </span>
                            </div>
                            <div className="space-y-1 my-auto">
                              <div className="h-2 bg-slate-200 rounded w-3/4"></div>
                              <div className="h-2 bg-slate-100 rounded w-full"></div>
                              <div className="h-2 bg-slate-200 rounded w-5/6"></div>
                            </div>
                            <div className="flex items-center justify-between text-[8px] text-slate-500 pt-1 border-t border-slate-100">
                              <span>توثيق اسم الطالب ✓</span>
                              <span className="text-emerald-700 font-bold">جاهز للطباعة</span>
                            </div>
                          </div>
                        ) : (
                          /* Standard Portal Subjects Grid Snapshot */
                          <div className="w-full h-full flex flex-col justify-between">
                            <div className="text-[9px] font-bold text-slate-300 truncate">
                              الصفحة: <span className="text-emerald-400">{cam.currentSection}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 my-auto">
                              {['العلوم', 'الرياضيات', 'لغتي'].map((subj, i) => (
                                <div
                                  key={i}
                                  className={`p-1.5 rounded-lg border text-center text-[9px] font-bold ${
                                    cam.currentSubject === subj
                                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-1 ring-emerald-300'
                                      : 'bg-slate-800 text-slate-300 border-slate-700'
                                  }`}
                                >
                                  {subj}
                                </div>
                              ))}
                            </div>
                            <div className="text-[9px] text-slate-400 flex items-center justify-between">
                              <span>المادة: {cam.currentSubject}</span>
                              <span className="text-emerald-300 font-bold font-mono">200 OK</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Offline / Exited Standby Screen Snapshot */
                    <div className="w-full h-full rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-3 text-center space-y-1 relative">
                      <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center border border-slate-700">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-bold text-slate-400">الطالب خارج المنصة حالياً</div>
                      <p className="text-[10px] text-slate-500">آخر تسجيل وتواجد: {cam.lastSeen}</p>
                      <div className="text-[9px] font-mono text-slate-600 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        STANDBY • CAMERA IDLE
                      </div>
                    </div>
                  )}

                  {/* Student Photo Stamp Inset in Corner of Camera */}
                  <div className="absolute bottom-3 right-3 z-30 bg-black/80 backdrop-blur-xs p-1.5 rounded-xl border border-white/20 flex items-center gap-2 shadow-lg">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cam.avatarColor} text-white flex items-center justify-center text-xs font-black shadow-inner`}>
                      {cam.studentName.slice(0, 1)}
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-white leading-tight truncate max-w-[100px]">
                        {cam.studentName}
                      </div>
                      <div className="text-[8px] text-emerald-400 font-mono flex items-center gap-1">
                        <span className={`w-1 h-1 rounded-full ${cam.isLive ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`}></span>
                        <span>{cam.isLive ? 'نشط الآن' : 'غير متصل'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Telemetry info bar */}
                <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span className="font-semibold text-slate-400">النشاط الحالي:</span>
                    <span className="font-bold text-emerald-400 truncate max-w-[200px]">{cam.currentAction}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1 truncate">
                      <Smartphone className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{cam.deviceType}</span>
                    </span>
                    <span className="text-slate-400">تحديث: {cam.lastSeen}</span>
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
                  <span className="font-mono text-emerald-400 font-bold">{log.timeFormatted}</span>
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
