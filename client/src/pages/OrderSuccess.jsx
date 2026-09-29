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
  ExternalLink
} from 'lucide-react';
import { getOrderById, getSocket } from '../api';
import { formatVND } from '../utils/vietnamData';
import { useChat } from '../context/ChatContext';

export default function OrderSuccess() {
  const { id } = useParams();
  const location = useLocation();
  const { setIsChatOpen } = useChat();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!order);

  // Trigger confetti explosion on load
  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  // Fetch or sync order
  useEffect(() => {
    if (!order && id) {
      setLoading(true);
      getOrderById(id)
        .then((res) => {
          if (res.success && res.order) setOrder(res.order);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id, order]);

  // Listen to live order status updates
  useEffect(() => {
    const socket = getSocket();
    const handleStatusUpdate = (updatedOrder) => {
      if (updatedOrder.id === order?.id || updatedOrder.order_code === order?.order_code) {
        setOrder(updatedOrder);
      }
    };

    socket.on('order_status_updated', handleStatusUpdate);
    return () => socket.off('order_status_updated', handleStatusUpdate);
  }, [order]);

  const getStatusStep = (status) => {
    switch (status) {
      case 'pending':
        return 1;
      case 'preparing':
        return 2;
      case 'delivering':
        return 3;
      case 'completed':
        return 4;
      case 'cancelled':
        return -1;
      default:
        return 1;
    }
  };

  const currentStep = getStatusStep(order?.status);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500">Đang tải thông tin đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12 pb-24 md:pb-12 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 sm:p-8 rounded-3xl shadow-xl text-center space-y-3">
        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">Đặt Món Thành Công!</h1>
        <p className="text-xs sm:text-sm text-emerald-100 max-w-md mx-auto">
          Cảm ơn bạn! Bếp Việt đã nhận được đơn hàng và đang chuẩn bị những món ăn nóng sốt nhất.
        </p>
        <div className="inline-block bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider">
          Mã Đơn: {order?.order_code || `ORD-${order?.id}`}
        </div>
      </div>

      {/* Real-time Order Tracking Stepper */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Tiến Trình Đơn Hàng</h3>
            <p className="text-xs text-slate-400">Trạng thái được cập nhật trực tiếp theo thời gian thực</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-700 uppercase">
            {order?.status === 'pending' && 'Chờ tiếp nhận'}
            {order?.status === 'preparing' && 'Bếp đang nấu'}
            {order?.status === 'delivering' && 'Shipper đang giao'}
            {order?.status === 'completed' && 'Đã hoàn thành'}
            {order?.status === 'cancelled' && 'Đã hủy'}
          </span>
        </div>

        {/* Stepper bar */}
        <div className="grid grid-cols-4 gap-2 relative">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition ${
                currentStep >= 1
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-700">Đã Nhận</span>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition ${
                currentStep >= 2
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <ChefHat className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-700">Đang Nấu</span>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition ${
                currentStep >= 3
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <Bike className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-700">Đang Giao</span>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition ${
                currentStep >= 4
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <PackageCheck className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-700">Giao Xong</span>
          </div>
        </div>
      </div>

      {/* Order Details & Delivery Info */}
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
            <span className="text-slate-400 block mb-0.5">Địa chỉ giao hàng:</span>
            <strong className="text-slate-800 text-sm leading-relaxed">
              {order?.delivery_address}
            </strong>
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
                <span>Giảm giá:</span>
                <span>-{formatVND(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Phí giao hàng:</span>
              <span>{order?.delivery_fee === 0 ? 'Miễn phí' : formatVND(order?.delivery_fee)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
              <span>Tổng thanh toán ({order?.payment_method}):</span>
              <span className="text-base text-orange-600">{formatVND(order?.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setIsChatOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold text-sm border border-orange-200 transition"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Chat Ngay Với Quán</span>
        </button>

        <Link
          to="/orders"
          className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition"
        >
          <span>Xem Lịch Sử Đơn Hàng</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
