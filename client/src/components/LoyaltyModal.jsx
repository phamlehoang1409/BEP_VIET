import React, { useState } from 'react';
import { X, Crown, Sparkles, Gift, CheckCircle2, Coins, ArrowRight, ShieldCheck, Zap, Heart, Star } from 'lucide-react';
import { useLoyalty, LOYALTY_TIERS } from '../context/LoyaltyContext';
import { useCart } from '../context/CartContext';
import { useToast } from './Toast';
import { formatVND } from '../utils/vietnamData';
import confetti from 'canvas-confetti';

export default function LoyaltyModal({ isOpen, onClose }) {
  const { points, lifetimeSpend, currentTier } = useLoyalty();
  const { applyPromo } = useCart();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'tiers' | 'rewards'

  if (!isOpen) return null;

  // Calculate next tier info
  const tierKeys = ['BRONZE', 'SILVER', 'GOLD', 'DIAMOND'];
  const currentTierKey = Object.keys(LOYALTY_TIERS).find(
    (k) => LOYALTY_TIERS[k].id === currentTier.id
  ) || 'BRONZE';
  const currentIndex = tierKeys.indexOf(currentTierKey);
  const nextTierKey = currentIndex < tierKeys.length - 1 ? tierKeys[currentIndex + 1] : null;
  const nextTier = nextTierKey ? LOYALTY_TIERS[nextTierKey] : null;

  const spendForNextTier = nextTier ? Math.max(0, nextTier.minSpend - lifetimeSpend) : 0;
  const progressPercent = nextTier
    ? Math.min(100, Math.round((lifetimeSpend / nextTier.minSpend) * 100))
    : 100;

  const handleClaimGift = (voucherCode) => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });
    navigator.clipboard.writeText(voucherCode);
    showToast(`Đã sao chép mã độc quyền "${voucherCode}"! Áp dụng ngay khi thanh toán.`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-xl bg-[#0F121C] text-white rounded-3xl overflow-hidden shadow-2xl border border-amber-500/30 flex flex-col max-h-[90vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative p-6 bg-gradient-to-br from-[#1C2030] via-[#151926] to-[#0F121C] border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20">
              {currentTier.icon || '🪙'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white">Bếp Xu & Hạng Thành Viên</h3>
                <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${currentTier.badgeClass}`}>
                  {currentTier.name}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Tích lũy Bếp Xu mỗi đơn hàng - Dùng trừ tiền trực tiếp khi thanh toán
              </p>
            </div>
          </div>

          {/* Points & Spend Banner */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 relative overflow-hidden">
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5" /> Số dư Bếp Xu
              </div>
              <div className="text-2xl font-black text-amber-300 mt-1 flex items-baseline gap-1">
                <span>{points.toLocaleString('vi-VN')}</span>
                <span className="text-xs font-bold text-amber-400">Xu (= {formatVND(points)})</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">1 Bếp Xu = 1 VNĐ giảm trực tiếp</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 relative overflow-hidden">
              <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" /> Tổng Chi Tiêu
              </div>
              <div className="text-xl font-black text-purple-200 mt-1">
                {formatVND(lifetimeSpend)}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Tích lũy trọn đời nâng hạng VIP</p>
            </div>
          </div>

          {/* Tier Progress Bar */}
          {nextTier && (
            <div className="mt-4 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">
                  Tiến độ lên <span className="text-amber-300 font-black">{nextTier.name} {nextTier.icon}</span>
                </span>
                <span className="text-amber-400 font-black">{progressPercent}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Chi tiêu thêm <span className="text-white font-bold">{formatVND(spendForNextTier)}</span> để mở khóa hoàn xu <span className="text-emerald-400 font-bold">{Math.round(nextTier.earnRate * 100)}%</span>!
              </p>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-[#0A0C13] px-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 text-xs font-black border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Đặc Quyền Của Bạn
          </button>
          <button
            onClick={() => setActiveTab('tiers')}
            className={`py-3 px-4 text-xs font-black border-b-2 transition ${
              activeTab === 'tiers'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Bảng 4 Hạng Thành Viên
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`py-3 px-4 text-xs font-black border-b-2 transition ${
              activeTab === 'rewards'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Nhiệm Vụ Kiếm Thêm Xu ⚡
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Quyền Lợi Hạng {currentTier.name}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentTier.benefits.map((b, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-center gap-2.5 text-xs text-slate-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              {/* How to use points */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-amber-300">
                  <Zap className="w-4 h-4" /> Cách Sử Dụng Bếp Xu
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tại bước thanh toán đơn hàng (Checkout), bạn chỉ cần bật nút <strong>"Dùng Bếp Xu"</strong>, hệ thống sẽ tự động trừ thẳng số tiền tương ứng vào hóa đơn.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'tiers' && (
            <div className="space-y-3">
              {Object.entries(LOYALTY_TIERS).map(([key, tier]) => {
                const isCurrent = tier.id === currentTier.id;
                return (
                  <div
                    key={key}
                    className={`p-4 rounded-2xl border transition ${
                      isCurrent
                        ? 'bg-amber-500/10 border-amber-400 shadow-lg shadow-amber-500/10'
                        : 'bg-slate-800/30 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{tier.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-white">{tier.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                                Đang Đạt
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Chi tiêu từ {formatVND(tier.minSpend)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-emerald-400">
                          Tích {Math.round(tier.earnRate * 100)}% Xu
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {tier.benefits.map((ben, bi) => (
                        <span
                          key={bi}
                          className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700"
                        >
                          • {ben}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'rewards' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-black">
                    🍲
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white">Đặt Đơn Hàng Mới</h5>
                    <p className="text-[11px] text-slate-400">Nhận hoàn {Math.round(currentTier.earnRate * 100)}% Bếp Xu ngay khi giao thành công</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition shadow-sm"
                >
                  Đặt Ngay
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black">
                    ⭐
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white">Đánh Giá Đơn Hàng</h5>
                    <p className="text-[11px] text-slate-400">Viết nhận xét món ăn nhận ngay +5.000 Bếp Xu</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-400">+5.000 Xu</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                    🎁
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white">Vòng Quay May Mắn</h5>
                    <p className="text-[11px] text-slate-400">Quay thưởng mỗi ngày trúng voucher lên đến 50.000đ</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs transition shadow-sm"
                >
                  Quay Ngay
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0A0C13] border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Bếp Việt Loyalty Program
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition"
          >
            Đã Hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
