import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, Phone, ChevronRight, MessageCircle, RefreshCw, XCircle } from 'lucide-react';
import { getCustomerOrders, getSocket, cancelOrder } from '../api';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { formatVND } from '../utils/vietnamData';
import { useToast } from '../components/Toast';

export default function MyOrders() {
  const { user, setIsAuthModalOpen } = useAuth();
  const { setIsChatOpen } = useChat();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchPhone, setSearchPhone] = useState(user?.phone || '');
  const { showToast } = useToast();

  const fetchOrders = async (phone) => {
    if (!phone) return;
    setLoading(true);
    try {
      const res = await getCustomerOrders(phone);
      if (res.success) setOrders(res.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;
    try {
      const res = await cancelOrder(orderId);
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o))
        );
        showToast('Đã hủy đơn hàng thành công!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Không thể hủy đơn hàng', 'error');
    }
  };

  useEffect(() => {
    if (user?.phone) {
      setSearchPhone(user.phone);
      fetchOrders(user.phone);
    }
  }, [user]);

  // Live order updates via socket
  useEffect(() => {
    const socket = getSocket();
    const handleStatusUpdate = (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
      );
    };

    socket.on('order_status_updated', handleStatusUpdate);
    return () => socket.off('order_status_updated', handleStatusUpdate);
  }, []);

  const handleLookup = (e) => {
    e.preventDefault();
    if (searchPhone.trim()) {
      fetchOrders(searchPhone.trim());
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold">Chờ xác nhận</span>;
      case 'preparing':
        return <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold">Đang nấu nóng</span>;
      case 'delivering':
        return <span className="bg-sky-100 text-sky-800 px-3 py-1 rounded-full text-xs font-bold">Đang giao tới</span>;
      case 'completed':
        return <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">Giao thành công</span>;
      case 'cancelled':
        return <span className="bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-xs font-bold">Đã hủy đơn</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10 pb-24 md:pb-12 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Đơn Hàng Của Tôi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi trạng thái giao hàng và xem lại các món ăn đã đặt
          </p>
        </div>

        {/* Refresh button */}
        {searchPhone && (
          <button
            onClick={() => fetchOrders(searchPhone)}
            disabled={loading}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Cập nhật</span>
          </button>
        )}
      </div>

      {/* Phone Search form if not logged in or searching another phone */}
      {!user && (
        <form onSubmit={handleLookup} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="tel"
              placeholder="Nhập số điện thoại đã đặt hàng (0912...)"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold outline-none focus:bg-white focus:border-orange-500"
            />
            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-2xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition"
          >
            Tra Cứu Đơn
          </button>
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition"
          >
            Đăng Nhập
          </button>
        </form>
      )}

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-3">
              <div className="h-5 w-40 rounded shimmer" />
              <div className="h-16 w-full rounded shimmer" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 mx-auto flex items-center justify-center">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Chưa có đơn hàng nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchPhone
              ? `Không tìm thấy đơn hàng nào liên kết với số điện thoại ${searchPhone}.`
              : 'Hãy nhập số điện thoại hoặc đăng nhập để xem lịch sử đặt món của bạn.'}
          </p>
          <Link
            to="/menu"
            className="inline-block px-6 py-2.5 rounded-2xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition"
          >
            Đặt Món Ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm hover:shadow-md transition space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-sm sm:text-base">
                      {order.order_code}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      • {new Date(order.created_at).toLocaleDateString('vi-VN')} {new Date(order.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    Giao tới: {order.delivery_address}
                  </p>
                </div>
                {getStatusBadge(order.status)}
              </div>

              {/* Items */}
              <div className="space-y-2.5">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      {item.food_image && (
                        <img
                          src={item.food_image}
                          alt={item.food_name}
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                      )}
                      <div>
                        <span className="font-bold text-slate-800">{item.food_name}</span>
                        <span className="text-slate-400 text-[11px] block">x{item.quantity}</span>
                      </div>
                    </div>
                    <span className="font-semibold text-slate-700">{formatVND(item.total)}</span>
                  </div>
                ))}
              </div>

              {/* Total & Action */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-400 block">Tổng thanh toán ({order.payment_method})</span>
                  <span className="text-base font-black text-orange-600">
                    {formatVND(order.total_amount)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {(order.status === 'pending' || order.status === 'confirmed') && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold transition"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Hủy đơn</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsChatOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 text-xs font-bold transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Hỏi quán</span>
                  </button>

                  <Link
                    to={`/order-success/${order.id}`}
                    state={{ order }}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
                  >
                    <span>Xem tiến trình</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
