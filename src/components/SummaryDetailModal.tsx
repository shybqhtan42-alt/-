import React, { useState } from 'react';
import { SummaryItem, CurrentUser, SchoolConfig, StudentDownloadInfo } from '../types';
import { downloadSummaryDocument, downloadSummaryText, downloadStampedImage } from '../utils/fileExport';
import { StudentDownloadModal } from './StudentDownloadModal';
import { 
  X, 
  Printer, 
  Copy, 
  Check, 
  Bookmark, 
  BookmarkCheck, 
  FileText, 
  Download, 
  Lock, 
  Star, 
  Sparkles, 
  GraduationCap,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface SummaryDetailModalProps {
  summary: SummaryItem | null;
  currentUser: CurrentUser;
  onOpenLogin: () => void;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  isFilePreviewEnabled?: boolean;
  config?: SchoolConfig;
}

export const SummaryDetailModal: React.FC<SummaryDetailModalProps> = ({
  summary,
  currentUser,
  onOpenLogin,
  onClose,
  isFavorite,
  onToggleFavorite,
  isFilePreviewEnabled = true,
  config,
}) => {
  const [copied, setCopied] = useState(false);
  const [isInAppPreviewOpen, setIsInAppPreviewOpen] = useState(false);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [blobPreviewUrl, setBlobPreviewUrl] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'worksheet' | 'pdf'>('worksheet');
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [useFallbackData, setUseFallbackData] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [pendingDownloadType, setPendingDownloadType] = useState<'document' | 'text'>('document');

  React.useEffect(() => {
    setImageLoadFailed(false);
    setUseFallbackData(false);
  }, [summary?.id]);

  // Safely generate a Blob ObjectURL for embedded preview without triggering top-frame navigation
  React.useEffect(() => {
    const rawSrc = summary?.attachmentData || summary?.attachmentUrl;
    if (!rawSrc) {
      setBlobPreviewUrl(null);
      return;
    }
    if (rawSrc.startsWith('data:')) {
      try {
        const parts = rawSrc.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : (summary?.attachmentType === 'image' ? 'image/png' : 'application/pdf');
        const byteString = atob(parts[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mime });
        const url = URL.createObjectURL(blob);
        setBlobPreviewUrl(url);
        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (e) {
        console.warn('Could not parse data url for blob:', e);
        setBlobPreviewUrl(rawSrc);
      }
    } else {
      setBlobPreviewUrl(rawSrc);
    }
  }, [summary?.attachmentData, summary?.attachmentUrl, summary?.attachmentType]);

  if (!summary) return null;

  const isExclusive = Boolean(summary.isImportant || summary.isExclusive);
  const isLocked = isExclusive && currentUser.role === 'guest';
  const hasAttachment = Boolean(summary.attachmentUrl || summary.attachmentData || summary.attachmentName);
  const isImageAttachment = summary.attachmentType === 'image' || Boolean(
    summary.attachmentName?.match(/\.(png|jpe?g|webp|gif|svg)$/i) ||
    summary.attachmentUrl?.startsWith('data:image/') ||
    summary.attachmentData?.startsWith('data:image/')
  );

  const fallbackUploadUrl = summary.attachmentName ? `/uploads/${encodeURIComponent(summary.attachmentName)}` : '';
  const effectiveImageSrc = useFallbackData && summary.attachmentData
    ? summary.attachmentData
    : (summary.attachmentUrl || summary.attachmentData || blobPreviewUrl || fallbackUploadUrl || '');

  const handleCopyText = async () => {
    try {
      const textToCopy = `${summary.title}\nالمادة: ${summary.subject} - ${summary.grade}\n\n${summary.summaryText}`;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const requiresStudentVerification =
    (config?.requireStudentInfoOnDownload ?? true) &&
    (summary?.requiresStudentInfo ?? true);

  const executeDownloadWithInfo = (info?: StudentDownloadInfo, format?: 'image' | 'document' | 'text') => {
    if (format === 'image' || (isImageAttachment && hasAttachment && format !== 'document' && format !== 'text')) {
      downloadStampedImage(summary, config, info);
    } else if (pendingDownloadType === 'text' || format === 'text') {
      downloadSummaryText(summary, config, info);
    } else {
      downloadSummaryDocument(summary, config, info);
    }
  };

  const handleDownloadFile = () => {
    setPendingDownloadType(isImageAttachment ? 'document' : 'document');
    if (requiresStudentVerification) {
      setIsDownloadModalOpen(true);
    } else {
      executeDownloadWithInfo();
    }
  };

  const handleDownloadText = () => {
    setPendingDownloadType('text');
    if (requiresStudentVerification) {
      setIsDownloadModalOpen(true);
    } else {
      executeDownloadWithInfo(undefined, 'text');
    }
  };

  // Opens the file or image cleanly without about:blank errors
  const handleOpenExternal = () => {
    if (!summary) return;
    const source = summary.attachmentUrl || fallbackUploadUrl || summary.attachmentData;
    if (source) {
      if (source.startsWith('/uploads/') || source.startsWith('http')) {
        const link = document.createElement('a');
        link.href = source;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (blobPreviewUrl) {
        const link = document.createElement('a');
        link.href = blobPreviewUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        downloadSummaryDocument(summary, config);
      }
    } else {
      downloadSummaryDocument(summary, config);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={`p-4 sm:p-5 flex items-start justify-between gap-4 text-white ${
          isExclusive ? 'bg-gradient-to-r from-emerald-950 via-emerald-900 to-amber-950' : 'bg-emerald-900'
        }`}>
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-200">
              <span className="font-semibold">{summary.grade}</span>
              <span>·</span>
              <span className="font-semibold">{summary.subject}</span>
              <span>·</span>
              <span>{summary.category}</span>
              {isExclusive && (
                <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-950 font-black text-[11px] px-2 py-0.5 rounded-full shadow-xs">
                  <Star className="w-3 h-3 fill-amber-950" />
                  <span>ملخص مهم (حصري للمسجلين)</span>
                </span>
              )}
            </div>
            <h3 className="font-bold text-base sm:text-lg leading-snug break-words">{summary.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-emerald-800 transition-colors shrink-0 cursor-pointer"
            title="إغلاق"
            aria-label="إغلاق تفاصيل الملخص"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {isLocked ? (
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-center flex flex-col items-center justify-center bg-slate-50/50">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-800 border border-amber-200 shadow-xs">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-md">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100/80 px-3 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ميزة حصرية للطلاب المسجلين</span>
              </div>
              <h4 className="text-lg font-black text-slate-900">
                هذا المحتوى ضمن «الملخصات المهمة»
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                عزيزي الطالب، خصصت إدارة مدرسة عبد الملك بن مروان هذه الميزة لطلاب المدرسة. يرجى تسجيل الدخول للاطلاع على كامل نص الملخص وتحميل أوراق العمل والمرفقات الدراسية.
              </p>
            </div>

            <div className="w-full max-w-sm space-y-2 pt-2">
              <button
                onClick={onOpenLogin}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <GraduationCap className="w-4 h-4" />
                <span>تسجيل الدخول الآن لفتح الملخص وتحميل الملف</span>
              </button>
              <p className="text-[11px] text-slate-500">
                إذا لم تكن مسجلاً بعد، يرجى مراجعة مدير المدرسة لإضافة اسمك.
              </p>
            </div>
          </div>
        ) : (
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
          {/* Metadata bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pb-3 border-b border-slate-100">
            <div>
              <span>تاريخ الإضافة: </span>
              <span className="font-medium text-slate-700">{summary.dateAdded}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleFavorite(summary.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  isFavorite
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isFavorite ? <BookmarkCheck className="w-4 h-4 text-amber-700" /> : <Bookmark className="w-4 h-4" />}
                <span>{isFavorite ? 'تم الحفظ' : 'حفظ في المفضلة'}</span>
              </button>

              <button
                onClick={handleCopyText}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors no-print cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة</span>
              </button>
            </div>
          </div>

          {/* PROMINENT ATTACHED FILE CARD */}
          {hasAttachment && (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-slate-50 p-4 sm:p-5 rounded-2xl border-2 border-emerald-300 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                    {summary.attachmentType === 'image' ? (
                      <ImageIcon className="w-6 h-6" />
                    ) : (
                      <FileText className="w-6 h-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-800">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>الملف والمرفق الدراسي المعتمد</span>
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-900 truncate">
                      {summary.attachmentName || `${summary.title}.pdf`}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {summary.attachmentType === 'image'
                        ? 'صورة دراسية عالية الدقة'
                        : 'مستند دراسي جاهز للتحميل والطباعة والمذاكرة'}
                    </p>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
                  <button
                    type="button"
                    onClick={handleDownloadFile}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    title="تحميل وحفظ الملف المعتمد مباشرة على جهازك في مجلد التنزيلات وملفاتي دون مغادرة الصفحة"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل الملف المعتمد</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenExternal}
                    className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-emerald-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 border border-emerald-300 shadow-2xs cursor-pointer active:scale-95"
                    title="فتح في موقع خارجي أو نافذة مستقلة"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                    <span>فتح مباشر</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadText}
                    className="px-3 py-2.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-300 shadow-2xs cursor-pointer active:scale-95"
                    title="تحميل نص الملخص كملف للمفكرة والملاحظات"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-600" />
                    <span>نص (TXT)</span>
                  </button>

                  {isFilePreviewEnabled && (
                    <button
                      type="button"
                      onClick={() => setIsInAppPreviewOpen(!isInAppPreviewOpen)}
                      className={`px-3.5 py-2.5 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
                        isInAppPreviewOpen
                          ? 'bg-emerald-800 text-white border border-emerald-700 shadow-sm'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                      title="معاينة واستعراض الملف مباشرة داخل التطبيق دون الخروج"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{isInAppPreviewOpen ? 'إغلاق المعاينة' : 'معاينة واستعراض الملف'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Dedicated In-App File Viewer */}
              {isInAppPreviewOpen && isFilePreviewEnabled && (
                <div className={`rounded-2xl overflow-hidden border-2 border-emerald-500 bg-slate-900 text-white mt-3 p-1 shadow-xl animate-in fade-in duration-200 ${
                  isFullscreenPreview ? 'fixed inset-3 z-50 flex flex-col max-h-[96vh]' : ''
                }`}>
                  <div className="bg-slate-800/95 px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3 text-xs border-b border-slate-700">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0"></span>
                      <span className="font-bold truncate text-slate-200 text-xs">
                        معاينة: {summary.attachmentName || `${summary.title}.pdf`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* View Mode Toggle if has PDF URL */}
                      {summary.attachmentUrl && !isImageAttachment && (
                        <div className="hidden sm:flex items-center bg-slate-700/80 p-0.5 rounded-lg text-[10px]">
                          <button
                            type="button"
                            onClick={() => setPreviewTab('worksheet')}
                            className={`px-2 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                              previewTab === 'worksheet' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            ورقة العمل
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewTab('pdf')}
                            className={`px-2 py-0.5 rounded-md font-bold transition-colors cursor-pointer ${
                              previewTab === 'pdf' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            ملف PDF
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleOpenExternal}
                        className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="فتح في موقع خارجي / نافذة مستقلة"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">فتح خارجي</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadFile}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="تحميل الملف وحفظه"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تحميل</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsFullscreenPreview(!isFullscreenPreview)}
                        className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title={isFullscreenPreview ? 'تصغير' : 'تكبير بملء الشاشة'}
                      >
                        {isFullscreenPreview ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{isFullscreenPreview ? 'تصغير' : 'تكبير'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsInAppPreviewOpen(false);
                          setIsFullscreenPreview(false);
                        }}
                        className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                      >
                        إغلاق
                      </button>
                    </div>
                  </div>

                  <div className={`bg-slate-100 p-2 sm:p-3 flex items-center justify-center overflow-y-auto rounded-b-xl ${
                    isFullscreenPreview ? 'flex-1 min-h-[75vh]' : 'min-h-[320px] max-h-[75vh]'
                  }`}>
                    {isImageAttachment ? (
                      <div className="w-full flex flex-col items-center justify-center p-3 gap-3">
                        {!imageLoadFailed && effectiveImageSrc ? (
                          <img
                            src={effectiveImageSrc}
                            alt={summary.title}
                            onError={() => {
                              if (!useFallbackData && summary.attachmentData) {
                                setUseFallbackData(true);
                              } else {
                                setImageLoadFailed(true);
                              }
                            }}
                            className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-md border border-slate-200 bg-white"
                          />
                        ) : (
                          <div className="bg-white p-6 rounded-xl border border-slate-200 text-center space-y-3 max-w-sm">
                            <ImageIcon className="w-12 h-12 text-slate-400 mx-auto" />
                            <p className="text-xs text-slate-700 font-bold">صورة المرفق الدراسي متاحة للتحميل والفتح المباشر</p>
                            <button
                              type="button"
                              onClick={handleDownloadFile}
                              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5"
                            >
                              <Download className="w-4 h-4" />
                              <span>تحميل الصورة مباشرة</span>
                            </button>
                          </div>
                        )}
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleOpenExternal}
                            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>فتح الصورة في نافذة مستقلة / موقع خارجي</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleDownloadFile}
                            className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-600" />
                            <span>تحميل وحفظ الصورة</span>
                          </button>
                        </div>
                      </div>
                    ) : (previewTab === 'pdf' && (summary.attachmentUrl || summary.attachmentData) && (
                      summary.attachmentType === 'pdf' ||
                      summary.attachmentUrl?.toLowerCase().includes('.pdf') ||
                      summary.attachmentUrl?.startsWith('blob:') ||
                      summary.attachmentUrl?.startsWith('data:application/pdf') ||
                      summary.attachmentUrl?.startsWith('/uploads/') ||
                      summary.attachmentData?.startsWith('data:application/pdf')
                    )) ? (
                      <div className="w-full h-full flex flex-col items-center gap-3">
                        <iframe
                          src={blobPreviewUrl || summary.attachmentUrl}
                          title={summary.attachmentName || summary.title}
                          className="w-full h-[65vh] rounded-lg border border-slate-300 bg-white"
                          sandbox="allow-scripts allow-same-origin"
                        />
                        <button
                          type="button"
                          onClick={() => setPreviewTab('worksheet')}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          الانتقال لعرض ورقة العمل المنسقة
                        </button>
                      </div>
                    ) : (
                      /* Rich Document Worksheet Preview (Prevents loading the app inside iframe and shows authentic study document) */
                      <div className="w-full bg-white rounded-xl p-5 sm:p-6 text-slate-900 border border-slate-200 overflow-y-auto max-h-[60vh] space-y-4 shadow-sm text-right" dir="rtl">
                        <div className="border-b-2 border-emerald-600/70 pb-3 flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-black uppercase text-emerald-800 tracking-wider">
                              ورقة عمل وملخص دراسي رسمي معتمد
                            </span>
                            <h3 className="text-base sm:text-lg font-black text-slate-950 mt-0.5">
                              {summary.title}
                            </h3>
                            <p className="text-xs text-slate-500 font-bold mt-0.5">
                              {summary.subject} · {summary.grade} · {summary.dateAdded || '1448 هـ'}
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                            <FileText className="w-6 h-6 text-emerald-800" />
                          </div>
                        </div>

                        <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-semibold whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                          {summary.summaryText}
                        </div>

                        <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
                          <span>مدرسة عبد الملك بن مروان · معتمد للطلاب</span>
                          <span className="font-mono text-emerald-800 font-bold">الملف: {summary.attachmentName || `${summary.title}.pdf`}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Standard inline image preview when in-app viewer is closed */}
              {!isInAppPreviewOpen && isImageAttachment && effectiveImageSrc && !imageLoadFailed && (
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-white mt-2 max-h-72 flex items-center justify-center p-1">
                  <img
                    src={effectiveImageSrc}
                    alt={summary.title}
                    onError={() => {
                      if (!useFallbackData && summary.attachmentData) {
                        setUseFallbackData(true);
                      } else {
                        setImageLoadFailed(true);
                      }
                    }}
                    className="max-h-72 w-full object-contain rounded-lg"
                  />
                </div>
              )}
            </div>
          )}

          {/* Main Summary Text */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
              <span>نص ومحتوى الملخص:</span>
            </h4>
            <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200/80 text-xs sm:text-sm leading-relaxed whitespace-pre-line text-slate-800">
              {summary.summaryText}
            </div>
          </div>
        </div>
        )}

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>مدرسة عبد الملك بن مروان · {summary.grade}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>

      {/* Verification modal before downloading */}
      {config && (
        <StudentDownloadModal
          isOpen={isDownloadModalOpen}
          onClose={() => setIsDownloadModalOpen(false)}
          summary={summary}
          config={config}
          defaultStudentName={currentUser.role === 'student' ? currentUser.student?.fullName || '' : ''}
          onConfirmDownload={(info, format) => {
            executeDownloadWithInfo(info, format);
          }}
        />
      )}
    </div>
  );
};
