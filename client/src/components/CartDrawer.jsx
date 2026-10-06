import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, CheckCircle2, Sparkles, Percent, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatVND } from '../utils/vietnamData';

export default function CartDrawer() {
  const navigate = useNavigate();
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    subtotal,
    deliveryFee,
    discount,
    promoCode,
    promoMessage,
    applyPromo,
    total,
    storeSettings,
    showStoreClosedModal
  } = useCart();

  const [inputCode, setInputCode] = useState('');

  if (!isCartOpen) return null;

  const targetFreeShip = storeSettings?.free_shipping_threshold || 200000;
  const freeShipProgress = Math.min(100, Math.round((subtotal / targetFreeShip) * 100));
  const freeShipRemaining = Math.max(0, targetFreeShip - subtotal);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    applyPromo(inputCode);
  };

  const handleQuickApplyPromo = (code) => {
    setInputCode(code);
    applyPromo(code);
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-[#0F121C] shadow-2xl flex flex-col animate-slide-left border-l border-amber-500/20 text-slate-900 dark:text-slate-100">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-orange-500/20">
                <ShoppingBag className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base">Giỏ Hàng Của Bạn</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{cartItems.length} món ăn đã chọn</p>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Freeship Progress Bar */}
          {cartItems.length > 0 && (
            <div className="bg-amber-50/90 dark:bg-amber-950/30 border-b border-amber-200/60 dark:border-amber-800/40 px-5 py-3 shrink-0">
              <div className="flex items-center justify-between text-xs font-bold mb-1.5 text-amber-900 dark:text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  {freeShipRemaining === 0 ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-black">🎉 Bạn đã đủ điều kiện FREESHIP!</span>
                  ) : (
                    <span>Mua thêm <strong className="text-orange-600 dark:text-orange-400">{formatVND(freeShipRemaining)}</strong> để Freeship</span>
                  )}
                </span>
                <span className="text-[11px] font-black text-amber-700 dark:text-amber-400">{freeShipProgress}%</span>
              </div>
              <div className="w-full h-2 bg-amber-200/60 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${freeShipProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Cart Item List */}
          {cartItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mb-4 border border-amber-200/50 dark:border-amber-800/40">
                <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
              </div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-base mb-1">Giỏ hàng của bạn đang trống</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-6 leading-relaxed">
                Bạn chưa chọn món nào. Khám phá ngay các món Mì Indomie thượng hạng và đồ ăn vặt hấp dẫn nhé!
              </p>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/menu');
                }}
                className="px-7 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-lg shadow-orange-500/25 hover:scale-105 active:scale-95 transition"
              >
                Khám Phá Thực Đơn
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
              {cartItems.map((item) => (
                <div
                  key={item.food.id}
                  className="flex gap-3.5 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-md transition bg-white dark:bg-[#151926]"
                >
                  <img
                    src={item.food.image}
                    alt={item.food.name}
                    className="w-20 h-20 rounded-2xl object-cover shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
                  />
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-sm truncate">
                          {item.food.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.food.id)}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition p-1"
                          title="Xóa món"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {item.note && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 italic truncate mt-0.5 font-medium">
                          Ghi chú: {item.note}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                        {formatVND(item.food.price * item.quantity)}
                      </span>

                      {/* Quantity buttons */}
                      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                          onClick={() => updateQuantity(item.food.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs shadow-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center font-black text-slate-800 dark:text-slate-200 text-xs">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.food.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-sm hover:from-amber-600 hover:to-orange-600 transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer with totals & vouchers */}
          {cartItems.length > 0 && (
            <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-[#0c0e17] shrink-0 space-y-4">
              {/* Promo code recommendation chips */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Gợi ý mã giảm giá:
                  </span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    type="button"
                    onClick={() => handleQuickApplyPromo('INDOMIE20')}
                    className="px-2.5 py-1 rounded-lg bg-amber-100/80 dark:bg-amber-950/40 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[11px] font-mono font-bold whitespace-nowrap transition"
                  >
                    INDOMIE20 (-20%)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickApplyPromo('HANOI15K')}
                    className="px-2.5 py-1 rounded-lg bg-orange-100/80 dark:bg-orange-950/40 hover:bg-orange-200 dark:hover:bg-orange-900/50 text-orange-900 dark:text-orange-300 border border-orange-300 dark:border-orange-700 text-[11px] font-mono font-bold whitespace-nowrap transition"
                  >
                    HANOI15K (-15k ship)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickApplyPromo('BEPVIETVIP')}
                    className="px-2.5 py-1 rounded-lg bg-rose-100/80 dark:bg-rose-950/40 hover:bg-rose-200 dark:hover:bg-rose-900/50 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-700 text-[11px] font-mono font-bold whitespace-nowrap transition"
                  >
                    BEPVIETVIP (-25%)
                  </button>
                </div>
              </div>

              {/* Promo code form */}
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Nhập mã voucher..."
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white dark:bg-[#151926] border border-slate-200 dark:border-slate-700 text-xs uppercase font-bold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-900/40 text-slate-900 dark:text-white shadow-sm"
                  />
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-600 text-white dark:text-slate-950 text-xs font-black transition active:scale-95 shadow-sm"
                >
                  Áp dụng
                </button>
              </form>

              {promoMessage && (
                <div
                  className={`text-xs font-bold flex items-center gap-1.5 p-2.5 rounded-xl ${
                    discount > 0 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {discount > 0 && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                  <span>{promoMessage}</span>
                </div>
              )}

              {/* Price summary */}
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-[#151926] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex justify-between">
                  <span>Tạm tính ({cartItems.length} món):</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatVND(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Giảm giá voucher ({promoCode}):</span>
                    <span>-{formatVND(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Phí giao hàng:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-black uppercase">Miễn phí ship</span>
                    ) : (
                      formatVND(deliveryFee)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2.5 border-t border-slate-100 dark:border-slate-800">
                  <span>Tổng thanh toán:</span>
                  <span className="text-lg font-black bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400 bg-clip-text text-transparent">
                    {formatVND(total)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              {storeSettings && storeSettings.is_currently_open === false ? (
                <div className="space-y-2">
                  <button
                    onClick={() => showStoreClosedModal()}
                    className="w-full py-3.5 px-4 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 font-black text-sm border border-rose-300 dark:border-rose-800 transition active:scale-95 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>🔴 Quán Đang Tạm Nghỉ (Xem Thông Báo)</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleCheckout}
                  className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm shadow-xl shadow-orange-500/25 active:scale-95 transition"
                >
                  <span>Tiến Hành Đặt Món Ngay</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
