import React, { useState } from 'react';
import { SchoolConfig } from '../types';
import { Copy, Check, QrCode, Share2, School, GraduationCap, BookOpen } from 'lucide-react';
import { APP_IMAGES } from '../assets/images';

interface FooterProps {
  config: SchoolConfig;
  onOpenQR: () => void;
}

export const Footer: React.FC<FooterProps> = ({ config, onOpenQR }) => {
  const [copied, setCopied] = useState(false);
  const [emblemError, setEmblemError] = useState(false);

  const handleCopyLink = async () => {
    try {
      const current = window.location.href;
      // Prefer custom configured URL or permanent ais-pre link over temporary ais-dev
      const url = config.customShareUrl?.trim()
        ? config.customShareUrl.trim()
        : current.includes('ais-dev-')
        ? current.replace('ais-dev-', 'ais-pre-')
        : current;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <footer className="bg-emerald-950 text-white mt-20 border-t border-emerald-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center pb-10 border-b border-emerald-900/80">
          {/* Col 1: Platform & School branding */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center border border-emerald-800">
                {!emblemError ? (
                  <img
                    src={config.customLogoUrl || APP_IMAGES.emblem}
                    alt="شعار المنصة"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== APP_IMAGES.emblem && target.src !== window.location.origin + APP_IMAGES.publicEmblem) {
                        target.src = APP_IMAGES.emblem;
                      } else if (target.src !== window.location.origin + APP_IMAGES.publicEmblem) {
                        target.src = APP_IMAGES.publicEmblem;
                      } else {
                        setEmblemError(true);
                      }
                    }}
                  />
                ) : (
                  <BookOpen className="w-5 h-5 text-emerald-300" />
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-white">
                  {config.platformTitle}
                </h3>
                <div className="text-xs text-emerald-300 font-medium">
                  {config.schoolName}
                </div>
              </div>
            </div>
            <p className="text-xs text-emerald-300/80 leading-relaxed pt-1">
              منصة تعليمية متطورة لتسهيل وصول الطلاب للملخصات والمذكرات الدراسية المعتمدة لصف ثاني متوسط.
            </p>
          </div>

          {/* Col 2: Author & Dedication */}
          <div className="text-center md:text-right space-y-1.5 bg-emerald-900/40 p-4 rounded-xl border border-emerald-800/60">
            <div className="flex items-center gap-2 justify-center md:justify-start text-emerald-300 text-xs font-semibold">
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              <span>إشراف وتطوير المنصة:</span>
            </div>
            <div className="text-base font-bold text-white">
              إعداد: {config.authorName}
            </div>
            <div className="text-xs text-emerald-400/90 flex items-center gap-1.5 justify-center md:justify-start">
              <School className="w-3.5 h-3.5" />
              <span>{config.schoolName}</span>
            </div>
          </div>

          {/* Col 3: Safe Link Sharing & Barcode */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-emerald-200">
              مشاركة ورابط المنصة المباشر:
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 border border-emerald-700/60'
                }`}
                title="نسخ رابط الموقع المباشر"
              >
                {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'تم نسخ الرابط بنجاح!' : 'نسخ رابط الموقع'}</span>
              </button>

              <button
                onClick={onOpenQR}
                className="flex items-center gap-2 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors border border-emerald-600/50"
                title="إظهار باركود الموقع"
              >
                <QrCode className="w-4 h-4" />
                <span>باركود الموقع</span>
              </button>
            </div>
            <p className="text-[11px] text-emerald-400/70">
              رابط صحيح ومباشر ينقلك للموقع فوراً بدون إغلاق أو أخطاء
            </p>
          </div>
        </div>

        {/* Bottom Rights Notice strictly complying with user requirement */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-300/80">
          <div className="font-medium text-center sm:text-right">
            حقوق الطبع محفوظة لدى {config.yearGregorian} التاريخ بالهجري {config.yearHijri}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-emerald-400/80">
            <span>{config.schoolName}</span>
            <span>·</span>
            <span>إعداد: {config.authorName}</span>
            <span>·</span>
            <span>{config.platformTitle}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
