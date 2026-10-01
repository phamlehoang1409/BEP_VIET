import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Gift, X, Sparkles, Trophy, Check, ArrowRight } from 'lucide-react';
import { useToast } from './Toast';

const PRIZES = [
  { id: 1, label: 'Giảm 10.000₫', code: 'MAYMAN10K', color: '#F59E0B', text: '#ffffff' },
  { id: 2, label: 'Freeship 15k', code: 'FREESHIP15K', color: '#10B981', text: '#ffffff' },
  { id: 3, label: 'Giảm 20%', code: 'INDOMIE20', color: '#EF4444', text: '#ffffff' },
  { id: 4, label: 'Voucher 10k', code: 'MAYMAN10K', color: '#6366F1', text: '#ffffff' },
  { id: 5, label: 'VIP Giảm 25%', code: 'BEPVIETVIP', color: '#EC4899', text: '#ffffff' },
  { id: 6, label: 'Thêm May Mắn', code: 'MAYMAN10K', color: '#F97316', text: '#ffffff' },
];

export default function LuckyWheelModal({ isOpen, onClose }) {
  const { showToast } = useToast();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSpin = () => {
    if (spinning) return;
    setWonPrize(null);
    setCopied(false);
    setSpinning(true);

    // Pick a winning index (favoring 0, 1, 2, 3)
    const winningIdx = Math.floor(Math.random() * PRIZES.length);
    const sliceAngle = 360 / PRIZES.length;
    // Calculate final angle (target top pointer)
    const extraSpins = 5 * 360; // 5 full rotations
    const targetAngle = extraSpins + (360 - winningIdx * sliceAngle - sliceAngle / 2);

    const newRotation = rotation + targetAngle;
    setRotation(newRotation);

    setTimeout(() => {
      setSpinning(false);
      const prize = PRIZES[winningIdx];
      setWonPrize(prize);

      // Save winning voucher to localStorage for auto-fill in checkout
      try {
        localStorage.setItem('bepviet_lucky_voucher', prize.code);
      } catch (e) {}

      // Fire celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      showToast(`🎉 Chúc mừng bạn trúng ${prize.label}!`, 'success');
    }, 4500);
  };

  const handleCopyCode = (code) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      showToast(`Đã sao chép mã ${code}! Tự động áp dụng khi thanh toán.`, 'success');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const sliceAngle = 360 / PRIZES.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-gradient-to-b from-[#1E293B] to-[#0F172A] border border-amber-500/30 rounded-3xl max-w-sm w-full p-6 text-white text-center shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ưu Đãi Mỗi Ngày</span>
          </div>
          <h3 className="text-xl font-black text-white">Vòng Quay May Mắn</h3>
          <p className="text-xs text-slate-300 mt-1">
            Quay ngay nhận mã giảm giá & freeship đặt món ăn hôm nay!
          </p>
        </div>

        {/* Wheel Container */}
        <div className="relative w-64 h-64 mx-auto my-4 flex items-center justify-center">
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
            {/* SVG Wheel segments */}
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {PRIZES.map((prize, idx) => {
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
                  <g key={prize.id}>
                    <path d={d} fill={prize.color} stroke="#1e293b" strokeWidth="0.5" />
                    <text
                      x={textX}
                      y={textY}
                      fill={prize.text}
                      fontSize="4.2"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                    >
                      {prize.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Center Spin Button */}
          <button
            onClick={handleSpin}
            disabled={spinning}
            className="absolute z-20 w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 font-black text-xs shadow-xl border-4 border-white hover:scale-105 active:scale-95 transition flex flex-col items-center justify-center leading-none"
          >
            <span>{spinning ? 'ĐANG' : 'QUAY'}</span>
            <span className="text-[10px]">{spinning ? 'QUAY' : 'NGAY'}</span>
          </button>
        </div>

        {/* Won Prize Display */}
        {wonPrize ? (
          <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2 animate-scale-up">
            <p className="text-xs text-amber-300 font-bold uppercase tracking-wider">
              🎉 Bạn Đã Trúng Thưởng!
            </p>
            <p className="text-lg font-black text-white">{wonPrize.label}</p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="font-mono font-bold text-sm bg-slate-900 px-3 py-1.5 rounded-xl border border-amber-500/40 text-amber-400">
                {wonPrize.code}
              </span>
              <button
                onClick={() => handleCopyCode(wonPrize.code)}
                className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition flex items-center gap-1 shadow"
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
          <p className="text-[11px] text-slate-400 mt-2">
            Mỗi khách hàng được nhận 1 lượt quay may mắn mỗi ngày
          </p>
        )}
      </div>
    </div>
  );
}
