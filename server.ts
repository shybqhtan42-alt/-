import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const BACKUP_DB_FILE = path.join('/tmp', 'al_basheer_database.json');

// Ensure data, uploads, and backups directories exist
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
const BACKUPS_DIR = path.resolve(DATA_DIR, 'backups');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

const DEFAULT_CONFIG = {
  platformTitle: 'البشير التعليمي',
  schoolName: 'مدرسة عبد الملك بن مروان',
  authorName: 'صهيب القحطاني',
  studentSchoolCode: '27274',
  managerSchoolCode: '67890',
  yearGregorian: '2026',
  yearHijri: '1448',
  studentLoginMode: 'full_credentials' as const,
  isManagerConfigured: false,
  lastUpdatedTimestamp: 1000,
  customShareUrl: '',
  customLogoUrl: '',
  customBannerUrl: '',
  customBannerTitle: 'ملخصات وافية وشاملة لكل مواد الفصل',
  customBannerSubtitle: 'مدرسة عبد الملك بن مروان',
  isGamesTabEnabled: false,
  gameDefaultWeather: 'night' as const,
  gameDefaultTime: 'night' as const,
  isAppBackgroundEnabled: true,
  appBackgroundUrl: '/images/calm_study_window_books.jpg',
  appBackgroundOpacity: 0.9,
  appBackgroundBlur: 0,
  appBackgroundTheme: 'calm_study' as const,
  madrasatiUrl: 'https://schools.madrasati.sa/login?Language=1',
  isFilePreviewEnabled: true,
  isLatestSpotlightEnabled: false,
  isHomeNavButtonsEnabled: true,
  defaultGrade: 'ثاني متوسط',
  requireStudentInfoOnDownload: true,
  downloadStampPlacement: 'header' as const,
  defaultTeacherName: 'صهيب القحطاني',
  isLiveMonitoringEnabled: true,
};

const INITIAL_SUMMARIES = [
  {
    id: 'sum-1',
    title: 'ملخص شامل: الجهاز العصبي والغدد الصماء',
    grade: 'ثاني متوسط',
    subject: 'العلوم',
    category: 'الملخصات',
    summaryText: `• يتكون الجهاز العصبي المركزي من الدماغ والحبل الشوكي.\n• الوحدة البنائية الأساسية للجهاز العصبي هي الخلية العصبية (العصبون).\n• يتكون العصبون من: جسم الخلية، والزوائد الشجيرية، والمحور العصبي.\n• الغدد الصماء تفرز الهرمونات مباشرة في مجرى الدم لتنظيم وظائف الجسم الحيوية.\n• الغدة النخامية تسمى "سيدة الغدد" لأنها تفرز هرمونات تنظم عمل الغدد الصماء الأخرى.`,
    attachmentType: 'text',
    attachmentName: 'ملخص_العلوم_ثاني_متوسط.pdf',
    dateAdded: '1448 هـ / 2026 م',
    isImportant: true,
    isExclusive: true,
  },
  {
    id: 'sum-2',
    title: 'ملخص نظرية فيثاغورس والأعداد الحقيقية',
    grade: 'ثاني متوسط',
    subject: 'الرياضيات',
    category: 'الملخصات',
    summaryText: `• تنص نظرية فيثاغورس على: في أي مثلث قائم الزاوية، مربع طول الوتر يساوي مجموع مربعي طولي الضلعين الآخرين (ج² = أ² + ب²).\n• الوتر هو الضلع المقابل للزاوية القائمة وهو أطول أضلاع المثلث القائم.\n• الأعداد الحقيقية تتضمن الأعداد النسبية (الكسور والأعداد العشرية المنتهية أو الدورية) والأعداد غير النسبية (الجذور التربيعية للأعداد غير المربعة مثل √2).\n• أمثلة مشهورة لثلاثيات فيثاغورس: (3، 4، 5) و (5، 12، 13).`,
    attachmentType: 'text',
    attachmentName: 'قوانين_الرياضيات_الفصل_الأول.pdf',
    dateAdded: '1448 هـ / 2026 م',
    isImportant: true,
    isExclusive: true,
  },
  {
    id: 'sum-3',
    title: 'ملخص قواعد لغتي: الفاعل ونائب الفاعل والمفعول به',
    grade: 'ثاني متوسط',
    subject: 'لغتي الخالدة',
    category: 'الملخصات',
    summaryText: `• الفاعل: اسم مرفوع يدل على من قام بالفعل أو اتصف به (علامات رفعه: الضمة للمفرد وجمع التكسير وجمع المؤنث السالم، الألف للمثنى، الواو لجمع المذكر السالم والأسماء الخمسة).\n• نائب الفاعل: اسم مرفوع يحل محل الفاعل بعد حذفه وبناء الفعل للمجهول (يُضم أول الفعل الماضي ويُكسر ما قبل آخره، ويُضم أول الفعل المضارع ويُفتح ما قبل آخره).\n• المفعول به: اسم منصوب يدل على من وقع عليه فعل الفاعل.`,
    attachmentType: 'text',
    attachmentName: 'ملخص_قواعد_لغتي_الخالدة.pdf',
    dateAdded: '1448 هـ / 2026 م',
    isImportant: false,
    isExclusive: false,
  },
  {
    id: 'sum-4',
    title: 'ورقة عمل مادة الدراسات الاجتماعية - محلول',
    grade: 'ثاني متوسط',
    subject: 'الاجتماعيات',
    category: 'أوراق عمل',
    summaryText: `• ورقة عمل مادة الدراسات الاجتماعية لصف ثاني متوسط مع الحل والنموذج الرسمي المعتمد.
• تشمل أسئلة الاختيار من متعدد، وضع علامة صح أو خطأ، وإكمال الفراغات والأسئلة المقالية لجميع وحدات الفصل.
• متاح كملف PDF رسمي كامل جاهز للتصفح والتحميل المباشر.`,
    attachmentType: 'pdf',
    attachmentName: 'ورقة_عمل_الدراسات_الاجتماعية_محلول.pdf',
    attachmentUrl: '/uploads/social_studies_worksheet_solved.pdf',
    dateAdded: '1448 هـ / 2026 م',
    isImportant: true,
    isExclusive: true,
  },
  {
    id: 'sum-5',
    title: 'ملخص التوحيد والفقه: أصول الإيمان ومقاصد الشريعة',
    grade: 'ثاني متوسط',
    subject: 'الدراسات الإسلامية',
    category: 'الملخصات',
    summaryText: `• أركان الإيمان ستة: الإيمان بالله، وملائكته، وكتبه، ورسله، واليوم الآخر، والقدر خيره وشره.\n• أحكام الصيام وأعذار الفطر المبيحة في السفر والمرض.\n• أهمية بر الوالدين وحسن الخلق في المعاملات اليومية.`,
    attachmentType: 'text',
    attachmentName: 'ملخص_الدراسات_الإسلامية.pdf',
    dateAdded: '1448 هـ / 2026 م',
    isImportant: false,
    isExclusive: false,
  },
];

