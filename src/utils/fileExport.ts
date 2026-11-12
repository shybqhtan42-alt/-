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
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Converts any image URL (including relative /uploads/ or remote URLs) to base64
 * so it is guaranteed to embed self-contained into HTML documents or canvas without network dependencies.
 */
async function resolveImageAsBase64(src?: string, titleHint?: string): Promise<string | null> {
  if (src && src.startsWith('data:image/')) return src;
  if (src && src.startsWith('data:')) {
    return src.replace(/^data:[^;]+;base64,/, 'data:image/jpeg;base64,');
  }

  const urlsToTry: string[] = [];
  if (src) {
    urlsToTry.push(src);
    if (typeof window !== 'undefined' && src.startsWith('/')) {
      urlsToTry.push(window.location.origin + src);
    }
  }

  // Fallbacks for known school assets if the main url failed or was not uploaded
  if (titleHint?.includes('الطاقة') || titleHint?.includes('العلوم') || src?.includes('Screenshot')) {
    urlsToTry.push('/assets/aistudio/Screenshot_________________Chrome_ccc1b384.jpg');
    urlsToTry.push('/uploads/Screenshot_٢٠٢٦١١٠٨_٢٢٠٦٥٦_Chrome.jpg');
    if (typeof window !== 'undefined') {
      urlsToTry.push(window.location.origin + '/assets/aistudio/Screenshot_________________Chrome_ccc1b384.jpg');
    }
  }

  for (const url of urlsToTry) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        if (blob.size > 0) {
          const base64 = await new Promise<string | null>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve(typeof reader.result === 'string' ? reader.result : null);
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          });
          if (base64) return base64;
        }
      }
    } catch (_) {
      // try next
    }
  }

  return null;
}

/**
 * Downloads the worksheet image stamped directly with the student's name, school name,
 * and teacher name rendered onto the image canvas as a genuine high-resolution PNG file.
 */
