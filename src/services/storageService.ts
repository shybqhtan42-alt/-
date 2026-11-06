import { Student, SummaryItem, SchoolConfig } from '../types';

const STORAGE_KEYS = {
  STUDENTS: 'al_basheer_students_v1',
  CONFIG: 'al_basheer_config_v1',
  SUMMARIES: 'al_basheer_summaries_v1',
  SESSION: 'al_basheer_session_v1',
  FAVORITES: 'al_basheer_favorites_v1',
  VERSION: 'al_basheer_version_v1',
  TIMESTAMP: 'al_basheer_timestamp_v1',
  MANAGER_CUSTOMIZED: 'al_basheer_manager_customized_v1',
  VAULT: 'al_basheer_manager_vault_v1',
  DELETED_SUMMARIES: 'al_basheer_deleted_summaries_v1',
  DELETED_STUDENTS: 'al_basheer_deleted_students_v1',
};

export const DEFAULT_CONFIG: SchoolConfig = {
  platformTitle: 'البشير التعليمي',
  schoolName: 'مدرسة عبد الملك بن مروان',
  authorName: 'صهيب القحطاني',
  studentSchoolCode: '27274',
  managerSchoolCode: '67890',
  yearGregorian: '2026',
  yearHijri: '1448',
  studentLoginMode: 'full_credentials',
  customShareUrl: '',
  customLogoUrl: '',
  customBannerUrl: '',
  customBannerTitle: 'ملخصات وافية وشاملة لكل مواد الفصل',
  customBannerSubtitle: 'مدرسة عبد الملك بن مروان',
  isManagerConfigured: false,
  lastUpdatedTimestamp: 1000,
  isGamesTabEnabled: false,
  gameDefaultWeather: 'night',
  gameDefaultTime: 'night',
  isAppBackgroundEnabled: true,
  appBackgroundUrl: '/images/calm_study_window_books.jpg',
  appBackgroundOpacity: 0.9,
  appBackgroundBlur: 0,
  appBackgroundTheme: 'calm_study',
  madrasatiUrl: 'https://schools.madrasati.sa/login?Language=1',
  isFilePreviewEnabled: true,
  isLatestSpotlightEnabled: false,
  isHomeNavButtonsEnabled: true,
};

// High quality initial educational summaries specifically prepared for ثاني متوسط
export const INITIAL_SUMMARIES: SummaryItem[] = [
  {
    id: 'sum-1',
    title: 'ملخص شامل: الجهاز العصبي والغدد الصماء',
    grade: 'ثاني متوسط',
    subject: 'العلوم',
    category: 'الملخصات',
    summaryText: `• يتكون الجهاز العصبي المركزي من الدماغ والحبل الشوكي.
• الوحدة البنائية الأساسية للجهاز العصبي هي الخلية العصبية (العصبون).
• يتكون العصبون من: جسم الخلية، والزوائد الشجيرية، والمحور العصبي.
• الغدد الصماء تفرز الهرمونات مباشرة في مجرى الدم لتنظيم وظائف الجسم الحيوية.
• الغدة النخامية تسمى "سيدة الغدد" لأنها تفرز هرمونات تنظم عمل الغدد الصماء الأخرى.`,
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
    summaryText: `• تنص نظرية فيثاغورس على: في أي مثلث قائم الزاوية، مربع طول الوتر يساوي مجموع مربعي طولي الضلعين الآخرين (ج² = أ² + ب²).
• الوتر هو الضلع المقابل للزاوية القائمة وهو أطول أضلاع المثلث القائم.
• الأعداد الحقيقية تتضمن الأعداد النسبية (الكسور والأعداد العشرية المنتهية أو الدورية) والأعداد غير النسبية (الجذور التربيعية للأعداد غير المربعة مثل √2).
• أمثلة مشهورة لثلاثيات فيثاغورس: (3، 4، 5) و (5، 12، 13).`,
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
    summaryText: `• الفاعل: اسم مرفوع يدل على من قام بالفعل أو اتصف به (علامات رفعه: الضمة للمفرد وجمع التكسير وجمع المؤنث السالم، الألف للمثنى، الواو لجمع المذكر السالم والأسماء الخمسة).
• نائب الفاعل: اسم مرفوع يحل محل الفاعل بعد حذفه وبناء الفعل للمجهول (يُضم أول الفعل الماضي ويُكسر ما قبل آخره، ويُضم أول الفعل المضارع ويُفتح ما قبل آخره).
• المفعول به: اسم منصوب يدل على من وقع عليه فعل الفاعل.`,
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
    summaryText: `• أركان الإيمان ستة: الإيمان بالله، وملائكته، وكتبه، ورسله، واليوم الآخر، والقدر خيره وشره.
• أحكام الصيام وأعذار الفطر المبيحة في السفر والمرض.
• أهمية بر الوالدين وحسن الخلق في المعاملات اليومية.`,
    attachmentType: 'text',
    attachmentName: 'ملخص_الدراسات_الإسلامية.pdf',
    dateAdded: '1448 هـ / 2026 م',
    isImportant: false,
    isExclusive: false,
  },
];

