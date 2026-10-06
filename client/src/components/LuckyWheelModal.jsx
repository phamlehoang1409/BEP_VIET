import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Gift, X, Sparkles, Trophy, Check, ArrowRight, ShoppingBag } from 'lucide-react';
import { useToast } from './Toast';
import { spinLuckyWheel, getLuckyWheelStatus } from '../api';

const WHEEL_SLICES = [
  { id: 0, label: 'May Mắn Lần Sau', code: null, color: '#475569', text: '#ffffff' },
  { id: 1, label: 'Giảm 5.000₫', code: 'MAYMAN5K', color: '#F59E0B', text: '#ffffff' },
  { id: 2, label: 'Giảm 7.000₫', code: 'MAYMAN7K', color: '#10B981', text: '#ffffff' },
  { id: 3, label: 'Giảm 10%', code: 'MAYMAN10PT', color: '#EF4444', text: '#ffffff' },
  { id: 4, label: 'Giảm 5.000₫', code: 'MAYMAN5K', color: '#6366F1', text: '#ffffff' },
  { id: 5, label: 'Giảm 7.000₫', code: 'MAYMAN7K', color: '#EC4899', text: '#ffffff' },
];

export default function LuckyWheelModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [userSpins, setUserSpins] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [globalStats, setGlobalStats] = useState(null);

  // Sync available spins from localStorage whenever modal opens
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = parseInt(localStorage.getItem('bepviet_user_spins') || '0', 10);
        setUserSpins(isNaN(saved) ? 0 : saved);
      } catch (e) {
        setUserSpins(0);
      }
      setResult(null);
      setCopied(false);

      getLuckyWheelStatus()
        .then((res) => {
          if (res.success) setGlobalStats(res);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSpin = async () => {
    if (spinning) return;

    if (userSpins <= 0) {
      showToast('Bạn đã hết lượt quay! Đặt một đơn hàng Bếp Việt để nhận 1 lượt quay cho lần sau nhé.', 'info', 5000);
      return;
    }

    setResult(null);
    setCopied(false);
    setSpinning(true);

    // Deduct 1 spin locally
    const nextSpins = Math.max(userSpins - 1, 0);
    setUserSpins(nextSpins);
    try {
      localStorage.setItem('bepviet_user_spins', nextSpins.toString());
    } catch (e) {}

    try {
      const spinRes = await spinLuckyWheel();
      const prize = spinRes.prize || {
        id: 0,
        label: 'May Mắn Lần Sau',
        code: null,
        sliceIndex: 0
      };

      const targetSliceIdx = prize.sliceIndex !== undefined ? prize.sliceIndex : (spinRes.isWinner ? 1 : 0);
      const sliceAngle = 360 / WHEEL_SLICES.length;

      // 5 full spins + rotate to align pointer (top pointer at 0 deg)
      const extraSpins = 5 * 360;
      const targetAngle = extraSpins + (360 - targetSliceIdx * sliceAngle - sliceAngle / 2);
      const newRotation = rotation + targetAngle;
      setRotation(newRotation);

      setTimeout(() => {
        setSpinning(false);
        setResult({
          isWinner: spinRes.isWinner,
          prize,
          message: spinRes.message,
          totalSpins: spinRes.totalSpins
        });

        if (spinRes.isWinner) {
          try {
            localStorage.setItem('bepviet_lucky_voucher', prize.code);
          } catch (e) {}
          confetti({
            particleCount: 90,
            spread: 75,
            origin: { y: 0.6 }
          });
          showToast(`🎉 CHÚC MỪNG BẠN ĐÃ TRÚNG ${prize.label}!`, 'success', 6000);
        } else {
          showToast('Chúc bạn may mắn lần sau! Đặt hàng để nhận thêm lượt quay.', 'info', 4000);
        }
      }, 4500);
    } catch (err) {
      setSpinning(false);
      showToast(err.message || 'Lỗi khi quay thưởng', 'error');
    }
  };

  const handleCopyCode = (code) => {
    if (navigator.clipboard && code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      showToast(`Đã sao chép mã ${code}! Tự động áp dụng tại trang thanh toán.`, 'success');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const sliceAngle = 360 / WHEEL_SLICES.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-gradient-to-b from-[#1E293B] via-[#0F172A] to-[#090D16] border border-amber-500/30 rounded-3xl max-w-sm w-full p-6 text-white text-center shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={spinning}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Tặng Vé Quay Khi Mua Hàng</span>
          </div>
          <h3 className="text-xl font-black text-white">Vòng Quay May Mắn</h3>
          <p className="text-[11px] text-slate-300 mt-0.5">
            Quay liền tay - Nhận ngay voucher giảm giá hấp dẫn!
          </p>
        </div>

        {/* User Tickets Counter */}
        <div className="flex items-center justify-center gap-2 my-2 py-1.5 px-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 max-w-xs mx-auto">
          <span className="text-xs text-slate-300 font-semibold">Lượt quay của bạn:</span>
          <span
            className={`font-black text-sm px-2 py-0.5 rounded-lg ${
              userSpins > 0 ? 'bg-amber-400 text-slate-950 font-mono' : 'bg-slate-700 text-slate-400 font-mono'
            }`}
          >
            {userSpins} lượt
          </span>
        </div>

        {/* Wheel Graphic */}
        <div className="relative w-60 h-60 mx-auto my-3 flex items-center justify-center">
          {/* Top Pointer */}
          <div className="absolute -top-3 z-30 transform -translate-x-1/2 left-1/2 drop-shadow-md">
            <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[22px] border-t-amber-400 filter drop-shadow" />
          </div>

          {/* Rotating Wheel */}
          <div
            className="w-full h-full rounded-full border-4 border-amber-400/80 shadow-2xl relative overflow-hidden"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning
                ? 'transform 4.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
                : 'none'
            }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {WHEEL_SLICES.map((slice, idx) => {
                const startAngle = idx * sliceAngle;
                const endAngle = startAngle + sliceAngle;
                const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);
                const d = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

                const textAngle = startAngle + sliceAngle / 2;
                const textX = 50 + 32 * Math.cos((Math.PI * textAngle) / 180);
                const textY = 50 + 32 * Math.sin((Math.PI * textAngle) / 180);

                return (
                  <g key={slice.id + '-' + idx}>
                    <path d={d} fill={slice.color} stroke="#0f172a" strokeWidth="0.6" />
                    <text
                      x={textX}
                      y={textY}
                      fill={slice.text}
                      fontSize="4.1"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                    >
                      {slice.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Center Spin Button */}
          <button
            onClick={handleSpin}
            disabled={spinning || userSpins <= 0}
            className={`absolute z-20 w-16 h-16 rounded-full font-black text-xs shadow-2xl border-4 border-white transition flex flex-col items-center justify-center leading-none ${
              userSpins > 0
                ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 hover:scale-105 active:scale-95 cursor-pointer'
                : 'bg-slate-700 text-slate-400 border-slate-600 opacity-80 cursor-not-allowed'
            }`}
          >
            <span>{spinning ? 'ĐANG' : userSpins > 0 ? 'QUAY' : 'HẾT'}</span>
            <span className="text-[10px]">{spinning ? 'QUAY' : userSpins > 0 ? 'NGAY' : 'LƯỢT'}</span>
          </button>
        </div>

        {/* RESULT DISPLAY */}
        {result && (
          <div className="mt-2 p-3.5 rounded-2xl border text-center space-y-2 animate-scale-up">
            {result.isWinner ? (
              <div className="bg-emerald-500/10 border-emerald-500/30 p-3 rounded-xl space-y-2">
                <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Xin Chúc Mừng Bạn Đã Trúng Thưởng!</span>
                </p>
                <p className="text-base font-black text-white">{result.prize.label}</p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <span className="font-mono font-bold text-xs bg-slate-900 px-3 py-1.5 rounded-xl border border-emerald-500/40 text-emerald-400">
                    {result.prize.code}
                  </span>
                  <button
                    onClick={() => handleCopyCode(result.prize.code)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs transition flex items-center gap-1 shadow"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : null}
                    <span>{copied ? 'Đã Lưu!' : 'Sao Chép'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Mã đã được lưu, sẽ tự áp dụng tại trang Đặt hàng & Thanh toán!
                </p>
              </div>
            ) : (
              <div className="bg-slate-800/80 border-slate-700/60 p-3 rounded-xl space-y-1.5">
                <p className="text-sm font-bold text-amber-300">
                  🍀 Chúc bạn may mắn lần sau!
                </p>
                <p className="text-[11px] text-slate-400">
                  Hãy tiếp tục đặt món tại Bếp Việt để nhận thêm lượt quay may mắn nhé!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty spins notice & CTA to buy */}
        {userSpins <= 0 && !spinning && (
          <div className="mt-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-2">
            <p className="text-[11px] text-amber-200">
              💡 Mỗi đơn hàng hoàn tất tại Bếp Việt sẽ được tặng <strong>+1 lượt quay may mắn</strong> để nhận voucher cho lần mua kế tiếp!
            </p>
            <button
              onClick={() => {
                onClose();
                navigate('/menu');
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Đặt Món Ngay Nhận Lượt Quay</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
