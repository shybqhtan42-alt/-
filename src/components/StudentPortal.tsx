import React, { useState } from 'react';
import { SummaryItem, CurrentUser, SchoolConfig, AVAILABLE_GRADES } from '../types';
import { 
  BookOpen, 
  Search, 
  Layers, 
  FileText, 
  Eye, 
  Bookmark, 
  BookmarkCheck, 
  Sparkles,
  ChevronLeft,
  GraduationCap,
  Lock,
  Star,
  ArrowRight,
  ArrowLeft,
  Laptop,
  Compass,
  Calculator,
  FlaskConical,
  Languages,
  CheckCircle2,
  Download,
  BookMarked
} from 'lucide-react';
import { APP_IMAGES } from '../assets/images';
import { downloadSummaryDocument } from '../utils/fileExport';

interface StudentPortalProps {
  summaries: SummaryItem[];
  currentUser: CurrentUser;
  config: SchoolConfig;
  onSelectSummary: (summary: SummaryItem) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onOpenLogin: () => void;
}

interface SubjectCardDef {
  name: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

const SECOND_INTERMEDIATE_SUBJECTS: SubjectCardDef[] = [
  {
    name: 'العلوم',
    icon: FlaskConical,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200 hover:border-emerald-500',
    description: 'أجهزة جسم الإنسان، المادة، الطاقة، والبيئة',
  },
  {
    name: 'الرياضيات',
    icon: Calculator,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200 hover:border-blue-500',
    description: 'الأعداد الحقيقية، نظرية فيثاغورس، والهندسة والقياس',
  },
  {
    name: 'لغتي الخالدة',
    icon: BookOpen,
    color: 'text-amber-800',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200 hover:border-amber-500',
    description: 'القواعد النحوية، الفاعل ونائب الفاعل، والبلاغة والنصوص',
  },
  {
    name: 'الاجتماعيات',
    icon: Compass,
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200 hover:border-orange-500',
    description: 'تاريخ الدولة الأموية، الفتوحات، والجغرافيا الإقليمية',
  },
  {
    name: 'الدراسات الإسلامية',
    icon: Sparkles,
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200 hover:border-teal-500',
    description: 'التوحيد، الفقه، أصول الإيمان، والحديث النبوي الشريف',
  },
  {
    name: 'اللغة الإنجليزية',
    icon: Languages,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200 hover:border-purple-500',
    description: 'English Super Goal: Vocabulary, Grammar & Reading',
  },
  {
    name: 'المهارات الرقمية',
    icon: Laptop,
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200 hover:border-cyan-500',
    description: 'أساسيات الحاسب، البرمجة، والتعامل مع الملفات الرقمية',
  },
];

export const StudentPortal: React.FC<StudentPortalProps> = ({
  summaries,
  currentUser,
  config,
  onSelectSummary,
  favorites,
  onToggleFavorite,
  onOpenLogin,
}) => {
  // Navigation states: Lock registered student to their specific assigned grade
  const isRegisteredStudent = currentUser.role === 'student' && Boolean(currentUser.student?.grade);
  const studentRegisteredGrade = currentUser.student?.grade;
  const initialGrade = isRegisteredStudent && studentRegisteredGrade
    ? studentRegisteredGrade
    : (config.defaultGrade || 'أول متوسط');

  const [selectedGrade, setSelectedGrade] = useState<string>(initialGrade);

  // Synchronize when student credentials or config default grade updates
  React.useEffect(() => {
    if (isRegisteredStudent && studentRegisteredGrade) {
      setSelectedGrade(studentRegisteredGrade);
    } else if (config.defaultGrade) {
      setSelectedGrade(config.defaultGrade);
    }
  }, [isRegisteredStudent, studentRegisteredGrade, config.defaultGrade]);

  // selectedSubject: if null, shows all subject cards as requested: "تطلع الخيارات المواد الذي يريدها"
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  // Content categories: 'الكل' | 'أوراق عمل' | 'ملخصات' | 'الكتب الدراسية'
  const [selectedCategory, setSelectedCategory] = useState<'الكل' | 'أوراق عمل' | 'ملخصات' | 'الكتب الدراسية'>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterFavoritesOnly, setFilterFavoritesOnly] = useState<boolean>(false);