export const storageService = {
  // Sync version tracking
  getLocalVersion(): number {
    try {
      const v = localStorage.getItem(STORAGE_KEYS.VERSION);
      return v ? parseInt(v, 10) : 0;
    } catch {
      return 0;
    }
  },

  setLocalVersion(v: number): void {
    try {
      localStorage.setItem(STORAGE_KEYS.VERSION, String(v));
    } catch {
      // ignore
    }
  },

  getLocalTimestamp(): number {
    try {
      const t = localStorage.getItem(STORAGE_KEYS.TIMESTAMP);
      return t ? parseInt(t, 10) : 1000;
    } catch {
      return 1000;
    }
  },

  setLocalTimestamp(t: number): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TIMESTAMP, String(t));
    } catch {
      // ignore
    }
  },

  isManagerCustomized(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.MANAGER_CUSTOMIZED) === 'true';
    } catch {
      return false;
    }
  },

  setManagerCustomized(val: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MANAGER_CUSTOMIZED, val ? 'true' : 'false');
    } catch {
      // ignore
    }
  },

  getDeletedSummaryIds(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DELETED_SUMMARIES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  },

  recordDeletedSummaryId(id: string): void {
    try {
      const list = this.getDeletedSummaryIds();
      if (!list.includes(id)) {
        list.push(id);
        localStorage.setItem(STORAGE_KEYS.DELETED_SUMMARIES, JSON.stringify(list));
      }
    } catch {
      // ignore
    }
  },

  getDeletedStudentIds(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DELETED_STUDENTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  },

  recordDeletedStudentId(id: string): void {
    try {
      const list = this.getDeletedStudentIds();
      if (!list.includes(id)) {
        list.push(id);
        localStorage.setItem(STORAGE_KEYS.DELETED_STUDENTS, JSON.stringify(list));
      }
    } catch {
      // ignore
    }
  },

  // Save full manager state into a safe vault
  backupToVault(config: SchoolConfig, students: Student[], summaries: SummaryItem[], timestamp: number): void {
    try {
      const payload = {
        config,
        students,
        summaries,
        timestamp,
        isManagerConfigured: true,
      };
      this.safeSetItem(STORAGE_KEYS.VAULT, JSON.stringify(payload));
      this.setManagerCustomized(true);
      this.setLocalTimestamp(timestamp);
    } catch {
      // ignore
    }
  },

  getVaultData(): { config: SchoolConfig; students: Student[]; summaries: SummaryItem[]; timestamp: number } | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.VAULT);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
    return null;
  },

  deduplicateSummaries(list: SummaryItem[]): SummaryItem[] {
    if (!Array.isArray(list)) return [];
    const seenIds = new Set<string>();
    const seenKeys = new Set<string>();
    const result: SummaryItem[] = [];

    for (const item of list) {
      if (!item || !item.id) continue;
      const key = `${(item.title || '').trim()}_${(item.subject || '').trim()}_${(item.grade || '').trim()}_${(item.category || '').trim()}`;
      if (!seenIds.has(item.id) && !seenKeys.has(key)) {
        seenIds.add(item.id);
        seenKeys.add(key);
        result.push(item);
      }
    }
    return result;
  },

  safeSetItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`localStorage quota warning for key ${key}, saving trimmed fallback...`, e);
      try {
        if (key === STORAGE_KEYS.SUMMARIES || key === STORAGE_KEYS.VAULT) {
          const parsed = JSON.parse(value);
          const sanitizeList = (list: any[]) =>
            list.map((item) => {
              // Keep /uploads/ URLs and reasonably sized attachments intact
              const isUploadUrl = typeof item.attachmentUrl === 'string' && (item.attachmentUrl.startsWith('/uploads/') || item.attachmentUrl.startsWith('http'));
              return {
                ...item,
                attachmentUrl: isUploadUrl ? item.attachmentUrl : (item.attachmentUrl && item.attachmentUrl.length > 1500000 ? undefined : item.attachmentUrl),
                attachmentData: item.attachmentData && item.attachmentData.length > 1500000 ? undefined : item.attachmentData,
              };
            });

          if (Array.isArray(parsed)) {
            localStorage.setItem(key, JSON.stringify(sanitizeList(parsed)));
          } else if (parsed && Array.isArray(parsed.summaries)) {
            parsed.summaries = sanitizeList(parsed.summaries);
            localStorage.setItem(key, JSON.stringify(parsed));
          }
        }
      } catch (innerErr) {
        console.warn('Could not persist to localStorage:', innerErr);
      }
    }
  },

  // Send heartbeat for online student presence
  sendHeartbeat(studentId: string): void {
    if (!studentId) return;
    try {
      fetch('/api/presence/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      }).catch(() => {});
    } catch (_) {}
  },

  // Notify server when student logs out or leaves
  sendOffline(studentId: string): void {
    if (!studentId) return;
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify({ studentId })], { type: 'application/json' });
        navigator.sendBeacon('/api/presence/offline', blob);
      } else {
        fetch('/api/presence/offline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId }),
          keepalive: true,
        }).catch(() => {});
      }
    } catch (_) {}
  },

  // Central Server Fetch & Sync - connects all phones in real-time
  async fetchServerState(): Promise<{
    config: SchoolConfig;
    students: Student[];
    summaries: SummaryItem[];
    onlineStudentIds: string[];
    version: number;
  } | null> {
    try {
      const res = await fetch(`/api/sync?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (res.ok) {
        const data = await res.json();

        // Sync deleted summary IDs from server across all devices
        if (Array.isArray(data.deletedSummaryIds) && data.deletedSummaryIds.length > 0) {
          const currentDeleted = this.getDeletedSummaryIds();
          const mergedDeleted = Array.from(new Set([...currentDeleted, ...data.deletedSummaryIds]));
          try {
            localStorage.setItem(STORAGE_KEYS.DELETED_SUMMARIES, JSON.stringify(mergedDeleted));
          } catch (_) {}
        }

        // Sync deleted student IDs from server across all devices
        if (Array.isArray(data.deletedStudentIds) && data.deletedStudentIds.length > 0) {
          const currentDeletedStudents = this.getDeletedStudentIds();
          const mergedDeletedStudents = Array.from(new Set([...currentDeletedStudents, ...data.deletedStudentIds]));
          try {
            localStorage.setItem(STORAGE_KEYS.DELETED_STUDENTS, JSON.stringify(mergedDeletedStudents));
          } catch (_) {}
        }

        const activeDeletedIds = this.getDeletedSummaryIds();
        const activeDeletedStudentIds = this.getDeletedStudentIds();
        const localStudents = this.getStudents();
        const localSummaries = this.getSummaries();

        // One-time emergency seed ONLY if the server is completely fresh/unconfigured and local has custom manager data
        if (
          this.isManagerCustomized() &&
          !data.isManagerConfigured &&
          (localStudents.length > 0 || localSummaries.length > INITIAL_SUMMARIES.length)
        ) {
          fetch('/api/rehydrate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              config: this.getConfig(),
              students: localStudents,
              summaries: localSummaries,
              deletedSummaryIds: activeDeletedIds,
              deletedStudentIds: activeDeletedStudentIds,
              lastUpdatedTimestamp: Date.now(),
            }),
          }).catch(() => {});
        }

        // Server state is authoritative across all devices
        if (data.config) {
          this.safeSetItem(STORAGE_KEYS.CONFIG, JSON.stringify(data.config));
        }

        // Server state is authoritative, BUT merge any local valid students not yet reflected on the server
        // so newly added students are NEVER wiped or lost!
        let finalStudents: Student[] = Array.isArray(data.students)
          ? data.students.filter((s: any) => s && s.id && !activeDeletedStudentIds.includes(s.id))
          : [];

        // Check for local students that are valid and not deleted
        for (const localStd of localStudents) {
          if (localStd && localStd.id && !activeDeletedStudentIds.includes(localStd.id)) {
            const alreadyInFinal = finalStudents.some((s) => s.id === localStd.id || s.username === localStd.username);
            if (!alreadyInFinal) {
              finalStudents.unshift(localStd);
              // Push to server so all phones see it immediately
              fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(localStd),
              }).catch(() => {});
            }
          }
        }

        this.safeSetItem(STORAGE_KEYS.STUDENTS, JSON.stringify(finalStudents));

        if (Array.isArray(data.summaries)) {
          const filtered = data.summaries.filter((s: any) => s && s.id && !activeDeletedIds.includes(s.id));
          const dedupedSummaries = this.deduplicateSummaries(filtered);
          this.safeSetItem(STORAGE_KEYS.SUMMARIES, JSON.stringify(dedupedSummaries));
        }
        if (typeof data.version === 'number') {
          this.setLocalVersion(data.version);
        }
        if (typeof data.lastUpdatedTimestamp === 'number') {
          this.setLocalTimestamp(data.lastUpdatedTimestamp);
        }

        const rawSummaries = Array.isArray(data.summaries) ? data.summaries : localSummaries;
        const validSummaries = this.deduplicateSummaries(
          rawSummaries.filter((s: any) => s && s.id && !activeDeletedIds.includes(s.id))
        );

        return {
          config: data.config || DEFAULT_CONFIG,
          students: finalStudents,
          summaries: validSummaries,
          onlineStudentIds: Array.isArray(data.onlineStudentIds) ? data.onlineStudentIds : [],
          version: data.version || 0,
        };
      }
    } catch (err) {
      console.warn('Network sync offline, using local storage state', err);
    }
    return null;
  },

  // Config
  getConfig(): SchoolConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (data) {
        const parsed = JSON.parse(data);
        return { ...DEFAULT_CONFIG, ...parsed };
      }
    } catch {
      // fallback
    }
    return DEFAULT_CONFIG;
  },

  async saveConfig(config: SchoolConfig): Promise<SchoolConfig> {
    const timestamp = Date.now();
    const finalConfig: SchoolConfig = {
      ...config,
      isManagerConfigured: true,
      lastUpdatedTimestamp: timestamp,
    };

    this.safeSetItem(STORAGE_KEYS.CONFIG, JSON.stringify(finalConfig));
    this.setManagerCustomized(true);
    this.setLocalTimestamp(timestamp);
    this.backupToVault(finalConfig, this.getStudents(), this.getSummaries(), timestamp);

    // Publish to server so all phones receive it immediately
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalConfig),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.version === 'number') {
          this.setLocalVersion(data.version);
        }
        if (data && data.config) {
          this.safeSetItem(STORAGE_KEYS.CONFIG, JSON.stringify(data.config));
          return data.config;
        }
      }
    } catch (err) {
      console.error('Failed to sync config to server:', err);
    }
    return finalConfig;
  },

  // Students
  getStudents(): Student[] {
    const deletedStudentIds = this.getDeletedStudentIds();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.filter((s: any) => s && s.id && !deletedStudentIds.includes(s.id));
        }
      }
    } catch {
      // fallback
    }
    return [];
  },

  saveStudents(students: Student[]): void {
    const timestamp = Date.now();
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    this.setManagerCustomized(true);
    this.setLocalTimestamp(timestamp);
    this.backupToVault(this.getConfig(), students, this.getSummaries(), timestamp);
  },

  async addStudent(student: Omit<Student, 'id' | 'registeredAt'>): Promise<Student> {
    const students = this.getStudents();
    const newStudent: Student = {
      ...student,
      id: 'std-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      registeredAt: new Date().toLocaleDateString('ar-SA'),
    };
    students.unshift(newStudent);
    this.saveStudents(students);

    // Publish to server for cross-device visibility immediately
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.version === 'number') {
          this.setLocalVersion(data.version);
        }
        if (data && data.student) {
          const list = this.getStudents();
          const idx = list.findIndex((s) => s.id === newStudent.id);
          if (idx !== -1) {
            list[idx] = data.student;
            this.safeSetItem(STORAGE_KEYS.STUDENTS, JSON.stringify(list));
          }
        }
      }
    } catch (err) {
      console.error('Failed to sync student to server:', err);
    }

    return newStudent;
  },

  async updateStudent(id: string, updatedFields: Partial<Student>): Promise<boolean> {
    const students = this.getStudents();
    const idx = students.findIndex((s) => s.id === id);
    if (idx !== -1) {
      students[idx] = { ...students[idx], ...updatedFields };
      this.saveStudents(students);

      try {
        const res = await fetch(`/api/students/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFields),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.version === 'number') {
            this.setLocalVersion(data.version);
          }
        }
      } catch (err) {
        console.error('Failed to update student on server:', err);
      }

      return true;
    }
    return false;
  },

  async deleteStudent(id: string): Promise<boolean> {
    this.recordDeletedStudentId(id);
    const students = this.getStudents();
    const filtered = students.filter((s) => s.id !== id);
    this.saveStudents(filtered);

    try {
      const res = await fetch(`/api/students/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.version === 'number') {
          this.setLocalVersion(data.version);
        }
      }
    } catch (err) {
      console.error('Failed to delete student on server:', err);
    }

    return true;
  },

  // Summaries
  getSummaries(): SummaryItem[] {
    const deletedIds = this.getDeletedSummaryIds();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUMMARIES);
      if (data !== null) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return this.deduplicateSummaries(parsed.filter((s) => s && s.id && !deletedIds.includes(s.id)));
        }
      }
    } catch {
      // fallback
    }
    // Brand new device or uninitialized storage: provide INITIAL_SUMMARIES filtered by deletedIds
    return INITIAL_SUMMARIES.filter((s) => !deletedIds.includes(s.id));
  },

  saveSummaries(summaries: SummaryItem[]): void {
    const timestamp = Date.now();
    const deduped = this.deduplicateSummaries(summaries);
    this.safeSetItem(STORAGE_KEYS.SUMMARIES, JSON.stringify(deduped));
    this.setManagerCustomized(true);
    this.setLocalTimestamp(timestamp);
    this.backupToVault(this.getConfig(), this.getStudents(), deduped, timestamp);
  },

  async addSummary(summary: Omit<SummaryItem, 'id' | 'dateAdded'>): Promise<SummaryItem> {
    const summaries = this.getSummaries();
    const config = this.getConfig();

    // Check if an item with identical title, subject, grade, and category already exists (prevent duplicate creation)
    const existing = summaries.find(
      (s) =>
        (s.title || '').trim() === (summary.title || '').trim() &&
        s.subject === summary.subject &&
        s.grade === summary.grade &&
        s.category === summary.category
    );
    if (existing) {
      console.warn('Summary with identical content already exists, preventing duplicate creation:', summary.title);
      return existing;
    }

    const newSummary: SummaryItem = {
      ...summary,
      id: 'sum-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      dateAdded: `${config.yearHijri} هـ / ${config.yearGregorian} م`,
    };
    summaries.unshift(newSummary);
    this.saveSummaries(summaries);

    // Publish to server for cross-device visibility immediately
    try {
      const res = await fetch('/api/summaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSummary),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.version === 'number') {
          this.setLocalVersion(data.version);
        }
      }
    } catch (err) {
      console.error('Failed to sync summary to server:', err);
    }

    return newSummary;
  },

  async deleteSummary(id: string): Promise<boolean> {
    this.recordDeletedSummaryId(id);
    const summaries = this.getSummaries();
    const filtered = summaries.filter((s) => s.id !== id);
    this.saveSummaries(filtered);

    // Publish deletion to server immediately
    try {
      const res = await fetch(`/api/summaries/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.version === 'number') {
          this.setLocalVersion(data.version);
        }
      }
    } catch (err) {
      console.error('Failed to delete summary on server:', err);
    }

    return true;
  },

  async updateSummary(id: string, updatedFields: Partial<SummaryItem>): Promise<boolean> {
    const summaries = this.getSummaries();
    const idx = summaries.findIndex((s) => s.id === id);
    if (idx !== -1) {
      summaries[idx] = { ...summaries[idx], ...updatedFields };
      this.saveSummaries(summaries);

      // Publish update to server
      try {
        const res = await fetch(`/api/summaries/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFields),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.version === 'number') {
            this.setLocalVersion(data.version);
          }
        }
      } catch (err) {
        console.error('Failed to update summary on server:', err);
      }

      return true;
    }
    return false;
  },

  // Student Favorites (Kept on student device)
  getFavorites(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return [];
  },

  toggleFavorite(id: string): boolean {
    const favs = this.getFavorites();
    const exists = favs.includes(id);
    const updated = exists ? favs.filter((f) => f !== id) : [...favs, id];
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
    return !exists;
  },

  // Full System Backup Export & Restore (نسخة احتياطية للبرنامج)
  async downloadBackupFile(): Promise<{ success: boolean; filename: string }> {
    try {
      // First attempt to get the authoritative export from server
      const res = await fetch('/api/backup/export');
      let backupBlob: Blob;
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `نسخة_احتياطية_منصة_البشير_${dateStr}.json`;

      if (res.ok) {
        backupBlob = await res.blob();
      } else {
        // Fallback: construct comprehensive backup from local storage & vault
        const backupData = {
          platform: 'Al-Basheer Educational Platform',
          version: this.getLocalVersion(),
          exportedAt: new Date().toISOString(),
          exportedAtArabic: new Date().toLocaleDateString('ar-SA', { dateStyle: 'full' }),
          config: this.getConfig(),
          studentsCount: this.getStudents().length,
          students: this.getStudents(),
          summariesCount: this.getSummaries().length,
          summaries: this.getSummaries(),
          deletedSummaryIds: this.getDeletedSummaryIds(),
          deletedStudentIds: this.getDeletedStudentIds(),
        };
        backupBlob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      }

      const url = URL.createObjectURL(backupBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { success: true, filename };
    } catch (err) {
      console.error('Backup download error:', err);
      throw err;
    }
  },

  async restoreBackupFromFile(fileContent: string): Promise<{ success: boolean; message: string; studentsCount: number; summariesCount: number }> {
    try {
      const parsed = JSON.parse(fileContent);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('محتوى الملف غير صالح');
      }

      // 1. Post to server
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      // 2. Also update local storage immediately
      if (parsed.config) {
        this.safeSetItem(STORAGE_KEYS.CONFIG, JSON.stringify(parsed.config));
      }
      if (Array.isArray(parsed.students)) {
        this.safeSetItem(STORAGE_KEYS.STUDENTS, JSON.stringify(parsed.students));
      }
      if (Array.isArray(parsed.summaries)) {
        this.safeSetItem(STORAGE_KEYS.SUMMARIES, JSON.stringify(parsed.summaries));
      }
      if (Array.isArray(parsed.deletedSummaryIds)) {
        this.safeSetItem(STORAGE_KEYS.DELETED_SUMMARIES, JSON.stringify(parsed.deletedSummaryIds));
      }
      if (Array.isArray(parsed.deletedStudentIds)) {
        this.safeSetItem(STORAGE_KEYS.DELETED_STUDENTS, JSON.stringify(parsed.deletedStudentIds));
      }

      const stdCount = Array.isArray(parsed.students) ? parsed.students.length : 0;
      const sumCount = Array.isArray(parsed.summaries) ? parsed.summaries.length : 0;

      if (res.ok) {
        const data = await res.json();
        return {
          success: true,
          message: data.message || 'تمت استعادة النسخة الاحتياطية بنجاح!',
          studentsCount: data.studentsCount ?? stdCount,
          summariesCount: data.summariesCount ?? sumCount,
        };
      }

      return {
        success: true,
        message: 'تمت استعادة النسخة الاحتياطية محلياً بنجاح!',
        studentsCount: stdCount,
        summariesCount: sumCount,
      };
    } catch (err: any) {
      console.error('Backup restore error:', err);
      throw new Error(err.message || 'فشلت قراءة ملف النسخة الاحتياطية');
    }
  },
};
