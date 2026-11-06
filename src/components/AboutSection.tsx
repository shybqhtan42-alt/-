import React, { useState } from 'react';
import { SchoolConfig } from '../types';
import { School, GraduationCap, Calendar, Award, CheckCircle2, BookOpen } from 'lucide-react';
import { APP_IMAGES } from '../assets/images';

interface AboutSectionProps {
  config: SchoolConfig;
  onGoToSecondIntermediate: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  config,
  onGoToSecondIntermediate,
}) => {
  const [emblemError, setEmblemError] = useState(false);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Hero Overview */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-slate-100">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-emerald-50 border border-emerald-100 shrink-0 flex items-center justify-center">
            {!emblemError ? (
              <img
                src={config.customLogoUrl || APP_IMAGES.emblem}
                alt="شعار البشير التعليمي"
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
              <BookOpen className="w-10 h-10 text-emerald-800" />
            )}
          </div>

          <div className="space-y-1">
            <div className="inline-block text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md">
              المنصة التعليمية الرقمية الرسمية
            </div>
            <h1 className="text-2xl font-black text-slate-900">
              {config.platformTitle}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {config.schoolName} · إعداد: {config.authorName}
            </p>
          </div>
        </div>

        {/* Content Prose */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <p>
            تعد <strong>{config.platformTitle}</strong> مبادرة تعليمية رائدة في <strong>{config.schoolName}</strong> بإشراف وإعداد الأستاذ <strong>{config.authorName}</strong>، تهدف إلى إثراء المحتوى التعليمي للطلاب وتسهيل مراجعة الدروس وتحصيل أعلى الدرجات.
          </p>
          <p>
            تم تخصيص المنصة بصورة رئيسية لطلاب <strong>الصف الثاني المتوسط</strong>، لتوفير بنك شامل للملخصات، وأوراق العمل، والنماذج الإرشادية لكل المواد من علوم، ورياضيات، ولغتي الخالدة، والاجتماعيات والدراسات الإسلامية.
          </p>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
              <School className="w-4 h-4" />
              <span>المدرسة المعتمدة</span>
            </div>
            <div className="text-xs font-semibold text-slate-800">{config.schoolName}</div>
            <div className="text-[11px] text-slate-500">بيئة تعليمية متميزة</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
              <GraduationCap className="w-4 h-4" />
              <span>الإشراف والتطوير</span>
            </div>
            <div className="text-xs font-semibold text-slate-800">إعداد: {config.authorName}</div>
            <div className="text-[11px] text-slate-500">متابعة أكاديمية مستمرة</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
              <Calendar className="w-4 h-4" />
              <span>التوثيق والاعتماد</span>
            </div>
            <div className="text-xs font-semibold text-slate-800">
              عام {config.yearGregorian} م / {config.yearHijri} هـ
            </div>
            <div className="text-[11px] text-slate-500">حقوق الطبع والنشر محفوظة</div>
          </div>
        </div>

        {/* Direct Action */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            تصفح ملخصات الفصل الدراسي فوراً:
          </span>
          <button
            onClick={onGoToSecondIntermediate}
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            الانتقال إلى ملخصات ثاني متوسط
          </button>
        </div>
      </div>
    </div>
  );
};