  // Normalizer: strictly assigns each item to EXACTLY ONE of the three categories
  const normalizeCategory = (cat: string | undefined): 'أوراق عمل' | 'ملخصات' | 'الكتب الدراسية' => {
    const c = (cat || '').trim();
    if (c.includes('ورق') || c.includes('أوراق') || c.includes('اوراق') || c.includes('عمل')) {
      return 'أوراق عمل';
    }
    if (c.includes('كتب') || c.includes('كتاب') || c.includes('مقرر')) {
      return 'الكتب الدراسية';
    }
    // Default to summaries for all other lecture notes and summaries
    return 'ملخصات';
  };

  // Deduplicate summaries array to prevent any duplicate rendering
  const uniqueSummaries = React.useMemo(() => {
    const seenIds = new Set<string>();
    const seenKeys = new Set<string>();
    return summaries.filter((item) => {
      if (!item || !item.id) return false;
      const key = `${(item.title || '').trim()}_${(item.subject || '').trim()}_${(item.grade || '').trim()}_${(item.category || '').trim()}`;
      if (seenIds.has(item.id) || seenKeys.has(key)) return false;
      seenIds.add(item.id);
      seenKeys.add(key);
      return true;
    });
  }, [summaries]);

  // Helper count function per subject
  const getSubjectItemCount = (subjectName: string) => {
    return uniqueSummaries.filter(
      (s) => s.grade === selectedGrade && s.subject === subjectName
    ).length;
  };

  // Helper count per subject and category
  const getCategoryCount = (subjectName: string, cat: 'الكل' | 'أوراق عمل' | 'ملخصات' | 'الكتب الدراسية') => {
    return uniqueSummaries.filter((item) => {
      if (item.grade !== selectedGrade) return false;
      if (subjectName !== 'الكل' && item.subject !== subjectName) return false;
      if (cat === 'الكل') return true;
      return normalizeCategory(item.category) === cat;
    }).length;
  };

