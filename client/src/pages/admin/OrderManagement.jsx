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
  ExternalLink
} from 'lucide-react';
import { getAllOrders, updateOrderStatus, getSocket } from '../../api';
import { formatVND } from '../../utils/vietnamData';
import { useToast } from '../../components/Toast';

export default function OrderManagement() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

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
      showToast(`🔔 Có đơn hàng mới: #${newOrder.order_code}!`, 'info', 5000);
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

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      showToast('Đã cập nhật trạng thái đơn hàng!', 'success');
      fetchOrders();
    } catch (err) {
      showToast(err.message || 'Lỗi cập nhật trạng thái', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Quản Lý Đơn Hàng Bếp Việt
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Theo dõi, xử lý và cập nhật tiến trình đơn hàng theo thời gian thực
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800/80 p-4 rounded-3xl border border-slate-700/60 shadow-xl">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Tìm theo mã đơn, SĐT, tên khách..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-orange-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'pending', label: 'Chờ xác nhận' },
            { id: 'preparing', label: 'Đang nấu' },
            { id: 'delivering', label: 'Đang giao' },
            { id: 'completed', label: 'Hoàn thành' },
            { id: 'cancelled', label: 'Đã hủy' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                statusFilter === tab.id
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
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
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 hover:border-slate-600 transition"
            >
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center font-black">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-white">{order.order_code}</span>
                      <span className="text-[11px] text-slate-400">
                        • {new Date(order.created_at).toLocaleDateString('vi-VN')} {new Date(order.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-300 mt-0.5">
                      <span>👤 {order.customer_name}</span>
                      <span>📞 {order.customer_phone}</span>
                    </div>
                  </div>
                </div>

                {/* Status selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 hidden sm:inline">Trạng thái:</span>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className={`text-xs font-black rounded-xl px-3 py-2 outline-none border transition ${
                      order.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : order.status === 'preparing'
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                        : order.status === 'delivering'
                        ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                        : order.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    }`}
                  >
                    <option value="pending" className="bg-slate-900 text-amber-400">
                      Chờ xác nhận
                    </option>
                    <option value="preparing" className="bg-slate-900 text-orange-400">
                      Bếp đang nấu
                    </option>
                    <option value="delivering" className="bg-slate-900 text-sky-400">
                      Shipper đang giao
                    </option>
                    <option value="completed" className="bg-slate-900 text-emerald-400">
                      Đã hoàn tất
                    </option>
                    <option value="cancelled" className="bg-slate-900 text-rose-400">
                      Đã hủy đơn
                    </option>
                  </select>
                </div>
              </div>

              {/* Delivery Address & Note */}
              <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-1.5">
                <div className="flex items-start gap-2 text-slate-300">
                  <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <span>
                    Địa chỉ giao: <strong className="text-white">{order.delivery_address}</strong>
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
                    className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-900/40"
                  >
                    <div className="flex items-center gap-2.5">
                      {item.food_image && (
                        <img
                          src={item.food_image}
                          alt={item.food_name}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <span className="font-bold text-white">{item.food_name}</span>
                        <span className="text-slate-400 text-[11px] block">
                          SL: {item.quantity} x {formatVND(item.price)}
                        </span>
                      </div>
                    </div>
                    <span className="font-semibold text-slate-300">{formatVND(item.total)}</span>
                  </div>
                ))}
              </div>

              {/* Total & Action */}
              <div className="pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4 text-slate-400">
                  <span>
                    Thanh toán: <strong className="text-white uppercase">{order.payment_method}</strong>
                  </span>
                  <span>
                    Tổng tiền:{' '}
                    <strong className="text-orange-400 text-sm font-black">
                      {formatVND(order.total_amount)}
                    </strong>
                  </span>
                </div>

                <button
                  onClick={() => navigate('/admin/chat', { state: { customerPhone: order.customer_phone } })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-200 font-bold transition"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
                  <span>Nhắn Tin Khách</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
