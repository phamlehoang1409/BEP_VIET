import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, Phone, ChevronRight, MessageCircle, RefreshCw, XCircle, Star, CheckCircle2, RotateCw, Sparkles } from 'lucide-react';
import { getCustomerOrders, getSocket, cancelOrder, getReviews } from '../api';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useCart } from '../context/CartContext';
import { formatVND } from '../utils/vietnamData';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import ReviewModal from '../components/ReviewModal';
import { awardSpinForCompletedOrder } from '../utils/luckyWheelService';

export default function MyOrders() {
  const { user, setIsAuthModalOpen } = useAuth();
  const { setIsChatOpen } = useChat();
  const { reorderItems, setIsCartOpen } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchPhone, setSearchPhone] = useState(user?.phone || '');
  const [reviewingOrder, setReviewingOrder] = useState(null);
  const [reviewedOrderIds, setReviewedOrderIds] = useState(new Set());
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const { showToast } = useToast();

  const handleReorderOrder = (ord) => {
    if (!ord?.items || ord.items.length === 0) {
      showToast('Đơn hàng này không có thông tin món để đặt lại', 'error');
      return;
    }
    reorderItems(ord.items);
    showToast(`Đã thêm ${ord.items.length} món từ đơn #${ord.order_code || ord.id} vào giỏ hàng!`, 'success', 3500);
    setIsCartOpen(true);
  };

  const fetchOrders = async (phone) => {
    if (!phone) return;
    setLoading(true);
    try {
      const res = await getCustomerOrders(phone);
      if (res.success && res.orders) {
        setOrders(res.orders);
        // Award spin for any completed order that hasn't been awarded yet
        res.orders.forEach((o) => {
          if (o.status === 'completed') {
            awardSpinForCompletedOrder(o);
          }
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancelOrder = async () => {
    if (!cancellingOrderId) return;
    setCancelling(true);
    try {
      const res = await cancelOrder(cancellingOrderId);
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === cancellingOrderId ? { ...o, status: 'cancelled' } : o))
        );
        showToast('Đã hủy đơn hàng thành công!', 'success');
        setCancellingOrderId(null);
      }
    } catch (err) {
      showToast(err.message || 'Không thể hủy đơn hàng', 'error');
    } finally {
      setCancelling(false);
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

  // Fetch already reviewed order IDs
  useEffect(() => {
    getReviews()
      .then((res) => {
        if (res.success && res.reviews) {
          const ids = new Set();
          res.reviews.forEach((r) => {
            if (r.order_id) ids.add(String(r.order_id).trim());
          });
          setReviewedOrderIds(ids);
        }
      })
      .catch(() => {});
  }, []);

  const handleLookup = (e) => {
    e.preventDefault();
    if (searchPhone.trim()) {
      fetchOrders(searchPhone.trim());
    }
  };

  const getStatusBadge = (status, note) => {
    switch (status) {
      case 'pending':
        return <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full text-xs font-bold border border-amber-200 dark:border-amber-500/30">Chờ xác nhận</span>;
      case 'confirmed':
        return <span className="bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 px-3 py-1 rounded-full text-xs font-bold border border-teal-200 dark:border-teal-500/30">Đã xác nhận</span>;
      case 'preparing':
        return <span className="bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300 px-3 py-1 rounded-full text-xs font-bold border border-orange-200 dark:border-orange-500/30">Đang nấu nóng</span>;
      case 'delivering':
        return <span className="bg-sky-100 dark:bg-sky-500/20 text-sky-800 dark:text-sky-300 px-3 py-1 rounded-full text-xs font-bold border border-sky-200 dark:border-sky-500/30">Đang giao tới</span>;
      case 'completed':
        return <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-500/30">Giao thành công</span>;
      case 'cancelled':
        return note?.includes('[Quán từ chối:')
          ? <span className="bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 px-3 py-1 rounded-full text-xs font-bold border border-rose-200 dark:border-rose-500/30">Quán từ chối</span>
          : <span className="bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 px-3 py-1 rounded-full text-xs font-bold border border-rose-200 dark:border-rose-500/30">Đã hủy đơn</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10 pb-24 md:pb-12 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Đơn Hàng Của Tôi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi trạng thái giao hàng, đánh giá món ăn nhận Bếp Xu & đặt lại 1 chạm
          </p>
        </div>

        {/* Refresh button */}
        {searchPhone && (
          <button
            onClick={() => fetchOrders(searchPhone)}
            disabled={loading}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#151926] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Cập nhật</span>
          </button>
        )}
      </div>

      {/* Phone Search form if not logged in or searching another phone */}
      {!user && (
        <form onSubmit={handleLookup} className="bg-white dark:bg-[#12151E] p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="tel"
              placeholder="Nhập số điện thoại đã đặt hàng (0912...)"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#181C2A] border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none focus:bg-white dark:focus:bg-[#1e2335] focus:border-amber-500 text-slate-900 dark:text-white"
            />
            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-sm hover:from-amber-600 hover:to-orange-600 transition shadow-md"
          >
            Tra Cứu Đơn
          </button>
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Đăng Nhập
          </button>
        </form>
      )}

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-[#12151E] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="h-5 w-40 rounded shimmer bg-slate-200 dark:bg-slate-800" />
              <div className="h-16 w-full rounded shimmer bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#12151E] rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 border border-amber-200 dark:border-amber-800/40 mx-auto flex items-center justify-center">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Chưa có đơn hàng nào</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchPhone
              ? `Không tìm thấy đơn hàng nào liên kết với số điện thoại ${searchPhone}.`
              : 'Hãy nhập số điện thoại hoặc đăng nhập để xem lịch sử đặt món của bạn.'}
          </p>
          <Link
            to="/menu"
            className="inline-block px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-black hover:from-amber-600 hover:to-orange-600 transition shadow-md"
          >
            Đặt Món Ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-[#12151E] rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
                      {order.order_code}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      • {new Date(order.created_at).toLocaleDateString('vi-VN')} {new Date(order.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    Giao tới: {order.delivery_address}
                  </p>
                  {order.note?.includes('[Quán từ chối:') && (
                    <div className="mt-1.5 inline-block bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-300 text-[11px] font-bold px-2.5 py-1 rounded-xl">
                      📢 Lý do từ chối: {order.note.match(/\[Quán từ chối:\s*([^\]]+)\]/)?.[1] || 'Quán đang quá tải'}
                    </div>
                  )}
                </div>
                {getStatusBadge(order.status, order.note)}
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
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-xl object-cover border border-slate-100 dark:border-slate-700"
                        />
                      )}
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{item.food_name}</span>
                        <span className="text-slate-400 text-[11px] block">x{item.quantity}</span>
                      </div>
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{formatVND(item.total)}</span>
                  </div>
                ))}
              </div>

              {/* Total & Action */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-400 block">Tổng thanh toán ({order.payment_method})</span>
                  <span className="text-base font-black text-amber-600 dark:text-amber-400">
                    {formatVND(order.total_amount)}
                  </span>
                  {order.status === 'completed' && (
                    <span className="flex items-center gap-1 text-[10px] font-extrabold text-amber-500 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md mt-0.5">
                      🎁 +1 Lượt quay may mắn
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Re-order button */}
                  {order.items && order.items.length > 0 && (
                    <button
                      onClick={() => handleReorderOrder(order)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs shadow-xs active:scale-95 transition"
                      title="Đặt lại các món trong đơn này"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-slate-950" />
                      <span>Đặt lại</span>
                    </button>
                  )}

                  {(order.status === 'pending' || order.status === 'confirmed') && (
                    <button
                      onClick={() => setCancellingOrderId(order.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold transition active:scale-95 border border-rose-200 dark:border-rose-900/40"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Hủy đơn</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsChatOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 hover:bg-orange-100 text-xs font-bold transition border border-orange-200 dark:border-orange-900/40"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Hỏi quán</span>
                  </button>

                  {order.status === 'completed' && (
                    reviewedOrderIds.has(String(order.order_code || '').trim()) || reviewedOrderIds.has(String(order.id || '').trim()) ? (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-300/80 dark:border-amber-500/30 text-xs font-bold select-none">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>Đã đánh giá</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => setReviewingOrder(order)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold transition border border-emerald-200 dark:border-emerald-500/30"
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>Đánh giá ⭐</span>
                      </button>
                    )
                  )}

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

      {/* Review Modal */}
      {reviewingOrder && (
        <ReviewModal
          isOpen={!!reviewingOrder}
          order={reviewingOrder}
          onClose={() => setReviewingOrder(null)}
          onSuccess={() => {
            setReviewedOrderIds((prev) => {
              const next = new Set(prev);
              if (reviewingOrder.order_code) next.add(String(reviewingOrder.order_code).trim());
              if (reviewingOrder.id) next.add(String(reviewingOrder.id).trim());
              return next;
            });
            setReviewingOrder(null);
          }}
        />
      )}

      {/* Confirm Cancel Modal */}
      <ConfirmModal
        isOpen={!!cancellingOrderId}
        title="Xác Nhận Hủy Đơn Hàng?"
        message="Quý khách có chắc chắn muốn hủy đơn hàng này không? Sau khi hủy, quán sẽ dừng chế biến món ăn này và không thể khôi phục lại đơn."
        confirmText="Đồng Ý Hủy"
        cancelText="Giữ Lại Đơn"
        confirmType="danger"
        loading={cancelling}
        onConfirm={handleConfirmCancelOrder}
        onCancel={() => setCancellingOrderId(null)}
      />
    </div>
  );
}
