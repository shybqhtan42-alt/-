import React, { useState, useEffect, useRef } from 'react';
import { CurrentUser, SchoolConfig, GameViolation, SuspectVehicle, CarModelType, CarColorOption } from '../types';
import { ThreeGameSimulator } from './ThreeGameSimulator';
import { 
  ShieldCheck, 
  Car, 
  Siren, 
  Camera, 
  MapPin, 
  Sun, 
  Moon, 
  CloudRain, 
  Wind, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Award, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  UserCheck, 
  Clock, 
  Play, 
  ChevronLeft,
  X,
  Sparkles,
  KeyRound,
  SlidersHorizontal,
  Check,
  Eye
} from 'lucide-react';

interface LtAnasGameProps {
  config: SchoolConfig;
  currentUser: CurrentUser;
  onOpenLogin?: () => void;
  onUpdateConfig?: (config: SchoolConfig) => void;
  onBack?: () => void;
}

// Available Civilian Cars requested by user
const CIVILIAN_CAR_MODELS: { id: CarModelType; name: string; brand: string; desc: string; badge: string }[] = [
  {
    id: 'accent',
    name: 'هيونداي أكسنت (Hyundai Accent)',
    brand: 'هيونداي',
    desc: 'سيدان مدمجة، خفيفة وسلسة واقتصادية جداً على الطرق السريعة',
    badge: 'الأكثر توفيراً',
  },
  {
    id: 'camry',
    name: 'تويوتا كامري (Toyota Camry)',
    brand: 'تويوتا',
    desc: 'السيارة الأكثر انتشاراً وموثوقية في المملكة، عزل وقوة وثبات ممتاز',
    badge: 'الأكثر شعبية في السعودية',
  },
  {
    id: 'yaris',
    name: 'تويوتا ياريس (Toyota Yaris)',
    brand: 'تويوتا',
    desc: 'سيارة رشيقة وعملية، استجابة عالية وسهولة في المناورة',
    badge: 'رشيقة واقتصادية',
  },
  {
    id: 'lexus',
    name: 'لكزس فاخرة VIP (Lexus Luxury VIP)',
    brand: 'لكزس',
    desc: 'سيدان تنفيذية VIP بمقصورة جلد عنابي وشاشة ملاحة وشبك أمامي فاخر كالصورة',
    badge: 'مقصورة جلد عنابي VIP',
  },
  {
    id: 'bmw_i7',
    name: 'بي إم دبليو الفئة السابعة لونين VIP (BMW i7)',
    brand: 'بي إم دبليو',
    desc: 'سيدان فاخرة طراز الفئة السابعة بطلاء ثنائي اللون (فضي ميتاليك وأخضر ملكي) كالصورة',
    badge: 'VIP لونين فخامة',
  },
  {
    id: 'sonata',
    name: 'هيونداي سوناتا (Hyundai Sonata)',
    brand: 'هيونداي',
    desc: 'سيدان متوسطة عصرية بتصميم كوبيه إيروديناميكي وشريط إضاءة مميز',
    badge: 'تصميم رياضي',
  },
];

// Available Police Vehicles
const POLICE_CAR_MODELS: { id: CarModelType; name: string; desc: string; badge: string }[] = [
  {
    id: 'police_fj',
    name: 'دورية تويوتا إف جي / برادو أمن الطرق (وحدة JM-602)',
    desc: 'الدورية الرسمية في الصورة مع دعامية صدمات وفلاشر LED وسارينة الملازم أنس',
    badge: 'الدورية في الصورة الرسمية',
  },
  {
    id: 'police_dodge',
    name: 'دورية دودج تشارجر أمن الطرق (المطاردة السريعة)',
    desc: 'دورية اعتراض ومطاردة رياضية على الطرق السريعة مع فلاشر وسارينات طوارئ',
    badge: 'مطاردة سريعة',
  },
];

