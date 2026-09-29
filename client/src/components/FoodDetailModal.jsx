import React, { useState } from 'react';
import { X, Star, Clock, Flame, Plus, Minus, ShoppingBag } from 'lucide-react';
import { formatVND } from '../utils/vietnamData';
import { useCart } from '../context/CartContext';
import { useToast } from './Toast';

export default function FoodDetailModal({ food, onClose }) {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  if (!food) return null;

  const handleAddToCart = () => {
    if (!food.is_available) {
      showToast('Món ăn hiện tạm hết!', 'error');
      return;
    }
    addToCart(food, quantity, note);
    showToast(`Đã thêm ${quantity}x "${food.name}" vào giỏ hàng!`, 'success');
    onClose();
  };

  const hasDiscount = food.original_price && food.original_price > food.price;
  const totalPrice = food.price * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl animate-scale-up max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-sm transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Dish Image */}
        <div className="relative aspect-[16/10] w-full shrink-0 bg-slate-100">
          <img
            src={food.image}
            alt={food.name}
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
            }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <span className="text-xs font-semibold bg-orange-600/90 backdrop-blur-sm px-2.5 py-1 rounded-lg">
              {food.category_name || 'Món đặc biệt'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black mt-2 leading-tight drop-shadow-sm">
              {food.name}
            </h2>
          </div>
        </div>

        {/* Scrollable details */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-800 px-3 py-1.5 rounded-xl border border-amber-200/60">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>{food.rating ? food.rating.toFixed(1) : '5.0'} / 5.0</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Thời gian chuẩn bị: ~{food.prep_time || 15} phút</span>
            </div>

            {food.spicy_level > 0 && (
              <div className="flex items-center gap-1.5 bg-rose-50 text-rose-700 px-3 py-1.5 rounded-xl border border-rose-200/60">
                <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span>{food.spicy_level === 1 ? 'Cay nhẹ' : 'Cay nồng đậm vị'}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Mô tả món ăn
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              {food.description || 'Món ăn đậm đà hương vị truyền thống Việt Nam, chế biến từ nguyên liệu tươi mới trong ngày.'}
            </p>
          </div>

          {/* Special request note */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Ghi chú cho đầu bếp (tuỳ chọn)
            </h4>
            <input
              type="text"
              placeholder="VD: Không lấy hành tây, ít cay, để đá riêng..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none text-sm transition"
            />
          </div>

          {/* Quantity selector */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div>
              <span className="text-xs text-slate-400 font-bold block">Số lượng</span>
              <div className="text-lg font-black text-slate-900">
                {quantity} phần
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition shadow-sm"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center font-black text-slate-800 text-sm">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center font-bold transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Bottom CTA */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4 shrink-0">
          <div>
            <div className="text-xs text-slate-400">Tổng thanh toán</div>
            <div className="text-xl font-black text-orange-600">
              {formatVND(totalPrice)}
            </div>
            {hasDiscount && (
              <div className="text-[11px] text-slate-400 line-through">
                {formatVND(food.original_price * quantity)}
              </div>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!food.is_available}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-2xl font-bold text-sm shadow-lg transition duration-200 ${
              food.is_available
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/25 active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{food.is_available ? 'Thêm vào giỏ hàng' : 'Món tạm hết'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