  // Filtering logic for the items list
  const filteredSummaries = uniqueSummaries.filter((item) => {
    // Grade matching
    if (item.grade !== selectedGrade) return false;

    // Subject matching
    if (selectedSubject && selectedSubject !== 'الكل' && item.subject !== selectedSubject) {
      return false;
    }

    // Category matching (الكل shows all files, otherwise matches specific category)
    if (selectedCategory !== 'الكل' && normalizeCategory(item.category) !== selectedCategory) {
      return false;
    }

    // Favorites only filter
    if (filterFavoritesOnly && !favorites.includes(item.id)) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSubject = item.subject.toLowerCase().includes(q);
      const matchText = item.summaryText.toLowerCase().includes(q);
      if (!matchTitle && !matchSubject && !matchText) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-8 max-w-full overflow-hidden">
      {/* Student Welcome & Identity Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl sm:rounded-3xl p-4 sm:p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-1.5 max-w-2xl min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-emerald-200 text-xs font-semibold">
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>{config.schoolName}</span>
              <span>·</span>
              <span>إشراف: {config.authorName}</span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight break-words">
              {currentUser.role === 'student' && currentUser.student
                ? `مرحباً بك يا بطل: ${currentUser.student.fullName}`
                : `منصة ${config.platformTitle} - ${selectedGrade}`}
            </h1>

            {isRegisteredStudent && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-xl text-xs font-black text-amber-200 border border-white/20 mt-1">
                <GraduationCap className="w-4 h-4 text-amber-300" />
                <span>الصف الدراسي المعتمد لك: {selectedGrade}</span>
              </div>
            )}

            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              اختر المادة الدراسية التي تريدها، ثم حدد ما إذا كنت تريد <strong>أوراق العمل</strong>، <strong>الملخصات</strong>، أو <strong>الكتب الدراسية</strong> لتصل إلى مادتك مباشرة.
            </p>
          </div>

          {currentUser.role === 'guest' ? (
            <div className="bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-white/20 shrink-0 text-center space-y-2 w-full md:w-auto">
              <p className="text-xs text-emerald-100 font-semibold">
                {config.studentLoginMode === 'code_only' ? 'طالب في المدرسة؟' : 'طالب مسجل في المدرسة؟'}
              </p>
              <button
                onClick={onOpenLogin}
                className="w-full px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-900 font-bold text-xs rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                {config.studentLoginMode === 'code_only' ? 'الدخول برمز المدرسة' : 'تسجيل الدخول للمنصة'}
              </button>
            </div>
          ) : (
            <div className="bg-emerald-950/60 border border-emerald-500/30 p-3 sm:p-4 rounded-xl sm:rounded-2xl shrink-0 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
                ⭐
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-white">حساب مفعل ومميز</div>
                <div className="text-[11px] text-amber-300">متاح لك فتح كافة الملخصات المهمة والمذكرات</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grade Selector Bar for Guests and Manager (Registered student is locked to their assigned grade) */}
      {!isRegisteredStudent && (
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-800 text-xs font-bold">
            <GraduationCap className="w-4 h-4 text-emerald-700" />
            <span>تصفح حسب الصف الدراسي:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {AVAILABLE_GRADES.map((g) => (
              <button
                key={g}
                onClick={() => {
                  setSelectedGrade(g);
                  setSelectedSubject(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  selectedGrade === g
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 1: SUBJECT SELECTION (تطلع له خيارات المواد الذي يريدها) */}
      {!selectedSubject ? (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs mb-1">
                <Layers className="w-4 h-4" />
                <span>الخطوة 1: اختيار المادة الدراسية</span>
              </div>
              <h2 className="text-lg font-black text-slate-900">
                اختر المادة الدراسية لصف {selectedGrade}:
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                انقر على المادة التي تريدها للاطلاع على أوراق العمل والملخصات والكتب الدراسية الخاصة بها.
              </p>
            </div>

            <button
              onClick={() => setSelectedSubject('الكل')}
              className="px-4 py-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer text-center"
            >
              عرض جميع المواد والملخصات معاً
            </button>
          </div>

          {/* Grid of Subjects (2 columns side-by-side on mobile as requested) */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {SECOND_INTERMEDIATE_SUBJECTS.map((subj) => {
              const IconComp = subj.icon;
              const count = getSubjectItemCount(subj.name);

              return (
                <div
                  key={subj.name}
                  onClick={() => {
                    setSelectedSubject(subj.name);
                    setSelectedCategory('الكل');
                  }}
                  className={`bg-white p-3.5 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer group shadow-2xs hover:shadow-md flex flex-col justify-between ${subj.borderColor}`}
                >
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between gap-1">
                      <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl ${subj.bgColor} ${subj.color} flex items-center justify-center group-hover:scale-105 transition-transform shrink-0`}>
                        <IconComp className="w-4 h-4 sm:w-6 sm:h-6" />
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-black text-slate-800 bg-slate-100/90 px-2 py-0.5 rounded-full shrink-0 border border-slate-200/60">
                        {count} متاح
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xs sm:text-base font-black text-slate-950 group-hover:text-emerald-800 transition-colors leading-snug">
                        مادة {subj.name}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-slate-700 font-semibold mt-0.5 sm:mt-1 line-clamp-2 leading-relaxed">
                        {subj.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px] sm:text-xs font-black text-emerald-800 group-hover:text-emerald-950">
                    <span>دخول المادة</span>
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Latest Published Summaries & Worksheets Section */}
          {Boolean(config.isLatestSpotlightEnabled) && uniqueSummaries.length > 0 && (
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900">
                      أحدث الملفات وأوراق العمل المنشورة حديثاً
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      تُنشر فورياً وتصل إلى جميع جوالات الطلاب وإدارة المدرسة
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedSubject('الكل');
                    setSelectedCategory('الكل');
                  }}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200 cursor-pointer"
                >
                  <span>عرض الكل ({uniqueSummaries.length})</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {uniqueSummaries.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectSummary(item)}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/40 transition-all cursor-pointer group flex flex-col justify-between space-y-2 shadow-2xs hover:shadow-xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          {item.subject}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                          {item.category || 'ملخص'}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-2">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {item.summaryText}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-emerald-800">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span>فتح واستعراض الملف</span>
                      </span>
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expressive Educational Books Banner at the bottom of the subjects page */}
          <div className="mt-5 sm:mt-8 rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm relative group bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950">
            <div className="relative h-44 sm:h-64 w-full overflow-hidden">
              <img
                src={APP_IMAGES.booksBanner}
                alt="كتب وملخصات مدرسة عبد الملك بن مروان"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== APP_IMAGES.publicBooksBanner) {
                    target.src = APP_IMAGES.publicBooksBanner;
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent flex flex-col justify-end p-4 sm:p-6 text-white space-y-1">
                <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-amber-300 bg-amber-400/20 backdrop-blur-md px-2.5 py-1 rounded-lg w-fit border border-amber-300/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>مكتبة مدرسة عبد الملك بن مروان الرقمية</span>
                </div>
                <h3 className="text-sm sm:text-lg font-black text-white">
                  ملخصات وكتب دراسية معتمدة لكافة مواد {selectedGrade}
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-200 leading-relaxed max-w-xl">
                  اختر أي مادة دراسية أعلاه لبدء استعراض أوراق العمل والملخصات والكتب المقررة.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* STEP 2: CATEGORY OPTIONS & CONTENT VIEW (اذا اختار المادة تطلع له خيارات هي اوراق العمل - ملخصات - الكتب الدراسية) */
        <div className="space-y-6">
          {/* Active Subject Bar with Back Button */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedSubject(null)}
                className="p-2 sm:px-3 sm:py-2 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="العودة لاختيار مادة أخرى"
              >
                <ArrowRight className="w-4 h-4 shrink-0" />
                <span>العودة لقائمة المواد</span>
              </button>

              <div className="border-r border-slate-200 pr-3">
                <div className="text-[11px] text-slate-500 font-semibold">المادة المختارة حالياً:</div>
                <div className="text-base font-black text-slate-900 flex items-center gap-2">
                  <span>{selectedSubject === 'الكل' ? 'جميع المواد الدراسية' : `مادة ${selectedSubject}`}</span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                    {selectedGrade}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick search input */}
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`ابحث داخل ${selectedSubject === 'الكل' ? 'المواد' : 'مادة ' + selectedSubject}...`}
                className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-600 transition-colors"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>

            {/* Favorites toggle */}
            <button
              onClick={() => setFilterFavoritesOnly(!filterFavoritesOnly)}
              className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer shrink-0 ${
                filterFavoritesOnly
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${filterFavoritesOnly ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span>المفضلة لدي ({favorites.length})</span>
            </button>
          </div>

          {/* THE 3 CATEGORY OPTIONS AS SPECIFIED: اوراق العمل - ملخصات - الكتب الدراسية */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-700 px-1">
              اختر نوع المحتوى الذي تريده لمادة ({selectedSubject === 'الكل' ? selectedGrade : selectedSubject}):
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {/* Option 0: الكل (جميع الملفات) */}
              <button
                type="button"
                onClick={() => setSelectedCategory('الكل')}
                className={`p-3 sm:p-4 rounded-2xl border-2 text-right transition-all flex items-start gap-2.5 sm:gap-3 cursor-pointer ${
                  selectedCategory === 'الكل'
                    ? 'bg-emerald-50/90 border-emerald-600 shadow-xs ring-1 ring-emerald-600/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 ${
                  selectedCategory === 'الكل' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900">الكل</span>
                    <span className={`text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${
                      selectedCategory === 'الكل' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {getCategoryCount(selectedSubject, 'الكل')}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed truncate">
                    جميع الملفات والملخصات
                  </p>
                </div>
              </button>

              {/* Option 1: أوراق العمل */}
              <button
                type="button"
                onClick={() => setSelectedCategory('أوراق عمل')}
                className={`p-3 sm:p-4 rounded-2xl border-2 text-right transition-all flex items-start gap-2.5 sm:gap-3 cursor-pointer ${
                  selectedCategory === 'أوراق عمل'
                    ? 'bg-emerald-50/90 border-emerald-600 shadow-xs ring-1 ring-emerald-600/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 ${
                  selectedCategory === 'أوراق عمل' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900">أوراق العمل</span>
                    <span className={`text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${
                      selectedCategory === 'أوراق عمل' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {getCategoryCount(selectedSubject, 'أوراق عمل')}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed truncate">
                    أوراق قياس وتدريبات وأنشطة
                  </p>
                </div>
              </button>

              {/* Option 2: ملخصات */}
              <button
                type="button"
                onClick={() => setSelectedCategory('ملخصات')}
                className={`p-3 sm:p-4 rounded-2xl border-2 text-right transition-all flex items-start gap-2.5 sm:gap-3 cursor-pointer ${
                  selectedCategory === 'ملخصات'
                    ? 'bg-emerald-50/90 border-emerald-600 shadow-xs ring-1 ring-emerald-600/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 ${
                  selectedCategory === 'ملخصات' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900">الملخصات</span>
                    <span className={`text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${
                      selectedCategory === 'ملخصات' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {getCategoryCount(selectedSubject, 'ملخصات')}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed truncate">
                    ملخصات الدروس ومذكرات القوانين
                  </p>
                </div>
              </button>

              {/* Option 3: الكتب الدراسية */}
              <button
                type="button"
                onClick={() => setSelectedCategory('الكتب الدراسية')}
                className={`p-3 sm:p-4 rounded-2xl border-2 text-right transition-all flex items-start gap-2.5 sm:gap-3 cursor-pointer ${
                  selectedCategory === 'الكتب الدراسية'
                    ? 'bg-emerald-50/90 border-emerald-600 shadow-xs ring-1 ring-emerald-600/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 ${
                  selectedCategory === 'الكتب الدراسية' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <BookMarked className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900">الكتب المقررة</span>
                    <span className={`text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${
                      selectedCategory === 'الكتب الدراسية' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {getCategoryCount(selectedSubject, 'الكتب الدراسية')}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed truncate">
                    المناهج والكتب والوحدات
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* STEP 3: CONTENT DISPLAY (يطلع له الذي يريده الطالب) */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 px-1 gap-2">
              <span className="font-bold text-slate-800">
                المعروض في خانة ({selectedCategory}) لمادة ({selectedSubject === 'الكل' ? 'كل المواد' : selectedSubject}):{' '}
                <span className="text-emerald-800">{filteredSummaries.length}</span> عنصر
              </span>
            </div>

            {/* Empty State */}
            {filteredSummaries.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-slate-200 shadow-xs space-y-3">
                <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                  {selectedCategory === 'أوراق عمل' ? (
                    <FileText className="w-7 h-7 text-emerald-700" />
                  ) : selectedCategory === 'الكتب الدراسية' ? (
                    <BookMarked className="w-7 h-7 text-blue-700" />
                  ) : (
                    <BookOpen className="w-7 h-7 text-amber-700" />
                  )}
                </div>

                <h4 className="font-bold text-slate-900 text-base">
                  لا توجد ملفات مرفوعة حالياً في قسم «{selectedCategory}» لمادة ({selectedSubject === 'الكل' ? 'المواد' : selectedSubject})
                </h4>

                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  يقوم مدير المدرسة ومعلمو المواد بإضافة ونشر {selectedCategory} تباعاً. يمكنك تصفح باقي الأقسام أو الاطلاع على ملخصات المواد الأخرى.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {selectedCategory !== 'ملخصات' && (
                    <button
                      onClick={() => setSelectedCategory('ملخصات')}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      تصفح الملخصات المتاحة
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedSubject(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    اختيار مادة أخرى
                  </button>
                </div>
              </div>
            ) : (
              /* Items Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {filteredSummaries.map((item) => {
                  const isFav = favorites.includes(item.id);
                  const isExclusive = Boolean(
                    item.isImportant ||
                    item.isExclusive ||
                    item.category === 'ملخصات مهمة' ||
                    item.category === 'الملخصات المهمة'
                  );
                  const isLockedForGuest = isExclusive && currentUser.role === 'guest';

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        onSelectSummary(item);
                      }}
                      className={`bg-white rounded-2xl border shadow-xs hover:shadow-md transition-all p-4 sm:p-5 flex flex-col justify-between cursor-pointer group ${
                        isExclusive
                          ? 'border-amber-200/90 hover:border-amber-400 bg-gradient-to-b from-amber-50/20 to-white'
                          : 'border-slate-200/90 hover:border-emerald-300'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Header line */}
                        <div className="flex items-center justify-between text-xs text-slate-500 gap-2">
                          <div className="flex flex-wrap items-center gap-1.5 font-semibold text-emerald-800">
                            <span>{item.subject}</span>
                            <span>·</span>
                            <span>{item.category || selectedCategory}</span>
                            {isExclusive && (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 font-bold text-[10px] px-2 py-0.5 rounded-full border border-amber-300">
                                <Star className="w-3 h-3 fill-amber-700 text-amber-700" />
                                <span>ملخص مهم</span>
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(item.id);
                            }}
                            className="text-slate-400 hover:text-amber-500 transition-colors p-1 shrink-0 cursor-pointer"
                            title={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                          >
                            {isFav ? (
                              <BookmarkCheck className="w-4 h-4 text-amber-500 fill-amber-500" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-slate-900 group-hover:text-emerald-800 transition-colors text-sm sm:text-base leading-snug line-clamp-2">
                          {item.title}
                        </h3>

                        {/* Text preview */}
                        {isLockedForGuest ? (
                          <div className="text-xs text-amber-900 bg-amber-50/90 p-3 rounded-xl border border-amber-200 space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-amber-950">
                              <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span>محتوى حصري للطلاب المسجلين</span>
                            </div>
                            <p className="text-[11px] text-amber-800 leading-relaxed">
                              هذا الملخص مصنف كـ «ملخص مهم». سجّل دخولك بحساب الطالب للاطلاع على المحتوى والمرفقات كاملة.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed whitespace-pre-line bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              {item.summaryText}
                            </p>

                            {/* Prominent Attached File Badge */}
                            {(item.attachmentUrl || item.attachmentName) && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50/90 text-emerald-900 text-[11px] font-bold border border-emerald-200">
                                <FileText className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                <span className="truncate">
                                  {item.attachmentName ? `ملف مرفق: ${item.attachmentName}` : 'مرفق ملف دراسي جاهز للفتح والتحميل'}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card bottom */}
                      <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[10px] sm:text-[11px] text-slate-400">
                          {item.dateAdded}
                        </span>

                        {isLockedForGuest ? (
                          <div className="flex items-center gap-1 font-bold text-amber-800 text-xs group-hover:translate-x-[-2px] transition-transform">
                            <Lock className="w-3.5 h-3.5" />
                            <span>تسجيل الدخول للفتح</span>
                          </div>
                        ) : (item.attachmentUrl || item.attachmentName) ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectSummary(item);
                              }}
                              className="px-2.5 py-1.5 text-slate-600 hover:text-emerald-800 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              title="عرض التفاصيل والشرح"
                            >
                              التفاصيل
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectSummary(item);
                              }}
                              className="flex items-center gap-1.5 font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95 text-xs"
                              title="استعراض ومعاينة الملف المعتمد داخل التطبيق دون أي خروج"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>استعراض الملف</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 font-bold text-emerald-700 group-hover:translate-x-[-2px] transition-transform">
                            <Eye className="w-3.5 h-3.5" />
                            <span>عرض المحتوى</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