// Available Paint Colors for cars
const CAR_COLORS: CarColorOption[] = [
  { id: 'white', name: 'أبيض لؤلؤي', hex: '#f8fafc', cssBg: 'bg-slate-100' },
  { id: 'silver', name: 'فضي معدني', hex: '#94a3b8', cssBg: 'bg-slate-400' },
  { id: 'black', name: 'أسود ملكي', hex: '#0f172a', cssBg: 'bg-slate-900' },
  { id: 'navy', name: 'كحلي فاخر', hex: '#1e3a8a', cssBg: 'bg-blue-900' },
  { id: 'titanium', name: 'رمادي تيتانيوم', hex: '#475569', cssBg: 'bg-slate-600' },
  { id: 'burgundy', name: 'أحمر عودي', hex: '#881337', cssBg: 'bg-rose-900' },
  { id: 'desert', name: 'عسلي صحراوي', hex: '#b45309', cssBg: 'bg-amber-700' },
];

// Preset Suspect Vehicles for the Inspection system (matching user screenshot)
const INITIAL_SUSPECT_CARS: SuspectVehicle[] = [
  {
    id: 'veh-1',
    model: 'تويوتا كامري 2024',
    color: 'أبيض لؤلؤي',
    plateNumber: 'أ ب ح | 159',
    driverName: 'فهد بن ناصر الدوسري',
    nationalId: '1088492011',
    city: 'الرياض',
    licenseStatus: 'سارية',
    trunkItems: [
      { name: 'فأرة كمبيوتر لاسلكية', isIllegal: false, count: 1 },
      { name: 'مفتاح عجل احتياطي', isIllegal: false, count: 1 },
      { name: 'مجموعة أدوات تصليح ومفكات', isIllegal: false, count: 1 },
      { name: 'سكين طعام ومستلزمات رحلات', isIllegal: false, count: 1 },
    ],
    status: 'pending',
  },
  {
    id: 'veh-2',
    model: 'هيونداي سوناتا 2023',
    color: 'رمادي داكن',
    plateNumber: 'ر ق م | 884',
    driverName: 'سعد بن عبد الرحمن القرني',
    nationalId: '1074559203',
    city: 'مكة المكرمة',
    licenseStatus: 'منتهية',
    trunkItems: [
      { name: 'حقيبة سفر شخصية', isIllegal: false, count: 2 },
      { name: 'شهادة تدريب معتمدة', isIllegal: false, count: 1 },
      { name: 'ألعاب نارية غير مرخصة', isIllegal: true, count: 5 },
    ],
    status: 'pending',
  },
  {
    id: 'veh-3',
    model: 'تويوتا يارس 2025',
    color: 'فضي معدني',
    plateNumber: 'ص ك ب | 442',
    driverName: 'خالد بن مسفر القحطاني',
    nationalId: '1099234812',
    city: 'جدة',
    licenseStatus: 'سارية',
    trunkItems: [
      { name: 'كتب ومذكرات مدرسية (ثاني متوسط)', isIllegal: false, count: 4 },
      { name: 'طفاية حريق ومثلث طوارئ', isIllegal: false, count: 1 },
      { name: 'كاميرا تصوير فوتوغرافي', isIllegal: false, count: 1 },
    ],
    status: 'pending',
  },
];

