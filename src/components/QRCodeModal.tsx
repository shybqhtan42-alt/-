import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  QrCode as QrIcon, 
  AlertTriangle, 
  Globe, 
  Smartphone, 
  Edit3, 
  Save, 
  Info,
  Share2
} from 'lucide-react';
import { SchoolConfig } from '../types';
import { storageService } from '../services/storageService';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SchoolConfig;
  onUpdateConfig?: (newConfig: SchoolConfig) => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ 
  isOpen, 
  onClose, 
  config, 
  onUpdateConfig 
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [urlMode, setUrlMode] = useState<'permanent' | 'dev'>('permanent');
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [customInputUrl, setCustomInputUrl] = useState(config.customShareUrl || '');
  const [showGuide, setShowGuide] = useState(false);

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  // Compute URLs
  const currentRawUrl = typeof window !== 'undefined' ? window.location.href : '';
  const isDevUrl = currentRawUrl.includes('ais-dev-');

  // The permanent URL replaces ais-dev- with ais-pre- (or uses custom url configured by school)
  const computedPermanentUrl = config.customShareUrl?.trim()
    ? config.customShareUrl.trim()
    : isDevUrl
    ? currentRawUrl.replace('ais-dev-', 'ais-pre-')
    : currentRawUrl;

  const activeUrl = urlMode === 'permanent' ? computedPermanentUrl : currentRawUrl;

  useEffect(() => {
    if (activeUrl) {
      QRCode.toDataURL(activeUrl, {
        width: 360,
        margin: 2,
        color: {
          dark: '#064e3b', // Deep emerald green
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      })
        .then((dataUrl) => {
          setQrDataUrl(dataUrl);
        })
        .catch((err) => {
          console.error('Error generating QR code:', err);
        });
    }
  }, [activeUrl, isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(activeUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = activeUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `باركود_${config.platformTitle.replace(/\s+/g, '_')}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handleSaveCustomUrl = () => {
    const updated = { ...config, customShareUrl: customInputUrl.trim() };
    storageService.saveConfig(updated);
    if (onUpdateConfig) onUpdateConfig(updated);
    setIsEditingUrl(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800 rounded-lg text-emerald-100">
              <QrIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">باركود ورابط المنصة للطلاب</h3>
              <p className="text-xs text-emerald-200 mt-0.5">{config.schoolName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1.5 rounded-lg hover:bg-emerald-800 transition-colors"
            title="إغلاق"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-center">
          {/* Solution Explanation Alert */}
          <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 text-right text-xs text-amber-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>حل مشكلة إغلاق الرابط وظهور شاشة الانتظار:</span>
            </div>
            <p className="leading-relaxed text-[11px] text-amber-900/90">
              رابط التطوير المؤقت (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono">ais-dev</code>) يتوقف تلقائياً بعد ساعتين لتوفير موارد السيرفر.
              للعمل المستمر على مدار الساعة بدون انقطاع:
            </p>
            <div className="text-[11px] bg-white/70 p-2.5 rounded-lg border border-amber-200/60 space-y-1">
              <div>1. اضغط على زر <strong>Share (مشاركة)</strong> في أعلى يمين واجهة Google AI Studio.</div>
              <div>2. استخدم <strong>الرابط الدائم (ais-pre)</strong> المعتمد أدناه لمشاركته مع الطلاب.</div>
            </div>
          </div>

          {/* URL Type Selector Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              onClick={() => setUrlMode('permanent')}
              className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                urlMode === 'permanent'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>الرابط الدائم المستمر (ais-pre)</span>
            </button>

            <button
              onClick={() => setUrlMode('dev')}
              className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                urlMode === 'dev'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>رابط المعاينة المؤقت</span>
            </button>
          </div>

          {/* QR Image */}
          <div className="inline-block p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 shadow-inner">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="باركود موقع البشير التعليمي"
                className="w-52 h-52 mx-auto rounded-lg shadow-sm"
              />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-slate-400">
                جاري توليد الباركود...
              </div>
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-800">
              {urlMode === 'permanent'
                ? 'امسح الباركود للوصول إلى الرابط الدائم المستمر 24 ساعة'
                : 'باركود المعاينة السريعة المؤقتة'}
            </p>
            <p className="text-[11px] text-slate-500">
              امسح الكود بكاميرا الجوال للانتقال المباشر للمنصة
            </p>
          </div>

          {/* Copy URL Input & Button */}
          <div className="space-y-2">
            {!isEditingUrl ? (
              <div className="bg-slate-50 rounded-xl p-2 border border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={activeUrl}
                  className="bg-transparent text-xs text-slate-700 w-full px-2 py-1 focus:outline-none font-mono text-left truncate"
                  dir="ltr"
                />
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg shrink-0 transition-all ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-700 text-white hover:bg-emerald-800'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ الرابط</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setCustomInputUrl(config.customShareUrl || activeUrl);
                    setIsEditingUrl(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg"
                  title="تخصيص الرابط يدوياً"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl p-2.5 border-2 border-emerald-500 space-y-2">
                <div className="text-right text-[11px] font-bold text-slate-700">
                  تعديل وتحديد رابط المنصة المعتمد:
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={customInputUrl}
                    onChange={(e) => setCustomInputUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono text-left"
                    dir="ltr"
                  />
                  <button
                    onClick={handleSaveCustomUrl}
                    className="px-3 py-1 bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>حفظ</span>
                  </button>
                  <button
                    onClick={() => setIsEditingUrl(false)}
                    className="px-2 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs shrink-0"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleDownloadQR}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>تحميل الباركود كصورة</span>
            </button>

            <a
              href={activeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-emerald-700" />
              <span>فتح الرابط مباشرة</span>
            </a>
          </div>

          {/* PWA In-App Install Prompt for Mobile Students */}
          {!isInstalled && (
            <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/80 text-right space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
                  <Smartphone className="w-4 h-4 text-emerald-700" />
                  <span>تثبيت المنصة كتطبيق على الهاتف:</span>
                </div>
                {isInstallable && (
                  <button
                    onClick={install}
                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                  >
                    تثبيت الآن
                  </button>
                )}
                {isIOS && (
                  <button
                    onClick={() => setShowIOSPrompt(true)}
                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    طريقة التثبيت لآيفون
                  </button>
                )}
              </div>
              <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                عند إضافة الموقع إلى الشاشة الرئيسية للهاتف، يفتح التطبيق مباشرة في أي وقت دون انتظار التحميل أو انقطاع السيرفر.
              </p>
            </div>
          )}

          {/* iOS Safari Guide Modal */}
          {showIOSPrompt && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-right text-xs space-y-2">
              <div className="font-bold text-slate-900">طريقة التثبيت على أجهزة iPhone / iPad:</div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px]">
                <li>اضغط على زر المشاركة (Share) في متصفح Safari أسفل الشاشة.</li>
                <li>مرر للأسفل واختر <strong>&quot;إضافة إلى الشاشة الرئيسية&quot; (Add to Home Screen)</strong>.</li>
                <li>اضغط &quot;إضافة&quot; وسيظهر أيقونة المنصة كتطبيق مثبت.</li>
              </ol>
              <button
                onClick={() => setShowIOSPrompt(false)}
                className="w-full py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[11px] font-bold"
              >
                فهمت ذلك
              </button>
            </div>
          )}

          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
            {config.schoolName} · إعداد: {config.authorName} · حقوق الطبع محفوظة {config.yearGregorian} / {config.yearHijri} هـ
          </div>
        </div>
      </div>
    </div>
  );
};
