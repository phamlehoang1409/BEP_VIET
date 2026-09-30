import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Phone, Lock, User, ArrowRight, ShieldCheck, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { validateVietnamPhone } from '../utils/vietnamData';
import { requestOtp } from '../api';
import { useToast } from './Toast';

export default function LoginModal() {
  const navigate = useNavigate();
  const { isAuthModalOpen, setIsAuthModalOpen, loginWithPhone, loginAsAdmin } = useAuth();
  const { showToast } = useToast();

  // Steps:
  // 1: Phone input
  // 2: OTP verification + Mandatory Name input
  // 3: Admin passcode login
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [nameError, setNameError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setIsAuthModalOpen(false);
    setStep(1);
    setPhone('');
    setName('');
    setOtp('');
    setPhoneError('');
    setNameError('');
    setIsReturningUser(false);
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
        setOtp('123456'); // prefill demo OTP for convenient testing
        // Check if returning customer
        if (res.isExistingUser && res.existingName) {
          setName(res.existingName);
          setIsReturningUser(true);
          showToast(`Chào mừng ${res.existingName} quay trở lại! 🎉`, 'success', 4000);
        } else {
          setIsReturningUser(false);
        }
        showToast(`Mã xác thực đã gửi tới ${validation.normalized} (Mã thử nghiệm: 123456)`, 'info', 5000);
      }
    } catch (err) {
      setPhoneError(err.message || 'Không thể gửi mã OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpAndName = async (e) => {
    e.preventDefault();
    setNameError('');

    if (!otp || otp.trim().length !== 6) {
      showToast('Vui lòng nhập đúng 6 chữ số mã OTP', 'error');
      return;
    }

    // MANDATORY NAME VALIDATION - User must physically type their real name
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setNameError('Bắt buộc phải nhập Họ và Tên của Quý khách (tối thiểu 2 ký tự)');
      showToast('Vui lòng nhập họ và tên của Quý khách để tiếp tục', 'error');
      return;
    }

    setLoading(true);
    try {
      await loginWithPhone(phone, otp.trim(), trimmedName);
      showToast(`Kính chào Quý khách ${trimmedName}! Đăng nhập thành công.`, 'success');
      handleClose();
    } catch (err) {
      showToast(err.message || 'Xác thực OTP thất bại', 'error');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-gradient-to-b from-[#161922] to-[#0D0F17] rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] p-6 sm:p-8 border border-amber-500/20 text-white animate-scale-up"
      >
        {/* Glow ambient accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700/60"
        >
          <X className="w-4 h-4" />
        </button>

        {/* STEP 1: Phone input */}
        {step === 1 && (
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4 shadow-inner">
              <Phone className="w-6 h-6" />
            </div>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                Thành Viên Bếp Việt
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Đăng Nhập Bằng Số Điện Thoại
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 mb-6">
              Nhập số điện thoại để tích điểm, nhận voucher Indomie thượng hạng và theo dõi đơn hàng.
            </p>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-amber-300/80 mb-2 uppercase tracking-wider">
                  Số điện thoại Việt Nam <span className="text-rose-400">*</span>
                </label>
                
                {/* Clean luxury phone input group */}
                <div className="flex items-stretch rounded-2xl bg-slate-900/90 border border-slate-700 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 overflow-hidden transition">
                  <div className="flex items-center gap-1.5 px-3.5 bg-slate-800/80 border-r border-slate-700/80 text-xs font-bold text-slate-300 shrink-0 select-none">
                    <span className="text-base leading-none">🇻🇳</span>
                    <span className="text-amber-300 font-mono">+84</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="0353 859 726"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (phoneError) setPhoneError('');
                    }}
                    className="flex-1 px-4 py-3 bg-transparent text-sm font-semibold text-white placeholder-slate-500 outline-none"
                    autoFocus
                  />
                </div>

                {phoneError && (
                  <p className="text-xs text-rose-400 font-medium mt-1.5 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{phoneError}</span>
                  </p>
                )}
                <p className="text-[11px] text-slate-500 mt-1">Đầu số hợp lệ: 03, 05, 07, 08, 09 (10 số)</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 active:scale-95 transition"
              >
                <span>{loading ? 'Đang gửi mã xác thực...' : 'Tiếp Tục Nhận Mã OTP'}</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            </form>

            {/* Admin Switch shortcut */}
            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-xs text-slate-400 hover:text-amber-400 font-semibold inline-flex items-center gap-1.5 transition"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Chủ quán / Quản trị viên đăng nhập</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: OTP Verification + Mandatory Name */}
        {step === 2 && (
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Xác Thực & Nhập Họ Tên
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-5">
              Mã xác thực 6 số đã được gửi tới số{' '}
              <strong className="text-amber-300 font-mono">{phone}</strong>.
            </p>

            <form onSubmit={handleVerifyOtpAndName} className="space-y-4">
              {/* OTP Input */}
              <div>
                <label className="block text-xs font-bold text-amber-300/80 mb-1.5 uppercase tracking-wider">
                  Mã OTP (Mã thử nghiệm: 123456) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center tracking-[0.5em] font-mono text-xl font-black py-3 rounded-2xl bg-slate-900 border border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-amber-300 outline-none transition"
                  autoFocus
                />
              </div>

              {/* NAME INPUT - Different UI for returning vs new customers */}
              <div>
                <label className="block text-xs font-bold text-amber-300/80 mb-1.5 uppercase tracking-wider">
                  {isReturningUser ? 'Xin chào Quý khách!' : 'Họ và Tên của Quý khách'}{' '}
                  {!isReturningUser && <span className="text-rose-400">* (Bắt buộc)</span>}
                </label>
                {isReturningUser ? (
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-emerald-300">{name}</p>
                      <p className="text-[11px] text-emerald-200/70">Hệ thống đã nhận diện Quý khách. Bấm xác nhận để đăng nhập nhanh!</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <User className="w-4 h-4 text-amber-400/80 absolute left-4 top-3.5" />
                      <input
                        type="text"
                        placeholder="Quý khách tự nhập họ tên (VD: Hoàng Anh)..."
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (nameError) setNameError('');
                        }}
                        className={`w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-900 border text-sm font-semibold text-white placeholder-slate-500 outline-none transition ${
                          nameError
                            ? 'border-rose-400 bg-rose-950/20'
                            : 'border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'
                        }`}
                      />
                    </div>
                    {nameError ? (
                      <p className="text-xs text-rose-400 font-medium mt-1.5 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{nameError}</span>
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Vui lòng tự nhập họ tên để chủ quán và shipper tiện phục vụ chu đáo nhất.
                      </p>
                    )}
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 active:scale-95 transition"
              >
                <span>{loading ? 'Đang xác thực...' : 'Xác Nhận & Đăng Nhập'}</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-xs text-slate-400 hover:text-amber-300 font-semibold py-1 transition"
              >
                ← Đổi số điện thoại khác
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: Admin Passcode Login */}
        {step === 3 && (
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Quản Trị Bếp Việt
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-6">
              Dành riêng cho chủ quán. Yêu cầu nhập mật khẩu quản trị để truy cập trang quản lý đơn và món ăn.
            </p>

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-amber-300/80 mb-1.5 uppercase tracking-wider">
                  Mật khẩu quản trị viên
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-amber-400/80 absolute left-4 top-3.5" />
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu (14092006)"
                    value={adminPasscode}
                    onChange={(e) => setAdminPasscode(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-sm font-semibold text-white placeholder-slate-500 outline-none focus:border-amber-400 transition"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm shadow-xl active:scale-95 transition"
              >
                {loading ? 'Đang kiểm tra...' : 'Vào Trang Quản Trị'}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-xs text-slate-400 hover:text-amber-400 font-semibold py-1 transition"
              >
                ← Quay lại đăng nhập Khách hàng
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
