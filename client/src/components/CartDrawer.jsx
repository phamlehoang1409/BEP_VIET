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
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-slide-left border-l border-amber-500/20">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-orange-500/20">
                <ShoppingBag className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">Giỏ Hàng Của Bạn</h3>
                <p className="text-xs text-slate-500 font-medium">{cartItems.length} món ăn đã chọn</p>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Freeship Progress Bar */}
          {cartItems.length > 0 && (
            <div className="bg-amber-50/90 border-b border-amber-200/60 px-5 py-3 shrink-0">
              <div className="flex items-center justify-between text-xs font-bold mb-1.5 text-amber-900">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-amber-600" />
                  {freeShipRemaining === 0 ? (
                    <span className="text-emerald-700 font-black">🎉 Bạn đã đủ điều kiện FREESHIP!</span>
                  ) : (
                    <span>Mua thêm <strong className="text-orange-600">{formatVND(freeShipRemaining)}</strong> để Freeship</span>
                  )}
                </span>
                <span className="text-[11px] font-black text-amber-700">{freeShipProgress}%</span>
              </div>
              <div className="w-full h-2 bg-amber-200/60 rounded-full overflow-hidden">
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
              <div className="w-20 h-20 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-4 border border-amber-200/50">
                <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-base mb-1">Giỏ hàng của bạn đang trống</h4>
              <p className="text-xs text-slate-500 max-w-xs mb-6 leading-relaxed">
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
                  className="flex gap-3.5 p-3 rounded-2xl border border-slate-200/80 hover:border-amber-400 hover:shadow-md transition bg-white"
                >
                  <img
                    src={item.food.image}
                    alt={item.food.name}
                    className="w-20 h-20 rounded-2xl object-cover shrink-0 bg-slate-100 border border-slate-100"
                  />
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-extrabold text-slate-900 text-sm truncate">
                          {item.food.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.food.id)}
                          className="text-slate-400 hover:text-rose-600 transition p-1"
                          title="Xóa món"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {item.note && (
                        <p className="text-[11px] text-amber-700 italic truncate mt-0.5 font-medium">
                          Ghi chú: {item.note}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                      <span className="text-sm font-black bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                        {formatVND(item.food.price * item.quantity)}
                      </span>

                      {/* Quantity buttons */}
                      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                        <button
                          onClick={() => updateQuantity(item.food.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-lg bg-white text-slate-700 flex items-center justify-center font-bold text-xs shadow-sm hover:bg-slate-200 transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center font-black text-slate-800 text-xs">
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
            <div className="p-5 border-t border-slate-200 bg-slate-50/90 shrink-0 space-y-4">
              {/* Promo code recommendation chips */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Gợi ý mã giảm giá:
                  </span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    type="button"
                    onClick={() => handleQuickApplyPromo('INDOMIE20')}
                    className="px-2.5 py-1 rounded-lg bg-amber-100/80 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[11px] font-mono font-bold whitespace-nowrap transition"
                  >
                    INDOMIE20 (-20%)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickApplyPromo('HANOI15K')}
                    className="px-2.5 py-1 rounded-lg bg-orange-100/80 hover:bg-orange-200 text-orange-900 border border-orange-300 text-[11px] font-mono font-bold whitespace-nowrap transition"
                  >
                    HANOI15K (-15k ship)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickApplyPromo('BEPVIETVIP')}
                    className="px-2.5 py-1 rounded-lg bg-rose-100/80 hover:bg-rose-200 text-rose-900 border border-rose-300 text-[11px] font-mono font-bold whitespace-nowrap transition"
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
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs uppercase font-bold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 shadow-sm"
                  />
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition active:scale-95 shadow-sm"
                >
                  Áp dụng
                </button>
              </form>

              {promoMessage && (
                <div
                  className={`text-xs font-bold flex items-center gap-1.5 p-2.5 rounded-xl ${
                    discount > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                  }`}
                >
                  {discount > 0 && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                  <span>{promoMessage}</span>
                </div>
              )}

              {/* Price summary */}
              <div className="space-y-1.5 text-xs text-slate-600 bg-white p-3.5 rounded-2xl border border-slate-200/80">
                <div className="flex justify-between">
                  <span>Tạm tính ({cartItems.length} món):</span>
                  <span className="font-bold text-slate-900">{formatVND(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Giảm giá voucher ({promoCode}):</span>
                    <span>-{formatVND(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Phí giao hàng:</span>
                  <span className="font-bold text-slate-900">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-600 font-black uppercase">Miễn phí ship</span>
                    ) : (
                      formatVND(deliveryFee)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2.5 border-t border-slate-100">
                  <span>Tổng thanh toán:</span>
                  <span className="text-lg font-black bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                    {formatVND(total)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              {storeSettings && storeSettings.is_currently_open === false ? (
                <div className="space-y-2">
                  <button
                    onClick={() => showStoreClosedModal()}
                    className="w-full py-3.5 px-4 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 font-black text-sm border border-rose-300 transition active:scale-95 flex items-center justify-center gap-2 shadow-sm"
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
