import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Copy,
  Check,
  Download,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Smartphone,
  CreditCard,
  Banknote,
  RotateCw
} from 'lucide-react';
import { formatVND } from '../utils/vietnamData';
import { useToast } from './Toast';

export default function VietQRPaymentGateway({ order, onSwitchToCod, onPaymentCompleted }) {
  const { showToast } = useToast();
  const [copiedField, setCopiedField] = useState(null);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes countdown (Shopee standard)
  const [isPaidConfirmed, setIsPaidConfirmed] = useState(
    order?.payment_status === 'paid' ||
    order?.status === 'confirmed' ||
    order?.status === 'preparing' ||
    order?.status === 'delivering' ||
    order?.status === 'completed'
  );

  // Sync paid state if order updates
  useEffect(() => {
    if (
      order?.payment_status === 'paid' ||
      order?.status === 'confirmed' ||
      order?.status === 'preparing' ||
      order?.status === 'delivering' ||
      order?.status === 'completed'
    ) {
      setIsPaidConfirmed(true);
    }
  }, [order?.status, order?.payment_status]);

  // 15-minute countdown timer
  useEffect(() => {
    if (timeLeft <= 0 || isPaidConfirmed) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isPaidConfirmed]);

  if (!order) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedCountdown = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const bankName = 'Techcombank (Ngân hàng Kỹ Thương)';
  const accountNumber = '19073268561011';
  const accountHolder = 'PHẠM LÊ HOÀNG (BẾP VIỆT)';
  const transferContent = `BV ${order.order_code}`;
  const amount = Number(order.total_amount) || 0;

  // VietQR Napas247 Standard API with Techcombank BIN 970407
  const qrUrl = `https://api.vietqr.io/image/970407-${accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
    transferContent
  )}&accountName=${encodeURIComponent('PHAM LE HOANG')}`;

  const handleCopy = (text, fieldName) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      showToast(`Đã sao chép ${fieldName}!`, 'success', 2500);
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  const handleDownloadQR = async () => {
    try {
      showToast('Đang tải ảnh mã QR xuống điện thoại...', 'info');
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VietQR-BepViet-${order.order_code}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast('Đã lưu ảnh mã QR! Mở App Ngân hàng và chọn Quét từ ảnh nhé.', 'success');
    } catch (e) {
      window.open(qrUrl, '_blank');
    }
  };

  const handleUserConfirmed = () => {
    setIsPaidConfirmed(true);
    showToast('Bếp Việt đã ghi nhận thông báo chuyển khoản của Quý khách! Bếp đang kiểm tra và chuẩn bị món ngay.', 'success', 6000);
    if (onPaymentCompleted) onPaymentCompleted();
  };

  return (
    <div className="bg-white rounded-3xl border border-orange-200/80 shadow-xl overflow-hidden animate-scale-up">
      {/* Shopee-style Header Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl shrink-0">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider bg-black/20 px-2.5 py-0.5 rounded-full">
                Cổng Thanh Toán VietQR 24/7
              </span>
              <span className="text-xs font-semibold opacity-90 hidden sm:inline">• Napas 247</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black mt-0.5">
              Quét Mã QR Chuyển Khoản Ngân Hàng
            </h3>
          </div>
        </div>

        {/* 15:00 Countdown Timer */}
        {!isPaidConfirmed ? (
          <div className="flex items-center gap-2 bg-black/25 backdrop-blur-md px-3.5 py-2 rounded-2xl self-start sm:self-auto border border-white/20">
            <Clock className="w-4 h-4 text-amber-300 animate-spin-slow shrink-0" />
            <div className="text-right">
              <span className="text-[10px] text-amber-200 block uppercase font-bold leading-none">
                Thời gian giữ đơn
              </span>
              <span className="font-mono text-base font-black tracking-widest text-white leading-none">
                {formattedCountdown}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-emerald-500 text-white px-3.5 py-1.5 rounded-2xl text-xs font-black self-start sm:self-auto shadow-md">
            <CheckCircle2 className="w-4 h-4" />
            <span>ĐÃ XÁC NHẬN THANH TOÁN</span>
          </div>
        )}
      </div>

      {/* Main Payment Section */}
      <div className="p-5 sm:p-7">
        {isPaidConfirmed ? (
          /* Payment Success State */
          <div className="text-center py-6 space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center ring-8 ring-emerald-50">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-black text-slate-900">
              Đã Ghi Nhận Chuyển Khoản Thành Công!
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Cảm ơn Quý khách! Đơn hàng <strong className="text-slate-800">#{order.order_code}</strong> trị giá <strong className="text-orange-600">{formatVND(amount)}</strong> đã được ghi nhận. Bếp đang bắt đầu chế biến món ăn ngay bây giờ.
            </p>
          </div>
        ) : (
          /* Active QR Payment Gateway */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
            {/* Left: VietQR Image with Scanning Radar Frame */}
            <div className="md:col-span-5 flex flex-col items-center">
              <div className="relative p-3 bg-white rounded-3xl border-2 border-dashed border-amber-400/80 shadow-lg group">
                {/* 4 Corner Framing Accents */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-orange-500 rounded-tl-xl pointer-events-none" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-orange-500 rounded-tr-xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-orange-500 rounded-bl-xl pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-orange-500 rounded-br-xl pointer-events-none" />

                {/* QR Image */}
                <img
                  src={qrUrl}
                  alt={`VietQR ${order.order_code}`}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/owner_qr.png';
                  }}
                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-2xl"
                />

                {/* Animated Scanning Radar Line */}
                <div className="absolute inset-x-3 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-lg shadow-amber-500/50 animate-bounce pointer-events-none top-1/2" />
              </div>

              {/* Download QR Button */}
              <button
                onClick={handleDownloadQR}
                className="mt-3 flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition shadow-xs active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-orange-600" />
                <span>Tải Mã QR Về Máy</span>
              </button>
            </div>

            {/* Right: Bank Transfer Details Table (Shopee 1-Click Copy) */}
            <div className="md:col-span-7 space-y-4">
              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-3 text-xs">
                {/* Amount to pay */}
                <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                  <span className="text-slate-600 font-semibold">Số tiền thanh toán:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-orange-600 font-mono">
                      {formatVND(amount)}
                    </span>
                    <button
                      onClick={() => handleCopy(amount.toString(), 'Số tiền')}
                      className="p-1.5 rounded-lg bg-white border border-amber-300 text-slate-600 hover:text-orange-600 transition"
                      title="Sao chép số tiền"
                    >
                      {copiedField === 'Số tiền' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Bank Name */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Ngân hàng:</span>
                  <strong className="text-slate-800 text-right">{bankName}</strong>
                </div>

                {/* Account Number */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Số tài khoản:</span>
                  <div className="flex items-center gap-2">
                    <strong className="text-base text-slate-900 font-mono tracking-wider font-black">
                      {accountNumber}
                    </strong>
                    <button
                      onClick={() => handleCopy(accountNumber, 'Số tài khoản')}
                      className="p-1.5 rounded-lg bg-white border border-amber-300 text-slate-600 hover:text-orange-600 transition"
                      title="Sao chép số tài khoản"
                    >
                      {copiedField === 'Số tài khoản' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Account Holder */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Chủ tài khoản:</span>
                  <strong className="text-slate-800 uppercase">{accountHolder}</strong>
                </div>

                {/* Transfer Content Note */}
                <div className="flex items-center justify-between pt-2 border-t border-amber-200/60">
                  <div className="pr-2">
                    <span className="text-slate-600 block">Nội dung chuyển khoản:</span>
                    <span className="text-[10px] text-rose-600 font-bold block">
                      * Bắt buộc ghi đúng để tự động nhận đơn
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-orange-500 text-white font-mono font-black text-sm tracking-wider">
                      {transferContent}
                    </span>
                    <button
                      onClick={() => handleCopy(transferContent, 'Nội dung CK')}
                      className="p-1.5 rounded-lg bg-white border border-amber-300 text-slate-600 hover:text-orange-600 transition"
                      title="Sao chép nội dung"
                    >
                      {copiedField === 'Nội dung CK' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* 3 Step Guide (Shopee standard) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-[11px] text-slate-600">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-orange-600" />
                  <span>3 Bước thanh toán nhanh trong 30 giây:</span>
                </p>
                <ol className="list-decimal list-inside space-y-1 pl-1">
                  <li>Mở <strong>App Ngân hàng bất kỳ</strong> hoặc <strong>Ví MoMo</strong> trên điện thoại.</li>
                  <li>Chọn mục <strong>"Quét mã QR"</strong> và quét hình mã bên trái.</li>
                  <li>Kiểm tra đúng số tiền <strong>{formatVND(amount)}</strong> và bấm xác nhận chuyển tiền.</li>
                </ol>
              </div>

              {/* User Confirmation Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  onClick={handleUserConfirmed}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs shadow-lg shadow-emerald-500/25 transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tôi Đã Chuyển Khoản Xong</span>
                </button>

                {onSwitchToCod && (
                  <button
                    onClick={onSwitchToCod}
                    className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                  >
                    Đổi Sang Trả Tiền Mặt (COD)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
