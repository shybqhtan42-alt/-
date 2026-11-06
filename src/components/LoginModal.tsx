import React, { useState } from 'react';
import { SchoolConfig, Student } from '../types';
import { storageService } from '../services/storageService';
import { X, Lock, KeyRound, User, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SchoolConfig;
  onLoginSuccess: (role: 'student' | 'manager', student?: Student) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  config,
  onLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'student' | 'manager'>('student');

  // Student form fields
  const [studentUsername, setStudentUsername] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentSchoolCode, setStudentSchoolCode] = useState('');

  // Manager form fields (only requires manager school code: 24242)
  const [managerCode, setManagerCode] = useState('');

  // Error & notification states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isCodeOnlyMode = config.studentLoginMode === 'code_only';

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedCode = studentSchoolCode.trim();

    // Mode 1: Login by school code only
    if (isCodeOnlyMode) {
      if (!trimmedCode) {
        setErrorMessage('يرجى إدخال رمز المدرسة.');
        return;
      }

      if (trimmedCode !== config.studentSchoolCode) {
        setErrorMessage('رمز المدرسة غير صحيح. يرجى إدخال رمز المدرسة الصحيح.');
        return;
      }

      setSuccessMessage('تم التحقق من رمز المدرسة بنجاح! جاري دخول الطالب...');
      setTimeout(() => {
        onLoginSuccess('student', {
          id: 'std-school-code',
          fullName: 'طالب مدرسة عبد الملك بن مروان',
          username: 'student',
          password: '',
          grade: 'ثاني متوسط',
          registeredAt: `${config.yearHijri} هـ / ${config.yearGregorian} م`,
        });
        onClose();
      }, 800);
      return;
    }

    // Mode 2: Login by username + password + school code
    const trimmedUsername = studentUsername.trim();
    const trimmedPass = studentPassword.trim();

    if (!trimmedUsername || !trimmedPass || !trimmedCode) {
      setErrorMessage('يرجى تعبئة كافة الحقول المطلوبة (اسم المستخدم، كلمة المرور، ورمز المدرسة).');
      return;
    }

    // 1. Verify student school code
    if (trimmedCode !== config.studentSchoolCode) {
      setErrorMessage('رمز المدرسة غير صحيح. يرجى إدخال رمز المدرسة الصحيح.');
      return;
    }

    // 2. Check registered students list from storage & live server fallback
    let registeredStudents = storageService.getStudents();
    let matchedStudent = registeredStudents.find(
      (s) => s.username.toLowerCase() === trimmedUsername.toLowerCase()
    );

    // If student is not yet found locally, query live server state immediately (instant propagation across all phones)
    if (!matchedStudent) {
      try {
        const liveState = await storageService.fetchServerState();
        if (liveState && Array.isArray(liveState.students)) {
          registeredStudents = liveState.students;
          matchedStudent = registeredStudents.find(
            (s) => s.username.toLowerCase() === trimmedUsername.toLowerCase()
          );
        }
      } catch (err) {
        console.warn('Live student fetch check error:', err);
      }
    }

    if (registeredStudents.length === 0) {
      setErrorMessage(
        'الموقع حالياً لا يحتوي على أي طالب مسجل. يجب على مدير المدرسة أولاً تسجيل بيانات الطلاب من لوحة التحكم.'
      );
      return;
    }

    if (!matchedStudent) {
      setErrorMessage(
        'عذراً، اسم المستخدم هذا غير مسجل في النظام من قِبل إدارة المدرسة. تواصل مع إدارة المدرسة لتسجيل اسمك أولاً.'
      );
      return;
    }

    if (matchedStudent.password !== trimmedPass) {
      setErrorMessage('كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى.');
      return;
    }

    // Login successful
    setSuccessMessage(`أهلاً بك يا ${matchedStudent.fullName}، تم تسجيل دخولك بنجاح!`);
    setTimeout(() => {
      onLoginSuccess('student', matchedStudent);
      onClose();
    }, 1000);
  };

  const handleManagerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedCode = managerCode.trim();

    if (!trimmedCode) {
      setErrorMessage('يرجى إدخال رمز مدرسة المدير.');
      return;
    }

    // Verify manager school code
    if (trimmedCode !== config.managerSchoolCode) {
      setErrorMessage('رمز مدرسة المدير غير صحيح.');
      return;
    }

    // Login successful
    setSuccessMessage('مرحباً بك يا مدير المدرسة، جاري فتح لوحة التحكم...');
    setTimeout(() => {
      onLoginSuccess('manager');
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">{config.platformTitle}</h3>
            <p className="text-xs text-emerald-200">{config.schoolName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-emerald-800 transition-colors"
            title="إغلاق"
            aria-label="إغلاق نافذة تسجيل الدخول"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher: Student vs Manager */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => {
              setActiveTab('student');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'student'
                ? 'bg-white text-emerald-900 border-b-2 border-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>دخول الطالب</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('manager');
              setErrorMessage(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'manager'
                ? 'bg-white text-emerald-900 border-b-2 border-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>دخول المدير (رمز المدرسة)</span>
          </button>
        </div>

        <div className="p-6">
          {/* Error & Success Messages */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {activeTab === 'student' ? (
            /* Student Login Form */
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              {isCodeOnlyMode ? (
                /* Mode 1: Code Only View */
                <>
                  <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200 text-xs text-emerald-950 leading-relaxed space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>طريقة الدخول: برمز المدرسة فقط</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      حددت إدارة مدرسة عبد الملك بن مروان إمكانية دخول الطالب مباشرة بإدخال رمز المدرسة المعتمد للطلاب دون الحاجة لاسم مستخدم أو كلمة مرور.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      رمز المدرسة للطلاب
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        autoFocus
                        value={studentSchoolCode}
                        onChange={(e) => setStudentSchoolCode(e.target.value)}
                        placeholder="أدخل رمز المدرسة"
                        className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-600 font-mono transition-colors"
                      />
                      <KeyRound className="w-4 h-4 text-emerald-700 absolute right-3 top-3" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all mt-2"
                  >
                    دخول الطالب برمز المدرسة
                  </button>
                </>
              ) : (
                /* Mode 2: Username + Password + Code View */
                <>
                  <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 text-[11px] text-emerald-900 leading-relaxed">
                    <span className="font-bold">تنبيه للطلاب:</span> يتطلب الدخول إدخال اسم المستخدم وكلمة المرور مع رمز المدرسة، ويجب أن يكون اسمك مسجلاً مسبقاً من قِبل إدارة المدرسة.
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      اسم المستخدم
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={studentUsername}
                        onChange={(e) => setStudentUsername(e.target.value)}
                        placeholder="أدخل اسم المستخدم الخاص بك"
                        className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-600 transition-colors"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      كلمة المرور
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        placeholder="أدخل كلمة المرور"
                        className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-600 transition-colors"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      رمز المدرسة للطلاب
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={studentSchoolCode}
                        onChange={(e) => setStudentSchoolCode(e.target.value)}
                        placeholder="أدخل رمز المدرسة"
                        className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-600 font-mono transition-colors"
                      />
                      <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors mt-2"
                  >
                    دخول الطالب إلى المنصة
                  </button>
                </>
              )}
            </form>
          ) : (
            /* Manager Login Form: Only School Code */
            <form onSubmit={handleManagerSubmit} className="space-y-4">
              <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                <span className="font-bold">بوابة المدير:</span> يتطلب دخول المدير إدخال رمز مدرسة المدير للتحكم في الأسماء والملخصات ورمز المدرسة.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  رمز مدرسة المدير
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    autoFocus
                    value={managerCode}
                    onChange={(e) => setManagerCode(e.target.value)}
                    placeholder="أدخل رمز مدرسة المدير"
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-600 font-mono transition-colors"
                  />
                  <KeyRound className="w-4 h-4 text-amber-600 absolute right-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors mt-2"
              >
                دخول المدير إلى لوحة التحكم
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