export const LtAnasGame: React.FC<LtAnasGameProps> = ({
  config,
  currentUser,
  onOpenLogin,
  onUpdateConfig,
  onBack,
}) => {
  // Gateway State: Student MUST register school code and choose vehicle before entering 3D game
  const [isGameUnlocked, setIsGameUnlocked] = useState<boolean>(() => {
    // Check if session has previously unlocked
    return sessionStorage.getItem('anas_game_unlocked') === 'true';
  });

  // School Code Gateway Input State
  const [enteredSchoolCode, setEnteredSchoolCode] = useState<string>(() => {
    return currentUser.role === 'student' ? (config.studentSchoolCode || '') : '';
  });
  const [schoolCodeError, setSchoolCodeError] = useState<string | null>(null);

  // Vehicle Selection in Gateway & in-game customizer
  const [selectedRole, setSelectedRole] = useState<'officer' | 'civilian'>('officer');
  const [selectedCarModel, setSelectedCarModel] = useState<CarModelType>('police_fj');
  const [selectedColorHex, setSelectedColorHex] = useState<string>('#f8fafc');
  const [isVehicleCustomizerOpen, setIsVehicleCustomizerOpen] = useState(false);

  // Active View: 'game' | 'inspection' | 'leaderboard'
  // (CRITICAL: 'code-architecture' completely removed per "رابعاً: لا تطلع الكود نهائياً")
  const [activeGameView, setActiveGameView] = useState<'game' | 'inspection' | 'leaderboard'>('game');

  // Environment & Weather
  const [weather, setWeather] = useState<'clear' | 'night' | 'rain' | 'dust'>(config.gameDefaultWeather || 'night');
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'night'>(config.gameDefaultTime || 'night');

  // Score State
  const [score, setScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('anas_game_score_v1');
      return saved ? parseInt(saved, 10) : 100;
    } catch {
      return 100;
    }
  });

  // Suspect Cars & Inspection System (matching user's screenshot)
  const [suspectCars, setSuspectCars] = useState<SuspectVehicle[]>(INITIAL_SUSPECT_CARS);
  const [activeSuspectCar, setActiveSuspectCar] = useState<SuspectVehicle | null>(INITIAL_SUSPECT_CARS[0]);
  const [inspectionSubView, setInspectionSubView] = useState<'overview' | 'trunk'>('overview');
  const [confiscatedList, setConfiscatedList] = useState<string[]>([]);
  const [toastAlert, setToastAlert] = useState<string | null>(null);

  // Fullscreen Landscape Helper
  const [isFullscreen, setIsFullscreen] = useState(false);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  // Violations Log
  const [violations, setViolations] = useState<GameViolation[]>([]);

  const showToast = (msg: string) => {
    setToastAlert(msg);
    setTimeout(() => setToastAlert(null), 3500);
  };

  // Save score locally
  useEffect(() => {
    try {
      localStorage.setItem('anas_game_score_v1', score.toString());
    } catch {
      // ignore
    }
  }, [score]);

  // Handle Gateway Form Submission (School Code Verification + Vehicle Choice)
  const handleUnlockGame = (e: React.FormEvent) => {
    e.preventDefault();
    const validCodes = [
      (config.studentSchoolCode || '').trim(),
      (config.managerSchoolCode || '').trim()
    ].filter(Boolean);

    const inputCode = enteredSchoolCode.trim();
    if (!inputCode) {
      setSchoolCodeError('يرجى إدخال رمز المدرسة للمتابعة والدخول للعبة');
      return;
    }

    if (!validCodes.includes(inputCode) && currentUser.role === 'guest') {
      setSchoolCodeError('رمز المدرسة غير صحيح! يرجى إدخال رمز المدرسة المعتمد.');
      return;
    }

    // Success! Unlock game and save session
    setSchoolCodeError(null);
    setIsGameUnlocked(true);
    sessionStorage.setItem('anas_game_unlocked', 'true');
    showToast('تم التحقق بنجاح! مرحباً بك في لعبة الملازم أَنَس 3D');
  };

  // Toggle Fullscreen Landscape mode
  const toggleFullscreen = () => {
    if (!gameContainerRef.current) return;
    if (!document.fullscreenElement) {
      gameContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Inspection actions
  const handleConfiscateItem = (itemName: string) => {
    setConfiscatedList((prev) => [...prev, itemName]);
    showToast(`تمت مصادرة المادة [${itemName}] وإحالتها للإجراءات النظامية.`);
  };

  const handleClearVehicle = () => {
    if (!activeSuspectCar) return;
    setScore((s) => s + 20);
    showToast(`تم السماح بالمرور لمركبة (${activeSuspectCar.driverName}) بعد التأكد من سلامة الأوراق والتفتيش (+20 نقطة تميز)!`);
    setSuspectCars((prev) =>
      prev.map((c) => (c.id === activeSuspectCar.id ? { ...c, status: 'cleared' } : c))
    );
    setInspectionSubView('overview');
  };

  const handleTicketVehicle = () => {
    if (!activeSuspectCar) return;
    setScore((s) => s + 10);
    showToast(`تم تسجيل مخالفة مرورية بحق السائق (${activeSuspectCar.driverName}) لعدم اكتمال المتطلبات.`);
    setSuspectCars((prev) =>
      prev.map((c) => (c.id === activeSuspectCar.id ? { ...c, status: 'ticketed' } : c))
    );
    setInspectionSubView('overview');
  };

  // =========================================================================
  // GATEWAY MODAL / SCREEN (MANDATORY BEFORE ENTERING 3D SIMULATION)
  // Replicating requirement: "الطالب لا يدخل اللعبة الا اذا سجل رمز المدرسة ثم
  // اختار سياره عاديه او دوريه اذا اختار سياره عاديه تطلع له انواع السيارات
  // هونداي اكسنت كامري ياريس لكزس الى اخره ثم يختار الألوان ثم تفتح اللعبة"
  // =========================================================================
  if (!isGameUnlocked) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-4">
        {/* Toast Alert */}
        {toastAlert && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-900 text-white px-5 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold border border-emerald-600 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastAlert}</span>
          </div>
        )}

        {/* Gateway Card */}
        <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl border-2 border-indigo-800 shadow-2xl p-6 sm:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pb-6 border-b border-slate-800 text-center sm:text-right">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 flex items-center justify-center border-2 border-blue-400/40 text-blue-300 shadow-xl shrink-0">
              <Siren className="w-9 h-9 text-amber-400 animate-bounce" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/40">
                  بوابة الدخول المعتمدة
                </span>
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  عرض وليس طول (Landscape 16:9)
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                لعبة الملازم أَنَس 3D (أمن الطرق ومحاكاة القيادة)
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                الرجاء تسجيل رمز المدرسة واختيار سيارتك المفضلة لبدء المحاكاة الواقعية
              </p>
            </div>
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                الرجوع للمنصة
              </button>
            )}
          </div>

          <form onSubmit={handleUnlockGame} className="mt-6 space-y-6">
            {/* STEP 1: SCHOOL CODE */}
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-amber-400 flex items-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  <span>الخطوة 1: تسجيل رمز المدرسة للطالب</span>
                </label>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={enteredSchoolCode}
                  onChange={(e) => {
                    setEnteredSchoolCode(e.target.value);
                    setSchoolCodeError(null);
                  }}
                  placeholder="أدخل رمز المدرسة المعتمد"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 text-white font-mono text-center text-lg sm:text-xl py-3 px-4 rounded-xl outline-hidden tracking-widest placeholder:text-slate-600 transition-colors"
                />
              </div>

              {schoolCodeError && (
                <div className="text-xs text-rose-400 font-bold flex items-center gap-1.5 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{schoolCodeError}</span>
                </div>
              )}
            </div>

            {/* STEP 2: CHOOSE ROLE (OFFICER PATROL VS CIVILIAN CAR) */}
            <div className="space-y-3">
              <label className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>الخطوة 2: اختيار نوع المركبة ونمط القيادة</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: Police Patrol */}
                <div
                  onClick={() => {
                    setSelectedRole('officer');
                    if (selectedCarModel !== 'police_fj' && selectedCarModel !== 'police_dodge') {
                      setSelectedCarModel('police_fj');
                    }
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3.5 ${
                    selectedRole === 'officer'
                      ? 'bg-blue-950/70 border-blue-500 shadow-lg ring-2 ring-blue-500/30'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-300 border border-blue-500/30 flex items-center justify-center shrink-0">
                    <Siren className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-white flex items-center gap-2">
                      <span>دورية أمن الطرق (الملازم أَنَس)</span>
                      {selectedRole === 'officer' && <Check className="w-4 h-4 text-blue-400" />}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      دورية تويوتا إف جي / برادو (JM-602) أو دودج تشارجر مع سارينة حقيقية وفلاشر
                    </p>
                  </div>
                </div>

                {/* Option 2: Civilian Vehicle */}
                <div
                  onClick={() => {
                    setSelectedRole('civilian');
                    if (selectedCarModel === 'police_dodge' || selectedCarModel === 'police_fj') {
                      setSelectedCarModel('lexus');
                    }
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3.5 ${
                    selectedRole === 'civilian'
                      ? 'bg-emerald-950/70 border-emerald-500 shadow-lg ring-2 ring-emerald-500/30'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <Car className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-white flex items-center gap-2">
                      <span>سيارة مدنية عادية</span>
                      {selectedRole === 'civilian' && <Check className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      اختر من بين: لكزس VIP، بي إم دبليو الفئة 7، كامري، أكسنت، ياريس، سوناتا
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 3A: POLICE CAR MODELS LIST (APPEARS IF POLICE IS CHOSEN) */}
            {selectedRole === 'officer' && (
              <div className="space-y-3 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 animate-in fade-in">
                <label className="text-xs sm:text-sm font-bold text-blue-400 flex items-center gap-2">
                  <Siren className="w-4 h-4" />
                  <span>الخطوة 3: اختر طراز دورية أمن الطرق</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {POLICE_CAR_MODELS.map((model) => {
                    const isSelected = selectedCarModel === model.id;
                    return (
                      <div
                        key={model.id}
                        onClick={() => setSelectedCarModel(model.id)}
                        className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'bg-blue-950/60 border-blue-400 shadow-md ring-1 ring-blue-400'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white">{model.name}</span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-blue-300 border border-slate-700">
                            {model.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          {model.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3B: CIVILIAN CAR MODELS LIST (APPEARS IF CIVILIAN IS CHOSEN) */}
            {selectedRole === 'civilian' && (
              <div className="space-y-3 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 animate-in fade-in">
                <label className="text-xs sm:text-sm font-bold text-amber-400 flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  <span>الخطوة 3: اختر نوع السيارة المدنية</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {CIVILIAN_CAR_MODELS.map((model) => {
                    const isSelected = selectedCarModel === model.id;
                    return (
                      <div
                        key={model.id}
                        onClick={() => setSelectedCarModel(model.id)}
                        className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'bg-amber-950/40 border-amber-400 shadow-md ring-1 ring-amber-400'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white">{model.name}</span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                            {model.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          {model.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: CAR COLOR PALETTE */}
            <div className="space-y-3 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
              <label className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                <span>
                  الخطوة {selectedRole === 'civilian' ? '4' : '3'}: اختيار لون السيارة
                </span>
                {selectedRole === 'officer' && (
                  <span className="text-[11px] text-slate-400 font-normal">
                    (دورية أمن الطرق تأتي بالأبيض المعتمد مع خطوط وشعارات أمن الطرق)
                  </span>
                )}
              </label>

              <div className="flex flex-wrap items-center gap-3">
                {CAR_COLORS.map((color) => {
                  const isSelected = selectedColorHex.toLowerCase() === color.hex.toLowerCase();
                  return (
                    <button
                      type="button"
                      key={color.id}
                      onClick={() => setSelectedColorHex(color.hex)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-400 bg-amber-400/15 text-white shadow-md ring-1 ring-amber-400'
                          : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-slate-400 shadow-xs"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span>{color.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 5: START SIMULATION BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm sm:text-base rounded-2xl shadow-2xl border-2 border-emerald-400 flex items-center justify-center gap-3 transition-transform active:scale-98 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>⚡ فتح اللعبة وبدء المحاكاة بالوضع الأفقي (Landscape)</span>
              </button>
              <p className="text-center text-[11px] text-slate-400 mt-2">
                اللعبة تعمل بالوضع الأفقي 16:9 - طرق سريعة، كباري طلعات ونزلات، مستشفى عام، ومركز شرطة.
              </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ACTIVE 3D GAME SCREEN (AFTER GATEWAY UNLOCK)
  // =========================================================================
  return (
    <div 
      ref={gameContainerRef}
      className={`w-full overflow-hidden transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-2 sm:p-4 flex flex-col' : 'space-y-4'
      }`}
    >
      {/* Toast alert */}
      {toastAlert && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-900 text-white px-5 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold border border-emerald-600 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastAlert}</span>
        </div>
      )}

      {/* TOP BAR / GAME CONTROL HEADER */}
      <div className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-3">
        {/* Title & Active Vehicle Status */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-blue-700 via-indigo-900 to-slate-950 flex items-center justify-center border border-blue-400/30 text-blue-300 shadow-xs shrink-0">
            <Siren className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse text-amber-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-white truncate">
                لعبة الملازم أَنَس (Lt. Anas 3D)
              </h2>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 shrink-0">
                {selectedRole === 'officer' ? 'دورية أمن الطرق' : 'سيارة مدنية'}
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 truncate">
              {selectedRole === 'officer'
                ? (POLICE_CAR_MODELS.find(m => m.id === selectedCarModel)?.name || 'دورية أمن الطرق الرسمية')
                : `المركبة الحالية: ${CIVILIAN_CAR_MODELS.find(m => m.id === selectedCarModel)?.name || 'سيارة مدنية'}`}
            </p>
          </div>
        </div>

        {/* View Switcher Tabs: Strictly 3 tabs (Game, Inspection, Scoreboard) - NO CODE TAB! */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveGameView('game')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeGameView === 'game' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>المحاكاة والقيادة 3D</span>
          </button>

          <button
            onClick={() => setActiveGameView('inspection')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeGameView === 'inspection' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>تفتيش السيارة ({suspectCars.length})</span>
          </button>

          <button
            onClick={() => setActiveGameView('leaderboard')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeGameView === 'leaderboard' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>سجل النقاط والتحدي</span>
          </button>
        </div>

        {/* Top actions: Fullscreen & Change Vehicle & Score */}
        <div className="flex items-center gap-2">
          {/* Change Vehicle Button */}
          <button
            onClick={() => setIsVehicleCustomizerOpen(true)}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="تغيير السيارة ولونها"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">تغيير السيارة</span>
          </button>

          {/* Score Display */}
          <div className="bg-slate-950 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-slate-300 font-semibold">رصيد النقاط:</span>
            <span className="text-amber-400 font-black text-sm">{score}</span>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
            title="تبديل وضع ملء الشاشة بالعرض"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-1.5 bg-slate-800 hover:bg-rose-900/60 hover:text-rose-200 text-slate-300 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              title="الرجوع إلى الصفحة الرئيسية للمنصة"
            >
              <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
              <span className="hidden sm:inline">الرجوع للمنصة</span>
              <span className="sm:hidden">خروج</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: INTERACTIVE LANDSCAPE HIGHWAY SIMULATION */}
      {activeGameView === 'game' && (
        <div className="space-y-3">
          {/* Quick Shortcuts Ribbon */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-bold text-slate-700">تحكم الكيبورد:</span>
              <span className="text-slate-600">(W / S للسرعة والفرامل) · (A / D للالتفاف) · (C لتبديل الكاميرا) · (L للكشافات)</span>
              <span className="text-emerald-700 font-extrabold">🌟 القيادة النظامية تمنحك +10 نقاط باستمرار!</span>
            </div>

            <button
              onClick={() => setActiveGameView('inspection')}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>دخول نقطة التفتيش وفحص المركبات</span>
            </button>
          </div>

          {/* 3D WebGL Open-World Highway Simulator */}
          <ThreeGameSimulator
            config={config}
            currentUser={currentUser}
            score={score}
            onUpdateScore={(newScore) => setScore(newScore)}
            weather={weather}
            onWeatherChange={(w) => setWeather(w)}
            timeOfDay={timeOfDay}
            onTimeOfDayChange={(t) => setTimeOfDay(t)}
            selectedRole={selectedRole}
            selectedCarModel={selectedCarModel}
            carColorHex={selectedColorHex}
            onOpenInspection={(carIdx) => {
              if (carIdx !== undefined && suspectCars[carIdx]) {
                setActiveSuspectCar(suspectCars[carIdx]);
              }
              setActiveGameView('inspection');
            }}
            suspectCarsCount={suspectCars.length}
            suspectCars={suspectCars}
            onUpdateSuspectCars={(updated) => setSuspectCars(updated)}
            onChangeVehicleRequest={() => setIsVehicleCustomizerOpen(true)}
          />
        </div>
      )}

      {/* VIEW 2: VEHICLE & TRUNK INSPECTION (Matching User Screenshot "تقدر تفتش السيارة") */}
      {activeGameView === 'inspection' && (
        <div className="space-y-4">
          {/* Inspection Bay Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 rounded-3xl border border-slate-700 shadow-md flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>نقطة تفتيش أمن الطرق - تفتيش المركبات وكشف الهوية</span>
                </h3>
                <p className="text-xs text-slate-300">
                  فحص رخص القيادة، الاستعلام عن هوية السائق، وتفتيش صندوق السيارة لضبط الممنوعات
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setInspectionSubView('overview')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  inspectionSubView === 'overview' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                قائمة السيارات المشتبه بها
              </button>
              <button
                onClick={() => setInspectionSubView('trunk')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  inspectionSubView === 'trunk' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                تفتيش الصندوق
              </button>
            </div>
          </div>

          {/* INSPECTION SCREEN (MATCHING SCREENSHOT WITH EMBLEM) */}
          {activeSuspectCar && (
            <div className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white rounded-3xl border-2 border-slate-700 p-6 shadow-2xl min-h-[420px] flex flex-col justify-between overflow-hidden">
              {/* Special Forces for Road Security Emblem Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15">
                <div className="w-72 h-72 rounded-full border-4 border-amber-400 flex flex-col items-center justify-center text-center p-6">
                  <div className="text-xl font-black text-amber-300">القوات الخاصة لأمن الطرق</div>
                  <div className="text-xs text-slate-300 font-bold mt-1">الأمن العام · وزارة الداخلية</div>
                </div>
              </div>

              {/* Top Inspection Details */}
              <div className="relative z-10 space-y-4">
                <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400">تفتيش السيارة:</span>
                    <span className="text-sm font-extrabold text-white">{activeSuspectCar.model}</span>
                    <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700">
                      لوحة: {activeSuspectCar.plateNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">حالة الرخصة:</span>
                    <span className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                      activeSuspectCar.licenseStatus === 'سارية'
                        ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
                        : 'bg-red-900/60 text-red-300 border border-red-500/40'
                    }`}>
                      {activeSuspectCar.licenseStatus}
                    </span>
                  </div>
                </div>

                {/* Driver Identity Card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">اسم السائق:</span>
                    <strong className="text-white text-sm">{activeSuspectCar.driverName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">رقم الهوية الوطنية / الإقامة:</span>
                    <strong className="text-amber-300 font-mono text-sm">{activeSuspectCar.nationalId}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">المدينة / الوجهة:</span>
                    <strong className="text-white text-sm">{activeSuspectCar.city}</strong>
                  </div>
                </div>

                {/* Trunk Search Results Box (Directly replicating the user screenshot!) */}
                <div className="bg-slate-950/90 rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-400 flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      <span>النتيجة (محتويات صندوق السيارة):</span>
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      تم التفتيش بواسطة: الملازم أَنَس
                    </span>
                  </div>

                  <div className="space-y-2">
                    {activeSuspectCar.trunkItems.map((item, idx) => {
                      const isConfiscated = confiscatedList.includes(item.name);
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                            item.isIllegal
                              ? 'bg-red-950/30 border-red-500/50 text-red-200'
                              : 'bg-slate-900/60 border-slate-800 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            <span className="font-bold text-white">{item.name}</span>
                            {item.isIllegal && (
                              <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
                                مادة ممنوعة
                              </span>
                            )}
                          </div>

                          <div>
                            {isConfiscated ? (
                              <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>تمت المصادرة</span>
                              </span>
                            ) : item.isIllegal ? (
                              <button
                                onClick={() => handleConfiscateItem(item.name)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition-all shadow-xs cursor-pointer"
                              >
                                مصادرة
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400">مسموح</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div className="relative z-10 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="text-[11px] text-slate-400">
                  نظام التفتيش والضبط الأمني الموحد - دورية أمن الطرق
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setInspectionSubView('overview')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    رجوع إلى قائمة السيارات
                  </button>

                  <button
                    onClick={handleTicketVehicle}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    تسجيل مخالفة
                  </button>

                  <button
                    onClick={handleClearVehicle}
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-black rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    السماح بالمرور (+20 نقطة)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cars List to switch */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {suspectCars.map((car) => (
              <div
                key={car.id}
                onClick={() => setActiveSuspectCar(car)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  activeSuspectCar?.id === car.id
                    ? 'bg-amber-950/20 border-amber-500 shadow-md ring-1 ring-amber-500/40'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900">{car.model}</span>
                  <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                    {car.plateNumber}
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <div>السائق: <strong>{car.driverName}</strong></div>
                  <div>المدينة: <strong>{car.city}</strong></div>
                  <div>حالة الفحص: 
                    <span className="mr-1 font-bold text-amber-700">
                      {car.status === 'cleared' ? 'تم الفسح' : car.status === 'ticketed' ? 'تمت المخالفة' : 'قيد الانتظار'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: SCOREBOARD & VIOLATIONS LOG */}
      {activeGameView === 'leaderboard' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-6 rounded-3xl border border-emerald-700 shadow-lg flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                لوحة الشرف والتحدي
              </span>
              <h3 className="text-xl font-black text-white mt-1">
                سجل النقاط والالتزام المروري
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                كل فترة التزام مروري تمنحك +10 نقاط. مخالفات ساهر تخصم 100 نقطة.
              </p>
            </div>

            <div className="text-center bg-slate-950/60 border border-emerald-500/30 p-4 rounded-2xl min-w-[140px]">
              <div className="text-3xl font-black text-amber-400">{score}</div>
              <div className="text-xs text-slate-400 font-bold">الرصيد الكلي للنقاط</div>
            </div>
          </div>

          {/* Violations Table */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-red-600" />
              <span>سجل مخالفات ساهر والرصد الآلي (حسم 100 نقطة لكل مخالفة):</span>
            </h4>

            {violations.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs font-medium">
                سجلك نظيف تماماً! لم يتم رصد أي مخالفة مرورية بحقك حتى الآن. استمر بالقيادة النظامية 🌟
              </div>
            ) : (
              <div className="space-y-2">
                {violations.map((vio) => (
                  <div
                    key={vio.id}
                    className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-900"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <div>
                        <strong>{vio.type}</strong>
                        <div className="text-[10px] text-red-700">{vio.location} - {vio.time}</div>
                      </div>
                    </div>
                    <span className="font-black text-red-700 font-mono">
                      -{vio.pointsDeducted} نقطة
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* IN-GAME VEHICLE CUSTOMIZER MODAL */}
      {isVehicleCustomizerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl border-2 border-indigo-700 max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                <span>تغيير السيارة ولون الطلاء في المحاكاة 3D</span>
              </h3>
              <button
                onClick={() => setIsVehicleCustomizerOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Role switch */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                onClick={() => {
                  setSelectedRole('officer');
                  if (selectedCarModel !== 'police_fj' && selectedCarModel !== 'police_dodge') {
                    setSelectedCarModel('police_fj');
                  }
                }}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer ${
                  selectedRole === 'officer'
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <Siren className="w-4 h-4" />
                <span>دورية أمن الطرق</span>
              </button>

              <button
                onClick={() => {
                  setSelectedRole('civilian');
                  if (selectedCarModel === 'police_dodge' || selectedCarModel === 'police_fj') {
                    setSelectedCarModel('lexus');
                  }
                }}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer ${
                  selectedRole === 'civilian'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <Car className="w-4 h-4" />
                <span>سيارة مدنية</span>
              </button>
            </div>

            {/* Police model list */}
            {selectedRole === 'officer' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-blue-400">اختر طراز الدورية الرسمية:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {POLICE_CAR_MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedCarModel(m.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-right cursor-pointer ${
                        selectedCarModel === m.id
                          ? 'bg-blue-600/30 border-blue-400 text-blue-200 ring-1 ring-blue-400'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="text-[11px] text-white font-extrabold">{m.name}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{m.badge}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Civilian model list */}
            {selectedRole === 'civilian' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-amber-400">اختر طراز السيارة:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CIVILIAN_CAR_MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedCarModel(m.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-right cursor-pointer ${
                        selectedCarModel === m.id
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div>{m.brand}</div>
                      <div className="text-[11px] text-white font-extrabold">{m.name.split('(')[0]}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Palette */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-amber-400">اختر لون الطلاء:</label>
              <div className="flex flex-wrap gap-2">
                {CAR_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedColorHex(c.hex)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer ${
                      selectedColorHex.toLowerCase() === c.hex.toLowerCase()
                        ? 'bg-amber-400/20 border-amber-400 text-white ring-1 ring-amber-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-400" style={{ backgroundColor: c.hex }} />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setIsVehicleCustomizerOpen(false);
                  showToast('تم تحديث السيارة بنجاح!');
                }}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer"
              >
                تطبيق والعودة للمحاكاة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
