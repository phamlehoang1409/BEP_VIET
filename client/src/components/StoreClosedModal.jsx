import React from 'react';
import { Clock, Phone, MapPin, X, Utensils } from 'lucide-react';

export default function StoreClosedModal({ isOpen, onClose, storeSettings, customMessage }) {
  if (!isOpen) return null;

  const openTime = storeSettings?.open_time || '08:00';
  const closeTime = storeSettings?.close_time || '23:00';
  const hotline = storeSettings?.hotline || '0353859726';
  const deliveryArea = storeSettings?.delivery_area || 'Nội thành Hà Nội';

  return (
    <div 
      className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-[#141824] to-slate-950 border border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl text-center overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition active:scale-95"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Center icon */}
        <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 mb-4 rounded-3xl bg-gradient-to-br from-rose-500/20 via-amber-500/20 to-orange-500/20 border-2 border-rose-500/40 flex items-center justify-center shadow-lg shadow-rose-500/20">
          <span className="text-3xl sm:text-4xl animate-pulse">🌙</span>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-black uppercase tracking-wider mb-2.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>Quán Đang Tạm Nghỉ</span>
        </div>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Bếp Việt Tạm Dừng Nhận Đơn
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed px-2">
          {customMessage ||
            'Quán hiện đang trong giờ nghỉ hoặc tạm dừng nhận đơn để chuẩn bị nguyên liệu tươi ngon nhất. Bếp sẽ mở nhận đơn trở lại vào khung giờ bên dưới!'}
        </p>

        {/* Details Card */}
        <div className="mt-5 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-left space-y-2.5 text-xs">
          <div className="flex items-center gap-2.5 text-amber-300">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Giờ phục vụ: <strong>{openTime} - {closeTime}</strong> hàng ngày
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-slate-300">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              Khu vực giao: <strong>{deliveryArea}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-slate-300">
            <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Hotline hỗ trợ: <strong className="text-emerald-400">{hotline}</strong>
            </span>
          </div>
        </div>

        {/* Actions Buttons */}
        <div className="mt-6 flex flex-col gap-2.5">
          <a
            href={`tel:${hotline}`}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 active:scale-95 transition"
          >
            <Phone className="w-4 h-4 text-slate-950" />
            <span>Gọi Hotline Quán ({hotline})</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-bold text-xs border border-slate-700/80 transition active:scale-95"
          >
            <Utensils className="w-3.5 h-3.5 text-amber-400" />
            <span>Xem trước thực đơn món ngon</span>
          </button>
        </div>
      </div>
    </div>
  );
}
