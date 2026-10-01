import React from 'react';
import { Printer, X, Check, Phone, MapPin, Clock } from 'lucide-react';
import { formatVND } from '../utils/vietnamData';

export default function PrintBillModal({ order, onClose }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const items = order.items || order.order_items || [];
  const createdDate = order.created_at ? new Date(order.created_at) : new Date();
  const formattedTime = createdDate.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const formattedDate = createdDate.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:w-full print:max-w-none print:rounded-none">
        {/* Modal Action Header (Hidden in Print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm">In Hóa Đơn & Phiếu Bếp</h3>
              <p className="text-[11px] text-slate-400">Chuẩn in nhiệt 80mm / 58mm cho Shipper & Bếp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-neutral-100 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          {/* Thermal Receipt Paper (80mm emulation) */}
          <div
            id="printable-thermal-bill"
            className="w-[340px] max-w-full bg-white p-5 shadow-lg rounded-xl text-neutral-900 font-mono text-[12px] leading-relaxed border border-dashed border-neutral-300 print:border-none print:shadow-none print:w-[80mm] print:p-2 print:text-[11px]"
          >
            {/* Header */}
            <div className="text-center pb-3 border-b-2 border-dashed border-neutral-400">
              <h2 className="text-base font-black uppercase tracking-wider text-black">
                🍜 BẾP VIỆT GOURMET
              </h2>
              <p className="text-[11px] text-neutral-600 font-sans mt-0.5">
                Đỉnh Cao Mì Indomie Thượng Hạng
              </p>
              <p className="text-[11px] text-neutral-700 mt-1">
                📞 Hotline: <strong>0353.859.726</strong>
              </p>
              <p className="text-[10px] text-neutral-500 mt-0.5 font-sans">
                📍 Giao hỏa tốc Nội thành Hà Nội
              </p>
            </div>

            {/* Title & Order Meta */}
            <div className="py-2.5 text-center border-b border-dashed border-neutral-300">
              <span className="font-black text-sm uppercase block tracking-wider">
                PHIẾU GIAO HÀNG & BẾP
              </span>
              <p className="font-black text-sm text-black mt-0.5">
                #{order.order_code}
              </p>
              <p className="text-[10px] text-neutral-600">
                {formattedTime} - {formattedDate}
              </p>
            </div>

            {/* Customer Details */}
            <div className="py-2.5 border-b border-dashed border-neutral-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-500">Khách hàng:</span>
                <span className="font-bold text-black">{order.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Điện thoại:</span>
                <span className="font-bold text-black">{order.customer_phone}</span>
              </div>
              <div className="pt-0.5">
                <span className="text-neutral-500 block">Địa chỉ giao:</span>
                <span className="font-bold text-black block leading-tight font-sans text-[11px]">
                  {order.delivery_address}
                </span>
              </div>
              {order.notes && (
                <div className="pt-1 bg-amber-50 p-1.5 rounded border border-amber-200 text-amber-900 text-[10px] font-sans">
                  <strong>* Ghi chú của khách:</strong> {order.notes}
                </div>
              )}
            </div>

            {/* Order Items Table */}
            <div className="py-2.5 border-b-2 border-dashed border-neutral-400">
              <div className="flex justify-between text-[11px] font-bold pb-1.5 border-b border-neutral-200">
                <span>TÊN MÓN</span>
                <span>T.TIỀN</span>
              </div>
              <div className="divide-y divide-neutral-100">
                {items.map((item, idx) => (
                  <div key={idx} className="py-1.5">
                    <div className="flex justify-between font-bold">
                      <span className="flex-1 pr-2">
                        {item.quantity}x {item.food_name || item.name}
                      </span>
                      <span className="shrink-0">{formatVND(item.price * item.quantity)}</span>
                    </div>

                    {/* Toppings breakdown */}
                    {item.toppings && item.toppings.length > 0 && (
                      <div className="text-[10px] text-neutral-600 pl-3 font-sans">
                        + {item.toppings.map((t) => t.name || t).join(', ')}
                      </div>
                    )}

                    {/* Note per item */}
                    {item.note && (
                      <div className="text-[10px] text-orange-700 italic pl-3 font-sans">
                        (Lưu ý: {item.note})
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Totals */}
            <div className="py-2.5 border-b border-dashed border-neutral-300 space-y-1 text-[11px]">
              <div className="flex justify-between text-neutral-600">
                <span>Tiền món ăn:</span>
                <span>{formatVND(order.subtotal || order.total_amount)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Phí giao hàng:</span>
                <span>
                  {order.delivery_fee > 0 ? formatVND(order.delivery_fee) : 'Miễn phí'}
                </span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Giảm giá (Voucher):</span>
                  <span>-{formatVND(order.discount_amount)}</span>
                </div>
              )}
              {order.insurance_fee > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>Bảo hiểm đơn hàng:</span>
                  <span>+{formatVND(order.insurance_fee)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-neutral-300 flex justify-between items-center text-sm font-black text-black">
                <span>TỔNG THU:</span>
                <span className="text-base text-orange-600">
                  {formatVND(order.total_amount)}
                </span>
              </div>
            </div>

            {/* Payment Method Notice */}
            <div className="py-2.5 text-center border-b border-dashed border-neutral-300">
              <span className="text-[10px] uppercase text-neutral-500 block">
                Hình Thức Thanh Toán
              </span>
              <span className="font-black text-xs uppercase px-2 py-0.5 rounded bg-neutral-100 inline-block mt-0.5">
                {order.payment_method === 'vietqr' || order.payment_method === 'banking'
                  ? '✅ ĐÃ THANH TOÁN (VIETQR)'
                  : '💵 THU TIỀN MẶT (COD)'}
              </span>
            </div>

            {/* Footer Thank You */}
            <div className="pt-3 text-center text-[10px] text-neutral-600 space-y-0.5 font-sans">
              <p className="font-bold text-neutral-800">CẢM ƠN QUÝ KHÁCH ĐÃ ỦNG HỘ BẾP VIỆT!</p>
              <p>Chúc Quý khách một bữa ăn thật ngon miệng ❤️</p>
              <p className="text-[9px] text-neutral-400 mt-1">
                Hotline hỗ trợ & khiếu nại: 0353.859.726
              </p>
            </div>
          </div>
        </div>

        {/* Modal Buttons (Hidden in Print) */}
        <div className="p-4 bg-white border-t border-neutral-200 flex items-center justify-end gap-3 print:hidden shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition"
          >
            Đóng
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow-lg shadow-orange-500/25 transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>In Phiếu Ngay (Ctrl + P)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
