import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, Phone, ChevronRight, MessageCircle, RefreshCw, XCircle, Star, CheckCircle2, RotateCw } from 'lucide-react';
import { getCustomerOrders, getSocket, cancelOrder, submitReview, getReviews } from '../api';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useCart } from '../context/CartContext';
import { formatVND } from '../utils/vietnamData';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

export default function MyOrders() {
  const { user, setIsAuthModalOpen } = useAuth();
  const { setIsChatOpen } = useChat();
  const { reorderItems, setIsCartOpen } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchPhone, setSearchPhone] = useState(user?.phone || '');
  const [reviewingOrder, setReviewingOrder] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
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
      if (res.success) setOrders(res.orders || []);
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

  // Fetch already reviewed order IDs to ensure each order is reviewed at most once
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
        return <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold">Chờ xác nhận</span>;
      case 'confirmed':
        return <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-xs font-bold">Đã xác nhận</span>;
      case 'preparing':
        return <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold">Đang nấu nóng</span>;
      case 'delivering':
        return <span className="bg-sky-100 text-sky-800 px-3 py-1 rounded-full text-xs font-bold">Đang giao tới</span>;
      case 'completed':
        return <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">Giao thành công</span>;
      case 'cancelled':
        return note?.includes('[Quán từ chối:')
          ? <span className="bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-xs font-bold">Quán từ chối</span>
          : <span className="bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-xs font-bold">Đã hủy đơn</span>;
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
            Theo dõi trạng thái giao hàng và xem lại các món ăn đã đặt
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
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-400 block">Tổng thanh toán ({order.payment_method})</span>
                  <span className="text-base font-black text-orange-600">
                    {formatVND(order.total_amount)}
                  </span>
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
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold transition active:scale-95"
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

                  {order.status === 'completed' && (
                    reviewedOrderIds.has(String(order.order_code || '').trim()) || reviewedOrderIds.has(String(order.id || '').trim()) ? (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-300/80 text-xs font-bold select-none">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>Đã đánh giá</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => { setReviewingOrder(order); setRating(5); setComment(''); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-bold transition"
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>Đánh giá</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl animate-scale-up">
            <div className="text-center space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Đánh giá 1 lần duy nhất
              </span>
              <h3 className="font-black text-lg text-slate-900">Đánh Giá Món Ăn</h3>
              <p className="text-xs text-slate-500">Mã đơn: {reviewingOrder.order_code}</p>
            </div>

            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="hover:scale-110 active:scale-95 transition"
                >
                  <Star className={`w-8 h-8 ${rating >= star ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
                </button>
              ))}
            </div>

            <textarea
              placeholder="Chia sẻ cảm nhận của Quý khách về chất lượng món mì & dịch vụ..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 h-24 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setReviewingOrder(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={submittingReview}
                onClick={async () => {
                  setSubmittingReview(true);
                  try {
                    const orderCode = reviewingOrder.order_code || `ORD-${reviewingOrder.id}`;
                    const res = await submitReview({
                      order_id: orderCode,
                      customer_name: reviewingOrder.customer_name,
                      customer_phone: reviewingOrder.customer_phone,
                      rating,
                      comment
                    });
                    if (res.success) {
                      showToast(res.message || 'Cảm ơn Quý khách đã gửi đánh giá món ăn!', 'success');
                      setReviewedOrderIds((prev) => {
                        const next = new Set(prev);
                        if (reviewingOrder.order_code) next.add(String(reviewingOrder.order_code).trim());
                        if (reviewingOrder.id) next.add(String(reviewingOrder.id).trim());
                        return next;
                      });
                      setReviewingOrder(null);
                    }
                  } catch (e) {
                    showToast(e.message || 'Không thể gửi đánh giá', 'error');
                  } finally {
                    setSubmittingReview(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs shadow-md transition disabled:opacity-50"
              >
                {submittingReview ? 'Đang gửi...' : 'Gửi Đánh Giá'}
              </button>
            </div>
          </div>
        </div>
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
