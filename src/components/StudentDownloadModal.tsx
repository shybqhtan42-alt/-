import React, { useState } from 'react';
import { Download, FileText, CheckCircle, ShieldCheck, User, School, GraduationCap, X, Image as ImageIcon } from 'lucide-react';
import { SchoolConfig, StudentDownloadInfo, SummaryItem } from '../types';

interface StudentDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: SummaryItem;
  config: SchoolConfig;
  defaultStudentName?: string;
  onConfirmDownload: (info: StudentDownloadInfo, format: 'image' | 'document' | 'text') => void;
}

export const StudentDownloadModal: React.FC<StudentDownloadModalProps> = ({
  isOpen,
  onClose,
  summary,
  config,
  defaultStudentName = '',
  onConfirmDownload,
}) => {
  const [studentName, setStudentName] = useState(defaultStudentName);
  const [schoolName, setSchoolName] = useState(config.schoolName || 'مدرسة عبد الملك بن مروان');
  const [teacherName, setTeacherName] = useState(config.defaultTeacherName || config.authorName || 'صهيب القحطاني');
  const [error, setError] = useState('');

  const hasImageAttachment =
    summary.attachmentType === 'image' ||
    Boolean(summary.attachmentName?.match(/\.(png|jpe?g|webp|gif|svg)$/i)) ||
    Boolean(summary.attachmentUrl?.startsWith('data:image/')) ||
    Boolean(summary.attachmentData?.startsWith('data:image/')) ||
    Boolean(summary.attachmentUrl?.includes('/uploads/'));

  const [downloadFormat, setDownloadFormat] = useState<'image' | 'document' | 'text'>(
    hasImageAttachment ? 'image' : 'document'
  );

  if (!isOpen) return null;

  const placementLabel = {
    header: 'ترويسة رسمية أعلى الملف',
    footer: 'ختم وتوقيع أسفل الملف',
    watermark: 'علامة مائية أمنية في الخلفية',
    both: 'ترويسة بالأعلى وختم اعتماد بالأسفل',
  }[config.downloadStampPlacement || 'header'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setError('يرجى إدخال اسم الطالب ثلاثياً أو ثنائياً على الأقل لتوثيق الملف');
      return;
    }
    if (!schoolName.trim()) {
      setError('يرجى كتابة اسم المدرسة');
      return;
    }
    if (!teacherName.trim()) {
      setError('يرجى كتابة اسم المعلم أو المشرف');
      return;
    }

    setError('');
    onConfirmDownload(
      {
        studentName: studentName.trim(),
        schoolName: schoolName.trim(),
        teacherName: teacherName.trim(),
      },
      downloadFormat
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-emerald-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
              <ShieldCheck className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold">توثيق بيانات الطالب قبل التنزيل</h3>
              <p className="text-xs text-emerald-100">سيتم إدراج بياناتك رسمياً داخل نسخة الملف المحمّل</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* File Card Info */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              {hasImageAttachment ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-emerald-700 font-medium">الملف المراد تنزيله:</div>
              <div className="text-sm font-bold text-gray-800 truncate">{summary.title}</div>
              <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                <span>{summary.grade}</span>
                <span>•</span>
                <span>مادة {summary.subject}</span>
              </div>
            </div>
          </div>

          {/* Download Format Choice if image attachment exists */}
          {hasImageAttachment && (
            <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-3 space-y-2">
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <span>اختر صيغة التنزيل المعتمدة:</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDownloadFormat('image')}
                  className={`p-2.5 rounded-lg border text-xs font-bold flex flex-col items-center justify-center text-center gap-1 transition ${
                    downloadFormat === 'image'
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>صورة ورقة العمل (PNG)</span>
                  <span className="text-[10px] opacity-90 font-normal">تفتح بالاستوديو مباشرة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDownloadFormat('document')}
                  className={`p-2.5 rounded-lg border text-xs font-bold flex flex-col items-center justify-center text-center gap-1 transition ${
                    downloadFormat === 'document'
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>مستند دراسي كامل</span>
                  <span className="text-[10px] opacity-90 font-normal">شامل الصورة والنص والختم</span>
                </button>
              </div>
            </div>
          )}

          {/* Stamp Placement Notice */}
          <div className="flex items-center justify-between text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
            <span className="font-semibold text-slate-700">موضع التوثيق المعتمد من المدير:</span>
            <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
              {placementLabel}
            </span>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          {/* Inputs */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-600" />
                <span>اسم الطالب الرباعي أو الثلاثي *</span>
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => {
                  setStudentName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="مثال: زياد علي عسيري"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-gray-800 outline-none transition"
                autoFocus
                required
              />
              <p className="text-[11px] text-gray-400 mt-1">يظهر هذا الاسم في ترويسة وختم الملف كاسم الطالب المستلم</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <School className="w-4 h-4 text-emerald-600" />
                <span>اسم المدرسة *</span>
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="اسم المدرسة المعتمدة"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-gray-800 outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span>اسم المعلم / المشرف *</span>
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="مثال: صهيب القحطاني"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium text-gray-800 outline-none transition"
                required
              />
            </div>
          </div>

          {/* Stamp Preview Card */}
          <div className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-300 rounded-xl text-center">
            <div className="text-[11px] font-bold text-emerald-800 mb-1">معاينة بطاقة الاعتماد التي ستطبع داخل الملف:</div>
            <div className="inline-block bg-white border-2 border-emerald-500 rounded-lg px-4 py-2 text-xs shadow-sm">
              <div className="font-bold text-emerald-800">{schoolName || 'اسم المدرسة'}</div>
              <div className="text-gray-700 mt-0.5">
                الطالب: <span className="font-bold text-emerald-700">{studentName || 'لم يُحدد بعد'}</span>
              </div>
              <div className="text-gray-500 text-[10px] mt-0.5">
                بإشراف المعلم: <span className="font-semibold text-gray-700">{teacherName || 'المعلم'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>
                {downloadFormat === 'image'
                  ? 'تأكيد وتحميل ورقة العمل (صورة معتمدة)'
                  : 'تأكيد وتنزيل المستند المعتمد'}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-xl font-bold text-sm transition"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
