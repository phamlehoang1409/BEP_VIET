import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Phone, Lock, User, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { validateVietnamPhone } from '../utils/vietnamData';
import { requestOtp } from '../api';
import { useToast } from './Toast';

export default function LoginModal() {
  const navigate = useNavigate();
  const { isAuthModalOpen, setIsAuthModalOpen, loginWithPhone, loginAsAdmin } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState(1); // 1: Phone input, 2: OTP input, 3: Admin passcode
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setIsAuthModalOpen(false);
    setStep(1);
    setPhone('');
    setOtp('');
    setPhoneError('');
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setPhoneError('');

    const validation = validateVietnamPhone(phone);
    if (!validation.isValid) {
      setPhoneError(validation.error);
      return;
    }

    setLoading(true);
    try {
      const res = await requestOtp(validation.normalized);
      if (res.success) {
        setPhone(validation.normalized);
        setStep(2);
        setOtp('123456'); // pre-fill demo OTP for easiest frictionless user testing
        showToast(res.message, 'info', 4500);
      }
    } catch (err) {
      setPhoneError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      showToast('Vui lòng nhập mã OTP', 'error');
      return;
    }

    setLoading(true);
    try {
      await loginWithPhone(phone, otp, name);
      showToast('Đăng nhập thành công! Chào mừng bạn đến Bếp Việt.', 'success');
      handleClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!adminPasscode) {
      showToast('Vui lòng nhập mật khẩu quản trị viên', 'error');
      return;
    }
    setLoading(true);
    try {
      await loginAsAdmin(adminPasscode);
      showToast('Đăng nhập Quản Trị Viên thành công!', 'success');
      handleClose();
      navigate('/admin');
    } catch (err) {
      showToast(err.message || 'Mật khẩu quản trị không chính xác!', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 animate-scale-up"
      >
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* STEP 1: Phone input */}
        {step === 1 && (
          <div>
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
              <Phone className="w-6 h-6" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Đăng nhập bằng Số Điện Thoại
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6">
              Nhập số điện thoại Việt Nam để theo dõi món ăn và tích điểm thành viên.
            </p>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                  Số điện thoại Việt Nam
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-3 text-slate-400 font-bold text-sm flex items-center gap-1.5">
                    <span>🇻🇳</span>
                    <span>+84</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="0912 345 678"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (phoneError) setPhoneError('');
                    }}
                    className={`w-full pl-22 pr-4 py-3 rounded-2xl bg-slate-50 border text-sm font-semibold outline-none transition ${
                      phoneError
                        ? 'border-rose-400 bg-rose-50/30'
                        : 'border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100'
                    }`}
                    autoFocus
                  />
                </div>
                {phoneError && (
                  <p className="text-xs text-rose-500 font-medium mt-1.5 flex items-center gap-1">
                    <span>⚠️</span> {phoneError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-xl shadow-orange-500/25 active:scale-95 transition"
              >
                <span>{loading ? 'Đang gửi mã...' : 'Tiếp tục nhận mã OTP'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Admin Switch shortcut */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-xs text-slate-500 hover:text-orange-600 font-semibold inline-flex items-center gap-1.5 transition"
              >
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Chủ quán / Quản trị viên đăng nhập</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: OTP Verification */}
        {step === 2 && (
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Xác thực mã OTP
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Mã xác thực 6 số đã được gửi tới số{' '}
              <strong className="text-slate-800">{phone}</strong>.
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                  Mã OTP (Mặc định: 123456)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center tracking-[0.5em] font-mono text-xl font-black py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                  Tên của bạn (Tùy chọn)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    placeholder="Nguyễn Văn An"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-xl shadow-orange-500/25 active:scale-95 transition"
              >
                <span>{loading ? 'Đang xác thực...' : 'Xác nhận & Đăng nhập'}</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-600 font-semibold py-1"
              >
                Đổi số điện thoại khác
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: Admin Login */}
        {step === 3 && (
          <div>
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Quản Trị Bếp Việt
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Dành riêng cho chủ quán. Yêu cầu nhập mật khẩu quản trị để truy cập.
            </p>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
                  Mật khẩu quản trị viên
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu (14092006)"
                    value={adminPasscode}
                    onChange={(e) => setAdminPasscode(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold outline-none focus:border-slate-800 transition"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-sm shadow-xl active:scale-95 transition"
              >
                {loading ? 'Đang kiểm tra...' : 'Vào trang Quản Trị'}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-xs text-slate-500 hover:text-orange-600 font-semibold py-1"
              >
                Quay lại đăng nhập Khách hàng
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