interface DatabaseSchema {
  config: typeof DEFAULT_CONFIG;
  students: any[];
  summaries: any[];
  deletedSummaryIds?: string[];
  deletedStudentIds?: string[];
  version: number;
  lastUpdated: string;
  lastUpdatedTimestamp: number;
  isManagerConfigured: boolean;
}

function loadDatabase(): DatabaseSchema {
  // Check main file first, then fallback file
  const candidateFiles = [DB_FILE, BACKUP_DB_FILE];

  for (const file of candidateFiles) {
    try {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf-8');
        const data = JSON.parse(content);
        if (data && typeof data === 'object') {
          const deletedSummaryIds = Array.isArray(data.deletedSummaryIds) ? data.deletedSummaryIds : [];
          const deletedStudentIds = Array.isArray(data.deletedStudentIds) ? data.deletedStudentIds : [];
          // Filter out any summaries or students that were recorded as deleted
          const loadedSummaries = Array.isArray(data.summaries) ? data.summaries : INITIAL_SUMMARIES;
          const activeSummaries = loadedSummaries.filter((s: any) => s && s.id && !deletedSummaryIds.includes(s.id));
          const loadedStudents = Array.isArray(data.students) ? data.students : [];
          const activeStudents = loadedStudents.filter((s: any) => s && s.id && !deletedStudentIds.includes(s.id));

          return {
            config: { ...DEFAULT_CONFIG, ...(data.config || {}) },
            students: activeStudents,
            // CRITICAL FIX: If data.summaries is an array, respect it even if empty! (Never re-inject INITIAL_SUMMARIES if manager deleted them)
            summaries: activeSummaries,
            deletedSummaryIds,
            deletedStudentIds,
            version: typeof data.version === 'number' ? data.version : 1,
            lastUpdated: data.lastUpdated || new Date().toISOString(),
            lastUpdatedTimestamp: typeof data.lastUpdatedTimestamp === 'number' ? data.lastUpdatedTimestamp : (data.config?.lastUpdatedTimestamp || 1000),
            isManagerConfigured: Boolean(data.isManagerConfigured || data.config?.isManagerConfigured),
          };
        }
      }
    } catch (err) {
      console.error(`Error reading ${file}:`, err);
    }
  }

  const initialData: DatabaseSchema = {
    config: DEFAULT_CONFIG,
    students: [],
    summaries: INITIAL_SUMMARIES,
    deletedSummaryIds: [],
    deletedStudentIds: [],
    version: 1,
    lastUpdated: new Date().toISOString(),
    lastUpdatedTimestamp: 1000,
    isManagerConfigured: false,
  };

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    fs.writeFileSync(BACKUP_DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error creating initial database file:', err);
  }

  return initialData;
}

let db = loadDatabase();

function saveDatabase() {
  db.version += 1;
  db.lastUpdated = new Date().toISOString();
  db.lastUpdatedTimestamp = Date.now();
  db.isManagerConfigured = true;
  db.config.isManagerConfigured = true;
  db.config.lastUpdatedTimestamp = db.lastUpdatedTimestamp;

  const payload = JSON.stringify(db, null, 2);
  try {
    fs.writeFileSync(DB_FILE, payload, 'utf-8');
  } catch (err) {
    console.error('Error saving main database file:', err);
  }
  try {
    fs.writeFileSync(BACKUP_DB_FILE, payload, 'utf-8');
  } catch (err) {
    console.error('Error saving backup database file:', err);
  }
  try {
    if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    fs.writeFileSync(path.join(BACKUPS_DIR, 'latest-backup.json'), payload, 'utf-8');
  } catch (err) {
    console.error('Error saving latest-backup file in backups directory:', err);
  }
}

