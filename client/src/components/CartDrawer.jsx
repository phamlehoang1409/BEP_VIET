import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, CheckCircle2 } from 'lucide-react';
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

  const handleApplyPromo = (e) => {
    e.preventDefault();
    applyPromo(inputCode);
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
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-slide-left">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Giỏ Hàng Của Bạn</h3>
                <p className="text-xs text-slate-400">{cartItems.length} món đã chọn</p>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          {cartItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-orange-50 text-orange-400 flex items-center justify-center mb-4">
                <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
              </div>
              <h4 className="font-bold text-slate-800 text-base mb-1">Giỏ hàng đang trống</h4>
              <p className="text-xs text-slate-500 max-w-xs mb-6">
                Bạn chưa thêm món ăn nào vào giỏ. Hãy chọn những món ngon yêu thích nhé!
              </p>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/menu');
                }}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs shadow-md shadow-orange-500/20 hover:scale-105 transition"
              >
                Khám phá thực đơn
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Delivery notice */}
              <div className="p-3 bg-amber-50/80 border border-amber-200/50 rounded-2xl flex items-center gap-2 text-xs text-amber-800 font-medium">
                <span>🚚</span>
                <span>
                  {subtotal >= 250000
                    ? 'Bạn được Miễn phí giao hàng!'
                    : `Mua thêm ${formatVND(250000 - subtotal)} để được Freeship`}
                </span>
              </div>

              {cartItems.map((item) => (
                <div
                  key={item.food.id}
                  className="flex gap-3.5 p-3 rounded-2xl border border-slate-100 hover:border-orange-100 hover:shadow-sm transition bg-white"
                >
                  <img
                    src={item.food.image}
                    alt={item.food.name}
                    className="w-18 h-18 w-20 h-20 rounded-2xl object-cover shrink-0 bg-slate-100"
                  />
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-bold text-slate-800 text-sm truncate">
                          {item.food.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.food.id)}
                          className="text-slate-400 hover:text-rose-500 transition p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {item.note && (
                        <p className="text-[11px] text-amber-700 italic truncate mt-0.5">
                          Ghi chú: {item.note}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-extrabold text-orange-600">
                        {formatVND(item.food.price * item.quantity)}
                      </span>

                      {/* Quantity buttons */}
                      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                        <button
                          onClick={() => updateQuantity(item.food.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-lg bg-white text-slate-700 flex items-center justify-center font-bold text-xs shadow-sm hover:bg-slate-200 transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-4 text-center font-bold text-slate-800 text-xs">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.food.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-sm hover:bg-orange-600 transition"
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
            <div className="p-5 border-t border-slate-100 bg-slate-50/80 shrink-0 space-y-4">
              {/* Promo code form */}
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Mã voucher (BEPVIET20, GIAM10...)"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs uppercase font-semibold outline-none focus:border-orange-500"
                  />
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
                >
                  Áp dụng
                </button>
              </form>

              {promoMessage && (
                <div
                  className={`text-[11px] font-medium flex items-center gap-1.5 ${
                    discount > 0 ? 'text-emerald-600' : 'text-rose-500'
                  }`}
                >
                  {discount > 0 && <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{promoMessage}</span>
                </div>
              )}

              {/* Price summary */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Tạm tính ({cartItems.length} món):</span>
                  <span className="font-semibold text-slate-800">{formatVND(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Giảm giá ({promoCode}):</span>
                    <span>-{formatVND(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Phí giao hàng:</span>
                  <span className="font-semibold text-slate-800">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-600 font-bold uppercase">Miễn phí</span>
                    ) : (
                      formatVND(deliveryFee)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Tổng cộng:</span>
                  <span className="text-lg font-black text-orange-600">{formatVND(total)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              {storeSettings && storeSettings.is_currently_open === false ? (
                <div className="space-y-2">
                  <div 
                    onClick={() => showStoreClosedModal()}
                    className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-center cursor-pointer transition active:scale-98"
                  >
                    <p className="text-xs font-bold text-rose-600">
                      🔴 Quán hiện đang tạm nghỉ, chưa nhận đơn!
                    </p>
                    <p className="text-[11px] text-rose-500 mt-0.5">
                      Giờ mở cửa: {storeSettings.open_time || '08:00'} - {storeSettings.close_time || '23:00'} (Bấm để xem)
                    </p>
                  </div>
                  <button
                    onClick={() => showStoreClosedModal()}
                    className="w-full py-3.5 px-4 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 font-extrabold text-sm border border-rose-300 transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>🔴 Tạm Ngưng Nhận Đơn (Xem Thông Báo)</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleCheckout}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 active:scale-95 transition"
                >
                  <span>Tiến hành Đặt món</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
