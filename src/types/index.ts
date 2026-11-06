export interface Student {
  id: string;
  fullName: string;
  username: string;
  password: string;
  grade: string;
  registeredAt: string;
  notes?: string;
}

export interface SummaryItem {
  id: string;
  title: string;
  grade: string; // e.g. "ثاني متوسط"
  subject: string; // e.g. "العلوم", "الرياضيات", "لغتي الخالدة", "الدراسات الإسلامية", "الاجتماعيات", "اللغة الإنجليزية", "المهارات الرقمية"
  category: string; // "الملخصات", "أوراق عمل", "شروحات ومراجعات"
  summaryText: string;
  attachmentUrl?: string;
  attachmentData?: string; // Persistent base64 data to guarantee image/file never disappears across container restarts
  attachmentType?: 'image' | 'pdf' | 'document' | 'text' | 'none';
  attachmentName?: string;
  dateAdded: string;
  isImportant?: boolean;
  isExclusive?: boolean;
}

export interface SchoolConfig {
  platformTitle: string;
  schoolName: string;
  authorName: string;
  studentSchoolCode: string;
  managerSchoolCode: string;
  yearGregorian: string;
  yearHijri: string;
  studentLoginMode?: 'code_only' | 'full_credentials';
  isManagerConfigured?: boolean;
  lastUpdatedTimestamp?: number;
  customShareUrl?: string;
  customLogoUrl?: string;
  customBannerUrl?: string;
  customBannerTitle?: string;
  customBannerSubtitle?: string;
  isGamesTabEnabled?: boolean;
  gameDefaultWeather?: 'clear' | 'night' | 'rain' | 'dust';
  gameDefaultTime?: 'day' | 'night';
  isAppBackgroundEnabled?: boolean;
  appBackgroundUrl?: string;
  appBackgroundOpacity?: number;
  appBackgroundBlur?: number;
  appBackgroundTheme?: 'books_study' | 'classic_library' | 'calm_study' | 'custom';
  madrasatiUrl?: string;
  isFilePreviewEnabled?: boolean;
  isLatestSpotlightEnabled?: boolean;
  isHomeNavButtonsEnabled?: boolean;
}

export interface GameViolation {
  id: string;
  type: string; // 'قطع إشارة' | 'تجاوز السرعة' | 'عدم ربط الحزام' | 'هروب من النقطة'
  pointsDeducted: number;
  time: string;
  location: string;
  plateNumber: string;
}

export type CarModelType = 'police_fj' | 'police_dodge' | 'bmw_i7' | 'lexus' | 'camry' | 'accent' | 'yaris' | 'sonata';

export interface CarColorOption {
  id: string;
  name: string;
  hex: string;
  cssBg: string;
}

export interface SuspectVehicle {
  id: string;
  model: string;
  color: string;
  plateNumber: string;
  driverName: string;
  nationalId: string;
  city: string;
  licenseStatus: 'سارية' | 'منتهية' | 'مطلوبة أمنياً';
  trunkItems: { name: string; isIllegal: boolean; count: number }[];
  status: 'pending' | 'cleared' | 'confiscated' | 'ticketed';
}

export type UserRole = 'guest' | 'student' | 'manager';

export interface CurrentUser {
  role: UserRole;
  student?: Student;
}
