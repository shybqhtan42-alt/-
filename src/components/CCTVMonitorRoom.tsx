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
  FileCheck
} from 'lucide-react';
import { Student, StudentLiveSession, SchoolConfig } from '../types';

interface CCTVMonitorRoomProps {
  students: Student[];
  onlineSessions: StudentLiveSession[];
  config: SchoolConfig;
  onRefresh?: () => void;
}

export const CCTVMonitorRoom: React.FC<CCTVMonitorRoomProps> = ({
  students,
  onlineSessions,
  config,
  onRefresh,
}) => {
  const [selectedCam, setSelectedCam] = useState<string | null>(null);
  const [nightVision, setNightVision] = useState(false);
  const [scanlines, setScanlines] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [recordingSeconds, setRecordingSeconds] = useState(1420);

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

  const formatRecTime = (sec: number) => {
    const h = Math.floor(sec / 3600).toString().padStart(2, '0');
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Build combined camera list: registered students mapped to cameras + guest sessions
  const registeredCameras = students.map((st, idx) => {
    const camCode = `CAM-0${idx + 1}`;
    // Check if this student has an active session in the last 25 seconds
    const activeSession = onlineSessions.find(
      (s) => s.studentId === st.id || s.studentName.toLowerCase() === st.fullName.toLowerCase()
    );
    const isLive = Boolean(activeSession && (Date.now() - activeSession.lastSeen < 25000));

    return {
      camCode,
      studentId: st.id,
      studentName: st.fullName,
      grade: st.grade || config.defaultGrade || 'ثاني متوسط',
      isLive,
      currentSection: activeSession?.currentSection || (isLive ? 'بوابة ملخصات ثاني متوسط' : 'خارج المنصة حالياً'),
      currentSubject: activeSession?.currentSubject || (isLive ? 'العلوم' : 'غير متصل'),
      currentAction: activeSession?.currentAction || (isLive ? 'يتصفح الملخصات المعتمدة' : 'آخر تسجيل: قبل قليل'),
      deviceType: activeSession?.deviceType || 'هاتف ذكي (أندرويد)',
      lastSeen: activeSession ? new Date(activeSession.lastSeen).toLocaleTimeString('ar-SA') : 'منذ قليل',
      pingMs: isLive ? 24 : 0,
      avatarColor: idx % 3 === 0 ? 'from-emerald-600 to-teal-800' : idx % 3 === 1 ? 'from-blue-600 to-indigo-800' : 'from-amber-600 to-orange-800',
    };
  });

  // If there are guest online sessions not tied to registered students, show them as CAM-GUEST
  const guestSessions = onlineSessions.filter(
    (s) => !students.some((st) => st.id === s.studentId || st.fullName.toLowerCase() === s.studentName.toLowerCase())
  );

  const guestCameras = guestSessions.map((gs, idx) => {
    const camCode = `CAM-G${idx + 1}`;
    const isLive = Date.now() - gs.lastSeen < 25000;
    return {
      camCode,
      studentId: gs.studentId,
      studentName: gs.studentName || 'زائر / طالب جديد',
      grade: gs.grade || config.defaultGrade || 'ثاني متوسط',
      isLive,
      currentSection: gs.currentSection || 'تصفح المنصة',
      currentSubject: gs.currentSubject || 'عام',
      currentAction: gs.currentAction || 'اطلاع على الملخصات',
      deviceType: gs.deviceType || 'متصفح الجوال',
      lastSeen: new Date(gs.lastSeen).toLocaleTimeString('ar-SA'),
      pingMs: 32,
      avatarColor: 'from-purple-600 to-slate-800',
    };
  });

  const allCameras = [...registeredCameras, ...guestCameras];
  const liveCount = allCameras.filter((c) => c.isLive).length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* CCTV Control Room Command Header */}
      <div className="bg-slate-950 text-white rounded-2xl p-4 sm:p-6 shadow-2xl border border-slate-800 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-red-600 via-emerald-500 to-blue-600"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-500 relative">
              <Video className="w-6 h-6 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/80 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  REC [{formatRecTime(recordingSeconds)}]
                </span>
                <span className="text-xs text-slate-400 font-mono">CCTV SYSTEM V4.8</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5 flex items-center gap-2">
                <span>غرفة كاميرات المراقبة المدرسية الحية</span>
                <span className="text-xs font-normal text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                  بث مباشر 24/7
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                نظام مراقبة دخول الطلاب وتصفحهم للملخصات وأوراق العمل في الوقت الفعلي
              </p>
            </div>
          </div>

          {/* Quick HUD Metrics & Controls */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Live Count Pill */}
            <div className="bg-slate-900 border border-slate-700/80 px-3.5 py-2 rounded-xl flex items-center gap-2.5 text-xs">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <div>
                <div className="text-[10px] text-slate-400">الطلاب المتصلين الآن</div>
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

            {/* Filter Buttons */}
            <button
              onClick={() => setNightVision(!nightVision)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
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
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
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
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition"
                title="تحديث إشارات الكاميرات"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CCTV Cameras Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {allCameras.map((cam) => {
          const isSelected = selectedCam === cam.camCode;

          return (
            <div
              key={cam.camCode}
              onClick={() => setSelectedCam(isSelected ? null : cam.camCode)}
              className={`group relative rounded-2xl overflow-hidden border-2 transition-all cursor-pointer shadow-lg flex flex-col ${
                isSelected
                  ? 'border-red-500 ring-4 ring-red-500/20 col-span-1 md:col-span-2 xl:col-span-3'
                  : cam.isLive
                  ? 'border-emerald-600/80 hover:border-emerald-400 bg-slate-950'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950 opacity-90'
              } ${nightVision ? 'hue-rotate-90 contrast-125 saturate-150' : ''}`}
            >
              {/* CCTV Camera HUD Header Bar */}
              <div className="bg-slate-900/95 px-3 py-2 flex items-center justify-between text-xs border-b border-slate-800 select-none">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-red-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                    {cam.camCode}
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="font-bold text-slate-200 truncate max-w-[150px]">{cam.studentName}</span>
                </div>

                <div className="flex items-center gap-2">
                  {cam.isLive ? (
                    <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      LIVE 30fps
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                      STANDBY
                    </span>
                  )}
                  <span className="text-slate-400 text-[10px] font-mono hidden sm:inline">{cam.lastSeen}</span>
                  <button
                    type="button"
                    className="p-1 rounded text-slate-400 hover:text-white transition"
                    title={isSelected ? 'تصغير الكاميرا' : 'تكبير الشاشة الكاملة'}
                  >
                    {isSelected ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Camera Live Screen Area */}
              <div className={`relative bg-slate-950 p-4 flex flex-col justify-between overflow-hidden ${
                isSelected ? 'min-h-[380px]' : 'min-h-[220px]'
              }`}>
                {/* CRT Scanline Overlay */}
                {scanlines && (
                  <div
                    className="absolute inset-0 pointer-events-none opacity-20 z-10"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(0deg, #000, #000 2px, transparent 2px, transparent 4px)',
                    }}
                  ></div>
                )}

                {/* Night Vision Green Tint */}
                {nightVision && (
                  <div className="absolute inset-0 pointer-events-none bg-emerald-500/15 z-10 mix-blend-color-dodge"></div>
                )}

                {/* CCTV Targeting Reticle & Metadata Overlay */}
                <div className="relative z-20 flex items-start justify-between text-[11px] font-mono text-slate-300">
                  <div className="space-y-0.5 bg-black/60 backdrop-blur-xs p-1.5 rounded border border-white/10">
                    <div className="text-red-400 font-bold flex items-center gap-1">
                      <span>●</span>
                      <span>CAMERA 0{cam.camCode.slice(-1)}</span>
                    </div>
                    <div className="text-[10px] text-slate-300">RES: 1080P • ISO 400</div>
                    <div className="text-[10px] text-emerald-400 font-bold">SIGNAL: {cam.isLive ? '100% STABLE' : 'IDLE'}</div>
                  </div>

                  <div className="text-left space-y-0.5 bg-black/60 backdrop-blur-xs p-1.5 rounded border border-white/10" dir="ltr">
                    <div className="text-[10px] text-slate-400">LAT: {cam.pingMs}ms</div>
                    <div className="text-[10px] text-slate-400">FPS: {cam.isLive ? '30.0' : '0.0'}</div>
                  </div>
                </div>

                {/* Realistic Animated Student Desk Simulation Viewport */}
                <div className="relative z-0 my-auto py-3 flex flex-col items-center justify-center text-center">
                  {/* Digital Wireframe Avatar / Screen */}
                  <div className="relative">
                    <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br ${cam.avatarColor} p-1 shadow-2xl flex items-center justify-center border-2 ${
                      cam.isLive ? 'border-emerald-400 shadow-emerald-500/20' : 'border-slate-700'
                    }`}>
                      <div className="w-full h-full rounded-xl bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white relative">
                        {cam.isLive ? (
                          <div className="relative flex flex-col items-center">
                            <Activity className="w-8 h-8 text-emerald-400 animate-pulse" />
                            <span className="text-[9px] font-mono text-emerald-300 mt-1 font-bold">نشط بالمنصة</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-slate-500">
                            <User className="w-8 h-8" />
                            <span className="text-[9px] font-mono mt-1">في الانتظار</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Camera Targeting Crosshairs */}
                    <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400 pointer-events-none"></div>
                    <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400 pointer-events-none"></div>
                    <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400 pointer-events-none"></div>
                    <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400 pointer-events-none"></div>
                  </div>

                  {/* Student Title and Live Status */}
                  <div className="mt-3">
                    <div className="text-sm font-extrabold text-white flex items-center justify-center gap-1.5">
                      <span>{cam.studentName}</span>
                      <span className="text-[10px] text-emerald-300 font-normal bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                        {cam.grade}
                      </span>
                    </div>

                    {/* Activity Indicator Pill */}
                    <div className="inline-flex items-center gap-1.5 text-xs text-slate-300 mt-1 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-full shadow-sm">
                      <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                      <span className="font-semibold text-emerald-300">{cam.currentSubject}:</span>
                      <span>{cam.currentAction}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Telemetry Bar */}
                <div className="relative z-20 pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <div className="flex items-center gap-1.5 truncate">
                    <Smartphone className="w-3 h-3 text-slate-500" />
                    <span className="truncate">{cam.deviceType}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
                    <Wifi className={`w-3 h-3 ${cam.isLive ? 'text-emerald-400' : 'text-slate-600'}`} />
                    <span>{cam.isLive ? 'متصل ومراقب' : 'وضع السكون'}</span>
                  </div>
                </div>
              </div>

              {/* Expanded Inspection Drawer when selected */}
              {isSelected && (
                <div className="bg-slate-900 p-4 border-t border-slate-800 text-xs text-slate-200 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="font-bold text-emerald-400 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" />
                      <span>تقرير المراقبة المباشر للطالب: {cam.studentName}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">المدرسة: {config.schoolName}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <div className="text-slate-400">الصف الدراسي:</div>
                      <div className="font-bold text-white mt-0.5">{cam.grade}</div>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <div className="text-slate-400">القسم الحالي:</div>
                      <div className="font-bold text-emerald-400 mt-0.5">{cam.currentSection}</div>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <div className="text-slate-400">المادة المفتوحة:</div>
                      <div className="font-bold text-blue-400 mt-0.5">{cam.currentSubject}</div>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <div className="text-slate-400">جهاز الطالب:</div>
                      <div className="font-bold text-slate-300 mt-0.5 truncate">{cam.deviceType}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[11px] text-slate-400">
                      💡 ملاحظة: الكاميرا تضمن متابعة انضباط الطالب واطلاعه على المذكرات المعتمدة دون انتهاك خصوصية أو تشويش.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedCam(null)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold transition text-xs"
                    >
                      إغلاق نافذة الفحص
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Security Operations Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">سجل العمليات والرصد الأمني للموقع</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">LIVE FEED STREAM</span>
        </div>

        <div className="mt-3 space-y-2 text-xs">
          <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-3">
              <span className="font-mono text-emerald-400 font-bold">[14:48:12]</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="font-semibold text-slate-300">
                CAM-01 (زياد علي عسيري): يتصفح ملخصات الصف الثاني متوسط - العلوم
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">200 OK</span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-3">
              <span className="font-mono text-blue-400 font-bold">[14:45:30]</span>
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span className="font-semibold text-slate-300">
                النظام الأمني: توثيق وتأكيد بيانات تنزيل الملفات المعتمدة (اسم الطالب + المدرسة + المعلم)
              </span>
            </div>
            <span className="text-[11px] text-emerald-400 font-mono font-bold">VERIFIED</span>
          </div>

          <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-3">
              <span className="font-mono text-slate-400 font-bold">[14:40:00]</span>
              <span className="w-2 h-2 rounded-full bg-slate-600"></span>
              <span className="font-semibold text-slate-400">
                خادم المراقبة: فحص دوري لنقاط الاتصال - كافة الكاميرات الافتراضية تعمل بكفاءة تامة
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">STANDBY</span>
          </div>
        </div>
      </div>
    </div>
  );
};
