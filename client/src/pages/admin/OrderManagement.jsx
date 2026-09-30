import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Search,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Zap,
  Sparkles,
  Check,
  Truck,
  Edit2,
  Settings,
  X,
  Save,
  Trash2
} from 'lucide-react';
import {
  getAllOrders,
  updateOrderStatus,
  confirmOrder,
  updateOrderDeliveryFee,
  cleanupOldOrders,
  getSocket
} from '../../api';
import { formatVND } from '../../utils/vietnamData';
import { useToast } from '../../components/Toast';
import StoreSettingsModal from '../../components/StoreSettingsModal';

export default function OrderManagement() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);

  // Store Settings Modal trigger
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Edit Shipping Fee for single order modal
  const [editingFeeOrder, setEditingFeeOrder] = useState(null);
  const [customShippingFee, setCustomShippingFee] = useState('');
  const [updatingFee, setUpdatingFee] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await getAllOrders(params);
      if (res.success) setOrders(res.orders || []);
    } catch (err) {
      console.error(err);
      showToast('Lỗi tải danh sách đơn hàng', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchOrders, 200);
    return () => clearTimeout(timer);
  }, [statusFilter, search]);

  // Listen to new orders and status updates in real time
  useEffect(() => {
    const socket = getSocket();

    const handleNewOrder = (newOrder) => {
      showToast(`🔔 CÓ ĐƠN HÀNG MỚI: #${newOrder.order_code}! Vui lòng bấm Xác Nhận Đơn.`, 'info', 7000);
      setOrders((prev) => [newOrder, ...prev]);
    };

    const handleStatusUpdate = (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
      );
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order_status_updated', handleStatusUpdate);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('order_status_updated', handleStatusUpdate);
    };
  }, []);

  const handleConfirm = async (orderId) => {
    try {
      setConfirmingId(orderId);
      const res = await confirmOrder(orderId);
      if (res.success) {
        showToast('🎉 Đã xác nhận đơn hàng thành công! Khách hàng đã nhận được thông báo.', 'success', 4000);
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: 'confirmed' } : o))
        );
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi xác nhận đơn hàng', 'error');
    } finally {
      setConfirmingId(null);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      showToast('Đã cập nhật trạng thái đơn hàng!', 'success');
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      showToast(err.message || 'Lỗi cập nhật trạng thái', 'error');
    }
  };

  const openEditFeeModal = (order) => {
    setEditingFeeOrder(order);
    setCustomShippingFee(order.delivery_fee !== undefined ? order.delivery_fee : 15000);
  };

  const handleSaveOrderFee = async (e) => {
    e.preventDefault();
    if (!editingFeeOrder) return;
    const feeNum = Math.max(0, Number(customShippingFee) || 0);

    setUpdatingFee(true);
    try {
      const res = await updateOrderDeliveryFee(editingFeeOrder.id, feeNum);
      if (res.success && res.order) {
        showToast(`Đã đổi phí ship đơn #${editingFeeOrder.order_code} thành ${formatVND(feeNum)}!`, 'success');
        setOrders((prev) =>
          prev.map((o) => (o.id === editingFeeOrder.id ? { ...o, ...res.order } : o))
        );
        setEditingFeeOrder(null);
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi sửa phí ship', 'error');
    } finally {
      setUpdatingFee(false);
    }
  };

  const handleManualCleanup = async () => {
    try {
      const res = await cleanupOldOrders();
      if (res.success) {
        if (res.deletedCount > 0) {
          showToast(`🧹 Đã dọn dẹp ${res.deletedCount} đơn hàng cũ đã hoàn thành/hủy khỏi Supabase!`, 'success');
          fetchOrders();
        } else {
          showToast('Hệ thống cơ sở dữ liệu đã sạch sẽ, không có đơn hàng cũ qua ngày cần xóa!', 'info');
        }
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi dọn dẹp đơn cũ', 'error');
    }
  };

  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
              Đơn Hàng Nội Thành Hà Nội
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Quản Lý & Duyệt Đơn Hàng
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Khách đặt món sẽ ở trạng thái <strong className="text-amber-400">"Chờ xác nhận"</strong> cho đến khi bạn bấm <strong className="text-emerald-400">"Xác Nhận Đơn Hàng"</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* Quick Ship & Store Hours Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition border border-amber-500/30"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Chỉnh Phí Ship Quán</span>
          </button>

          {/* Manual Auto-Cleanup Trigger */}
          <button
            onClick={handleManualCleanup}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition border border-rose-500/30"
            title="Tự động xóa các đơn hoàn thành hoặc hủy của ngày hôm trước khỏi Supabase"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Dọn Đơn Cũ (Tự động)</span>
            <span className="sm:hidden">Dọn Cũ</span>
          </button>

          <button
            onClick={fetchOrders}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Làm Mới</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-slate-800/80 p-4 rounded-3xl border border-slate-700/60 shadow-xl">
        <div className="relative w-full lg:w-80">
          <input
            type="text"
            placeholder="Tìm theo mã đơn, SĐT, tên khách..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'pending', label: 'Chờ duyệt', count: pendingCount },
            { id: 'confirmed', label: 'Đã xác nhận' },
            { id: 'preparing', label: 'Đang nấu' },
            { id: 'delivering', label: 'Đang giao' },
            { id: 'completed', label: 'Hoàn thành' },
            { id: 'cancelled', label: 'Đã hủy' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                statusFilter === tab.id
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-800/60 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-12 text-center text-slate-400">
          Không có đơn hàng nào trong mục này.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isPending = order.status === 'pending';
            return (
              <div
                key={order.id}
                className={`bg-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 transition ${
                  isPending
                    ? 'border-2 border-amber-500/70 shadow-[0_0_25px_rgba(245,158,11,0.15)] bg-slate-800'
                    : 'border border-slate-700/60 hover:border-slate-600'
                }`}
              >
                {/* PENDING BANNER & INSTANT APPROVE BUTTON */}
                {isPending && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">🔔</span>
                      <div>
                        <h4 className="text-xs font-black text-amber-300">
                          ĐƠN HÀNG MỚI ĐANG CHỜ DUYỆT!
                        </h4>
                        <p className="text-[11px] text-amber-200/80">
                          Khách hàng đang chờ bạn xác nhận để tính là đặt đơn thành công.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleConfirm(order.id)}
                      disabled={confirmingId === order.id}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 active:scale-95 transition"
                    >
                      <Zap className="w-4 h-4 fill-slate-950" />
                      <span>{confirmingId === order.id ? 'Đang duyệt...' : '⚡ XÁC NHẬN ĐƠN HÀNG NGAY'}</span>
                    </button>
                  </div>
                )}

                {/* Header Info */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                        isPending
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-orange-500/10 text-orange-400'
                      }`}
                    >
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-white">{order.order_code}</span>
                        <span className="text-[11px] text-slate-400">
                          • {new Date(order.created_at).toLocaleDateString('vi-VN')}{' '}
                          {new Date(order.created_at).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-300 mt-0.5">
                        <span className="font-bold text-white">👤 {order.customer_name}</span>
                        <a
                          href={`tel:${order.customer_phone}`}
                          className="hover:underline text-amber-400 font-semibold"
                        >
                          📞 {order.customer_phone}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Status Action Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'cancelled')}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 text-[11px] font-bold transition border border-rose-500/30"
                      >
                        ❌ Hủy Đơn
                      </button>
                    )}
                    {order.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(order.id, 'preparing')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/30 text-orange-400 text-[11px] font-black transition border border-orange-500/30"
                        >
                          🍳 Bếp Đang Nấu
                        </button>
                        <button
                          onClick={() => handleStatusChange(order.id, 'cancelled')}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 text-[11px] font-bold transition border border-rose-500/30"
                        >
                          ❌ Hủy Đơn
                        </button>
                      </>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'delivering')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/30 text-sky-400 text-[11px] font-black transition border border-sky-500/30"
                      >
                        🛵 Giao Cho Shipper
                      </button>
                    )}
                    {order.status === 'delivering' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'completed')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 text-[11px] font-black transition border border-emerald-500/30"
                      >
                        ✅ Hoàn Thành
                      </button>
                    )}
                    {order.status === 'completed' && (
                      <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-[11px] font-black border border-emerald-500/30">
                        ✅ Đã Hoàn Thành
                      </span>
                    )}
                    {order.status === 'cancelled' && (
                      <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-400 text-[11px] font-black border border-rose-500/30">
                        ❌ Đã Hủy
                      </span>
                    )}
                  </div>
                </div>

                {/* Delivery Address & Note */}
                <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-start gap-2 text-slate-300">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      Địa chỉ giao: <strong className="text-white">{order.delivery_address}</strong>{' '}
                      {order.district && (
                        <span className="text-amber-300 font-bold">({order.district}, Hà Nội)</span>
                      )}
                    </span>
                  </div>
                  {order.note && (
                    <p className="text-amber-300/90 pl-6 italic">
                      Ghi chú từ khách: "{order.note}"
                    </p>
                  )}
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  {order.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-slate-900/40 border border-slate-800/40"
                    >
                      <div className="flex items-center gap-2.5">
                        {item.food_image && (
                          <img
                            src={item.food_image}
                            alt={item.food_name}
                            className="w-9 h-9 rounded-xl object-cover shrink-0"
                          />
                        )}
                        <div>
                          <span className="font-bold text-white">{item.food_name}</span>
                          <span className="text-slate-400 text-[11px] block">
                            SL: {item.quantity} phần x {formatVND(item.price)}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-amber-300">{formatVND(item.total)}</span>
                    </div>
                  ))}
                </div>

                {/* Total & Action */}
                <div className="pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-3.5 text-slate-400">
                    <span>
                      Thanh toán: <strong className="text-white uppercase">{order.payment_method}</strong>
                    </span>

                    {/* Adjustable Shipping Fee badge */}
                    <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-700">
                      <span>Phí ship:</span>
                      <strong className="text-white font-mono">
                        {order.delivery_fee === 0 ? 'Miễn phí' : formatVND(order.delivery_fee)}
                      </strong>
                      <button
                        onClick={() => openEditFeeModal(order)}
                        className="text-[10px] text-amber-400 hover:text-amber-300 ml-1 flex items-center gap-0.5 underline font-bold"
                        title="Điều chỉnh phí ship đơn này"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                        <span>Sửa ship</span>
                      </button>
                    </div>

                    {order.discount > 0 && (
                      <span className="text-emerald-400">
                        Voucher: -{formatVND(order.discount)}
                      </span>
                    )}

                    <span>
                      Tổng tiền:{' '}
                      <strong className="text-amber-400 text-sm font-black">
                        {formatVND(order.total_amount)}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPending && (
                      <button
                        onClick={() => handleConfirm(order.id)}
                        disabled={confirmingId === order.id}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Xác Nhận Đơn</span>
                      </button>
                    )}

                    <button
                      onClick={() =>
                        navigate('/admin/chat', { state: { customerPhone: order.customer_phone } })
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-200 font-bold transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                      <span>Nhắn Tin Khách</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: SỬA PHÍ SHIP RIÊNG CHO ĐƠN HÀNG */}
      {editingFeeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/40 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 animate-scale-up text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                <h4 className="font-black text-sm text-white">Điều Chỉnh Phí Ship Đơn Hàng</h4>
              </div>
              <button
                onClick={() => setEditingFeeOrder(null)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <p>Mã đơn: <strong className="text-amber-300 font-mono">{editingFeeOrder.order_code}</strong></p>
              <p>Khách hàng: <strong className="text-white">{editingFeeOrder.customer_name}</strong> ({editingFeeOrder.customer_phone})</p>
              <p>Tiền món (Tạm tính): <strong className="text-slate-200">{formatVND(editingFeeOrder.subtotal)}</strong></p>
            </div>

            <form onSubmit={handleSaveOrderFee} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">
                  Nhập Phí Vận Chuyển Mới (₫)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={customShippingFee}
                  onChange={(e) => setCustomShippingFee(e.target.value)}
                  placeholder="0 (Freeship) hoặc 10000, 20000..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-amber-300 font-mono font-black text-sm outline-none focus:border-amber-400"
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  {[0, 10000, 15000, 20000, 25000].map((v) => (
                    <button
                      type="button"
                      key={v}
                      onClick={() => setCustomShippingFee(v)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 border border-slate-700"
                    >
                      {v === 0 ? 'Freeship' : `${v / 1000}k`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingFeeOrder(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updatingFee}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 text-xs font-black shadow-lg transition flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{updatingFee ? 'Đang lưu...' : 'Lưu Phí Ship'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STORE SETTINGS MODAL */}
      <StoreSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsUpdated={() => fetchOrders()}
      />
    </div>
  );
}
