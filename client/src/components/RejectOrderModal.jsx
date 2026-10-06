import React, { useState } from 'react';
import { X, AlertTriangle, Ban, CheckCircle2, ShieldAlert } from 'lucide-react';
import { formatVND } from '../utils/vietnamData';

const PRESET_REASONS = [
  '🍳 Quán đang quá tải đơn hàng, phục vụ không kịp',
  '🥩 Hết nguyên liệu / Một số món trong đơn tạm hết',
  '📍 Địa chỉ nhận hàng nằm ngoài bán kính giao',
  '🌧️ Thời tiết xấu / Không có tài xế shipper nhận đơn',
  '📞 Khách hàng liên hệ yêu cầu hủy đơn',
  '⏰ Quán chuẩn bị đóng cửa / Hết giờ nhận đơn'
];

export default function RejectOrderModal({ order, isOpen, onClose, onConfirmReject, loading = false }) {
  const [selectedReason, setSelectedReason] = useState(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  if (!isOpen || !order) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalReason = useCustom ? customReason.trim() : selectedReason;
    if (useCustom && !finalReason) {
      return;
    }
    onConfirmReject(order.id, finalReason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-gradient-to-b from-[#1E2333] to-[#121624] border-2 border-rose-500/40 w-full max-w-lg rounded-3xl p-6 shadow-2xl shadow-rose-500/20 text-white space-y-5 animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center font-black">
              <Ban className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-rose-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Quyền Quản Trị
                </span>
                <span className="text-xs text-rose-300 font-mono font-bold">#{order.order_code}</span>
              </div>
              <h3 className="text-base font-black text-white mt-0.5">
                TỪ CHỐI / KHÔNG NHẬN ĐƠN HÀNG
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Order Summary Box */}
        <div className="bg-slate-900/90 border border-slate-700/80 p-3.5 rounded-2xl space-y-1.5 text-xs">
          <div className="flex items-center justify-between font-bold">
            <span className="text-slate-300">Khách: <strong className="text-white">{order.customer_name}</strong> ({order.customer_phone})</span>
            <span className="text-emerald-400 font-extrabold">{formatVND(order.total_amount)}</span>
          </div>
          <p className="text-slate-400 truncate">📍 {order.delivery_address}</p>
        </div>

        {/* Reason Selection Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-2">
              Chọn lý do không nhận đơn (Khách sẽ thấy lý do này):
            </label>
            <div className="space-y-2">
              {PRESET_REASONS.map((reason) => {
                const isSelected = !useCustom && selectedReason === reason;
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => {
                      setSelectedReason(reason);
                      setUseCustom(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold border transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-rose-500/20 border-rose-500 text-rose-200 font-bold shadow'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{reason}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />}
                  </button>
                );
              })}

              {/* Custom Reason Toggle */}
              <button
                type="button"
                onClick={() => setUseCustom(true)}
                className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold border transition flex items-center justify-between ${
                  useCustom
                    ? 'bg-rose-500/20 border-rose-500 text-rose-200 font-bold shadow'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>✏️ Nhập lý do khác...</span>
                {useCustom && <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />}
              </button>
            </div>

            {useCustom && (
              <div className="mt-2.5">
                <textarea
                  rows={2}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Nhập lý do từ chối cụ thể để báo cho khách hàng..."
                  required
                  className="w-full p-3 rounded-xl bg-slate-900 border border-rose-500/50 text-xs text-white placeholder-slate-500 outline-none focus:border-rose-400 transition resize-none"
                />
              </div>
            )}
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-[11px] text-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Sau khi bấm từ chối, đơn hàng sẽ chuyển sang trạng thái <strong>Đã Hủy</strong>. Hệ thống sẽ tự động gửi thông báo thời gian thực tới điện thoại/máy tính của khách hàng.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              Quay Lại
            </button>
            <button
              type="submit"
              disabled={loading || (useCustom && !customReason.trim())}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black shadow-lg shadow-rose-600/30 active:scale-95 transition flex items-center gap-1.5"
            >
              <Ban className="w-4 h-4" />
              <span>{loading ? 'Đang xử lý...' : 'XÁC NHẬN KHÔNG NHẬN ĐƠN'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