async function startServer() {
  const app = express();

  // Middleware for parsing JSON with generous limit for base64 images/files
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // High-performance file cache to ensure all uploaded images and documents remain available across restarts
  const uploadedFilesCache = new Map<string, { buffer: Buffer; contentType: string }>();

  // Function to register a file into cache and ensure it exists on disk
  const registerFileInCacheAndDisk = (urlOrName: string, mime: string, buffer: Buffer) => {
    const rawName = urlOrName.replace(/^\/uploads\//, '');
    const decoded = decodeURIComponent(rawName);
    uploadedFilesCache.set(rawName, { buffer, contentType: mime });
    uploadedFilesCache.set(decoded, { buffer, contentType: mime });

    try {
      if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      fs.writeFileSync(path.join(UPLOADS_DIR, decoded), buffer);
    } catch (_) {}
    try {
      const publicUploads = path.resolve(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(publicUploads)) fs.mkdirSync(publicUploads, { recursive: true });
      fs.writeFileSync(path.join(publicUploads, decoded), buffer);
    } catch (_) {}
  };

  // Helper to store file buffer to memory and all disk locations
  const persistUploadedFile = (fileName: string, mimeType: string, buffer: Buffer): string => {
    const ext = path.extname(fileName) || (mimeType.includes('pdf') ? '.pdf' : mimeType.includes('png') ? '.png' : '.jpg');
    const baseRaw = path.basename(fileName, ext);
    const safeBase = baseRaw.replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '_');
    const uniqueName = `${Date.now()}-${safeBase}${ext}`;

    // Cache in memory
    uploadedFilesCache.set(uniqueName, { buffer, contentType: mimeType });
    uploadedFilesCache.set(encodeURIComponent(uniqueName), { buffer, contentType: mimeType });

    // Write to UPLOADS_DIR
    try {
      fs.writeFileSync(path.join(UPLOADS_DIR, uniqueName), buffer);
    } catch (e) {
      console.warn('Could not write to UPLOADS_DIR:', e);
    }

    // Write to public/uploads
    try {
      const publicUploads = path.resolve(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(publicUploads)) fs.mkdirSync(publicUploads, { recursive: true });
      fs.writeFileSync(path.join(publicUploads, uniqueName), buffer);
    } catch (e) {
      console.warn('Could not write to public/uploads:', e);
    }

    // Write to dist/uploads if dist exists
    try {
      const distUploads = path.resolve(process.cwd(), 'dist', 'uploads');
      if (fs.existsSync(path.resolve(process.cwd(), 'dist'))) {
        if (!fs.existsSync(distUploads)) fs.mkdirSync(distUploads, { recursive: true });
        fs.writeFileSync(path.join(distUploads, uniqueName), buffer);
      }
    } catch (e) {
      console.warn('Could not write to dist/uploads:', e);
    }

    return `/uploads/${encodeURIComponent(uniqueName)}`;
  };

  // Pre-seed uploadedFilesCache and disk from existing db.summaries on startup
  if (Array.isArray(db.summaries)) {
    for (const s of db.summaries) {
      const rawData = s.attachmentData || (s.attachmentUrl?.startsWith('data:') ? s.attachmentUrl : null);
      if (rawData && rawData.startsWith('data:')) {
        try {
          const parts = rawData.split(',');
          const mime = parts[0].match(/:(.*?);/)?.[1] || (s.attachmentType === 'image' ? 'image/png' : 'application/pdf');
          const buffer = Buffer.from(parts[1], 'base64');
          if (s.attachmentUrl && s.attachmentUrl.startsWith('/uploads/')) {
            registerFileInCacheAndDisk(s.attachmentUrl, mime, buffer);
          } else {
            const ext = mime.includes('pdf') ? '.pdf' : mime.includes('png') ? '.png' : '.jpg';
            const cleanTitle = (s.title || 'file').replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '_');
            const fileName = s.attachmentName || `${cleanTitle}${ext}`;
            const fileUrl = persistUploadedFile(fileName, mime, buffer);
            s.attachmentUrl = fileUrl;
          }
        } catch (e) {
          console.warn('Could not pre-seed summary attachment into file cache:', e);
        }
      }
    }
  }

  // Dedicated file delivery endpoint for /uploads/:filename with explicit Content-Type headers
  app.get('/uploads/:filename', (req, res) => {
    const rawParam = req.params.filename;
    const decoded = decodeURIComponent(rawParam);
    const isDownload = req.query.download === '1' || req.query.dl === '1';

    // 1. Check in-memory cache first
    if (uploadedFilesCache.has(rawParam) || uploadedFilesCache.has(decoded)) {
      const cached = uploadedFilesCache.get(rawParam) || uploadedFilesCache.get(decoded)!;
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      if (isDownload) {
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(decoded)}"`);
      } else {
        res.setHeader('Content-Disposition', 'inline');
      }
      return res.send(cached.buffer);
    }

    // 2. Check disk directories
    const searchDirs = [
      UPLOADS_DIR,
      path.resolve(process.cwd(), 'public', 'uploads'),
      path.resolve(process.cwd(), 'dist', 'uploads'),
    ];

    for (const dir of searchDirs) {
      if (!fs.existsSync(dir)) continue;
      const candidates = [path.join(dir, rawParam), path.join(dir, decoded)];
      for (const cand of candidates) {
        if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
          const ext = path.extname(cand).toLowerCase();
          const mime =
            ext === '.pdf'
              ? 'application/pdf'
              : ext === '.png'
              ? 'image/png'
              : ext === '.jpg' || ext === '.jpeg'
              ? 'image/jpeg'
              : ext === '.webp'
              ? 'image/webp'
              : ext === '.svg'
              ? 'image/svg+xml'
              : 'application/octet-stream';

          res.setHeader('Content-Type', mime);
          res.setHeader('Cache-Control', 'public, max-age=31536000');
          if (isDownload) {
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(decoded)}"`);
          } else {
            res.setHeader('Content-Disposition', 'inline');
          }
          return res.sendFile(cand);
        }
      }
    }

    // 3. Fallback: Search in db.summaries for any matching attachment data and resurrect it immediately
    if (Array.isArray(db.summaries)) {
      for (const s of db.summaries) {
        const matchUrl = s.attachmentUrl && (s.attachmentUrl.includes(rawParam) || s.attachmentUrl.includes(decoded));
        const matchName = s.attachmentName && (s.attachmentName === rawParam || s.attachmentName === decoded);
        if (matchUrl || matchName) {
          const raw = s.attachmentData || (s.attachmentUrl?.startsWith('data:') ? s.attachmentUrl : null);
          if (raw && raw.startsWith('data:')) {
            try {
              const parts = raw.split(',');
              const mime = parts[0].match(/:(.*?);/)?.[1] || (s.attachmentType === 'image' ? 'image/png' : 'application/pdf');
              const buffer = Buffer.from(parts[1], 'base64');
              registerFileInCacheAndDisk(rawParam, mime, buffer);
              res.setHeader('Content-Type', mime);
              res.setHeader('Cache-Control', 'public, max-age=31536000');
              if (isDownload) {
                res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(decoded)}"`);
              } else {
                res.setHeader('Content-Disposition', 'inline');
              }
              return res.send(buffer);
            } catch (err) {
              console.warn('Error resurrecting file from db.summaries:', err);
            }
          }
        }
      }
    }

    // 4. CRITICAL: Never fall back to index.html for uploads!
    res.status(404).send('File not found');
  });

  // Terminal fallback for any /uploads path that didn't match
  app.use('/uploads', (req, res) => {
    res.status(404).send('File not found');
  });

  // File Upload Endpoint: saves file buffer and returns clean URL
  app.post('/api/upload', (req, res) => {
    try {
      const { fileName, fileType, fileData } = req.body || {};
      if (!fileData || !fileName) {
        return res.status(400).json({ error: 'Missing file data or file name' });
      }

      // Extract raw base64 data
      const base64Data = fileData.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const isImg = fileType?.startsWith('image/') || fileName.match(/\.(png|jpe?g|webp|gif|svg)$/i);
      const computedType = fileType || (isImg ? 'image/png' : 'application/pdf');

      const fileUrl = persistUploadedFile(fileName, computedType, buffer);
      console.log(`Saved uploaded file: ${fileName} (${buffer.length} bytes) -> ${fileUrl}`);

      res.json({
        success: true,
        url: fileUrl,
        fileName,
        fileType: computedType,
        fileSize: buffer.length,
      });
    } catch (err: any) {
      console.error('Error handling upload in /api/upload:', err);
      res.status(500).json({ error: 'Failed to save file: ' + err.message });
    }
  });

  // Cache-Control middleware for all API endpoints to guarantee immediate cross-device sync
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // Health check endpoints for deployment probes (Cloud Run / load balancers)
  app.get(['/health', '/api/health', '/healthz'], (req, res) => {
    res.status(200).send('OK');
  });

  // Online students presence & live CCTV telemetry tracking
  interface LiveStudentSession {
    studentId: string;
    studentName: string;
    grade?: string;
    currentSection?: string;
    currentSubject?: string;
    currentAction?: string;
    deviceType?: string;
    lastSeen: number;
    cameraCode?: string;
    isSuspended?: boolean;
    suspensionExpiresAt?: number;
    suspensionReason?: string;
    snapshotTheme?: 'home' | 'portal' | 'summary' | 'game' | 'login' | 'download';
    activityCount?: number;
    recentActivities?: StudentActivityLog[];
  }

  interface StudentSuspension {
    studentId: string;
    studentName: string;
    kickedAt: number;
    durationMinutes: number; // 0 = permanent until manager unlocks
    expiresAt: number; // 0 = permanent until manager unlocks
    reason?: string;
    kickedBy: string;
  }

  interface StudentActivityLog {
    id: string;
    studentId: string;
    studentName: string;
    action: string;
    section: string;
    subject?: string;
    timestamp: number;
    timeFormatted: string;
    deviceType?: string;
    type?: 'enter' | 'navigate' | 'view_summary' | 'download_file' | 'game' | 'exit' | 'kicked';
  }

  const liveSessionsMap = new Map<string, LiveStudentSession>();
  const studentSuspensionsMap = new Map<string, StudentSuspension>();
  const studentActivityLogs: StudentActivityLog[] = [];

  // Heartbeat endpoint for active students with live CCTV telemetry
  app.post('/api/presence/heartbeat', (req, res) => {
    const { studentId, studentName, grade, currentSection, currentSubject, currentAction, deviceType, snapshotTheme } = req.body || {};
    if (studentId && typeof studentId === 'string') {
      const existing = liveSessionsMap.get(studentId);
      let cameraCode = existing?.cameraCode;
      if (!cameraCode) {
        const count = liveSessionsMap.size + 1;
        cameraCode = `CAM-${count < 10 ? '0' + count : count}`;
      }

      // Check suspension expiration
      const suspension = studentSuspensionsMap.get(studentId);
      let isSuspended = false;
      let suspensionExpiresAt = 0;
      let suspensionReason = '';
      if (suspension) {
        if (suspension.expiresAt > 0 && Date.now() > suspension.expiresAt) {
          studentSuspensionsMap.delete(studentId);
        } else {
          isSuspended = true;
          suspensionExpiresAt = suspension.expiresAt;
          suspensionReason = suspension.reason || 'بأمر من إدارة المدرسة';
        }
      }

      // Log activity if action or section changed
      if (currentAction && existing && existing.currentAction !== currentAction) {
        const logItem: StudentActivityLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          studentId,
          studentName: studentName || existing.studentName,
          action: currentAction,
          section: currentSection || existing.currentSection || 'الصفحة الرئيسية',
          subject: currentSubject || existing.currentSubject,
          timestamp: Date.now(),
          timeFormatted: new Date().toLocaleTimeString('ar-SA'),
          deviceType: deviceType || existing.deviceType,
          type: currentAction.includes('تنزيل') ? 'download_file' : currentAction.includes('ملخص') ? 'view_summary' : 'navigate',
        };
        studentActivityLogs.push(logItem);
        if (studentActivityLogs.length > 300) studentActivityLogs.shift();
      } else if (!existing) {
        // Initial entry log
        studentActivityLogs.push({
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          studentId,
          studentName: studentName || 'طالب جديد',
          action: 'دخل إلى المنصة المدرسية',
          section: currentSection || 'الصفحة الرئيسية',
          subject: currentSubject,
          timestamp: Date.now(),
          timeFormatted: new Date().toLocaleTimeString('ar-SA'),
          deviceType,
          type: 'enter',
        });
      }

      const recentStudentLogs = studentActivityLogs
        .filter(l => l.studentId === studentId)
        .slice(-8)
        .reverse();

      liveSessionsMap.set(studentId, {
        studentId,
        studentName: studentName || existing?.studentName || 'طالب متصل',
        grade: grade || existing?.grade || 'ثاني متوسط',
        currentSection: currentSection || existing?.currentSection || 'الصفحة الرئيسية',
        currentSubject: currentSubject || existing?.currentSubject || 'عام',
        currentAction: currentAction || existing?.currentAction || 'تصفح المنصة',
        deviceType: deviceType || existing?.deviceType || 'جوال (Android/iOS)',
        lastSeen: Date.now(),
        cameraCode,
        isSuspended,
        suspensionExpiresAt,
        suspensionReason,
        snapshotTheme: snapshotTheme || 'home',
        activityCount: recentStudentLogs.length,
        recentActivities: recentStudentLogs,
      });

      return res.json({
        success: true,
        timestamp: Date.now(),
        isSuspended,
        suspension: isSuspended ? suspension : null,
      });
    }
    res.json({ success: true, timestamp: Date.now() });
  });

  // Kick / Suspend student endpoint
  app.post('/api/presence/kick', (req, res) => {
    const { studentId, studentName, durationMinutes = 5, reason = 'بأمر من إدارة المدرسة لمتابعة النشاط' } = req.body || {};
    if (!studentId) return res.status(400).json({ error: 'Missing studentId' });

    const duration = Number(durationMinutes) || 0;
    const kickedAt = Date.now();
    const expiresAt = duration > 0 ? kickedAt + duration * 60 * 1000 : 0;

    const suspension: StudentSuspension = {
      studentId,
      studentName: studentName || 'طالب مسجل',
      kickedAt,
      durationMinutes: duration,
      expiresAt,
      reason,
      kickedBy: 'إدارة المدرسة',
    };

    studentSuspensionsMap.set(studentId, suspension);

    // Update active session if present
    const existing = liveSessionsMap.get(studentId);
    if (existing) {
      existing.isSuspended = true;
      existing.suspensionExpiresAt = expiresAt;
      existing.suspensionReason = reason;
    }

    // Log kick activity
    studentActivityLogs.push({
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      studentId,
      studentName: suspension.studentName,
      action: `قام المدير بإخراج الطالب مؤقتاً ${duration > 0 ? `لمدة (${duration} دقيقة)` : 'حتى يقوم المدير بفتح الموقع له يدوياً'}`,
      section: 'إجراء أمني - إخراج الطالب',
      timestamp: Date.now(),
      timeFormatted: new Date().toLocaleTimeString('ar-SA'),
      type: 'kicked',
    });

    res.json({ success: true, suspension });
  });

  // Unkick / Reopen platform for student
  app.post('/api/presence/unkick', (req, res) => {
    const { studentId } = req.body || {};
    if (studentId) {
      const prev = studentSuspensionsMap.get(studentId);
      studentSuspensionsMap.delete(studentId);

      const existing = liveSessionsMap.get(studentId);
      if (existing) {
        existing.isSuspended = false;
        existing.suspensionExpiresAt = 0;
      }

      studentActivityLogs.push({
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        studentId,
        studentName: prev?.studentName || 'طالب مسجل',
        action: 'قام المدير بفك الحظر وإعادة فتح الموقع للطالب فوراً',
        section: 'إجراء أمني - فك الإيقاف',
        timestamp: Date.now(),
        timeFormatted: new Date().toLocaleTimeString('ar-SA'),
        type: 'enter',
      });
    }
    res.json({ success: true });
  });

  // Get student activity logs
  app.get('/api/presence/logs', (req, res) => {
    const { studentId } = req.query;
    const logs = studentId && typeof studentId === 'string'
      ? studentActivityLogs.filter(l => l.studentId === studentId)
      : studentActivityLogs;
    res.json({ logs: logs.slice(-150).reverse() });
  });

  // Explicit logout / offline endpoint
  app.post('/api/presence/offline', (req, res) => {
    const { studentId } = req.body || {};
    if (studentId && typeof studentId === 'string') {
      const existing = liveSessionsMap.get(studentId);
      if (existing) {
        studentActivityLogs.push({
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          studentId,
          studentName: existing.studentName,
          action: 'خرج من المنصة المدرسية (تسجيل خروج / إغلاق)',
          section: 'الصفحة الرئيسية',
          timestamp: Date.now(),
          timeFormatted: new Date().toLocaleTimeString('ar-SA'),
          type: 'exit',
        });
      }
      liveSessionsMap.delete(studentId);
    }
    res.json({ success: true });
  });

  // Dedicated CCTV live camera feeds endpoint
  app.get('/api/presence/cameras', (req, res) => {
    const now = Date.now();
    const activeThreshold = 25000;
    const activeFeeds: LiveStudentSession[] = [];
    liveSessionsMap.forEach((session, id) => {
      // Check suspension expiry
      const susp = studentSuspensionsMap.get(id);
      if (susp && susp.expiresAt > 0 && now > susp.expiresAt) {
        studentSuspensionsMap.delete(id);
        session.isSuspended = false;
      }
      if (now - session.lastSeen <= activeThreshold) {
        activeFeeds.push(session);
      }
    });
    res.json({
      cameras: activeFeeds,
      suspensions: Array.from(studentSuspensionsMap.values()),
      totalActive: activeFeeds.length,
      timestamp: now,
    });
  });

  // --- API ROUTES ---

  // 1. Full state sync endpoint (used by all devices to sync on load and poll every 3 seconds)
  app.get('/api/sync', (req, res) => {
    const now = Date.now();
    // Student is considered online if heartbeat was received within the last 18 seconds
    const activeThreshold = 18000;
    const onlineStudentIds: string[] = [];
    const onlineSessions: LiveStudentSession[] = [];

    liveSessionsMap.forEach((session, id) => {
      if (now - session.lastSeen <= activeThreshold) {
        onlineStudentIds.push(id);
        onlineSessions.push(session);
      } else if (now - session.lastSeen > 60000) {
        // cleanup stale records after 1 minute
        liveSessionsMap.delete(id);
      }
    });

    // Provide lean summaries over /api/sync so payload is tiny (< 5KB), fast (< 30ms),
    // and never exceeds mobile phone localStorage quotas while preserving clean /uploads/ URLs
    const leanSummaries = (db.summaries || []).map((s: any) => {
      if (!s) return s;
      const { attachmentData, ...rest } = s;
      return rest;
    });

    const deletedStudentIds = db.deletedStudentIds || [];
    const activeStudents = (db.students || []).filter(
      (s: any) => s && s.id && !deletedStudentIds.includes(s.id)
    );

    res.json({
      config: db.config,
      students: activeStudents,
      summaries: leanSummaries,
      deletedSummaryIds: db.deletedSummaryIds || [],
      deletedStudentIds: db.deletedStudentIds || [],
      onlineStudentIds,
      onlineSessions,
      suspensions: Array.from(studentSuspensionsMap.values()),
      version: db.version,
      lastUpdated: db.lastUpdated,
      lastUpdatedTimestamp: db.lastUpdatedTimestamp,
      isManagerConfigured: db.isManagerConfigured,
    });
  });

  // 2. Rehydration endpoint: Safe merge that preserves existing students and files
  app.post('/api/rehydrate', (req, res) => {
    const { config, students, summaries, deletedSummaryIds, deletedStudentIds, lastUpdatedTimestamp } = req.body || {};
    const clientTimestamp = typeof lastUpdatedTimestamp === 'number' ? lastUpdatedTimestamp : 0;

    // Only adopt if server is completely unconfigured OR if incoming has new items
    console.log('Processing rehydration request...');
    if (config && typeof config === 'object' && !db.isManagerConfigured) {
      db.config = {
        ...DEFAULT_CONFIG,
        ...config,
        isGamesTabEnabled: Boolean(config.isGamesTabEnabled),
        isLatestSpotlightEnabled: Boolean(config.isLatestSpotlightEnabled),
        isManagerConfigured: true,
      };
    }

    if (Array.isArray(deletedStudentIds) && deletedStudentIds.length > 0) {
      const deletedStudentSet = new Set(db.deletedStudentIds || []);
      deletedStudentIds.forEach((id: string) => deletedStudentSet.add(id));
      db.deletedStudentIds = Array.from(deletedStudentSet);
    }

    const activeDeletedStudents = new Set(db.deletedStudentIds || []);

    // NEVER blindly overwrite existing students! Merge missing ones while strictly excluding deleted students:
    if (Array.isArray(students) && students.length > 0) {
      const existingMap = new Map<string, any>();
      db.students.forEach((s) => {
        if (s && s.id && !activeDeletedStudents.has(s.id)) existingMap.set(s.id, s);
      });
      students.forEach((s) => {
        if (s && s.id && !activeDeletedStudents.has(s.id) && !existingMap.has(s.id)) {
          existingMap.set(s.id, s);
        }
      });
      db.students = Array.from(existingMap.values());
    }

    if (Array.isArray(deletedSummaryIds) && deletedSummaryIds.length > 0) {
      const deletedSet = new Set(db.deletedSummaryIds || []);
      deletedSummaryIds.forEach((id: string) => deletedSet.add(id));
      db.deletedSummaryIds = Array.from(deletedSet);
    }

    if (Array.isArray(summaries) && summaries.length > 0) {
      const deletedSet = new Set(db.deletedSummaryIds || []);
      const existingMap = new Map<string, any>();
      db.summaries.forEach((s) => {
        if (s && s.id && !deletedSet.has(s.id)) existingMap.set(s.id, s);
      });
      for (const s of summaries) {
        if (s && s.id && !deletedSet.has(s.id)) {
          const merged = { ...(existingMap.get(s.id) || {}), ...s };
          existingMap.set(s.id, merged);

          // Rehydrate files into cache and disk immediately
          const raw = merged.attachmentData || (merged.attachmentUrl?.startsWith('data:') ? merged.attachmentUrl : null);
          if (raw && raw.startsWith('data:')) {
            try {
              const parts = raw.split(',');
              const mime = parts[0].match(/:(.*?);/)?.[1] || (merged.attachmentType === 'image' ? 'image/png' : 'application/pdf');
              const buffer = Buffer.from(parts[1], 'base64');
              if (merged.attachmentUrl && merged.attachmentUrl.startsWith('/uploads/')) {
                registerFileInCacheAndDisk(merged.attachmentUrl, mime, buffer);
              }
            } catch (_) {}
          }
        }
      }
      db.summaries = Array.from(existingMap.values());
    }

    db.isManagerConfigured = true;
    db.lastUpdatedTimestamp = Math.max(clientTimestamp, Date.now());
    saveDatabase();
    return res.json({ success: true, message: 'Server synced successfully', version: db.version });
  });

  // 3. Config endpoints
  app.get('/api/config', (req, res) => {
    res.json(db.config);
  });

  app.post('/api/config', (req, res) => {
    const incoming = req.body || {};
    const timestamp = Math.max(incoming.lastUpdatedTimestamp || 0, Date.now());
    db.config = {
      ...db.config,
      ...incoming,
      studentLoginMode: incoming.studentLoginMode || db.config.studentLoginMode || 'full_credentials',
      isGamesTabEnabled: incoming.isGamesTabEnabled !== undefined ? Boolean(incoming.isGamesTabEnabled) : Boolean(db.config.isGamesTabEnabled),
      isLatestSpotlightEnabled: incoming.isLatestSpotlightEnabled !== undefined ? Boolean(incoming.isLatestSpotlightEnabled) : Boolean(db.config.isLatestSpotlightEnabled),
      defaultGrade: incoming.defaultGrade || db.config.defaultGrade || 'ثاني متوسط',
      requireStudentInfoOnDownload: incoming.requireStudentInfoOnDownload !== undefined ? Boolean(incoming.requireStudentInfoOnDownload) : Boolean(db.config.requireStudentInfoOnDownload ?? true),
      downloadStampPlacement: incoming.downloadStampPlacement || db.config.downloadStampPlacement || 'header',
      defaultTeacherName: incoming.defaultTeacherName || db.config.defaultTeacherName || 'صهيب القحطاني',
      isLiveMonitoringEnabled: incoming.isLiveMonitoringEnabled !== undefined ? Boolean(incoming.isLiveMonitoringEnabled) : Boolean(db.config.isLiveMonitoringEnabled ?? true),
      isManagerConfigured: true,
      lastUpdatedTimestamp: timestamp,
    };
    db.lastUpdatedTimestamp = timestamp;
    saveDatabase();
    res.json({ success: true, config: db.config, version: db.version });
  });

  // 4. Students endpoints
  app.get('/api/students', (req, res) => {
    res.json(db.students);
  });

  app.post('/api/students', (req, res) => {
    const studentData = req.body;
    if (!studentData || !studentData.fullName) {
      return res.status(400).json({ error: 'بيانات الطالب غير مكتملة' });
    }

    const newStudent = {
      ...studentData,
      id: studentData.id || 'std-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      registeredAt: studentData.registeredAt || new Date().toLocaleDateString('ar-SA'),
    };

    // Ensure this student ID is NOT marked as deleted
    if (Array.isArray(db.deletedStudentIds)) {
      db.deletedStudentIds = db.deletedStudentIds.filter((id) => id !== newStudent.id);
    }

    // Merge or insert without duplicates
    const existingIndex = db.students.findIndex(
      (s) => s.id === newStudent.id || s.username.toLowerCase() === newStudent.username.toLowerCase()
    );
    if (existingIndex !== -1) {
      db.students[existingIndex] = { ...db.students[existingIndex], ...newStudent };
    } else {
      db.students.unshift(newStudent);
    }

    saveDatabase();
    res.json({ success: true, student: newStudent, version: db.version });
  });

  app.put('/api/students/:id', (req, res) => {
    const { id } = req.params;
    const idx = db.students.findIndex((s) => s.id === id);
    if (idx !== -1) {
      db.students[idx] = { ...db.students[idx], ...req.body };
      saveDatabase();
      res.json({ success: true, student: db.students[idx], version: db.version });
    } else {
      res.status(404).json({ error: 'Student not found' });
    }
  });

  app.delete('/api/students/:id', (req, res) => {
    const { id } = req.params;
    if (!db.deletedStudentIds) db.deletedStudentIds = [];
    if (!db.deletedStudentIds.includes(id)) {
      db.deletedStudentIds.push(id);
    }
    db.students = db.students.filter((s) => s.id !== id);
    saveDatabase();
    res.json({ success: true, version: db.version, deletedStudentIds: db.deletedStudentIds });
  });

  // 4.5. Dedicated Backup & Restore endpoints (نسخة احتياطية للبرنامج)
  app.get('/api/backup/export', (req, res) => {
    const backupData = {
      platform: 'Al-Basheer Educational Platform',
      version: db.version,
      exportedAt: new Date().toISOString(),
      exportedAtArabic: new Date().toLocaleDateString('ar-SA', { dateStyle: 'full' }),
      config: db.config,
      studentsCount: db.students.length,
      students: db.students,
      summariesCount: db.summaries.length,
      summaries: db.summaries,
      deletedSummaryIds: db.deletedSummaryIds || [],
      deletedStudentIds: db.deletedStudentIds || [],
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="al_basheer_backup_${Date.now()}.json"`
    );
    res.send(JSON.stringify(backupData, null, 2));
  });

  app.post('/api/backup/restore', (req, res) => {
    try {
      const backup = req.body;
      if (!backup || typeof backup !== 'object') {
        return res.status(400).json({ error: 'ملف النسخة الاحتياطية غير صالح' });
      }

      if (backup.config && typeof backup.config === 'object') {
        db.config = { ...DEFAULT_CONFIG, ...backup.config, isManagerConfigured: true };
      }

      if (Array.isArray(backup.students)) {
        db.students = backup.students;
      }

      if (Array.isArray(backup.summaries)) {
        db.summaries = backup.summaries;
      }

      if (Array.isArray(backup.deletedSummaryIds)) {
        db.deletedSummaryIds = backup.deletedSummaryIds;
      }

      if (Array.isArray(backup.deletedStudentIds)) {
        db.deletedStudentIds = backup.deletedStudentIds;
      }

      db.isManagerConfigured = true;
      saveDatabase();

      res.json({
        success: true,
        message: 'تمت استعادة النسخة الاحتياطية بنجاح!',
        studentsCount: db.students.length,
        summariesCount: db.summaries.length,
        config: db.config,
        version: db.version,
      });
    } catch (err: any) {
      console.error('Error restoring backup:', err);
      res.status(500).json({ error: 'فشل استعادة النسخة الاحتياطية: ' + err.message });
    }
  });

  // 5. Summaries endpoints
  app.get('/api/summaries', (req, res) => {
    res.json(db.summaries);
  });

  app.post('/api/summaries', (req, res) => {
    const summaryData = req.body;
    if (!summaryData) {
      return res.status(400).json({ error: 'No data provided' });
    }

    // Auto-extract and persist any inline base64 attachments to ensure they are served as real files
    const rawAttachmentData = summaryData.attachmentData || (summaryData.attachmentUrl && summaryData.attachmentUrl.startsWith('data:') ? summaryData.attachmentUrl : null);
    if (rawAttachmentData && rawAttachmentData.startsWith('data:')) {
      try {
        const parts = rawAttachmentData.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || (summaryData.attachmentType === 'image' ? 'image/png' : 'application/pdf');
        const buffer = Buffer.from(parts[1], 'base64');
        const fileName = summaryData.attachmentName || `${summaryData.title || 'file'}.${mime.includes('pdf') ? 'pdf' : mime.includes('png') ? 'png' : 'jpg'}`;
        const savedUrl = persistUploadedFile(fileName, mime, buffer);
        summaryData.attachmentUrl = savedUrl;
        summaryData.attachmentData = rawAttachmentData; // Keep base64 in database.json so files survive container restarts!
        console.log(`Auto-persisted base64 summary attachment for "${summaryData.title}" -> ${savedUrl}`);
      } catch (err) {
        console.warn('Could not auto-persist base64 summary attachment:', err);
      }
    }

    const id = summaryData.id || 'sum-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);

    // 1. Check if an item with this ID already exists
    const existingIndex = db.summaries.findIndex((s) => s.id === id);
    if (existingIndex !== -1) {
      db.summaries[existingIndex] = { ...db.summaries[existingIndex], ...summaryData };
      saveDatabase();
      return res.json({ success: true, summary: db.summaries[existingIndex], version: db.version });
    }

    // 2. Check if a duplicate item with identical title, subject, grade, and category was already added (prevents double tap / rapid clicks)
    const duplicateIndex = db.summaries.findIndex(
      (s) =>
        (s.title || '').trim() === (summaryData.title || '').trim() &&
        s.subject === summaryData.subject &&
        s.grade === summaryData.grade &&
        s.category === summaryData.category
    );
    if (duplicateIndex !== -1) {
      console.log(`Prevented duplicate summary in /api/summaries: "${summaryData.title}"`);
      db.summaries[duplicateIndex] = { ...db.summaries[duplicateIndex], ...summaryData };
      saveDatabase();
      return res.json({ success: true, summary: db.summaries[duplicateIndex], version: db.version });
    }

    const newSummary = {
      ...summaryData,
      id,
      dateAdded: summaryData.dateAdded || `${db.config.yearHijri} هـ / ${db.config.yearGregorian} م`,
    };
    db.summaries.unshift(newSummary);
    saveDatabase();
    res.json({ success: true, summary: newSummary, version: db.version });
  });

  app.put('/api/summaries/:id', (req, res) => {
    const { id } = req.params;
    const idx = db.summaries.findIndex((s) => s.id === id);
    if (idx !== -1) {
      db.summaries[idx] = { ...db.summaries[idx], ...req.body };
      saveDatabase();
      res.json({ success: true, summary: db.summaries[idx], version: db.version });
    } else {
      res.status(404).json({ error: 'Summary not found' });
    }
  });

  app.delete('/api/summaries/:id', (req, res) => {
    const { id } = req.params;
    const initialLen = db.summaries.length;
    db.summaries = db.summaries.filter((s) => s.id !== id);
    if (!db.deletedSummaryIds) {
      db.deletedSummaryIds = [];
    }
    if (!db.deletedSummaryIds.includes(id)) {
      db.deletedSummaryIds.push(id);
    }
    saveDatabase();
    res.json({ success: true, version: db.version, deletedId: id });
  });

  // --- VITE DEV OR PRODUCTION STATIC SERVING ---
  const distPath = path.resolve(process.cwd(), 'dist');
  const distIndex = path.join(distPath, 'index.html');
  const hasDist = fs.existsSync(distIndex);
  const isProd = process.env.NODE_ENV === 'production' || hasDist;

  if (isProd && hasDist) {
    console.log('Serving production static build from dist/');
    app.use(express.static(distPath, { maxAge: '1h' }));
    app.get('*', (req, res) => {
      res.sendFile(distIndex);
    });
  } else {
    console.log('Starting Vite development mode...');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Al-Basheer Fullstack Server is active on port ${PORT}`);
  });

  const shutdown = () => {
    console.log('Closing Al-Basheer HTTP server gracefully...');
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
