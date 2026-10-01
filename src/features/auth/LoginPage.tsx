import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { Zap, UserPlus, LogIn } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    const userToLogin = customUser || username;
    const passToLogin = customPass !== undefined ? customPass : password;

    try {
      const loggedUser = await login(userToLogin, passToLogin);
      if (loggedUser.role === 'customer') {
        navigate('/my-cars');
      } else if (loggedUser.role === 'exchange_agent') {
        navigate('/exchange');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'بيانات الدخول غير صحيحة');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regFullName.trim() || !regUsername.trim() || !regPhone.trim()) {
      setErrorMsg('يرجى ملء كافة الحقول الأساسية المطلوبة');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        fullName: regFullName.trim(),
        username: regUsername.trim().toLowerCase(),
        phone: regPhone.trim(),
        email: regEmail.trim(),
        password: regPassword || '123456',
      });

      setSuccessMsg('تم إنشاء حسابك بنجاح! جاري توجيهك لكراج سياراتك...');
      setTimeout(() => {
        navigate('/my-cars');
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء إنشاء الحساب');
    } finally {
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    { label: 'سوبر أدمن', user: 'superadmin', pass: 'Admin@2026!' },
    { label: 'أدمن تشغيلي', user: 'ali.admin', pass: 'Admin@2026!' },
    { label: 'موظف متابعة', user: 'hussein.staff', pass: 'Staff@2026!' },
    { label: 'مكتب صرافة', user: 'amana.exchange', pass: 'Agent@2026!' },
    { label: 'عميل', user: 'omar.customer', pass: 'Customer@2026!' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EBF3EE] p-4 dir-rtl text-right font-sans">
      <div className="max-w-md w-full bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-10 h-10 rounded-xl bg-[#164E33] text-white flex items-center justify-center mx-auto mb-2 shadow-xs">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">CarShip Pro</h2>
          <p className="text-slate-400 text-xs">نظام شحن واستيراد السيارات والعمليات المالية</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#F0F4F2] p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'login'
                ? 'bg-white text-slate-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>تسجيل الدخول</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'register'
                ? 'bg-[#164E33] text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>إنشاء حساب زبون</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs text-center animate-fadeIn">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs text-center animate-fadeIn">
            {successMsg}
          </div>
        )}

        {/* 1. LOGIN FORM */}
        {authMode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">اسم المستخدم</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#F7F9F8] border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">كلمة المرور</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#F7F9F8] border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#164E33] hover:bg-[#1B5E3F] text-white text-xs font-bold py-2.5 rounded-full transition-all shadow-xs disabled:opacity-50 mt-2"
            >
              {isLoading ? 'جاري التحقق...' : 'دخول'}
            </button>
          </form>
        )}

        {/* 2. REGISTER FORM */}
        {authMode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                الاسم الكامل <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                className="w-full bg-[#F7F9F8] border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  اسم المستخدم للدخول <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full bg-[#F7F9F8] border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  رقم الهاتف <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full bg-[#F7F9F8] border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">البريد (اختياري)</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full bg-[#F7F9F8] border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">كلمة المرور</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full bg-[#F7F9F8] border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#164E33] hover:bg-[#1B5E3F] text-white text-xs font-bold py-2.5 rounded-full transition-all shadow-xs disabled:opacity-50 mt-2"
            >
              {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب والدخول لكراجي'}
            </button>
          </form>
        )}

        {/* Quick Demo Switch */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <span className="text-[10px] text-slate-400 block text-center">دخول سريع للتجربة (أدوار النظام):</span>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {demoAccounts.map((acc) => (
              <button
                key={acc.user}
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setUsername(acc.user);
                  setPassword(acc.pass);
                  handleLogin(undefined, acc.user, acc.pass);
                }}
                className="bg-[#F7F9F8] hover:bg-slate-100 border border-slate-200/60 text-[10px] font-semibold text-slate-700 px-2.5 py-1 rounded-full transition-all"
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
