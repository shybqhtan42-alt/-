import React, { useState, useEffect } from 'react';
import { Student, SummaryItem, SchoolConfig, AVAILABLE_GRADES, StudentLiveSession, StudentSuspension } from '../types';
import { storageService } from '../services/storageService';
import { CCTVMonitorRoom } from './CCTVMonitorRoom';
import { 
  Users, 
  FilePlus, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Upload, 
  Check, 
  Search, 
  KeyRound, 
  School, 
  GraduationCap, 
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Palette,
  RotateCcw,
  Eye,
  EyeOff,
  Gamepad2,
  Sun,
  Moon,
  CloudRain,
  Wind,
  CloudSun,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Compass,
  ShieldCheck,
  Download,
  Database,
  Video
} from 'lucide-react';
import { APP_IMAGES } from '../assets/images';

interface ManagerDashboardProps {
  config: SchoolConfig;
  onUpdateConfig: (newConfig: SchoolConfig) => void;
  students: Student[];
  onRefreshStudents: () => void;
  summaries: SummaryItem[];
  onRefreshSummaries: () => void;
  onlineStudentIds?: string[];
  onlineSessions?: StudentLiveSession[];
  suspensions?: StudentSuspension[];
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  config,
  onUpdateConfig,
  students,
  onRefreshStudents,
  summaries,
  onRefreshSummaries,
  onlineStudentIds = [],
  onlineSessions = [],
  suspensions = [],
}) => {
  const [activeTab, setActiveTab] = useState<'students' | 'summaries' | 'images' | 'settings' | 'backup' | 'cctv'>('students');

  // Student Form State
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [studentFullName, setStudentFullName] = useState('');
  const [studentUsername, setStudentUsername] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentGrade, setStudentGrade] = useState<string>(config.defaultGrade || 'ثاني متوسط');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentGradeFilter, setStudentGradeFilter] = useState<string>('الكل');

  // Summary / File Form State
  const [isAddingSummary, setIsAddingSummary] = useState(false);
  const [isSubmittingSummary, setIsSubmittingSummary] = useState(false);
  const isSubmittingSummaryRef = React.useRef(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [summaryTitle, setSummaryTitle] = useState('');
  const [summaryGrade, setSummaryGrade] = useState<string>(config.defaultGrade || 'ثاني متوسط');
  const [summarySubject, setSummarySubject] = useState('العلوم');
  const [summaryCategory, setSummaryCategory] = useState<'ملخصات' | 'أوراق عمل' | 'الكتب الدراسية'>('ملخصات');
  const [summaryText, setSummaryText] = useState('');
  const [summaryIsImportant, setSummaryIsImportant] = useState<boolean>(true);
  const [summaryRequiresStudentInfo, setSummaryRequiresStudentInfo] = useState<boolean>(true);
  const [summaryFilterTab, setSummaryFilterTab] = useState<'all' | 'important'>('all');
  const [summaryGradeFilter, setSummaryGradeFilter] = useState<string>('الكل');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [attachmentBase64, setAttachmentBase64] = useState<string>('');
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [attachmentType, setAttachmentType] = useState<'image' | 'pdf' | 'document' | 'none'>('none');

  // Media / Logo / Banner State (For Manager Only)
  const [logoPreview, setLogoPreview] = useState<string>(config.customLogoUrl || '');
  const [bannerPreview, setBannerPreview] = useState<string>(config.customBannerUrl || '');
  const [bannerTitle, setBannerTitle] = useState<string>(
    config.customBannerTitle || 'ملخصات وافية وشاملة لكل مواد الفصل'
  );
  const [bannerSubtitle, setBannerSubtitle] = useState<string>(
    config.customBannerSubtitle || config.schoolName
  );

  // App Background State (For Manager Only)
  const [isAppBackgroundEnabled, setIsAppBackgroundEnabled] = useState<boolean>(
    config.isAppBackgroundEnabled !== false
  );
  const [appBackgroundUrl, setAppBackgroundUrl] = useState<string>(
    config.appBackgroundUrl || ''
  );
  const [appBackgroundOpacity, setAppBackgroundOpacity] = useState<number>(
    config.appBackgroundOpacity !== undefined ? (config.appBackgroundOpacity > 1 ? config.appBackgroundOpacity / 100 : config.appBackgroundOpacity) : 0.9
  );
  const [appBackgroundBlur, setAppBackgroundBlur] = useState<number>(
    config.appBackgroundBlur !== undefined ? config.appBackgroundBlur : 0
  );
  const [appBackgroundTheme, setAppBackgroundTheme] = useState<string>(
    config.appBackgroundTheme || 'calm_study'
  );

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState<SchoolConfig>({ ...config });
  const [isSettingsDirty, setIsSettingsDirty] = useState<boolean>(false);
  const [showStudentCode, setShowStudentCode] = useState<boolean>(false);
  const [showManagerCode, setShowManagerCode] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Keep settingsForm and previews in sync whenever external config changes,
  // BUT NEVER overwrite what the manager is actively seeing or editing while in the settings tab!
  useEffect(() => {
    if (activeTab !== 'settings') {
      setSettingsForm({ ...config });
      setIsSettingsDirty(false);
    }
    if (config.customLogoUrl !== undefined && activeTab !== 'images') setLogoPreview(config.customLogoUrl);
    if (config.customBannerUrl !== undefined && activeTab !== 'images') setBannerPreview(config.customBannerUrl);
    if (config.customBannerTitle && activeTab !== 'images') setBannerTitle(config.customBannerTitle);
    if (config.customBannerSubtitle && activeTab !== 'images') setBannerSubtitle(config.customBannerSubtitle);
    if (config.isAppBackgroundEnabled !== undefined && activeTab !== 'images') {
      setIsAppBackgroundEnabled(config.isAppBackgroundEnabled !== false);
    }
    if (config.appBackgroundUrl !== undefined && activeTab !== 'images') {
      setAppBackgroundUrl(config.appBackgroundUrl || '');
    }
    if (config.appBackgroundOpacity !== undefined && activeTab !== 'images') {
      setAppBackgroundOpacity(config.appBackgroundOpacity > 1 ? config.appBackgroundOpacity / 100 : config.appBackgroundOpacity);
    }
    if (config.appBackgroundBlur !== undefined && activeTab !== 'images') {
      setAppBackgroundBlur(config.appBackgroundBlur);
    }
    if (config.appBackgroundTheme !== undefined && activeTab !== 'images') {
      setAppBackgroundTheme(config.appBackgroundTheme);
    }
  }, [config, activeTab]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Backup State & Handlers (نسخة احتياطية للبرنامج)
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const fileInputBackupRef = React.useRef<HTMLInputElement | null>(null);

  const handleDownloadBackup = async () => {
    setIsExportingBackup(true);
    try {
      const res = await storageService.downloadBackupFile();
      showToast(`تم تنزيل النسخة الاحتياطية بنجاح (${res.filename})`);
    } catch (err: any) {
      alert('حدث خطأ أثناء تنزيل النسخة الاحتياطية: ' + (err.message || 'خطأ'));
    } finally {
      setIsExportingBackup(false);
    }
  };

  const handleRestoreFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const studentCount = Array.isArray(parsed.students) ? parsed.students.length : 0;
      const summaryCount = Array.isArray(parsed.summaries) ? parsed.summaries.length : 0;

      const confirmMsg = `تنبيه أمان للمدير:\n\nهل أنت متأكد من استعادة هذه النسخة الاحتياطية؟\n\n• عدد الطلاب: ${studentCount}\n• عدد الملخصات: ${summaryCount}\n• المدرسة: ${parsed.config?.schoolName || 'مدرسة عبد الملك بن مروان'}\n\nسيتم تطبيق وتثبيت كافة بيانات هذه النسخة على النظام مباشرة لجميع الجوالات.`;
      
      if (!confirm(confirmMsg)) {
        if (e.target) e.target.value = '';
        return;
      }

      setIsRestoringBackup(true);
      const res = await storageService.restoreBackupFromFile(text);
      if (e.target) e.target.value = '';
      onRefreshStudents();
      onRefreshSummaries();
      if (parsed.config) {
        onUpdateConfig(parsed.config);
      }
      showToast(res.message);
      alert(`تمت استعادة النسخة الاحتياطية بنجاح!\n\nتم استرجاع ${res.studentsCount} طالب و ${res.summariesCount} ملخص مع تثبيت كافة الإعدادات.`);
    } catch (err: any) {
      console.error(err);
      alert('فشل استعادة الملف: تأكد من اختيار ملف نسخة احتياطية صالح بتنسيق JSON.');
    } finally {
      setIsRestoringBackup(false);
      if (e.target) e.target.value = '';
    }
  };

  // Media Handlers
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setLogoPreview(loadEvt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setBannerPreview(loadEvt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setAppBackgroundUrl(loadEvt.target?.result as string);
      setAppBackgroundTheme('custom');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveMedia = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SchoolConfig = {
      ...config,
      customLogoUrl: logoPreview.trim(),
      customBannerUrl: bannerPreview.trim(),
      customBannerTitle: bannerTitle.trim(),
      customBannerSubtitle: bannerSubtitle.trim(),
      isAppBackgroundEnabled: isAppBackgroundEnabled,
      appBackgroundUrl: appBackgroundUrl.trim(),
      appBackgroundOpacity: appBackgroundOpacity,
      appBackgroundBlur: appBackgroundBlur,
      appBackgroundTheme: appBackgroundTheme as any,
    };
    storageService.saveConfig(updated);
    onUpdateConfig(updated);
    showToast('تم حفظ وتحديث الشعار وصور الغلاف وخلفية الواجهة بنجاح!');
  };

  const handleResetLogo = () => {
    setLogoPreview('');
  };

  const handleResetBanner = () => {
    setBannerPreview('');
    setBannerTitle('ملخصات وافية وشاملة لكل مواد الفصل');
    setBannerSubtitle(config.schoolName);
  };

  // --- Student Handlers ---
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentFullName.trim() || !studentUsername.trim() || !studentPassword.trim()) {
      alert('يرجى تعبئة كافة الحقول المطلوبة');
      return;
    }

    setIsSavingStudent(true);
    try {
      if (editingStudentId) {
        await storageService.updateStudent(editingStudentId, {
          fullName: studentFullName.trim(),
          username: studentUsername.trim(),
          password: studentPassword.trim(),
          grade: studentGrade,
        });
        showToast('تم تحديث بيانات الطالب بنجاح ونشرها لجميع الجوالات فوراً');
        setEditingStudentId(null);
      } else {
        // Check if username already exists
        const exists = students.some(
          (s) => s.username.toLowerCase() === studentUsername.trim().toLowerCase()
        );
        if (exists) {
          alert('اسم المستخدم هذا مستخدم مسبقاً، يرجى اختيار اسم مستخدم آخر.');
          setIsSavingStudent(false);
          return;
        }

        await storageService.addStudent({
          fullName: studentFullName.trim(),
          username: studentUsername.trim(),
          password: studentPassword.trim(),
          grade: studentGrade,
        });
        showToast(`تم تسجيل الطالب ${studentFullName} بنجاح! ونشره لجميع الجوالات فوراً.`);
      }

      // Reset form
      setStudentFullName('');
      setStudentUsername('');
      setStudentPassword('');
      setIsAddingStudent(false);
      onRefreshStudents();
    } catch (err) {
      console.error('Error saving student:', err);
      alert('حدث خطأ أثناء حفظ بيانات الطالب، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSavingStudent(false);
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudentId(student.id);
    setStudentFullName(student.fullName);
    setStudentUsername(student.username);
    setStudentPassword(student.password);
    setStudentGrade(student.grade);
    setIsAddingStudent(true);
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف الطالب (${name})؟ لن يتمكن من تسجيل الدخول بعد الحذف.`)) {
      await storageService.deleteStudent(id);
      showToast('تم حذف الطالب من النظام وتحديث جميع الجوالات.');
      onRefreshStudents();
    }
  };

  // Helper to optimize and downscale phone camera photos before upload
  const compressImageFile = async (file: File): Promise<{ base64: string; mimeType: string }> => {
    if (!file.type.startsWith('image/')) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ base64: reader.result as string, mimeType: file.type || 'application/pdf' });
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        let width = img.width;
        let height = img.height;
        const maxDim = 1600;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const base64 = canvas.toDataURL(mime, 0.88);
          resolve({ base64, mimeType: mime });
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve({ base64: reader.result as string, mimeType: file.type });
        reader.readAsDataURL(file);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        const reader = new FileReader();
        reader.onload = () => resolve({ base64: reader.result as string, mimeType: file.type });
        reader.readAsDataURL(file);
      };
      img.src = objectUrl;
    });
  };

  // --- Summary & Files Handlers ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachmentName(file.name);
    const isImg = file.type.startsWith('image/');
    const isDoc = file.name.endsWith('.doc') || file.name.endsWith('.docx') || file.name.endsWith('.ppt') || file.name.endsWith('.pptx');
    const computedType = isImg ? 'image' : isDoc ? 'document' : 'pdf';
    setAttachmentType(computedType);

    setIsUploadingFile(true);
    try {
      const { base64, mimeType } = await compressImageFile(file);
      setAttachmentBase64(base64);

      // Upload file directly to server so it is saved to disk and served via /uploads/
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: mimeType,
          fileData: base64,
        }),
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          setAttachmentUrl(uploadData.url);
          showToast(`تم رفع وحفظ ${isImg ? 'الصورة' : 'الملف'} بنجاح: ${file.name}`);
        }
      }
    } catch (err) {
      console.warn('File upload warning:', err);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleSaveSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    // Guard against duplicate / rapid submissions
    if (isSubmittingSummaryRef.current) return;

    if (isUploadingFile) {
      alert('جارِ استكمال رفع وحفظ الملف على الخادم، يرجى الانتظار ثوانٍ قليلة ثم النقر على نشر.');
      return;
    }

    const finalTitle = summaryTitle.trim() || (attachmentName ? attachmentName.replace(/\.[^/.]+$/, '') : '');
    if (!finalTitle && !attachmentName) {
      alert('يرجى كتابة عنوان الملخص أو إرفاق ملف للطلاب.');
      return;
    }

    const finalText = summaryText.trim() || (attachmentName ? `مرفق ملف تعليمي: ${attachmentName}` : `محتوى دراسي معتمد لصف ${summaryGrade}`);

    isSubmittingSummaryRef.current = true;
    setIsSubmittingSummary(true);
    try {
      await storageService.addSummary({
        title: finalTitle,
        grade: summaryGrade,
        subject: summarySubject,
        category: summaryCategory,
        summaryText: finalText,
        attachmentUrl: attachmentUrl || attachmentBase64 || undefined,
        attachmentData: attachmentBase64 || undefined,
        attachmentType: attachmentType !== 'none' ? attachmentType : 'none',
        attachmentName: attachmentName || undefined,
        isImportant: summaryIsImportant,
        isExclusive: summaryIsImportant,
        requiresStudentInfo: summaryRequiresStudentInfo,
      });

      showToast(summaryIsImportant 
        ? `تم نشر «الملخص المهم» وتعميمه على جميع الجوالات بنجاح! متاح حصرياً للطلاب المسجلين.` 
        : `تم نشر الملخص وتعميمه على جميع الجوالات بنجاح!`
      );
      setSummaryTitle('');
      setSummaryText('');
      setAttachmentUrl('');
      setAttachmentBase64('');
      setAttachmentName('');
      setAttachmentType('none');
      setSummaryIsImportant(true);
      setIsAddingSummary(false);
      onRefreshSummaries();
    } catch (err) {
      console.error('Failed to publish summary:', err);
      alert('حدث خطأ أثناء نشر الملخص، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmittingSummary(false);
      isSubmittingSummaryRef.current = false;
    }
  };

  const handleToggleImportant = (id: string, current: boolean) => {
    storageService.updateSummary(id, {
      isImportant: !current,
      isExclusive: !current,
    });
    showToast(!current 
      ? 'تم تصنيف المحتوى كـ «ملخص مهم» متاح حصرياً للطلاب المسجلين.' 
      : 'تم تحويل المحتوى إلى ملخص عام متاح للجميع.'
    );
    onRefreshSummaries();
  };

  const handleDeleteSummary = async (id: string, title: string) => {
    if (confirm(`هل أنت متأكد من حذف هذا الملخص (${title})؟`)) {
      await storageService.deleteSummary(id);
      showToast('تم حذف الملخص وتعميم الحذف على جميع الجوالات بنجاح.');
      onRefreshSummaries();
    }
  };

  // --- Settings Handlers ---
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!settingsForm.studentSchoolCode.trim() || !settingsForm.managerSchoolCode.trim()) {
      alert('يرجى إدخال رمز المدرسة ورمز المدير وعدم تركهما فارغين.');
      return;
    }
    const updated: SchoolConfig = {
      ...config,
      ...settingsForm,
      studentSchoolCode: settingsForm.studentSchoolCode.trim(),
      managerSchoolCode: settingsForm.managerSchoolCode.trim(),
      authorName: (settingsForm.authorName || config.authorName || '').trim() || 'صهيب القحطاني',
      schoolName: (settingsForm.schoolName || config.schoolName || '').trim() || 'مدرسة عبد الملك بن مروان',
      isManagerConfigured: true,
      lastUpdatedTimestamp: Date.now(),
    };
    setIsSettingsDirty(false);
    setSettingsForm(updated);
    await storageService.saveConfig(updated);
    onUpdateConfig(updated);
    showToast('تم حفظ وتثبيت كافة بيانات المدرسة ورمز المدير بشكل دائم ومطلق!');
  };

  const handleAutoSaveField = async (field: keyof SchoolConfig, val: string) => {
    const updated: SchoolConfig = {
      ...config,
      ...settingsForm,
      [field]: val.trim(),
      isManagerConfigured: true,
      lastUpdatedTimestamp: Date.now(),
    };
    setSettingsForm(updated);
    await storageService.saveConfig(updated);
    onUpdateConfig(updated);
    showToast(`تم حفظ وتثبيت (${field === 'authorName' ? 'اسم المشرف' : field === 'schoolName' ? 'اسم المدرسة' : 'البيانات'}) بنجاح!`);
  };

  const handleUpdateLoginMode = async (mode: 'code_only' | 'full_credentials') => {
    const updated: SchoolConfig = {
      ...config,
      ...settingsForm,
      studentLoginMode: mode,
      isManagerConfigured: true,
      lastUpdatedTimestamp: Date.now(),
    };
    setSettingsForm(updated);
    await storageService.saveConfig(updated);
    onUpdateConfig(updated);
    showToast(
      mode === 'code_only'
        ? 'تم تثبيت الدخول: الآن يمكن للطلاب الدخول برمز المدرسة فقط!'
        : 'تم تثبيت الدخول: الآن يشترط اسم المستخدم وكلمة المرور مع رمز المدرسة!'
    );
  };

  const handleToggleSettingInstant = async (
    field: keyof SchoolConfig,
    value: any,
    toastMsg: string
  ) => {
    const updated: SchoolConfig = {
      ...config,
      ...settingsForm,
      [field]: value,
      isManagerConfigured: true,
      lastUpdatedTimestamp: Date.now(),
    };
    if (field === 'isAppBackgroundEnabled') {
      setIsAppBackgroundEnabled(value !== false);
    }
    setSettingsForm(updated);
    await storageService.saveConfig(updated);
    onUpdateConfig(updated);
    showToast(toastMsg);
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.username.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesGrade = studentGradeFilter === 'الكل' || s.grade === studentGradeFilter;
    return matchesSearch && matchesGrade;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-900 text-white px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold border border-emerald-700 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Dashboard Top bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-700 font-bold mb-1">
            <School className="w-4 h-4" />
            <span>لوحة الإدارة والتحكم الشاملة</span>
          </div>
          <h1 className="text-xl font-black text-slate-900">
            لوحة تحكم المدير - {config.schoolName}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة الطلاب والأسماء، تعديل رمز المدرسة، وإضافة الملفات والصور والملخصات المعتمدة (من السادس إلى الثالث المتوسط).
          </p>
        </div>

        {/* Tab switcher: 2x2 grid on mobile so no tabs are cut off, flex on desktop */}
        <div className="w-full lg:w-auto grid grid-cols-2 sm:grid-cols-4 lg:flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black transition-all text-center ${
              activeTab === 'students'
                ? 'bg-white text-emerald-950 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="truncate">إدارة الطلاب ({students.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('summaries')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black transition-all text-center ${
              activeTab === 'summaries'
                ? 'bg-white text-emerald-950 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <FilePlus className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="truncate">الملفات والملخصات ({summaries.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('images')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black transition-all text-center ${
              activeTab === 'images'
                ? 'bg-white text-emerald-950 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Palette className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="truncate">تعديل الشعار والصور</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black transition-all text-center ${
              activeTab === 'settings'
                ? 'bg-white text-emerald-950 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Settings className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="truncate">إعدادات ورموز المدرسة</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black transition-all text-center cursor-pointer ${
              activeTab === 'backup'
                ? 'bg-white text-emerald-950 shadow-xs border border-slate-200 ring-1 ring-emerald-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="truncate">نسخة احتياطية للبرنامج</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cctv')}
            className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all text-center cursor-pointer ${
              activeTab === 'cctv'
                ? 'bg-slate-950 text-emerald-400 shadow-md border-2 border-red-500 ring-2 ring-red-500/20'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <Video className="w-4 h-4 text-red-500 shrink-0 animate-pulse" />
            <span className="truncate flex items-center gap-1.5">
              <span>كاميرات المراقبة الحية</span>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: STUDENTS MANAGEMENT */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Manager Student Registration Method Selector Card */}
          <div className="bg-white p-5 rounded-2xl border-2 border-emerald-600/70 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    خانة طريقة تسجيل ودخول الطلاب للمنصة
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    اختر الطريقة المعتمدة لدخول الطلاب: هل يسجل الطالب برمز المدرسة فقط، أو باسم المستخدم مع كلمة المرور ورمز المدرسة.
                  </p>
                </div>
              </div>

              <div className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full w-fit">
                النظام النشط: {config.studentLoginMode === 'code_only' ? 'رمز المدرسة فقط' : 'اسم المستخدم + كلمة المرور + رمز المدرسة'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Option 1: School Code Only */}
              <div
                onClick={() => handleUpdateLoginMode('code_only')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  config.studentLoginMode === 'code_only'
                    ? 'bg-emerald-50/90 border-emerald-600 shadow-xs ring-1 ring-emerald-600/20'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="tab1StudentLoginMode"
                  checked={config.studentLoginMode === 'code_only'}
                  onChange={() => handleUpdateLoginMode('code_only')}
                  className="w-4 h-4 mt-0.5 accent-emerald-700 cursor-pointer shrink-0"
                />
                <div className="space-y-1">
                  <div className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                    <span>دخول برمز المدرسة فقط</span>
                    {config.studentLoginMode === 'code_only' && (
                      <span className="text-[10px] bg-emerald-700 text-white font-bold px-2 py-0.5 rounded-full">
                        مفعل حالياً
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    يكتفي الطالب بإدخال رمز المدرسة المعتمد للطلاب فقط للدخول مباشرة إلى المنصة والملخصات المهمة دون الحاجة لاسم مستخدم أو كلمة مرور.
                  </p>
                </div>
              </div>

              {/* Option 2: Full Credentials */}
              <div
                onClick={() => handleUpdateLoginMode('full_credentials')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                  config.studentLoginMode !== 'code_only'
                    ? 'bg-emerald-50/90 border-emerald-600 shadow-xs ring-1 ring-emerald-600/20'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="tab1StudentLoginMode"
                  checked={config.studentLoginMode !== 'code_only'}
                  onChange={() => handleUpdateLoginMode('full_credentials')}
                  className="w-4 h-4 mt-0.5 accent-emerald-700 cursor-pointer shrink-0"
                />
                <div className="space-y-1">
                  <div className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                    <span>اسم المستخدم + كلمة المرور + رمز المدرسة</span>
                    {config.studentLoginMode !== 'code_only' && (
                      <span className="text-[10px] bg-emerald-700 text-white font-bold px-2 py-0.5 rounded-full">
                        مفعل حالياً
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    يشترط تسجيل بيانات الطالب مسبقاً من قِبل المدير في الجدول أدناه، ويدخل الطالب اسمه وكلمة المرور الخاصة به مع رمز المدرسة.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Backup button */}
          <div className="bg-slate-50 border border-slate-200 p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-800 font-bold">
              <Users className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                إجمالي الطلاب المسجلين: {students.length} طالب
              </span>
            </div>
            <button
              type="button"
              onClick={handleDownloadBackup}
              disabled={isExportingBackup}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-black text-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل نسخة احتياطية للبرنامج</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative min-w-[200px] flex-1 max-w-sm">
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="ابحث بالاسم أو اسم المستخدم..."
                  className="w-full pl-3 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:border-emerald-600"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              </div>

              {/* Grade filter pills */}
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => setStudentGradeFilter('الكل')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    studentGradeFilter === 'الكل'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  الكل ({students.length})
                </button>
                {AVAILABLE_GRADES.map((g) => {
                  const count = students.filter((s) => s.grade === g).length;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setStudentGradeFilter(g)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        studentGradeFilter === g
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {g} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => {
                setEditingStudentId(null);
                setStudentFullName('');
                setStudentUsername('');
                setStudentPassword('');
                setStudentGrade(config.defaultGrade || 'ثاني متوسط');
                setIsAddingStudent(!isAddingStudent);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddingStudent ? 'إلغاء' : 'إضافة طالب جديد'}</span>
            </button>
          </div>

          {/* Add / Edit Student Modal / Panel */}
          {isAddingStudent && (
            <div className="bg-white p-6 rounded-2xl border-2 border-emerald-500 shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="font-bold text-sm text-slate-900">
                  {editingStudentId ? 'تعديل بيانات الطالب' : 'تسجيل طالب جديد في النظام'}
                </h3>
                <button
                  onClick={() => setIsAddingStudent(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveStudent} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الاسم الكامل / الرباعي للطالب
                  </label>
                  <input
                    type="text"
                    required
                    value={studentFullName}
                    onChange={(e) => setStudentFullName(e.target.value)}
                    placeholder="مثال: عبد الله بن خالد الشمري"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الصف الدراسي
                  </label>
                  <select
                    value={studentGrade}
                    onChange={(e) => setStudentGrade(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-600 font-semibold"
                  >
                    {AVAILABLE_GRADES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اسم المستخدم للدخول
                  </label>
                  <input
                    type="text"
                    required
                    value={studentUsername}
                    onChange={(e) => setStudentUsername(e.target.value)}
                    placeholder="مثال: abdullah2026"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-600 font-mono"
                  />
                  <span className="text-[10px] text-slate-400">
                    هذا الاسم سيستخدمه الطالب عند تسجيل الدخول
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    كلمة المرور
                  </label>
                  <input
                    type="text"
                    required
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="مثال: 123456"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-600 font-mono"
                  />
                  <span className="text-[10px] text-slate-400">
                    رمز المدرسة للطلاب يتم ضبطه من تبويب إعدادات المدرسة
                  </span>
                </div>

                <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingStudent(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    {editingStudentId ? 'تحديث البيانات' : 'حفظ وتسجيل الطالب'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Students List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {students.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">
                  الموقع خالي من الأسماء التجريبية (مرتب ومنظم)
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  بناءً على طلبك، تم إفراغ النظام من أي أسماء وهمية. يمكنك الآن تسجيل الطلاب الحقيقيين بالنقر على زر &quot;إضافة طالب جديد&quot; أعلاه ليتمكنوا من الدخول إلى المنصة.
                </p>
                <button
                  onClick={() => setIsAddingStudent(true)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>تسجيل أول طالب الآن</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-bold">اسم الطالب الكامل</th>
                      <th className="py-3 px-4 font-bold">الصف</th>
                      <th className="py-3 px-4 font-bold">اسم المستخدم</th>
                      <th className="py-3 px-4 font-bold">كلمة المرور</th>
                      <th className="py-3 px-4 font-bold">تاريخ التسجيل</th>
                      <th className="py-3 px-4 font-bold text-left">إجراءات المدير</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {filteredStudents.map((student) => {
                      const isOnline = onlineStudentIds.includes(student.id);
                      return (
                        <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div className="flex flex-col gap-1 items-start">
                              <span className="font-extrabold text-slate-900">{student.fullName}</span>
                              {isOnline ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                  <span>متاح الآن</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                  <span>غير متاح</span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-emerald-800 font-semibold">
                            {student.grade}
                          </td>
                        <td className="py-3.5 px-4 font-mono">{student.username}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">{student.password}</td>
                        <td className="py-3.5 px-4 text-slate-400">{student.registeredAt}</td>
                        <td className="py-3.5 px-4 text-left">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleEditStudent(student)}
                              className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title="تعديل بيانات الطالب"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(student.id, student.fullName)}
                              className="p-1.5 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="حذف الطالب"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SUMMARIES & FILES MANAGEMENT */}
      {activeTab === 'summaries' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                ملخصات ومذكرات الطلاب المعتمدة (من السادس إلى الثالث المتوسط)
              </h3>
              <p className="text-xs text-slate-500">
                أضف ملخصات أو صور مذكرات أو ملفات تظهر فوراً للطلاب في المنصة.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const newVal = !Boolean(config.isLatestSpotlightEnabled);
                  const updated: SchoolConfig = {
                    ...config,
                    isLatestSpotlightEnabled: newVal,
                    isManagerConfigured: true,
                    lastUpdatedTimestamp: Date.now(),
                  };
                  setSettingsForm((prev) => ({ ...prev, isLatestSpotlightEnabled: newVal }));
                  storageService.saveConfig(updated);
                  onUpdateConfig(updated);
                  showToast(
                    newVal
                      ? 'تم إظهار خانة «أحدث أوراق العمل والملخصات» للطلاب بنجاح!'
                      : 'تم إخفاء خانة «أحدث أوراق العمل والملخصات» عن الطلاب بنجاح!'
                  );
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                  Boolean(config.isLatestSpotlightEnabled)
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                }`}
                title="التحكم في ظهور أو إخفاء خانة أحدث أوراق العمل والملخصات"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {Boolean(config.isLatestSpotlightEnabled)
                    ? 'خانة أحدث المواد: ظاهرة'
                    : 'خانة أحدث المواد: مخفية'}
                </span>
              </button>

              <button
                onClick={() => setIsAddingSummary(!isAddingSummary)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isAddingSummary ? 'إلغاء' : 'إضافة ملخص / ملف جديد'}</span>
              </button>
            </div>
          </div>

          {/* Add Summary Form */}
          {isAddingSummary && (
            <div className="bg-white p-6 rounded-2xl border-2 border-emerald-500 shadow-md">
              <h3 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100 mb-4">
                إضافة ملخص دراسي جديد
              </h3>

              <form onSubmit={handleSaveSummary} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      الصف الدراسي
                    </label>
                    <select
                      value={summaryGrade}
                      onChange={(e) => setSummaryGrade(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-emerald-600"
                    >
                      {AVAILABLE_GRADES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      المادة الدراسية
                    </label>
                    <select
                      value={summarySubject}
                      onChange={(e) => setSummarySubject(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-emerald-600"
                    >
                      <option value="العلوم">العلوم</option>
                      <option value="الرياضيات">الرياضيات</option>
                      <option value="لغتي الخالدة">لغتي الخالدة</option>
                      <option value="الاجتماعيات">الاجتماعيات</option>
                      <option value="الدراسات الإسلامية">الدراسات الإسلامية</option>
                      <option value="اللغة الإنجليزية">اللغة الإنجليزية</option>
                      <option value="المهارات الرقمية">المهارات الرقمية</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      القسم / الخانة
                    </label>
                    <select
                      value={summaryCategory}
                      onChange={(e) => setSummaryCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-950 focus:bg-white focus:border-emerald-600"
                    >
                      <option value="ملخصات">ملخصات (تظهر في خانة الملخصات)</option>
                      <option value="أوراق عمل">أوراق عمل (تظهر في خانة أوراق العمل فقط)</option>
                      <option value="الكتب الدراسية">الكتب الدراسية (تظهر في خانة الكتب الدراسية فقط)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    عنوان الملخص أو المادة / الدرس <span className="text-[10px] text-slate-400 font-normal">(أو سيعتمد اسم الملف المرفق)</span>
                  </label>
                  <input
                    type="text"
                    value={summaryTitle}
                    onChange={(e) => setSummaryTitle(e.target.value)}
                    placeholder="مثال: ورقة عمل مادة العلوم - الجدول الدوري والعناصر"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    نص ومحتوى الملخص <span className="text-[10px] text-slate-400 font-normal">(اختياري في حال إرفاق ملف)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={summaryText}
                    onChange={(e) => setSummaryText(e.target.value)}
                    placeholder="اكتب نقاط الملخص أو التعاريف هنا، أو اتركها واكتفِ بإرفاق ملف الـ PDF أو الصورة أو ورقة العمل أدناه..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-600 leading-relaxed"
                  />
                </div>

                {/* Exclusive Important Summaries Toggle */}
                <div className="bg-amber-50/90 p-4 rounded-xl border border-amber-300 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="managerIsImportantToggle"
                    checked={summaryIsImportant}
                    onChange={(e) => setSummaryIsImportant(e.target.checked)}
                    className="w-4 h-4 text-amber-700 rounded mt-0.5 accent-amber-600 cursor-pointer shrink-0"
                  />
                  <label htmlFor="managerIsImportantToggle" className="text-xs text-amber-950 cursor-pointer space-y-1">
                    <div className="font-extrabold flex items-center gap-1.5 text-amber-900">
                      <span>⭐ محتوى مهم (متاح حصرياً للطلاب المسجلين بعد تسجيل الدخول)</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      عند تحديد هذا الخيار، يتم قفل المحتوى بعلامة النجمة ولا يفتح للزائر إلا بعد تسجيل الدخول بحسابه كطالب مسجل.
                    </p>
                  </label>
                </div>

                {/* Require Student Info on Download for this Summary */}
                <div className="bg-emerald-50/90 p-4 rounded-xl border border-emerald-300 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="managerRequiresStudentInfoToggle"
                    checked={summaryRequiresStudentInfo}
                    onChange={(e) => setSummaryRequiresStudentInfo(e.target.checked)}
                    className="w-4 h-4 text-emerald-700 rounded mt-0.5 accent-emerald-600 cursor-pointer shrink-0"
                  />
                  <label htmlFor="managerRequiresStudentInfoToggle" className="text-xs text-emerald-950 cursor-pointer space-y-1">
                    <div className="font-extrabold flex items-center gap-1.5 text-emerald-900">
                      <span>📄 توثيق بيانات الطالب (اسم الطالب + المدرسة + المعلم) قبل تنزيل الملف</span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                        خيار حر للمدير
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      عند تحديد هذا الخيار، سيُطلب من الطالب كتابة اسمه ومدرسته ومعلمه قبل تنزيل هذا الملف وطباعته معتمداً في الموضع الذي حددته. يمكنك إلغاؤه للسماح بالتنزيل المباشر لهذا الملف دون كتابة بيانات.
                    </p>
                  </label>
                </div>

                {/* Upload Image or File */}
                <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Upload className="w-4 h-4 text-emerald-700" />
                      <span>إرفاق ملف ورقة عمل، PDF، مستند، أو صورة دراسية</span>
                    </div>
                    {isUploadingFile && (
                      <span className="text-[11px] text-amber-700 font-bold flex items-center gap-1 animate-pulse">
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        <span>جاري رفع وتخزين الملف...</span>
                      </span>
                    )}
                  </div>

                  <input
                    type="file"
                    accept="application/pdf,image/*,.doc,.docx,.ppt,.pptx"
                    onChange={handleFileUpload}
                    className="text-xs text-slate-600 file:mr-0 file:ml-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-700 file:text-white hover:file:bg-emerald-800 cursor-pointer"
                  />

                  {attachmentName && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 font-semibold">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>الملف المرفق: <strong>{attachmentName}</strong></span>
                      </div>
                      {attachmentUrl && (
                        <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                          محفوظ على الخادم
                        </span>
                      )}
                    </div>
                  )}

                  {attachmentBase64 && attachmentType === 'image' && (
                    <div className="mt-2 w-32 h-32 rounded-lg overflow-hidden border border-slate-200">
                      <img src={attachmentBase64} alt="معاينة المرفق" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={isSubmittingSummary || isUploadingFile}
                    onClick={() => setIsAddingSummary(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingSummary || isUploadingFile}
                    className={`px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all ${
                      isSubmittingSummary || isUploadingFile ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'
                    }`}
                  >
                    {isSubmittingSummary ? (
                      <>
                        <RotateCcw className="w-4 h-4 animate-spin" />
                        <span>جاري نشر وتعميم الملخص...</span>
                      </>
                    ) : isUploadingFile ? (
                      <>
                        <RotateCcw className="w-4 h-4 animate-spin" />
                        <span>جاري معالجة الملف...</span>
                      </>
                    ) : (
                      <>
                        <FilePlus className="w-4 h-4" />
                        <span>نشر للطلاب الآن</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Summaries list filter header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSummaryFilterTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  summaryFilterTab === 'all'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                جميع الملخصات ({summaries.length})
              </button>
              <button
                type="button"
                onClick={() => setSummaryFilterTab('important')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  summaryFilterTab === 'important'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-100/80 text-amber-900 hover:bg-amber-200'
                }`}
              >
                <span>⭐ خانة الملخصات المهمة</span>
                <span className="bg-amber-500/20 px-1.5 py-0.5 rounded text-[11px] font-bold">
                  {summaries.filter(s => s.isImportant || s.isExclusive).length}
                </span>
              </button>

              {/* Grade filter pills for summaries */}
              <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSummaryGradeFilter('الكل')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    summaryGradeFilter === 'الكل'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  كافة الصفوف
                </button>
                {AVAILABLE_GRADES.map((g) => {
                  const count = summaries.filter(s => s.grade === g).length;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSummaryGradeFilter(g)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        summaryGradeFilter === g
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {g} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            <span className="text-[11px] text-slate-500 font-medium">
              المعروض: {summaries.filter(s => (summaryFilterTab === 'all' || s.isImportant || s.isExclusive) && (summaryGradeFilter === 'الكل' || s.grade === summaryGradeFilter)).length} ملخص
            </span>
          </div>

          {/* Summaries list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summaries
              .filter(s => (summaryFilterTab === 'all' || s.isImportant || s.isExclusive) && (summaryGradeFilter === 'الكل' || s.grade === summaryGradeFilter))
              .map((sum) => {
                const isImp = Boolean(sum.isImportant || sum.isExclusive);
                return (
                  <div
                    key={sum.id}
                    className={`p-4 rounded-xl border shadow-xs flex flex-col justify-between transition-all ${
                      isImp 
                        ? 'bg-amber-50/20 border-amber-300' 
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500 gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-emerald-800">
                            {sum.grade} · {sum.subject} · {sum.category}
                          </span>
                          {isImp && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                              ⭐ ملخص مهم
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleImportant(sum.id, isImp)}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                              isImp 
                                ? 'bg-amber-200 text-amber-950 hover:bg-amber-300' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title="تعديل صفة الملخص"
                          >
                            {isImp ? 'مهم ⭐' : 'عادي'}
                          </button>

                          <button
                            onClick={() => handleDeleteSummary(sum.id, sum.title)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="حذف هذا الملخص"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm">{sum.title}</h4>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {sum.summaryText}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span>تاريخ النشر: {sum.dateAdded}</span>
                      {sum.attachmentUrl && (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>يحتوي مرفق</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMIZE LOGO & HOME IMAGES (FOR MANAGER ONLY) */}
      {activeTab === 'images' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-8 max-w-4xl">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 mb-1">
              <Palette className="w-4 h-4" />
              <span>خاص بمدير المدرسة فقط</span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg">
              تعديل الشعار وصور الصفحة الرئيسية
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              يمكنك هنا رفع شعار المدرسة المخصص وتغيير صورة الغلاف في الواجهة الرئيسية وتعديل العناوين المصاحبة لها. تنعكس التغييرات فوراً للطلاب في المنصة.
            </p>
          </div>

          <form onSubmit={handleSaveMedia} className="space-y-8">
            {/* 1. School Logo Section */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">شعار المنصة والمدرسة</h4>
                    <p className="text-[11px] text-slate-500">يظهر في الترويسة العلوية، الفوتر، وصفحة عن المنصة</p>
                  </div>
                </div>

                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleResetLogo}
                    className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>استعادة الشعار الافتراضي</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Logo Preview */}
                <div className="w-24 h-24 rounded-2xl border-2 border-emerald-500/40 bg-white p-1 shadow-sm overflow-hidden flex items-center justify-center shrink-0">
                  <img
                    src={logoPreview || APP_IMAGES.emblem}
                    alt="معاينة الشعار"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = APP_IMAGES.publicEmblem;
                    }}
                  />
                </div>

                <div className="space-y-3 flex-1 w-full">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      رفع صورة شعار من جهازك (PNG أو JPG)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="text-xs text-slate-600 file:mr-0 file:ml-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-700 file:text-white hover:file:bg-emerald-800 cursor-pointer w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      أو وضع رابط مباشر لصورة الشعار (URL)
                    </label>
                    <input
                      type="url"
                      value={logoPreview.startsWith('data:') ? '' : logoPreview}
                      onChange={(e) => setLogoPreview(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-left focus:border-emerald-600"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Home Banner Image Section */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-teal-100 text-teal-800 rounded-lg">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">صورة غلاف الصفحة الرئيسية</h4>
                    <p className="text-[11px] text-slate-500">البانر التعليمي البارز في أعلى الصفحة الرئيسية أمام الطلاب</p>
                  </div>
                </div>

                {bannerPreview && (
                  <button
                    type="button"
                    onClick={handleResetBanner}
                    className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-semibold"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>استعادة الغلاف الافتراضي</span>
                  </button>
                )}
              </div>

              {/* Banner Preview Box */}
              <div className="w-full h-44 rounded-2xl overflow-hidden border border-slate-300 relative shadow-sm bg-emerald-950">
                <img
                  src={bannerPreview || APP_IMAGES.banner}
                  alt="معاينة الغلاف"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = APP_IMAGES.publicBanner;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-transparent flex flex-col justify-end p-4 text-white text-right">
                  <span className="text-xs font-semibold text-emerald-300">
                    {bannerSubtitle || config.schoolName}
                  </span>
                  <h4 className="text-base font-bold">
                    {bannerTitle || 'ملخصات وافية وشاملة لكل مواد الفصل'}
                  </h4>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رفع صورة غلاف جديدة من جهازك
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="text-xs text-slate-600 file:mr-0 file:ml-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-700 file:text-white hover:file:bg-emerald-800 cursor-pointer w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    أو رابط صورة الغلاف المباشر (URL)
                  </label>
                  <input
                    type="url"
                    value={bannerPreview.startsWith('data:') ? '' : bannerPreview}
                    onChange={(e) => setBannerPreview(e.target.value)}
                    placeholder="https://example.com/banner.jpg"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-left focus:border-emerald-600"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    العنوان المكتوب فوق صورة الغلاف
                  </label>
                  <input
                    type="text"
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    placeholder="مثال: ملخصات وافية وشاملة لكل مواد الفصل"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    النص الفرعي للغلاف
                  </label>
                  <input
                    type="text"
                    value={bannerSubtitle}
                    onChange={(e) => setBannerSubtitle(e.target.value)}
                    placeholder="مثال: مدرسة عبد الملك بن مروان"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: خلفية واجهة التطبيق العامة بألوان هادئة وتعليمية */}
            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                    <BookOpen className="w-5 h-5 text-amber-800" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      خلفية كاملة لواجهة التطبيق (ألوان هادئة ومريحة للعين)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      خلفية تعليمية هادئة (صورة الكتب والمكتبة كواجهة المواد الدراسية) تظهر خلف عناصر التطبيق مع الحفاظ التام على وضوح النصوص والأزرار.
                    </p>
                  </div>
                </div>

                {/* Show/Hide Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    const newVal = !isAppBackgroundEnabled;
                    setIsAppBackgroundEnabled(newVal);
                    handleToggleSettingInstant(
                      'isAppBackgroundEnabled',
                      newVal,
                      newVal ? 'تم تفعيل وإظهار خلفية واجهة التطبيق فوراً!' : 'تم إخفاء وتعطيل خلفية واجهة التطبيق فوراً!'
                    );
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isAppBackgroundEnabled
                      ? 'bg-emerald-700 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  {isAppBackgroundEnabled ? (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>الخلفية: مفعّلة ومُظهرة</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span>الخلفية: مخفية حالياً</span>
                    </>
                  )}
                </button>
              </div>

              {/* Background Theme Choices */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  اختر نمط صورة الخلفية الهادئة والمريحة للعين:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Preset 1: New Calm Study Window & Books (صورة هادئة جداً فيها كتب ونافذة وجو جميل) */}
                  <div
                    onClick={() => {
                      setAppBackgroundTheme('calm_study');
                      setAppBackgroundUrl('/images/calm_study_window_books.jpg');
                      setAppBackgroundBlur(0);
                    }}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      appBackgroundTheme === 'calm_study' || appBackgroundUrl.includes('calm_study_window_books')
                        ? 'bg-emerald-50/80 border-emerald-600 shadow-xs ring-2 ring-emerald-500/30'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">مكتب هادئ ونافذة وكتب</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        مريحة للعين ⭐
                      </span>
                    </div>
                    <div className="h-20 w-full rounded-lg overflow-hidden border border-slate-200 relative bg-emerald-950">
                      <img
                        src="/images/calm_study_window_books.jpg"
                        alt="مكتب هادئ ونافذة"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-1.5">
                        <span className="text-[10px] text-white font-semibold">نافذة مشمسة وكتب</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      طاولة دراسة هادئة بجوار نافذة مطلة على أشجار خضراء مع إضاءة صباحية مريحة.
                    </p>
                  </div>

                  {/* Preset 2: Books Study (Same as study subjects interface) */}
                  <div
                    onClick={() => {
                      setAppBackgroundTheme('books_study');
                      setAppBackgroundUrl('/images/books_study_banner.jpg');
                    }}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      appBackgroundTheme === 'books_study' && (appBackgroundUrl.includes('books_study_banner') || !appBackgroundUrl)
                        ? 'bg-amber-50/80 border-amber-600 shadow-xs ring-2 ring-amber-500/30'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">مكتبة الكتب الدراسية</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        كواجهة المواد
                      </span>
                    </div>
                    <div className="h-20 w-full rounded-lg overflow-hidden border border-slate-200 relative bg-amber-950">
                      <img
                        src="/images/books_study_banner.jpg"
                        alt="كتب دراسية"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-1.5">
                        <span className="text-[10px] text-white font-semibold">نفس صورة المواد</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      طاولة دراسة دافئة بكتب ومذكرات مدرسية وألوان هادئة ومريحة.
                    </p>
                  </div>

                  {/* Preset 3: Academic Notes & Open Books */}
                  <div
                    onClick={() => {
                      setAppBackgroundTheme('classic_library');
                      setAppBackgroundUrl('/images/educational_study_banner.jpg');
                    }}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      appBackgroundTheme === 'classic_library' || appBackgroundUrl.includes('educational_study_banner')
                        ? 'bg-teal-50/80 border-teal-600 shadow-xs ring-2 ring-teal-500/30'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">أوراق ومذكرات دراسية</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                        أكاديمية
                      </span>
                    </div>
                    <div className="h-20 w-full rounded-lg overflow-hidden border border-slate-200 relative bg-teal-950">
                      <img
                        src="/images/educational_study_banner.jpg"
                        alt="أوراق دراسية"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-1.5">
                        <span className="text-[10px] text-white font-semibold">مذكرات وأقلام</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      أجواء استذكار منظمة ومحفزة للتركيز الأكاديمي.
                    </p>
                  </div>

                  {/* Preset 4: Custom / Uploaded Image */}
                  <div
                    onClick={() => setAppBackgroundTheme('custom')}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      appBackgroundTheme === 'custom' || (!appBackgroundUrl.includes('calm_study_window_books') && !appBackgroundUrl.includes('books_study_banner') && !appBackgroundUrl.includes('educational_study_banner') && appBackgroundUrl)
                        ? 'bg-blue-50/80 border-blue-600 shadow-xs ring-2 ring-blue-500/30'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">تعديل بصورة مخصصة</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                        رفع أو رابط
                      </span>
                    </div>
                    <div className="h-20 w-full rounded-lg overflow-hidden border border-slate-200 relative bg-slate-900 flex items-center justify-center">
                      {appBackgroundUrl && !appBackgroundUrl.startsWith('/images/') ? (
                        <img src={appBackgroundUrl} alt="خلفية مخصصة" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center text-slate-400 text-[10px] font-bold p-1">
                          <Upload className="w-4 h-4 mx-auto mb-0.5 text-blue-400" />
                          <span>رفع صورة أو رابط</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      ارفع صورتك المفضلة من جهازك أو اكتب رابط صورة خارجي.
                    </p>
                  </div>
                </div>

                {/* Upload or URL fields if custom or wants to edit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      رفع صورة خلفية جديدة من جهازك
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundUpload}
                      className="text-xs text-slate-600 file:mr-0 file:ml-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-700 file:text-white hover:file:bg-amber-800 cursor-pointer w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      أو رابط صورة الخلفية المباشر (URL)
                    </label>
                    <input
                      type="url"
                      value={appBackgroundUrl.startsWith('data:') ? '' : appBackgroundUrl}
                      onChange={(e) => {
                        setAppBackgroundUrl(e.target.value);
                        setAppBackgroundTheme('custom');
                      }}
                      placeholder="https://example.com/calm-library.jpg"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-left focus:border-amber-600"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Precision 0-100 Opacity Slider (تحكم المدير بالوضوح من 0 إلى 100) */}
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-slate-900 block">
                        درجة وضوح الخلفية (من 0 إلى 100):
                      </label>
                      <p className="text-[10px] text-slate-500">
                        يمكنك زيادة الوضوح حتى 100% مع بقاء كافة النصوص والأزرار واضحة ومقروءة تماماً.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300">
                        {Math.round(appBackgroundOpacity > 1 ? appBackgroundOpacity : appBackgroundOpacity * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Range Slider 0 to 100 */}
                  <div className="space-y-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={Math.round(appBackgroundOpacity > 1 ? appBackgroundOpacity : appBackgroundOpacity * 100)}
                      onChange={(e) => setAppBackgroundOpacity(Number(e.target.value) / 100)}
                      className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>0% (مخفية)</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span className="font-bold text-emerald-700">100% (وضوح كامل 100/100)</span>
                    </div>
                  </div>

                  {/* Preset Clarity Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAppBackgroundOpacity(1.0);
                        setAppBackgroundBlur(0);
                      }}
                      className={`py-2 px-2.5 rounded-xl border transition-all cursor-pointer text-center ${
                        Math.round(appBackgroundOpacity * 100) >= 98
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-500/30'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-extrabold text-[11px]">100% وضوح كامل ⭐</div>
                      <div className="text-[9px] opacity-80 font-normal">وضوح 100 من 100 نقي</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAppBackgroundOpacity(0.8)}
                      className={`py-2 px-2.5 rounded-xl border transition-all cursor-pointer text-center ${
                        Math.round(appBackgroundOpacity * 100) >= 75 && Math.round(appBackgroundOpacity * 100) < 95
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-extrabold text-[11px]">80% وضوح عالي</div>
                      <div className="text-[9px] opacity-80 font-normal">بارزة وجميلة</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAppBackgroundOpacity(0.5)}
                      className={`py-2 px-2.5 rounded-xl border transition-all cursor-pointer text-center ${
                        Math.round(appBackgroundOpacity * 100) >= 40 && Math.round(appBackgroundOpacity * 100) < 70
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-extrabold text-[11px]">50% متوازنة</div>
                      <div className="text-[9px] opacity-80 font-normal">توازن مريح للعين</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAppBackgroundOpacity(0.2)}
                      className={`py-2 px-2.5 rounded-xl border transition-all cursor-pointer text-center ${
                        Math.round(appBackgroundOpacity * 100) < 35
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-extrabold text-[11px]">20% خفيفة</div>
                      <div className="text-[9px] opacity-80 font-normal">أقصى هدوء للنصوص</div>
                    </button>
                  </div>

                  {/* Sharpness / Blur Setting */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-700">
                      درجة نقاء الصورة والتمويه (Blur):
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[
                        { val: 0, label: '0px (نقاء تام 100% بدون غبش)' },
                        { val: 1, label: '1px (نعومة خفيفة)' },
                        { val: 2, label: '2px (تدرج ناعم)' },
                      ].map((b) => (
                        <button
                          key={b.val}
                          type="button"
                          onClick={() => setAppBackgroundBlur(b.val)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                            appBackgroundBlur === b.val
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Contrast & Text Clarity Preview Box */}
                <div className="pt-2">
                  <div className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center justify-between">
                    <span>معاينة حية لتدرج الألوان ووضوح النصوص والأزرار:</span>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      الوضوح الحالي: {Math.round(appBackgroundOpacity > 1 ? appBackgroundOpacity : appBackgroundOpacity * 100)}%
                    </span>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden p-4 sm:p-5 border border-slate-300 shadow-xs min-h-[140px] flex items-center">
                    {/* Simulated Background */}
                    {isAppBackgroundEnabled ? (
                      <>
                        <img
                          src={appBackgroundUrl || '/images/calm_study_window_books.jpg'}
                          alt="معاينة"
                          className="absolute inset-0 w-full h-full object-cover scale-105 transition-all duration-300"
                          style={{
                            opacity: appBackgroundOpacity > 1 ? appBackgroundOpacity / 100 : appBackgroundOpacity,
                            filter: `blur(${appBackgroundBlur}px)`,
                          }}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/images/calm_study_window_books.jpg';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/10 via-transparent to-slate-900/15" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-slate-100" />
                    )}

                    {/* Content card on top demonstrating crisp readability */}
                    <div className="relative z-10 w-full bg-white/95 backdrop-blur-md p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1 text-right">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>نصوص واضحة ومقروءة 100% بدون أي تأثر</span>
                        </div>
                        <h5 className="text-sm font-extrabold text-slate-900">
                          منصة {config.platformTitle} - {config.schoolName}
                        </h5>
                        <p className="text-[11px] text-slate-600">
                          كافة البطاقات والأزرار تحتفظ بتباينها الكامل وراحتها للعين حتى مع وضوح 100%.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-3 py-1.5 bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs">
                          زر أساسي واضح
                        </span>
                        <span className="px-3 py-1.5 bg-white text-slate-800 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs">
                          أيقونة وزر
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>حفظ وتطبيق الشعار وصور الغلاف وخلفية الواجهة فوراً</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: SETTINGS & SCHOOL CODES */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-2xl space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              تعديل رمز المدرسة وبيانات المنصة
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              يمكن للمدير تعديل رمز المدرسة للطلاب، ورمز مدرسة المدير، وبيانات المدرسة والفوتر.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4" autoComplete="off">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <h4 className="font-bold text-xs text-slate-900">إعدادات المدرسة ورموز الدخول</h4>
                <p className="text-[10px] text-slate-500">حفظ وتعميم التعديلات على كافة الجوالات المتصلة</p>
              </div>
              <button
                type="button"
                onClick={() => handleSaveSettings()}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Student School Code */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    رمز المدرسة للطلاب
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsDirty(true);
                      setSettingsForm((prev) => ({ ...prev, studentSchoolCode: '' }));
                    }}
                    className="text-[10px] text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                  >
                    مسح الرمز وكتابة جديد
                  </button>
                </div>

                <div className="relative flex items-center">
                  <input
                    type={showStudentCode ? 'text' : 'password'}
                    required
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-lpignore="true"
                    data-form-type="other"
                    name="customStudentSchoolCode"
                    id="customStudentSchoolCode"
                    value={settingsForm.studentSchoolCode}
                    onChange={(e) => {
                      setIsSettingsDirty(true);
                      setSettingsForm({ ...settingsForm, studentSchoolCode: e.target.value });
                    }}
                    onBlur={(e) => {
                      if (e.target.value.trim()) {
                        handleAutoSaveField('studentSchoolCode', e.target.value);
                      }
                    }}
                    placeholder="اكتب رمز المدرسة الجديد هنا..."
                    className="w-full pl-20 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold tracking-wider text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                  />
                  <KeyRound className="w-4 h-4 text-emerald-700 absolute right-3 pointer-events-none" />

                  <div className="absolute left-2 flex items-center gap-1">
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowStudentCode(!showStudentCode)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition-colors"
                      title={showStudentCode ? 'إخفاء الرمز' : 'إظهار الرمز'}
                    >
                      {showStudentCode ? (
                        <EyeOff className="w-4 h-4 text-emerald-700" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  الرمز الذي يطلبه النظام من الطالب للدخول إلى المنصة
                </span>
              </div>

              {/* Manager School Code */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    رمز مدرسة المدير
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsDirty(true);
                      setSettingsForm((prev) => ({ ...prev, managerSchoolCode: '' }));
                    }}
                    className="text-[10px] text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                  >
                    مسح الرمز وكتابة جديد
                  </button>
                </div>

                <div className="relative flex items-center">
                  <input
                    type={showManagerCode ? 'text' : 'password'}
                    required
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-lpignore="true"
                    data-form-type="other"
                    name="customManagerSchoolCode"
                    id="customManagerSchoolCode"
                    value={settingsForm.managerSchoolCode}
                    onChange={(e) => {
                      setIsSettingsDirty(true);
                      setSettingsForm({ ...settingsForm, managerSchoolCode: e.target.value });
                    }}
                    onBlur={(e) => {
                      if (e.target.value.trim()) {
                        handleAutoSaveField('managerSchoolCode', e.target.value);
                      }
                    }}
                    placeholder="اكتب رمز المدير الجديد هنا..."
                    className="w-full pl-20 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold tracking-wider text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                  />
                  <KeyRound className="w-4 h-4 text-amber-600 absolute right-3 pointer-events-none" />

                  <div className="absolute left-2 flex items-center gap-1">
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowManagerCode(!showManagerCode)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition-colors"
                      title={showManagerCode ? 'إخفاء الرمز' : 'إظهار الرمز'}
                    >
                      {showManagerCode ? (
                        <EyeOff className="w-4 h-4 text-amber-700" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  الرمز الوحيد المطلوب لدخول المدير إلى لوحة التحكم
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    اسم المدرسة
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold">حفظ تلقائي عند التغيير</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={settingsForm.schoolName || ''}
                    onChange={(e) => {
                      setIsSettingsDirty(true);
                      setSettingsForm({ ...settingsForm, schoolName: e.target.value });
                    }}
                    onBlur={(e) => handleAutoSaveField('schoolName', e.target.value)}
                    placeholder="مثال: مدرسة عبد الملك بن مروان"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => handleAutoSaveField('schoolName', settingsForm.schoolName || '')}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                  >
                    تثبيت
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    اسم المشرف / إعداد
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold">حفظ تلقائي عند التغيير</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={settingsForm.authorName || ''}
                    onChange={(e) => {
                      setIsSettingsDirty(true);
                      setSettingsForm({ ...settingsForm, authorName: e.target.value });
                    }}
                    onBlur={(e) => handleAutoSaveField('authorName', e.target.value)}
                    placeholder="مثال: صهيب القحطاني"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:border-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => handleAutoSaveField('authorName', settingsForm.authorName || '')}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                  >
                    تثبيت
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  السنة الميلادية لحقوق الطبع
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.yearGregorian || ''}
                  onChange={(e) => {
                    setIsSettingsDirty(true);
                    setSettingsForm({ ...settingsForm, yearGregorian: e.target.value });
                  }}
                  onBlur={(e) => handleAutoSaveField('yearGregorian', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  السنة الهجرية
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.yearHijri || ''}
                  onChange={(e) => {
                    setIsSettingsDirty(true);
                    setSettingsForm({ ...settingsForm, yearHijri: e.target.value });
                  }}
                  onBlur={(e) => handleAutoSaveField('yearHijri', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:border-emerald-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-900">
                    الصف الدراسي المعتمد للمنصة
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold">تطبيق فوري</span>
                </div>
                <select
                  value={settingsForm.defaultGrade || config.defaultGrade || 'ثاني متوسط'}
                  onChange={(e) => {
                    const chosen = e.target.value;
                    setIsSettingsDirty(true);
                    setSettingsForm({ ...settingsForm, defaultGrade: chosen });
                    handleToggleSettingInstant(
                      'defaultGrade',
                      chosen,
                      `تم اعتماد (${chosen}) كصف دراسي رئيسي للمنصة ونشره فوراً!`
                    );
                  }}
                  className="w-full px-3 py-2 bg-emerald-50 border-2 border-emerald-400 rounded-xl text-xs font-black text-emerald-950 focus:bg-white focus:border-emerald-600 cursor-pointer"
                >
                  {AVAILABLE_GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Student Login Mode Configuration Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-0.5">
                  طريقة تسجيل ودخول الطالب إلى المنصة
                </label>
                <p className="text-[11px] text-slate-500">
                  حدد خيار تسجيل دخول الطالب للمنصة المعتمد لدى إدارة المدرسة:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => handleUpdateLoginMode('code_only')}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-2.5 ${
                    (settingsForm.studentLoginMode || config.studentLoginMode) === 'code_only'
                      ? 'bg-emerald-50 border-emerald-600 ring-1 ring-emerald-600/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="settingsStudentLoginMode"
                    checked={(settingsForm.studentLoginMode || config.studentLoginMode) === 'code_only'}
                    onChange={() => handleUpdateLoginMode('code_only')}
                    className="w-4 h-4 mt-0.5 accent-emerald-700 cursor-pointer shrink-0"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 block">رمز المدرسة فقط</span>
                    <span className="text-[10px] text-slate-500 block">دخول سريع للطلاب برمز المدرسة دون طلب اسم مستخدم أو كلمة مرور</span>
                  </div>
                </label>

                <label
                  onClick={() => handleUpdateLoginMode('full_credentials')}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-2.5 ${
                    (settingsForm.studentLoginMode || config.studentLoginMode) !== 'code_only'
                      ? 'bg-emerald-50 border-emerald-600 ring-1 ring-emerald-600/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="settingsStudentLoginMode"
                    checked={(settingsForm.studentLoginMode || config.studentLoginMode) !== 'code_only'}
                    onChange={() => handleUpdateLoginMode('full_credentials')}
                    className="w-4 h-4 mt-0.5 accent-emerald-700 cursor-pointer shrink-0"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 block">اسم المستخدم + كلمة المرور + رمز المدرسة</span>
                    <span className="text-[10px] text-slate-500 block">دخول بحساب خاص مسجل مسبقاً لكل طالب برقم سري (مثبت دائماً)</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Game Simulation Settings Card (لعبة الملازم أَنَس) */}
            <div className="bg-linear-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-5 rounded-2xl border-2 border-indigo-500/50 space-y-4 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-800/60">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/30 text-amber-400 rounded-xl border border-indigo-400/30">
                    <Gamepad2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <span>لوحة تحكم "خانة الألعاب" (لعبة محاكاة الملازم أَنَس)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                        تحكم حصري للمدير
                      </span>
                    </h3>
                    <p className="text-[11px] text-indigo-200">
                      إمكانية إخفاء أو إظهار خانة الألعاب للطلاب في أي وقت، والتحكم بالطقس والتوقيت الواقعي.
                    </p>
                  </div>
                </div>

                {/* Visibility Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    const currentVal = Boolean(settingsForm.isGamesTabEnabled);
                    const newVal = !currentVal;
                    handleToggleSettingInstant(
                      'isGamesTabEnabled',
                      newVal,
                      newVal
                        ? 'تم تفعيل وإظهار خانة الألعاب لجميع الطلاب بنجاح!'
                        : 'تم إخفاء وإغلاق خانة الألعاب نهائياً عن جميع الجوالات بنجاح!'
                    );
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                    Boolean(settingsForm.isGamesTabEnabled)
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400'
                      : 'bg-rose-900/80 hover:bg-rose-800 text-rose-100 border border-rose-600'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${Boolean(settingsForm.isGamesTabEnabled) ? 'bg-emerald-200 animate-ping' : 'bg-rose-400'}`}></span>
                  <span>
                    {Boolean(settingsForm.isGamesTabEnabled) ? 'خانة الألعاب مُفعلة وظاهرة للطلاب' : 'خانة الألعاب مقفلة ومخفية تماماً'}
                  </span>
                </button>
              </div>

              {/* Weather & Time Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Weather selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-indigo-100 block">
                    الطقس الافتراضي في اللعبة:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'clear', label: 'صافٍ (شمس)', icon: Sun },
                      { id: 'night', label: 'ليل (استلام)', icon: Moon },
                      { id: 'rain', label: 'ممطر (أجواء غائمة)', icon: CloudRain },
                      { id: 'dust', label: 'غبار (عاصفة ترابية)', icon: Wind },
                    ].map((w) => {
                      const Icon = w.icon;
                      const active = (settingsForm.gameDefaultWeather || 'night') === w.id;
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => {
                            handleToggleSettingInstant(
                              'gameDefaultWeather',
                              w.id as any,
                              `تم تغيير طقس اللعبة إلى (${w.label}) ونشره لجميع الجوالات فوراً!`
                            );
                          }}
                          className={`p-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                            active
                              ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-sm'
                              : 'bg-indigo-900/40 text-indigo-200 border-indigo-700/50 hover:bg-indigo-800/40'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[11px] truncate">{w.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-indigo-100 block">
                    التوقيت الافتراضي للعبة:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleSettingInstant(
                          'gameDefaultTime',
                          'day',
                          'تم تغيير توقيت اللعبة إلى (توقيت نهار) وتطبيقه على كافة الأجهزة فوراً!'
                        );
                      }}
                      className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                        settingsForm.gameDefaultTime === 'day'
                          ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-sm'
                          : 'bg-indigo-900/40 text-indigo-200 border-indigo-700/50 hover:bg-indigo-800/40'
                      }`}
                    >
                      <Sun className="w-4 h-4 text-amber-300" />
                      <span>توقيت نهار</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleToggleSettingInstant(
                          'gameDefaultTime',
                          'night',
                          'تم تغيير توقيت اللعبة إلى (توقيت ليلي) وتطبيقه على كافة الأجهزة فوراً!'
                        );
                      }}
                      className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                        (settingsForm.gameDefaultTime || 'night') === 'night'
                          ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-sm'
                          : 'bg-indigo-900/40 text-indigo-200 border-indigo-700/50 hover:bg-indigo-800/40'
                      }`}
                    >
                      <Moon className="w-4 h-4 text-indigo-200" />
                      <span>توقيت ليلي (استلام)</span>
                    </button>
                  </div>
                  <span className="text-[10px] text-indigo-300/80 block">
                    يمكن للمدير تعديل هذه الإعدادات في أي وقت وحفظها لتتزامن على كافة الأجهزة فورياً.
                  </span>
                </div>
              </div>
            </div>

            {/* Quick App Background Setting in Settings tab */}
            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-200/70 text-amber-900 rounded-lg">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      خلفية واجهة التطبيق العامة (ألوان هادئة كواجهة المواد)
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      إظهار أو إخفاء خلفية واجهة التطبيق الهادئة والمريحة للعين.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const currentVal = settingsForm.isAppBackgroundEnabled !== false;
                      const newVal = !currentVal;
                      handleToggleSettingInstant(
                        'isAppBackgroundEnabled',
                        newVal,
                        newVal
                          ? 'تم تفعيل وإظهار خلفية واجهة التطبيق فوراً لجميع الأجهزة!'
                          : 'تم إخفاء وتعطيل خلفية واجهة التطبيق فوراً عن جميع الأجهزة!'
                      );
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      settingsForm.isAppBackgroundEnabled !== false
                        ? 'bg-emerald-700 text-white border-emerald-600'
                        : 'bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                  >
                    {settingsForm.isAppBackgroundEnabled !== false ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>الخلفية: مفعلة (ظاهرة)</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>الخلفية: معطلة (مخفية)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('images')}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    تعديل واختيار الصورة
                  </button>
                </div>
              </div>
            </div>
            {/* Madrasati Platform URL Configuration Card */}
            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200/90 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-xs sm:text-sm">
                      تعديل رابط منصة مدرستي المعتمد
                    </h4>
                    <p className="text-[11px] text-slate-600 font-semibold">
                      يمكنك كمدير تغيير الرابط المباشر لمنصة مدرستي ليتطابق مع رابط مدرستكم أو نظام الوزارة.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsDirty(true);
                    setSettingsForm({ ...settingsForm, madrasatiUrl: 'https://schools.madrasati.sa/login?Language=1' });
                  }}
                  className="px-2.5 py-1.5 bg-white hover:bg-emerald-100/70 text-emerald-900 border border-emerald-300 rounded-lg text-[11px] font-bold transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                >
                  الرابط الافتراضي
                </button>
              </div>

              <div>
                <input
                  type="url"
                  value={settingsForm.madrasatiUrl !== undefined ? settingsForm.madrasatiUrl : (config.madrasatiUrl || 'https://schools.madrasati.sa/login?Language=1')}
                  onChange={(e) => {
                    setIsSettingsDirty(true);
                    setSettingsForm({ ...settingsForm, madrasatiUrl: e.target.value.trim() });
                  }}
                  onBlur={(e) => handleAutoSaveField('madrasatiUrl', e.target.value.trim())}
                  placeholder="https://schools.madrasati.sa/login?Language=1"
                  className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-mono text-left focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  dir="ltr"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  الرابط الذي يفتح للطالب فور ضغطه على زر «الدخول» في خانة منصة مدرستي بالصفحة الرئيسية.
                </span>
              </div>
            </div>

            {/* File Preview Toggle Card (إلغاء أو إظهار معاينة الملفات) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-200 text-slate-800 rounded-lg shrink-0">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-xs sm:text-sm">
                      خانة معاينة الملفات للطلاب
                    </h4>
                    <p className="text-[11px] text-slate-600 font-semibold">
                      تستطيع إلغاء أو إظهار زر «معاينة الملف» داخل نوافذ الملخصات حسب رغبتك.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const currentVal = settingsForm.isFilePreviewEnabled !== false;
                    const newVal = !currentVal;
                    handleToggleSettingInstant(
                      'isFilePreviewEnabled',
                      newVal,
                      newVal
                        ? 'تم تفعيل وإظهار زر معاينة الملفات لجميع الطلاب فوراً!'
                        : 'تم إخفاء زر معاينة الملفات عن جميع الطلاب فوراً!'
                    );
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                    settingsForm.isFilePreviewEnabled !== false
                      ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                      : 'bg-rose-600 text-white hover:bg-rose-700'
                  }`}
                >
                  {settingsForm.isFilePreviewEnabled !== false ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>معاينة الملفات: مفعلة (ظاهرة)</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      <span>معاينة الملفات: ملغية (مخفية)</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                عند إلغائها، لن يظهر زر المعاينة للطلاب، وسيكتفي الطالب بقراءة شرح الملخص وتحميل الملف مباشرة.
              </p>
            </div>

            {/* Latest Published Materials Spotlight Toggle Card (إظهار أو إخفاء خانة أحدث أوراق العمل والملخصات) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-xs sm:text-sm">
                      خانة «أحدث أوراق العمل والملخصات المنشورة»
                    </h4>
                    <p className="text-[11px] text-slate-600 font-semibold">
                      تستطيع كمدير إظهار أو إخفاء خانة أحدث المواد المنشورة من الواجهة الرئيسية وبوابة الطلاب.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const currentVal = Boolean(settingsForm.isLatestSpotlightEnabled);
                    const newVal = !currentVal;
                    handleToggleSettingInstant(
                      'isLatestSpotlightEnabled',
                      newVal,
                      newVal
                        ? 'تم إظهار خانة «أحدث أوراق العمل والملخصات» لجميع الطلاب فوراً!'
                        : 'تم إخفاء خانة «أحدث أوراق العمل والملخصات» عن جميع الطلاب فوراً!'
                    );
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                    Boolean(settingsForm.isLatestSpotlightEnabled)
                      ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                      : 'bg-rose-600 text-white hover:bg-rose-700'
                  }`}
                >
                  {Boolean(settingsForm.isLatestSpotlightEnabled) ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>خانة أحدث المواد: مفعلة (ظاهرة)</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      <span>خانة أحدث المواد: ملغية (مخفية)</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                عند إلغائها (إخفائها)، لن تظهر خانة «أحدث أوراق العمل والملخصات المنشورة» في أعلى الصفحة للطلاب، وسيقتصر العرض على اختيار المادة وتصفح الأقسام مباشرة.
              </p>
            </div>

            {/* Home Screen Navigation Buttons Toggle Card (أزرار التنقل السريع) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-100 text-indigo-800 rounded-lg shrink-0">
                    <Compass className="w-4 h-4 text-indigo-700" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-xs sm:text-sm">
                      أزرار ومحطات التنقل السريع (Navigation Buttons) في شاشة التطبيق الرئيسية
                    </h4>
                    <p className="text-[11px] text-slate-600 font-semibold">
                      إظهار أو إخفاء بطاقات وأزرار الانتقال التفاعلية ذات الحركات الانسيابية في الواجهة الرئيسية.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const currentVal = settingsForm.isHomeNavButtonsEnabled !== false;
                    const newVal = !currentVal;
                    handleToggleSettingInstant(
                      'isHomeNavButtonsEnabled',
                      newVal,
                      newVal
                        ? 'تم تفعيل وإظهار أزرار ومحطات التنقل السريع لجميع الطلاب فوراً!'
                        : 'تم إخفاء أزرار ومحطات التنقل السريع عن جميع الطلاب فوراً!'
                    );
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                    settingsForm.isHomeNavButtonsEnabled !== false
                      ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                      : 'bg-rose-600 text-white hover:bg-rose-700'
                  }`}
                >
                  {settingsForm.isHomeNavButtonsEnabled !== false ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>أزرار التنقل: مفعلة (ظاهرة)</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      <span>أزرار التنقل: ملغية (مخفية)</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                عند تفعيلها، تعرض شاشة التطبيق الرئيسية محطات وأزرار تنقل تفاعلية سلسة بتأثير حركي (تكبير طفيف وتغيير لوني ناعم) تنقل الطالب بضغطة واحدة إلى الصفحات المطلوبة.
              </p>
            </div>

            {/* Student Download Verification & Stamp Settings Card (طلب بيانات الطالب قبل التنزيل) */}
            <div className="bg-emerald-50/90 p-5 rounded-2xl border-2 border-emerald-400 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-emerald-700 text-white rounded-xl shadow-xs shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                      <span>خانة توثيق بيانات الطالب والمدرسة والمعلم عند تنزيل الملفات</span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-950 font-extrabold px-2 py-0.5 rounded-full">
                        ميزة حصرية للمدير
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                      قبل تنزيل الطالب للملف، يكتب اسمه والمدرسة والمعلم وتظهر في الموضع الذي تحدده أنت كمدير، مع كامل الحرية لتفعيله أو إلغائه.
                    </p>
                  </div>
                </div>

                {/* Instant Master Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    const currentVal = settingsForm.requireStudentInfoOnDownload !== false;
                    const newVal = !currentVal;
                    handleToggleSettingInstant(
                      'requireStudentInfoOnDownload',
                      newVal,
                      newVal
                        ? 'تم تفعيل إلزام كتابة بيانات الطالب قبل التنزيل وتعميمها فوراً!'
                        : 'تم إلغاء طلب البيانات وإتاحة التنزيل المباشر للطلاب فوراً!'
                    );
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 shadow-xs ${
                    settingsForm.requireStudentInfoOnDownload !== false
                      ? 'bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-600'
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  {settingsForm.requireStudentInfoOnDownload !== false ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>طلب البيانات: مفعل (إلزامي)</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      <span>طلب البيانات: ملغي (تنزيل حر)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Placement Selector and Teacher Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Stamp Placement */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900">
                      موضع ظهور بيانات الطالب والمعلم في الملف:
                    </label>
                    <span className="text-[10px] text-emerald-700 font-bold">تطبيق فوري</span>
                  </div>
                  <select
                    value={settingsForm.downloadStampPlacement || 'header'}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setIsSettingsDirty(true);
                      setSettingsForm({ ...settingsForm, downloadStampPlacement: val });
                      handleToggleSettingInstant(
                        'downloadStampPlacement',
                        val,
                        `تم تغيير موضع توثيق بيانات الطالب إلى (${
                          val === 'header' ? 'أعلى الملف' : val === 'footer' ? 'أسفل الملف' : val === 'watermark' ? 'علامة مائية' : 'أعلى وأسفل معاً'
                        }) بنجاح!`
                      );
                    }}
                    className="w-full px-3 py-2.5 bg-white border-2 border-emerald-400 rounded-xl text-xs font-bold text-slate-900 focus:ring-1 focus:ring-emerald-600 cursor-pointer"
                  >
                    <option value="header">ترويسة رسمية في أعلى الملف (Header)</option>
                    <option value="footer">ختم واعتماد في أسفل الملف (Footer)</option>
                    <option value="watermark">علامة مائية أمنية في خلفية المستند (Watermark)</option>
                    <option value="both">ترويسة بالأعلى وختم اعتماد بالأسفل معاً (كامل)</option>
                  </select>
                  <p className="text-[10px] text-slate-500">
                    يحدد أين ستطبع بيانات اسم الطالب والمدرسة والمعلم داخل وثيقة الـ PDF وورقة العمل المحمّلة.
                  </p>
                </div>

                {/* Default Teacher Name */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900">
                      اسم المعلم الافتراضي للملفات:
                    </label>
                    <span className="text-[10px] text-emerald-700 font-bold">حفظ تلقائي</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settingsForm.defaultTeacherName !== undefined ? settingsForm.defaultTeacherName : (config.defaultTeacherName || 'صهيب القحطاني')}
                      onChange={(e) => {
                        setIsSettingsDirty(true);
                        setSettingsForm({ ...settingsForm, defaultTeacherName: e.target.value });
                      }}
                      onBlur={(e) => handleAutoSaveField('defaultTeacherName', e.target.value)}
                      placeholder="مثال: صهيب القحطاني"
                      className="flex-1 px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-1 focus:ring-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={() => handleAutoSaveField('defaultTeacherName', settingsForm.defaultTeacherName || 'صهيب القحطاني')}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                    >
                      تثبيت
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    الاسم الذي يظهر للطالب تلقائياً في خانة «اسم المعلم / المشرف» عند التنزيل.
                  </p>
                </div>
              </div>
            </div>

            {/* Custom / Permanent App URL */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رابط المنصة المعتمد للمشاركة مع الطلاب (الرابط الدائم)
              </label>
              <input
                type="url"
                value={settingsForm.customShareUrl || ''}
                onChange={(e) => {
                  setIsSettingsDirty(true);
                  setSettingsForm({ ...settingsForm, customShareUrl: e.target.value.trim() });
                }}
                onBlur={(e) => handleAutoSaveField('customShareUrl', e.target.value.trim())}
                placeholder="https://ais-pre-...run.app (أو رابط المدرسة الخاص)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-left focus:bg-white focus:border-emerald-600"
                dir="ltr"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                الرابط الذي يُعتمد في زر النسخ وتوليد الباركود. اتركه فارغاً ليعتمد تلقائياً رابط النشر الدائم.
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات في النظام</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: BACKUP & DATA SAFETY (نسخة احتياطية للبرنامج) */}
      {activeTab === 'backup' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-3xl space-y-6">
          <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl shrink-0">
                <Database className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">
                  مركز النسخ الاحتياطي وحماية بيانات المنصة
                </h3>
                <p className="text-xs text-slate-600 font-semibold mt-0.5">
                  حفظ وتصدير نسخة احتياطية كاملة لكافة حسابات الطلاب والملخصات والإعدادات، واستعادتها في أي وقت.
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>الحفظ التلقائي: نشط</span>
            </div>
          </div>

          {/* Backup Info */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs sm:text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>النسخ الاحتياطي وحفظ البيانات</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              يمكنك تصدير نسخة احتياطية من كافة بيانات المنصة واسترجاعها في أي وقت.
            </p>
          </div>

          {/* Live System Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-right space-y-1">
              <div className="text-slate-500 text-xs font-bold flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-600" />
                <span>الطلاب المسجلون</span>
              </div>
              <div className="text-xl font-black text-slate-900">
                {students.length} طالب
              </div>
              <div className="text-[10px] text-emerald-700 font-bold">
                حسابات مثبتة ومحمية
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-right space-y-1">
              <div className="text-slate-500 text-xs font-bold flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-600" />
                <span>الملخصات والمذكرات</span>
              </div>
              <div className="text-xl font-black text-slate-900">
                {summaries.length} ملخص
              </div>
              <div className="text-[10px] text-emerald-700 font-bold">
                مواد وأوراق عمل معتمدة
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-right space-y-1">
              <div className="text-slate-500 text-xs font-bold flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-slate-600" />
                <span>طريقة الدخول المثبتة</span>
              </div>
              <div className="text-xs font-black text-slate-900 line-clamp-1">
                {config.studentLoginMode === 'code_only' ? 'رمز المدرسة فقط' : 'الاسم + كلمة المرور + الرمز'}
              </div>
              <div className="text-[10px] text-emerald-700 font-bold">
                مثبتة دائماً ولن تتغير
              </div>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Export Card */}
            <div className="p-5 rounded-2xl border-2 border-emerald-500/80 bg-emerald-50/40 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                  <Download className="w-5 h-5" />
                </div>
                <h4 className="font-black text-slate-900 text-sm">
                  تصدير وتحميل نسخة احتياطية كاملة
                </h4>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                  تنزيل ملف بصيغة JSON على هاتفك أو حاسوبك يحتوي على جميع الطلاب، كلمات المرور، الملخصات، وصور ومرفقات المدرسة.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadBackup}
                disabled={isExportingBackup}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isExportingBackup ? 'جارٍ إعداد النسخة الاحتياطية...' : 'تحميل النسخة الاحتياطية الآن (.JSON)'}</span>
              </button>
            </div>

            {/* Import / Restore Card */}
            <div className="p-5 rounded-2xl border-2 border-indigo-400/80 bg-indigo-50/40 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-700 text-white flex items-center justify-center shadow-xs">
                  <Upload className="w-5 h-5" />
                </div>
                <h4 className="font-black text-slate-900 text-sm">
                  استعادة نسخة احتياطية سابقة
                </h4>
                <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                  رفع ملف نسخة احتياطية سبق تحميله لاسترجاع كافة الطلاب والملخصات والرموز السابقة فورياً.
                </p>
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputBackupRef}
                  accept=".json,application/json"
                  onChange={handleRestoreFileSelected}
                  className="hidden"
                  id="backup-file-input"
                />
                <button
                  type="button"
                  onClick={() => fileInputBackupRef.current?.click()}
                  disabled={isRestoringBackup}
                  className="w-full py-3 bg-indigo-700 hover:bg-indigo-800 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isRestoringBackup ? 'جارٍ الاستعادة...' : 'اختيار ملف النسخة واستعادته (.JSON)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: CCTV LIVE MONITORING ROOM */}
      {activeTab === 'cctv' && (
        <CCTVMonitorRoom
          students={students}
          onlineSessions={onlineSessions || []}
          suspensions={suspensions}
          config={config}
          onRefresh={onRefreshStudents}
        />
      )}
    </div>
  );
};