export async function downloadStampedImage(
  summary: SummaryItem,
  config?: Partial<SchoolConfig>,
  studentInfo?: StudentDownloadInfo
): Promise<void> {
  const schoolName = studentInfo?.schoolName || config?.schoolName || 'مدرسة عبد الملك بن مروان';
  const platformTitle = config?.platformTitle || 'منصة البشير التعليمية';
  const teacherName = studentInfo?.teacherName || config?.defaultTeacherName || config?.authorName || 'أ. صهيب القحطاني';
  const rawImage = summary.attachmentData || summary.attachmentUrl;

  const base64Src = await resolveImageAsBase64(rawImage, summary.title);
  if (!base64Src) {
    // Fallback to document generator
    return downloadSummaryDocument(summary, config, studentInfo);
  }

  const img = new Image();
  // only set crossOrigin if not data URL
  if (!base64Src.startsWith('data:')) {
    img.crossOrigin = 'anonymous';
  }

  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.onerror = () => {
      // If error on loading image, resolve gracefully without crashing
      resolve();
    };
    img.src = base64Src;
  });

  const imgWidth = img.naturalWidth || img.width || 1200;
  const imgHeight = img.naturalHeight || img.height || 800;

  // Set canvas dimensions to fit original image + official stamp header (NO bottom footer bar)
  const canvasWidth = Math.max(imgWidth, 1200);
  const scale = canvasWidth / imgWidth;
  const scaledImgHeight = imgHeight * scale;

  const headerHeight = studentInfo ? 280 : 120;
  const totalHeight = headerHeight + scaledImgHeight;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return downloadSummaryDocument(summary, config, studentInfo);
  }

  // 1. Clean Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, totalHeight);

  // 2. Official Header Banner with Royal Emerald Gradient
  const grad = ctx.createLinearGradient(0, 0, canvasWidth, 0);
  grad.addColorStop(0, '#064e3b');
  grad.addColorStop(0.5, '#065f46');
  grad.addColorStop(1, '#047857');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasWidth, headerHeight);

  // Gold accent line separating header from worksheet
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, headerHeight - 5, canvasWidth, 5);

  ctx.textAlign = 'right';
  ctx.direction = 'rtl';

  // School name and title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px "Cairo", Tahoma, sans-serif';
  ctx.fillText(`${schoolName} • ${platformTitle}`, canvasWidth - 36, 46);

  ctx.fillStyle = '#a7f3d0';
  ctx.font = 'bold 19px "Cairo", Tahoma, sans-serif';
  ctx.fillText(`ورقة عمل وملخص دراسي معتمد : ${summary.title} • ${summary.grade} - ${summary.subject}`, canvasWidth - 36, 82);

  // Student credentials & Brochure Emblem stamp box
  if (studentInfo) {
    const boxY = 100;
    const boxWidth = canvasWidth - 72;
    const boxHeight = 162;
    const boxX = 36;

    // Soft ivory background with subtle inner tint
    ctx.fillStyle = '#fffdf7';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 16);
    ctx.fill();

    // Dual luxury border (emerald & gold)
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#059669';
    ctx.stroke();

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#f59e0b';
    ctx.strokeRect(boxX + 3.5, boxY + 3.5, boxWidth - 7, boxHeight - 7);

    // 1. Top Right: Title Badge Pill (Offset safely inside right border)
    const titleBadgeText = 'بيانات توثيق الطالب والملف المعتمد ✓';
    ctx.font = 'bold 13.5px "Cairo", Tahoma, sans-serif';
    const titleBadgeTextWidth = ctx.measureText(titleBadgeText).width;
    const titleBadgeWidth = titleBadgeTextWidth + 36;
    const titleBadgeX = boxX + boxWidth - titleBadgeWidth - 24;
    const titleBadgeY = boxY + 12;

    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    ctx.roundRect(titleBadgeX, titleBadgeY, titleBadgeWidth, 27, 8);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px "Cairo", Tahoma, sans-serif';
    ctx.fillText(titleBadgeText, titleBadgeX + titleBadgeWidth / 2, titleBadgeY + 18.5);

    // 2. Top Left: Date Badge Pill (Offset safely inside left border, completely separate from emblem)
    const riyadhDateStr = new Date().toLocaleDateString('ar-SA', {
      timeZone: 'Asia/Riyadh',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const dateLabel = `تاريخ التوثيق : ${riyadhDateStr} م`;
    ctx.font = 'bold 13px "Cairo", Tahoma, sans-serif';
    const dateTextWidth = ctx.measureText(dateLabel).width;
    const datePillWidth = Math.max(dateTextWidth + 32, 210);
    const datePillX = boxX + 24;
    const datePillY = boxY + 12;

    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.roundRect(datePillX, datePillY, datePillWidth, 27, 8);
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#92400e';
    ctx.fillText(dateLabel, datePillX + datePillWidth / 2, datePillY + 18.5);

    // Vertical row positions (generous vertical spacing, 46px apart)
    const row1Y = boxY + 80;
    const row2Y = boxY + 128;

    // Reset text alignment for student data columns
    ctx.textAlign = 'right';
    ctx.direction = 'rtl';

    // 3. Column 1 (Right): Student Name & School (with clean, dynamic spacing!)
    const col1X = boxX + boxWidth - 32;

    // Row 1: Student Name
    const studentLabel = 'اسم الطالب : ';
    ctx.fillStyle = '#047857';
    ctx.font = 'bold 16px "Cairo", Tahoma, sans-serif';
    ctx.fillText(studentLabel, col1X, row1Y);
    const studentLabelWidth = ctx.measureText(studentLabel).width;

    ctx.fillStyle = '#022c22';
    ctx.font = '900 21px "Cairo", Tahoma, sans-serif';
    ctx.fillText(studentInfo.studentName, col1X - studentLabelWidth - 14, row1Y);

    // Row 2: School Name
    const schoolLabel = 'المدرسة : ';
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 15px "Cairo", Tahoma, sans-serif';
    ctx.fillText(schoolLabel, col1X, row2Y);
    const schoolLabelWidth = ctx.measureText(schoolLabel).width;

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 17px "Cairo", Tahoma, sans-serif';
    ctx.fillText(studentInfo.schoolName, col1X - schoolLabelWidth - 14, row2Y);

    // 4. Column 2 (Center): Teacher Name & Grade/Subject (with clean, dynamic spacing!)
    const col2X = boxX + boxWidth * 0.54;

    // Row 1: Teacher Name
    const teacherLabel = 'المعلم المشرف : ';
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 15px "Cairo", Tahoma, sans-serif';
    ctx.fillText(teacherLabel, col2X, row1Y);
    const teacherLabelWidth = ctx.measureText(teacherLabel).width;

    ctx.fillStyle = '#065f46';
    ctx.font = 'bold 18px "Cairo", Tahoma, sans-serif';
    ctx.fillText(studentInfo.teacherName, col2X - teacherLabelWidth - 14, row1Y);

    // Row 2: Grade and Subject
    const gradeLabel = 'الصف والمقرر : ';
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 15px "Cairo", Tahoma, sans-serif';
    ctx.fillText(gradeLabel, col2X, row2Y);
    const gradeLabelWidth = ctx.measureText(gradeLabel).width;

    ctx.fillStyle = '#0f766e';
    ctx.font = 'bold 18px "Cairo", Tahoma, sans-serif';
    ctx.fillText(`${summary.grade} • ${summary.subject}`, col2X - gradeLabelWidth - 14, row2Y);

    // 5. Column 3 (Left): OFFICIAL BROCHURE EMBLEM (شعار مطويات معتمدة - positioned cleanly below date pill)
    const emblemX = datePillX + datePillWidth / 2;
    const emblemY = boxY + 102;

    ctx.save();
    // Emblem circular glow badge
    const radGrad = ctx.createRadialGradient(emblemX, emblemY, 8, emblemX, emblemY, 46);
    radGrad.addColorStop(0, '#fef3c7');
    radGrad.addColorStop(0.75, '#fde68a');
    radGrad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(emblemX, emblemY, 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 2.2;
    ctx.strokeStyle = '#b45309';
    ctx.stroke();

    // Inner ring
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#065f46';
    ctx.beginPath();
    ctx.arc(emblemX, emblemY, 34, 0, Math.PI * 2);
    ctx.stroke();

    // Folded brochure icon geometry (3 panels: Left, Center, Right folded like a brochure / مطوية)
    // Center panel
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(emblemX - 10, emblemY - 22, 20, 26);
    ctx.strokeStyle = '#065f46';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(emblemX - 10, emblemY - 22, 20, 26);

    // Left folded panel
    ctx.beginPath();
    ctx.moveTo(emblemX - 10, emblemY - 22);
    ctx.lineTo(emblemX - 22, emblemY - 18);
    ctx.lineTo(emblemX - 22, emblemY + 8);
    ctx.lineTo(emblemX - 10, emblemY + 4);
    ctx.closePath();
    ctx.fillStyle = '#ecfdf5';
    ctx.fill();
    ctx.stroke();

    // Right folded panel
    ctx.beginPath();
    ctx.moveTo(emblemX + 10, emblemY - 22);
    ctx.lineTo(emblemX + 22, emblemY - 18);
    ctx.lineTo(emblemX + 22, emblemY + 8);
    ctx.lineTo(emblemX + 10, emblemY + 4);
    ctx.closePath();
    ctx.fillStyle = '#ecfdf5';
    ctx.fill();
    ctx.stroke();

    // Brochure fold lines
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(emblemX - 6, emblemY - 17);
    ctx.lineTo(emblemX + 6, emblemY - 17);
    ctx.moveTo(emblemX - 6, emblemY - 12);
    ctx.lineTo(emblemX + 6, emblemY - 12);
    ctx.moveTo(emblemX - 6, emblemY - 7);
    ctx.lineTo(emblemX + 6, emblemY - 7);
    ctx.stroke();

    // Ribbon banner at bottom of emblem
    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    ctx.roundRect(emblemX - 48, emblemY + 12, 96, 20, 6);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10.5px "Cairo", Tahoma, sans-serif';
    ctx.fillText('مطويات البشير', emblemX, emblemY + 25.5);
    ctx.restore();
  }

  // 3. Draw original worksheet image (NO bottom footer bar, clean pristine finish!)
  ctx.drawImage(img, 0, headerHeight, canvasWidth, scaledImgHeight);

  // Trigger real image download
  canvas.toBlob((blob) => {
    if (blob) {
      const safeTitle = (summary.title || 'ورقة_عمل').replace(/[/\\?%*:|"<>]/g, '_').trim();
      const safeStudent = studentInfo?.studentName
        ? ` - الطالب ${studentInfo.studentName.replace(/[/\\?%*:|"<>]/g, '_')}`
        : '';
      triggerDownload(blob, `${safeTitle}${safeStudent}.png`);
    } else {
      downloadSummaryDocument(summary, config, studentInfo);
    }
  }, 'image/png');
}

/**
 * Downloads the summary as a complete, self-contained educational document or native attachment.
 * Guarantees that any attached image is embedded as inline base64 so it NEVER breaks when opened offline.
 */
export async function downloadSummaryDocument(
  summary: SummaryItem,
  config?: Partial<SchoolConfig>,
  studentInfo?: StudentDownloadInfo
): Promise<void> {
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

  const rawImageSrc = summary.attachmentData || summary.attachmentUrl;
  const resolvedBase64Image = isImage ? await resolveImageAsBase64(rawImageSrc, summary.title) : null;

  // If this summary is exclusively a standalone image and student downloaded it directly:
  // Use downloadStampedImage for pristine image file output!
  if (isImage && resolvedBase64Image && (!summary.summaryText || summary.summaryText.length < 50)) {
    return downloadStampedImage(summary, config, studentInfo);
  }

  // If it's a PDF file with no student personalization or direct PDF download requested:
  if (summary.attachmentType === 'pdf' || summary.attachmentName?.toLowerCase().endsWith('.pdf')) {
    if (summary.attachmentData && summary.attachmentData.startsWith('data:application/pdf')) {
      const parts = summary.attachmentData.split(',');
      const byteString = atob(parts[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      const blob = new Blob([ab], { type: 'application/pdf' });
      const safePdfName = studentInfo?.studentName
        ? `${safeTitle} - الطالب ${studentInfo.studentName.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`
        : `${safeTitle}.pdf`;
      triggerDownload(blob, safePdfName);
      return;
    }
  }

  // Generate a self-contained, offline-compatible HTML document with guaranteed embedded base64!
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
      max-width: 860px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
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
    /* Prominent Worksheet File Image Box */
    .worksheet-highlight-box {
      margin-bottom: 24px;
      background: #f8fafc;
      border: 2px solid #065f46;
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(6, 95, 70, 0.08);
      text-align: center;
    }
    .worksheet-badge-tag {
      font-size: 13px;
      font-weight: 900;
      color: #065f46;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .worksheet-img {
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      border: 1px solid #cbd5e1;
      display: block;
      margin: 0 auto;
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
    /* Official Student & Teacher Endorsement Stamp (Footer) */
    .student-stamp-footer {
      background: #ecfdf5;
      border: 2px solid #10b981;
      border-radius: 12px;
      padding: 12px 18px;
      margin-top: 24px;
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
      <!-- Official Header Stamp Box as specified by manager with Brochure Emblem -->
      <div class="student-stamp-banner" style="display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 260px;">
          <div class="stamp-header-top">
            <span class="stamp-title-badge">بيانات توثيق الطالب والملف المعتمد ✓</span>
            <span style="font-size: 11px; font-weight: 800; color: #92400e;">تاريخ التوثيق : ${new Date().toLocaleDateString('ar-SA', { timeZone: 'Asia/Riyadh' })} م</span>
          </div>
          <div class="stamp-grid">
            <div class="stamp-cell">
              <span class="stamp-label">اسم الطالب :</span>
              <span class="stamp-value" style="color: #064e3b; font-size: 16px;">${escapeHtml(studentInfo.studentName)}</span>
            </div>
            <div class="stamp-cell">
              <span class="stamp-label">المدرسة :</span>
              <span class="stamp-value">${escapeHtml(studentInfo.schoolName)}</span>
            </div>
            <div class="stamp-cell">
              <span class="stamp-label">المعلم المشرف :</span>
              <span class="stamp-value">${escapeHtml(studentInfo.teacherName)}</span>
            </div>
            <div class="stamp-cell">
              <span class="stamp-label">الصف والمقرر :</span>
              <span class="stamp-value">${escapeHtml(summary.grade)} - ${escapeHtml(summary.subject)}</span>
            </div>
          </div>
        </div>

        <!-- Official Brochure Emblem Badge (شعار مطويات معتمدة) -->
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #b45309; border-radius: 12px; padding: 10px 16px; text-align: center; box-shadow: 0 4px 10px rgba(180,83,9,0.15); display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 110px;">
          <div style="font-size: 24px; line-height: 1;">📜</div>
          <div style="font-size: 11px; font-weight: 900; color: #78350f; margin-top: 4px;">مطوية معتمدة</div>
          <div style="font-size: 9px; font-weight: 800; background: #065f46; color: #ffffff; padding: 1px 8px; border-radius: 999px; margin-top: 4px;">★ رسمي ★</div>
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

      ${resolvedBase64Image ? `
      <!-- PROMINENT WORKSHEET FILE ATTACHMENT (100% Guaranteed Base64) -->
      <div class="worksheet-highlight-box">
        <div class="worksheet-badge-tag">
          <span>📄</span>
          <span>ورقة العمل والملف المرفق المعتمد:</span>
        </div>
        <img src="${resolvedBase64Image}" alt="${escapeHtml(summary.title)}" class="worksheet-img" />
      </div>
      ` : ''}

      ${summary.summaryText && summary.summaryText.trim() ? `
      <div class="section-label">محتوى الملخص والشرح الدراسي:</div>
      <div class="summary-text-box">${escapeHtml(summary.summaryText)}</div>
      ` : ''}

    </div>

    <div class="footer-bar">
      <div>وثيقة دراسية ومطوية معتمدة · ${escapeHtml(platformTitle)} · ${escapeHtml(schoolName)}</div>
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
تاريخ التنزيل: ${new Date().toLocaleDateString('ar-SA', { timeZone: 'Asia/Riyadh' })} م
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
${summary.summaryText || 'ورقة عمل ومرفق دراسي معتمد'}
===============================================================
${platformTitle} • ${schoolName}
`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const filename = studentInfo?.studentName
    ? `${summary.title} - الطالب ${studentInfo.studentName.replace(/[/\\?%*:|"<>]/g, '_')}.txt`
    : `${summary.title} - ${summary.subject}.txt`;
  triggerDownload(blob, filename);
}
