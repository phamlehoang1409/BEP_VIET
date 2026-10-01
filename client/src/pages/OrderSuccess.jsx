import React, { useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  CheckCircle,
  Clock,
  ChefHat,
  Bike,
  PackageCheck,
  MessageCircle,
  ArrowRight,
  Phone,
  MapPin,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  RotateCw,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { getOrderById, getSocket, cancelOrder, switchToCod } from '../api';
import { formatVND } from '../utils/vietnamData';
import { useChat } from '../context/ChatContext';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import VietQRPaymentGateway from '../components/VietQRPaymentGateway';

export default function OrderSuccess() {
  const { id } = useParams();
  const location = useLocation();
  const { setIsChatOpen } = useChat();
  const { user, setIsAuthModalOpen } = useAuth();
  
  const { showToast } = useToast();
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!order);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  // Fetch or sync order
  const syncOrder = () => {
    if (id) {
      getOrderById(id)
        .then((res) => {
          if (res.success && res.order) {
            setOrder(res.order);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  };

  const handleConfirmCancelOrder = async () => {
    if (!order || cancelling) return;
    setCancelling(true);
    try {
      const res = await cancelOrder(order.id);
      if (res.success) {
        setOrder((prev) => ({ ...prev, status: 'cancelled' }));
        showToast('Đã hủy đơn hàng thành công!', 'success');
        setShowCancelModal(false);
      }
    } catch (err) {
      showToast(err.message || 'Không thể hủy đơn hàng', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handleSwitchToCod = async () => {
    if (!order) return;
    try {
      const res = await switchToCod(order.id);
      if (res.success && res.order) {
        setOrder(res.order);
        showToast('Đã chuyển sang thanh toán Tiền Mặt (COD) thành công!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Không thể đổi phương thức thanh toán', 'error');
    }
  };

  useEffect(() => {
    syncOrder();
  }, [id]);

  // Polling every 2.5s while pending to catch admin confirmation instantly even without socket
  useEffect(() => {
    if (order?.status === 'pending') {
      const timer = setInterval(syncOrder, 2500);
      return () => clearInterval(timer);
    }
  }, [order?.status]);

  // Listen to live socket events (order_confirmed, order_status_updated)
  useEffect(() => {
    const socket = getSocket();

    const handleUpdate = (updatedOrder) => {
      if (
        updatedOrder &&
        (updatedOrder.id === order?.id ||
          updatedOrder.order_code === order?.order_code ||
          String(updatedOrder.id) === String(id))
      ) {
        setOrder((prev) => ({ ...prev, ...updatedOrder }));
      }
    };

    socket.on('order_confirmed', handleUpdate);
    socket.on('order_status_updated', handleUpdate);

    return () => {
      socket.off('order_confirmed', handleUpdate);
      socket.off('order_status_updated', handleUpdate);
    };
  }, [order?.id, order?.order_code, id]);

  // Trigger celebration confetti ONLY when order is confirmed or progressed past pending
  useEffect(() => {
    if (order && order.status !== 'pending' && order.status !== 'cancelled' && !hasTriggeredConfetti) {
      setHasTriggeredConfetti(true);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  }, [order?.status, hasTriggeredConfetti]);

  const isPending = order?.status === 'pending';
  const isConfirmed = order?.status === 'confirmed';
  const isCancelled = order?.status === 'cancelled';

  // 5-Stage Stepper
  const getStepIndex = (status) => {
    switch (status) {
      case 'pending':
        return 1;
      case 'confirmed':
        return 2;
      case 'preparing':
        return 3;
      case 'delivering':
        return 4;
      case 'completed':
        return 5;
      case 'cancelled':
        return -1;
      default:
        return 1;
    }
  };

  const currentStep = getStepIndex(order?.status);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500">Đang tải thông tin đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12 pb-24 md:pb-12 space-y-6">
      {/* STATUS BANNER */}
      {isPending ? (
        /* PENDING APPROVAL BANNER */
        <div className="bg-gradient-to-r from-[#161922] via-[#202534] to-[#161922] text-white p-6 sm:p-8 rounded-3xl shadow-2xl border-2 border-amber-500/50 text-center space-y-3 relative overflow-hidden">
          <div className="w-16 h-16 bg-amber-500/15 border border-amber-500/40 rounded-2xl mx-auto flex items-center justify-center animate-pulse">
            <Clock className="w-9 h-9 text-amber-400" />
          </div>
          <div className="inline-block bg-amber-500/20 px-3 py-1 rounded-full text-xs font-black uppercase text-amber-300 border border-amber-500/30">
            Trạng Thái: Chờ Quán Duyệt Đơn
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Đang Chờ Quán Xác Nhận Đơn Hàng...
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            Đơn của Quý khách đã được gửi tới Quản trị viên Bếp Việt. Đơn chỉ được tính là{' '}
            <strong className="text-amber-300">"Đặt Đơn Thành Công"</strong> ngay khi chủ quán bấm{' '}
            <strong className="text-emerald-400">Xác Nhận</strong>.
          </p>
          <div className="pt-2 flex items-center justify-center gap-2 text-xs font-mono font-bold text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Mã Đơn: {order?.order_code || `ORD-${order?.id}`}</span>
          </div>
        </div>
      ) : isCancelled ? (
        /* CANCELLED BANNER */
        <div className="bg-rose-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl text-center space-y-3 border border-rose-800">
          <div className="w-16 h-16 bg-rose-500/20 rounded-2xl mx-auto flex items-center justify-center">
            <AlertCircle className="w-9 h-9 text-rose-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">Đơn Hàng Đã Bị Hủy</h1>
          <p className="text-xs sm:text-sm text-rose-200">
            Đơn hàng #{order?.order_code} đã được hủy. Quý khách vui lòng liên hệ hotline 0353859726 nếu cần hỗ trợ.
          </p>
        </div>
      ) : (
        /* CONFIRMED & SUCCESS BANNER */
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-6 sm:p-8 rounded-3xl shadow-2xl text-center space-y-3 relative overflow-hidden">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center animate-scale-up">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <div className="inline-block bg-black/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-black uppercase text-emerald-200">
            🎉 Đã Xác Nhận Thành Công
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Quán Đã Xác Nhận Đơn Hàng Thành Công!
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-lg mx-auto">
            Bếp Việt Gourmet đã duyệt đơn và đang chuẩn bị những phần Mì Indomie nóng hổi nhất cho Quý khách tại Hà Nội!
          </p>
          <div className="inline-block bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider">
            Mã Đơn: {order?.order_code || `ORD-${order?.id}`}
          </div>
        </div>
      )}

      {/* SHOPEE-STYLE VIETQR PAYMENT GATEWAY (Only show when NOT cancelled and is Banking/MoMo) */}
      {!isCancelled &&
        order?.status !== 'cancelled' &&
        (order?.payment_method === 'BANKING' ||
          order?.payment_method === 'MOMO' ||
          order?.payment_method === 'vietqr' ||
          order?.payment_method === 'banking') && (
          <VietQRPaymentGateway
            order={order}
            onPaymentCompleted={syncOrder}
            onSwitchToCod={handleSwitchToCod}
          />
        )}

      {/* LUCKY SPIN REWARD BANNER (Only show when NOT cancelled) */}
      {!isCancelled && order?.status !== 'cancelled' && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-rose-500/15 border border-amber-500/30 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-orange-500/25 shrink-0">
              🎁
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full mb-0.5">
                <span>Đặc Quyền Khách Hàng</span>
              </div>
              <h4 className="font-black text-slate-900 text-sm sm:text-base">
                Bạn Vừa Được Tặng +1 Lượt Quay May Mắn!
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Áp dụng cho đơn hàng <strong>#{order?.order_code}</strong>. Hãy bấm nút <strong>"Vòng Quay May Mắn"</strong> ở góc dưới màn hình để quay voucher giảm giá cho lần đặt món tiếp theo nhé!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5-STEP LIVE TRACKING STEPPER WITH ANIMATED CONNECTING PROGRESS LINE */}
      <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900">Tiến Trình Đơn Hàng</h3>
              {!isCancelled && currentStep < 5 && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Trực tiếp theo dõi tiến độ theo thời gian thực</p>
          </div>
          <span
            className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
              isPending
                ? 'bg-amber-100 text-amber-700 animate-pulse border border-amber-300'
                : isConfirmed
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                : order?.status === 'preparing'
                ? 'bg-orange-100 text-orange-700 border border-orange-300'
                : order?.status === 'delivering'
                ? 'bg-sky-100 text-sky-700 border border-sky-300'
                : order?.status === 'completed'
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                : 'bg-rose-100 text-rose-700 border border-rose-300'
            }`}
          >
            {isPending && '⏳ Chờ Duyệt'}
            {isConfirmed && '✅ Đã Xác Nhận'}
            {order?.status === 'preparing' && '🍳 Bếp Đang Nấu'}
            {order?.status === 'delivering' && '🛵 Đang Giao'}
            {order?.status === 'completed' && '🎉 Thành Công'}
            {isCancelled && '❌ Đã Hủy'}
          </span>
        </div>

        {/* Stepper track & circles */}
        <div className="relative pt-2 pb-1">
          {/* Background gray progress line */}
          <div className="absolute top-6 left-6 right-6 sm:left-8 sm:right-8 h-1.5 bg-slate-100 rounded-full z-0" />

          {/* Animated active gradient progress fill */}
          {!isCancelled && (
            <div
              className="absolute top-6 left-6 sm:left-8 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-500 rounded-full z-0 transition-all duration-700 ease-out shadow-sm shadow-orange-500/30"
              style={{
                width:
                  currentStep <= 1
                    ? '0%'
                    : currentStep === 2
                    ? 'calc(25% - 12px)'
                    : currentStep === 3
                    ? 'calc(50% - 12px)'
                    : currentStep === 4
                    ? 'calc(75% - 12px)'
                    : 'calc(100% - 24px)'
              }}
            />
          )}

          {/* 5 Step Icons */}
          <div className="relative z-10 grid grid-cols-5 gap-1 text-center">
            {/* Step 1: Chờ Duyệt */}
            <div className="flex flex-col items-center space-y-1.5">
              <div
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-xs font-black transition-all duration-500 ${
                  currentStep > 1
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : currentStep === 1
                    ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 ring-4 ring-amber-400/30 scale-110 shadow-lg shadow-amber-500/30'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {currentStep > 1 ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : <Clock className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />}
              </div>
              <span className={`text-[10px] sm:text-xs font-bold leading-tight ${currentStep === 1 ? 'text-amber-600 font-black' : 'text-slate-700'}`}>
                1. Chờ Duyệt
              </span>
            </div>

            {/* Step 2: Quán Xác Nhận */}
            <div className="flex flex-col items-center space-y-1.5">
              <div
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-xs font-black transition-all duration-500 ${
                  currentStep > 2
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : currentStep === 2
                    ? 'bg-emerald-500 text-white ring-4 ring-emerald-400/30 scale-110 shadow-lg shadow-emerald-500/30'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <CheckCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${currentStep === 2 ? 'animate-bounce' : ''}`} />
              </div>
              <span className={`text-[10px] sm:text-xs font-bold leading-tight ${currentStep === 2 ? 'text-emerald-600 font-black' : 'text-slate-700'}`}>
                2. Xác Nhận
              </span>
            </div>

            {/* Step 3: Đang Nấu */}
            <div className="flex flex-col items-center space-y-1.5">
              <div
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-xs font-black transition-all duration-500 ${
                  currentStep > 3
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : currentStep === 3
                    ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white ring-4 ring-orange-400/30 scale-110 shadow-lg shadow-orange-500/30'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <ChefHat className={`w-4 h-4 sm:w-5 sm:h-5 ${currentStep === 3 ? 'animate-pulse' : ''}`} />
              </div>
              <span className={`text-[10px] sm:text-xs font-bold leading-tight ${currentStep === 3 ? 'text-orange-600 font-black' : 'text-slate-700'}`}>
                3. Đang Nấu
              </span>
            </div>

            {/* Step 4: Đang Giao HN */}
            <div className="flex flex-col items-center space-y-1.5">
              <div
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-xs font-black transition-all duration-500 ${
                  currentStep > 4
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : currentStep === 4
                    ? 'bg-sky-500 text-white ring-4 ring-sky-400/30 scale-110 shadow-lg shadow-sky-500/30'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <Bike className={`w-4 h-4 sm:w-5 sm:h-5 ${currentStep === 4 ? 'animate-bounce' : ''}`} />
              </div>
              <span className={`text-[10px] sm:text-xs font-bold leading-tight ${currentStep === 4 ? 'text-sky-600 font-black' : 'text-slate-700'}`}>
                4. Đang Giao
              </span>
            </div>

            {/* Step 5: Giao Xong */}
            <div className="flex flex-col items-center space-y-1.5">
              <div
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-xs font-black transition-all duration-500 ${
                  currentStep === 5
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-400/30 scale-110 shadow-lg shadow-emerald-600/30'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <PackageCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className={`text-[10px] sm:text-xs font-bold leading-tight ${currentStep === 5 ? 'text-emerald-600 font-black' : 'text-slate-700'}`}>
                5. Thành Công
              </span>
            </div>
          </div>
        </div>

        {/* ORDER INSURANCE BADGE IN STEPPER */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-black text-emerald-900 leading-tight">
                🛡️ Bảo Hiểm Món Ăn Bếp Việt 100% Đang Có Hiệu Lực
              </p>
              <p className="text-[11px] text-emerald-700">
                Cam kết mì nóng hổi, giòn rụm • Đổi mới hoặc hoàn 100% tiền trong 15p nếu có sự cố
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase text-emerald-700 bg-white px-2.5 py-1 rounded-full border border-emerald-300 shrink-0 shadow-xs">
            Đã Bảo Hiểm
          </span>
        </div>
      </div>

      {/* ORDER DETAILS */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-5">
        <h3 className="font-extrabold text-base text-slate-900 pb-3 border-b border-slate-100">
          Chi Tiết Đơn Hàng & Người Nhận
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
          <div>
            <span className="text-slate-400 block mb-0.5">Người nhận:</span>
            <strong className="text-slate-800 text-sm">{order?.customer_name}</strong>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Số điện thoại:</span>
            <strong className="text-slate-800 text-sm">{order?.customer_phone}</strong>
          </div>
          <div className="sm:col-span-2">
            <span className="text-slate-400 block mb-0.5">Địa chỉ giao (Nội thành Hà Nội):</span>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <strong className="text-slate-800 text-sm leading-relaxed">
                {order?.delivery_address}
              </strong>
              <a
                href={order?.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order?.delivery_address || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 font-bold text-xs border border-amber-400/40 transition shrink-0 active:scale-95"
              >
                <span>🗺️ Xem Trên Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
              </a>
            </div>
          </div>
          {order?.note && (
            <div className="sm:col-span-2">
              <span className="text-slate-400 block mb-0.5">Ghi chú:</span>
              <p className="text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200/60 italic">
                {order.note}
              </p>
            </div>
          )}
        </div>

        {/* Items List */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Các Món Đã Đặt ({order?.items?.length || 0})
          </h4>
          {order?.items?.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs py-1">
              <div className="flex items-center gap-3">
                {item.food_image && (
                  <img
                    src={item.food_image}
                    alt={item.food_name}
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                )}
                <div>
                  <p className="font-bold text-slate-800">{item.food_name}</p>
                  <p className="text-slate-400">SL: {item.quantity} phần</p>
                </div>
              </div>
              <span className="font-bold text-slate-800">{formatVND(item.total)}</span>
            </div>
          ))}

          {/* Pricing summary */}
          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Tạm tính:</span>
              <span>{formatVND(order?.subtotal)}</span>
            </div>
            {order?.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Voucher giảm giá:</span>
                <span>-{formatVND(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Phí ship nội thành Hà Nội:</span>
              <span>{order?.delivery_fee === 0 ? 'Miễn phí' : formatVND(order?.delivery_fee)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
              <span>Tổng thanh toán ({order?.payment_method}):</span>
              <span className="text-base text-amber-600 font-black">{formatVND(order?.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS & HOTLINE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(order?.status === 'pending' || order?.status === 'confirmed') && (
          <button
            onClick={() => setShowCancelModal(true)}
            disabled={cancelling}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-sm border border-rose-200 transition shadow-sm active:scale-95 disabled:opacity-50"
          >
            <XCircle className="w-4 h-4 text-rose-500" />
            <span>{cancelling ? 'Đang Hủy Đơn...' : 'Hủy Đơn Hàng'}</span>
          </button>
        )}

        <button
          onClick={() => {
            if (!user) {
              setIsAuthModalOpen(true);
            } else {
              setIsChatOpen(true);
            }
          }}
          className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm shadow-md shadow-amber-500/20 active:scale-95 transition"
        >
          <MessageCircle className="w-4 h-4 text-slate-950" />
          <span>Chat Ngay Với Chủ Quán</span>
        </button>

        <a
          href="tel:0353859726"
          className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-slate-900 to-[#161922] hover:bg-slate-800 text-amber-300 font-bold text-sm border border-amber-500/30 transition shadow-sm active:scale-95"
        >
          <Phone className="w-4 h-4 text-amber-400" />
          <span>Hotline: 0353859726</span>
        </a>

        <Link
          to="/orders"
          className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-200 shadow-sm active:scale-95 transition"
        >
          <span>Xem Lịch Sử Đơn Hàng</span>
          <ArrowRight className="w-4 h-4 text-slate-600" />
        </Link>
      </div>

      {/* Luxury Confirm Cancel Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        title="Xác Nhận Hủy Đơn Hàng?"
        message="Quý khách có chắc chắn muốn hủy đơn hàng này không? Sau khi hủy, quán sẽ dừng chế biến món ăn này."
        confirmText="Đồng Ý Hủy Đơn"
        cancelText="Giữ Lại Đơn"
        confirmType="danger"
        loading={cancelling}
        onConfirm={handleConfirmCancelOrder}
        onCancel={() => setShowCancelModal(false)}
      />
    </div>
  );
}
