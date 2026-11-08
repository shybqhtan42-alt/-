import { SummaryItem, SchoolConfig, StudentDownloadInfo } from '../types';

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  // CRITICAL: Do NOT set target="_blank" when downloading on mobile Chrome,
  // as it causes mobile Chrome to navigate to a blank window and reload the app!
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Downloads the summary as a complete, self-contained educational document or native attachment.
 * If studentInfo is provided, stamps student name, school name, and teacher name in the place
 * determined by the manager (header, footer, watermark, or both).
 */
export async function downloadSummaryDocument(
  summary: SummaryItem,
  config?: Partial<SchoolConfig>,
  studentInfo?: StudentDownloadInfo
) {
  const schoolName = studentInfo?.schoolName || config?.schoolName || 'مدرسة عبد الملك بن مروان';
  const authorName = config?.authorName || 'صهيب القحطاني';
  const teacherName = studentInfo?.teacherName || config?.defaultTeacherName || authorName || 'أ. صهيب القحطاني';
  const platformTitle = config?.platformTitle || 'منصة البشير التعليمية';
  const yearHijri = config?.yearHijri || '1448';
  const yearGregorian = config?.yearGregorian || '2026';
  const placement = config?.downloadStampPlacement || 'header';

  const safeTitle = (summary.title || 'ملخص_تعليمي').replace(/[/\\?%*:|"<>]/g, '_').trim();
  const isImage =
    summary.attachmentType === 'image' ||
    Boolean(summary.attachmentName?.match(/\.(png|jpe?g|webp|gif|svg)$/i)) ||
    Boolean(summary.attachmentUrl?.startsWith('data:image/')) ||
    Boolean(summary.attachmentData?.startsWith('data:image/'));

  const defaultExt = isImage ? '.png' : '.pdf';
  const safeFilename = (
    summary.attachmentName ||
    `${safeTitle}${defaultExt}`
  ).replace(/[/\\?%*:|"<>]/g, '_');

  const dataSource = (summary.attachmentData && summary.attachmentData.startsWith('data:'))
    ? summary.attachmentData
    : (summary.attachmentUrl && summary.attachmentUrl.startsWith('data:'))
    ? summary.attachmentUrl
    : null;

  // If no student personalization is requested AND there is a direct binary attachment, download directly
  if (!studentInfo) {
    // 1. Base64 binary
    if (dataSource) {
      try {
        const parts = dataSource.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || (isImage ? 'image/png' : 'application/pdf');
        const byteString = atob(parts[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mime });
        triggerDownload(blob, safeFilename);
        return;
      } catch (e) {
        console.warn('Failed base64 data download fallback:', e);
      }
    }

    // 2. Server URL
    if (summary.attachmentUrl && (summary.attachmentUrl.startsWith('/') || summary.attachmentUrl.startsWith('http'))) {
      try {
        const res = await fetch(summary.attachmentUrl);
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (!contentType.includes('text/html') || safeFilename.endsWith('.html')) {
            const blob = await res.blob();
            triggerDownload(blob, safeFilename);
            return;
          }
        }
      } catch (err) {
        console.warn('Direct fetch failed, falling back to document generator:', err);
      }
    }
  }

  // Generate a personalized, self-contained educational document!
  const filename = studentInfo?.studentName
    ? `${safeTitle} - الطالب ${studentInfo.studentName.replace(/[/\\?%*:|"<>]/g, '_')}.html`
    : `${safeTitle} - ${summary.subject} - ${summary.grade || 'المقرر'}.html`;

  const showHeaderStamp = Boolean(studentInfo) && (placement === 'header' || placement === 'both');
  const showFooterStamp = Boolean(studentInfo) && (placement === 'footer' || placement === 'both');
  const showWatermark = Boolean(studentInfo) && (placement === 'watermark' || placement === 'both');

  const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(summary.title)} - ${escapeHtml(schoolName)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Cairo", Tahoma, "Traditional Arabic", sans-serif;
      padding: 20px 14px;
      background-color: #f1f5f9;
      color: #0f172a;
      direction: rtl;
      text-align: right;
      line-height: 1.8;
    }
    .sheet {
      max-width: 840px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.08);
      border: 1px solid #cbd5e1;
      overflow: hidden;
      position: relative;
    }
    .sheet-header {
      background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%);
      color: #ffffff;
      padding: 26px 24px;
      border-bottom: 4px solid #10b981;
    }
    .school-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.22);
      padding-bottom: 12px;
      margin-bottom: 14px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .badge {
      background: #10b981;
      color: #ffffff;
      font-weight: 800;
      font-size: 11px;
      padding: 4px 12px;
      border-radius: 999px;
    }
    .school-name {
      font-weight: 900;
      font-size: 14px;
      letter-spacing: 0.2px;
    }
    .sheet-title {
      font-size: 22px;
      font-weight: 900;
      margin: 4px 0 12px 0;
      line-height: 1.4;
      color: #ffffff;
    }
    .meta-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 12px;
    }
    .meta-tag {
      background: rgba(255,255,255,0.18);
      padding: 4px 10px;
      border-radius: 8px;
      font-weight: 700;
    }
    /* Official Student & Teacher Identification Stamp (Header) */
    .student-stamp-banner {
      background: linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%);
      border: 2px solid #f59e0b;
      border-radius: 14px;
      padding: 14px 18px;
      margin-top: 16px;
      color: #78350f;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
    }
    .stamp-header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      border-bottom: 1px dashed #f59e0b;
      padding-bottom: 6px;
    }
    .stamp-title-badge {
      font-size: 12px;
      font-weight: 900;
      background: #f59e0b;
      color: #ffffff;
      padding: 3px 10px;
      border-radius: 6px;
    }
    .stamp-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 10px;
      font-size: 13px;
    }
    .stamp-cell {
      display: flex;
      flex-direction: column;
    }
    .stamp-label {
      font-size: 11px;
      font-weight: 700;
      color: #92400e;
    }
    .stamp-value {
      font-size: 14px;
      font-weight: 900;
      color: #451a03;
    }
    .sheet-body {
      padding: 28px 24px;
      position: relative;
    }
    .section-label {
      font-size: 13px;
      font-weight: 800;
      color: #065f46;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .summary-text-box {
      background-color: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 14px;
      padding: 20px;
      font-size: 15px;
      color: #1e293b;
      font-weight: 600;
      line-height: 2;
      white-space: pre-line;
      position: relative;
      z-index: 1;
    }
    .attachment-preview-box {
      margin-top: 20px;
      padding: 16px;
      background: #f8fafc;
      border: 2px dashed #cbd5e1;
      border-radius: 14px;
      text-align: center;
      position: relative;
      z-index: 1;
    }
    .attachment-preview-box img {
      max-width: 100%;
      height: auto;
      border-radius: 10px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }
    /* Official Student & Teacher Endorsement Stamp (Footer) */
    .student-stamp-footer {
      background: #ecfdf5;
      border: 2px solid #10b981;
      border-radius: 12px;
      padding: 12px 18px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      color: #065f46;
      font-size: 13px;
      font-weight: 700;
    }
    .stamp-seal-circle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #047857;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      shrink-0;
      box-shadow: 0 2px 6px rgba(4,120,87,0.3);
    }
    /* Watermark */
    .watermark-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-25deg);
      font-size: 26px;
      font-weight: 900;
      color: rgba(6, 78, 59, 0.05);
      pointer-events: none;
      white-space: nowrap;
      user-select: none;
      z-index: 0;
      text-align: center;
      width: 100%;
    }
    .footer-bar {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 12px;
      color: #64748b;
    }
    .print-button {
      background: #047857;
      color: #ffffff;
      border: none;
      padding: 9px 18px;
      border-radius: 10px;
      font-weight: 800;
      font-size: 13px;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(4,120,87,0.3);
      transition: background 0.2s;
    }
    .print-button:hover {
      background: #065f46;
    }
    @media print {
      body { padding: 0; background: #fff; }
      .sheet { box-shadow: none; border: none; max-width: 100%; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="sheet-header">
      <div class="school-info">
        <div class="school-name">${escapeHtml(schoolName)} · ${escapeHtml(platformTitle)}</div>
        <div class="badge">ملخص دراسي رسمي معتمد</div>
      </div>
      <h1 class="sheet-title">${escapeHtml(summary.title)}</h1>
      <div class="meta-tags">
        <span class="meta-tag">المادة: ${escapeHtml(summary.subject)}</span>
        <span class="meta-tag">الصف: ${escapeHtml(summary.grade)}</span>
        <span class="meta-tag">التصنيف: ${escapeHtml(summary.category || 'الملخصات')}</span>
        <span class="meta-tag">المعلم: ${escapeHtml(teacherName)}</span>
        <span class="meta-tag">العام الدراسي: ${escapeHtml(yearHijri)} هـ / ${escapeHtml(yearGregorian)} م</span>
      </div>

      ${showHeaderStamp && studentInfo ? `
      <!-- Official Header Stamp Box as specified by manager -->
      <div class="student-stamp-banner">
        <div class="stamp-header-top">
          <span class="stamp-title-badge">بيانات توثيق الطالب والملف المعتمد ✓</span>
          <span style="font-size: 11px; font-weight: 800;">تاريخ التنزيل: ${new Date().toLocaleDateString('ar-SA')} م</span>
        </div>
        <div class="stamp-grid">
          <div class="stamp-cell">
            <span class="stamp-label">اسم الطالب:</span>
            <span class="stamp-value">${escapeHtml(studentInfo.studentName)}</span>
          </div>
          <div class="stamp-cell">
            <span class="stamp-label">المدرسة:</span>
            <span class="stamp-value">${escapeHtml(studentInfo.schoolName)}</span>
          </div>
          <div class="stamp-cell">
            <span class="stamp-label">المعلم المشرف:</span>
            <span class="stamp-value">${escapeHtml(studentInfo.teacherName)}</span>
          </div>
          <div class="stamp-cell">
            <span class="stamp-label">الصف الدراسي:</span>
            <span class="stamp-value">${escapeHtml(summary.grade)}</span>
          </div>
        </div>
      </div>
      ` : ''}
    </div>

    <div class="sheet-body">
      ${showWatermark && studentInfo ? `
      <div class="watermark-overlay">
        ${escapeHtml(studentInfo.studentName)} · ${escapeHtml(studentInfo.schoolName)} · إشراف: ${escapeHtml(studentInfo.teacherName)}
      </div>
      ` : ''}

      <div class="section-label">محتوى الملخص والشرح الدراسي:</div>
      <div class="summary-text-box">${escapeHtml(summary.summaryText)}</div>

      ${(dataSource || summary.attachmentUrl) && isImage ? `
      <div class="attachment-preview-box">
        <div style="font-size: 12px; font-weight: 800; color: #475569; margin-bottom: 8px;">مرفق الملف التعليمي المعتمد:</div>
        <img src="${escapeHtml(dataSource || summary.attachmentUrl || '')}" alt="${escapeHtml(summary.title)}" />
      </div>
      ` : ''}

      ${showFooterStamp && studentInfo ? `
      <!-- Official Footer Stamp Box as specified by manager -->
      <div class="student-stamp-footer" style="margin-top: 24px;">
        <div class="stamp-seal-circle">✓</div>
        <div>
          <div>تم توثيق واعتماد هذا المستند رسميًا للطالب: <strong style="color: #064e3b; font-size: 14px;">${escapeHtml(studentInfo.studentName)}</strong></div>
          <div style="font-size: 11px; color: #047857; margin-top: 2px;">مدرسة: ${escapeHtml(studentInfo.schoolName)} · إشراف الأستاذ: <strong>${escapeHtml(studentInfo.teacherName)}</strong> · ${new Date().toLocaleDateString('ar-SA')} م</div>
        </div>
      </div>
      ` : ''}
    </div>

    <div class="footer-bar">
      <div>حقوق الطبع والتوثيق محفوظة · ${escapeHtml(schoolName)}</div>
      <button class="print-button no-print" onclick="window.print()">طباعة / حفظ كـ PDF</button>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  triggerDownload(blob, filename);
}

/**
 * Downloads summary text as a clean UTF-8 text file.
 */
export function downloadSummaryText(
  summary: SummaryItem,
  config?: Partial<SchoolConfig>,
  studentInfo?: StudentDownloadInfo
) {
  const schoolName = studentInfo?.schoolName || config?.schoolName || 'مدرسة عبد الملك بن مروان';
  const authorName = config?.authorName || 'صهيب القحطاني';
  const teacherName = studentInfo?.teacherName || config?.defaultTeacherName || authorName || 'صهيب القحطاني';
  const platformTitle = config?.platformTitle || 'منصة البشير التعليمية';
  const yearHijri = config?.yearHijri || '1448';
  const yearGregorian = config?.yearGregorian || '2026';

  let headerBanner = `===============================================================
${platformTitle} - ${schoolName}
إشراف المعلم: ${teacherName}
العام الدراسي: ${yearHijri} هـ / ${yearGregorian} م
===============================================================`;

  if (studentInfo?.studentName) {
    headerBanner += `\nبيانات توثيق الطالب:
اسم الطالب: ${studentInfo.studentName}
المدرسة: ${studentInfo.schoolName}
المعلم المشرف: ${studentInfo.teacherName}
تاريخ التنزيل: ${new Date().toLocaleDateString('ar-SA')}
===============================================================`;
  }

  const content = `${headerBanner}
عنوان الملخص: ${summary.title}
المادة: ${summary.subject}
الصف: ${summary.grade}
التصنيف: ${summary.category || 'الملخصات'}
التاريخ: ${summary.dateAdded || `${yearHijri} هـ`}
===============================================================
نص ومحتوى الملخص الدراسي:
---------------------------------------------------------------
${summary.summaryText}
===============================================================
حقوق الطبع والتوثيق محفوظة لمدرسة ${schoolName}
`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const filename = studentInfo?.studentName
    ? `${summary.title} - الطالب ${studentInfo.studentName.replace(/[/\\?%*:|"<>]/g, '_')}.txt`
    : `${summary.title} - ${summary.subject}.txt`;
  triggerDownload(blob, filename);
}
