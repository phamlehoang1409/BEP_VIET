import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  UtensilsCrossed,
  TrendingUp,
  ArrowUpRight,
  Flame,
  CheckCircle2,
  ChevronRight,
  Printer,
  BarChart3,
  Volume2,
  RefreshCw,
  Percent,
  Calendar,
  Layers
} from 'lucide-react';
import { getDashboardStats, updateOrderStatus } from '../../api';
import { formatVND } from '../../utils/vietnamData';
import PrintBillModal from '../../components/PrintBillModal';
import { playNewOrderChime, speakNewOrder } from '../../utils/orderAlertSound';
import { useToast } from '../../components/Toast';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [printingOrder, setPrintingOrder] = useState(null);
  const [activeChartTab, setActiveChartTab] = useState('revenue'); // 'revenue' or 'orders'
  const { showToast } = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await getDashboardStats();
      if (res.success && res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleQuickStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      fetchStats();
      showToast('Đã cập nhật trạng thái đơn!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Lỗi cập nhật trạng thái', 'error');
    }
  };

  if (loading && !stats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-800/60 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  // 7 Days Chart calculations
  const last7Days = stats?.last7Days || [];
  const maxDayRevenue = Math.max(...last7Days.map((d) => d.revenue || 0), 100000);
  const maxDayOrders = Math.max(...last7Days.map((d) => d.orderCount || 0), 5);

  const statusBreakdown = stats?.statusBreakdown || {
    pending: 0,
    preparing: 0,
    delivering: 0,
    completed: 0,
    cancelled: 0
  };
  const totalOrdersCount = stats?.totalOrders || 1;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Tổng Quan Cửa Hàng Bếp Việt
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Biểu đồ doanh thu 7 ngày, in hóa đơn bếp & tình trạng phục vụ thời gian thực
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sound Alert Test Button */}
          <button
            onClick={() => {
              playNewOrderChime();
              speakNewOrder('ORD-1409');
              showToast('🔊 Đang thử chuông và phát giọng nói báo đơn mới!', 'info');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition border border-amber-500/30"
            title="Kiểm tra chuông báo đơn mới"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Thử Chuông</span>
            <span className="sm:hidden">Chuông</span>
          </button>

          <button
            onClick={fetchStats}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Làm Mới</span>
          </button>

          <Link
            to="/admin/foods"
            className="px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition"
          >
            + Thêm Món
          </Link>
          <Link
            to="/admin/orders"
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition border border-slate-700"
          >
            Quản Lý Đơn
          </Link>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Revenue */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-800/80 border border-slate-700/60 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tổng Doanh Thu
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {formatVND(stats?.totalRevenue || 0)}
          </div>
          <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Doanh thu thực tế sau khuyến mãi</span>
          </p>
        </div>

        {/* Total Orders */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-800/80 border border-slate-700/60 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tổng Đơn Hàng
            </span>
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {stats?.totalOrders || 0}
          </div>
          <p className="text-[11px] text-slate-400">
            {stats?.completedOrders || 0} đơn đã hoàn tất thành công
          </p>
        </div>

        {/* Pending Orders */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-800/80 border border-slate-700/60 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Đơn Cần Chế Biến
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400">
            {stats?.pendingOrders || 0}
          </div>
          <p className="text-[11px] text-amber-400 font-medium">
            Cần bếp tiếp nhận và làm ngay
          </p>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-800/80 border border-slate-700/60 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Đơn Trung Bình (AOV)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {formatVND(stats?.avgOrderValue || 0)}
          </div>
          <p className="text-[11px] text-sky-400 font-medium">
            Doanh thu trung bình trên mỗi đơn
          </p>
        </div>
      </div>

      {/* SECTION: 7-DAY REVENUE & ORDERS CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Revenue Bar Chart (7 Cols) */}
        <div className="lg:col-span-8 bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/60">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">
                  Biểu Đồ Doanh Thu & Đơn Hàng 7 Ngày
                </h3>
                <p className="text-[11px] text-slate-400">
                  Xu hướng kinh doanh từ ngày {last7Days[0]?.displayDate} đến hôm nay
                </p>
              </div>
            </div>

            {/* Toggle Revenue / Orders */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700/60 self-start sm:self-auto">
              <button
                onClick={() => setActiveChartTab('revenue')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  activeChartTab === 'revenue'
                    ? 'bg-orange-500 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Doanh Thu (VNĐ)
              </button>
              <button
                onClick={() => setActiveChartTab('orders')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  activeChartTab === 'orders'
                    ? 'bg-orange-500 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Số Lượng Đơn
              </button>
            </div>
          </div>

          {/* Interactive Chart Container */}
          <div className="h-64 sm:h-72 w-full pt-4 flex items-end justify-between gap-2 sm:gap-4 px-2">
            {last7Days.map((day, idx) => {
              const isToday = idx === last7Days.length - 1;
              const heightPercent =
                activeChartTab === 'revenue'
                  ? Math.max(Math.round((day.revenue / maxDayRevenue) * 100), 8)
                  : Math.max(Math.round((day.orderCount / maxDayOrders) * 100), 8);

              return (
                <div
                  key={day.dateKey}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative"
                >
                  {/* Floating Tooltip */}
                  <div className="absolute -top-12 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition duration-200 bg-slate-950 text-white border border-amber-500/40 px-2.5 py-1.5 rounded-xl shadow-2xl text-center whitespace-nowrap text-[11px]">
                    <p className="font-black text-amber-400">{formatVND(day.revenue)}</p>
                    <p className="text-[10px] text-slate-400">{day.orderCount} đơn hàng</p>
                  </div>

                  {/* Value on top of bar on hover */}
                  <span className="text-[10px] font-mono text-slate-400 group-hover:text-amber-300 font-bold mb-1.5 transition">
                    {activeChartTab === 'revenue'
                      ? day.revenue > 0
                        ? `${Math.round(day.revenue / 1000)}k`
                        : '0'
                      : `${day.orderCount}đơn`}
                  </span>

                  {/* Bar */}
                  <div className="w-full max-w-[44px] bg-slate-900 rounded-t-2xl overflow-hidden flex items-end h-44 sm:h-52 border border-slate-700/40">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-xl transition-all duration-700 ease-out group-hover:brightness-125 ${
                        isToday
                          ? 'bg-gradient-to-t from-orange-600 via-amber-500 to-amber-300 shadow-lg shadow-orange-500/30'
                          : 'bg-gradient-to-t from-slate-700 via-orange-500/70 to-amber-400/80'
                      }`}
                    />
                  </div>

                  {/* Date Label */}
                  <div className="mt-2.5 text-center">
                    <span
                      className={`text-[11px] block font-bold ${
                        isToday ? 'text-amber-400 font-black' : 'text-slate-300'
                      }`}
                    >
                      {isToday ? 'Hôm nay' : day.dayName}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {day.displayDate}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Status Distribution (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-700/60">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-base text-white">Tỉ Lệ Đơn Hàng</h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Phân bổ tình trạng xử lý trên tổng {stats?.totalOrders || 0} đơn
            </p>
          </div>

          {/* Progress Bars */}
          <div className="space-y-4 flex-1 justify-center flex flex-col">
            {/* Completed */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Đã hoàn tất
                </span>
                <span className="font-mono font-black text-white">
                  {statusBreakdown.completed} đơn (
                  {Math.round((statusBreakdown.completed / totalOrdersCount) * 100)}%)
                </span>
              </div>
              <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/60">
                <div
                  style={{
                    width: `${Math.round((statusBreakdown.completed / totalOrdersCount) * 100)}%`
                  }}
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                />
              </div>
            </div>

            {/* Delivering / Preparing */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-bold text-sky-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  Đang giao & Bếp nấu
                </span>
                <span className="font-mono font-black text-white">
                  {statusBreakdown.preparing + statusBreakdown.delivering} đơn (
                  {Math.round(
                    ((statusBreakdown.preparing + statusBreakdown.delivering) / totalOrdersCount) *
                      100
                  )}
                  %)
                </span>
              </div>
              <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/60">
                <div
                  style={{
                    width: `${Math.round(
                      ((statusBreakdown.preparing + statusBreakdown.delivering) / totalOrdersCount) *
                        100
                    )}%`
                  }}
                  className="h-full bg-sky-500 rounded-full transition-all duration-500"
                />
              </div>
            </div>

            {/* Pending */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Chờ xác nhận
                </span>
                <span className="font-mono font-black text-white">
                  {statusBreakdown.pending} đơn (
                  {Math.round((statusBreakdown.pending / totalOrdersCount) * 100)}%)
                </span>
              </div>
              <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/60">
                <div
                  style={{
                    width: `${Math.round((statusBreakdown.pending / totalOrdersCount) * 100)}%`
                  }}
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                />
              </div>
            </div>

            {/* Cancelled */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-bold text-rose-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  Đã hủy
                </span>
                <span className="font-mono font-black text-white">
                  {statusBreakdown.cancelled} đơn (
                  {Math.round((statusBreakdown.cancelled / totalOrdersCount) * 100)}%)
                </span>
              </div>
              <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/60">
                <div
                  style={{
                    width: `${Math.round((statusBreakdown.cancelled / totalOrdersCount) * 100)}%`
                  }}
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-700/60 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Tỉ lệ phục vụ thành công:</span>
            <span className="font-black text-emerald-400 text-sm">
              {Math.round((statusBreakdown.completed / totalOrdersCount) * 100) || 100}%
            </span>
          </div>
        </div>
      </div>

      {/* LOWER SECTION: TOP FOODS & RECENT ORDERS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Top 5 Best Selling Foods */}
        <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <h3 className="font-extrabold text-base text-white">Top Món Ăn Bán Chạy</h3>
            </div>
            <Link to="/admin/foods" className="text-xs font-bold text-orange-400 hover:underline">
              Quản lý
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.topFoods?.map((f, i) => (
              <div
                key={f.id}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-xs font-black text-amber-400">
                    #{i + 1}
                  </span>
                  <img
                    src={f.image}
                    alt={f.name}
                    className="w-11 h-11 rounded-xl object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-xs text-white line-clamp-1">{f.name}</h4>
                    <span className="text-[11px] text-slate-400">{formatVND(f.price)}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-orange-400">
                    {f.sales_count} đã bán
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {formatVND(f.sales_count * f.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders with Quick Actions & Thermal Print */}
        <div className="lg:col-span-7 bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-sky-400" />
              <h3 className="font-extrabold text-base text-white">Đơn Hàng Gần Đây</h3>
            </div>
            <Link to="/admin/orders" className="text-xs font-bold text-orange-400 hover:underline">
              Xem tất cả
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.recentOrders?.map((ord) => (
              <div
                key={ord.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-white">{ord.order_code}</span>
                    <span className="text-[11px] text-slate-400">• {ord.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                    <span>SĐT: {ord.customer_phone}</span>
                    <span>
                      • Tổng:{' '}
                      <strong className="text-amber-400">{formatVND(ord.total_amount)}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                  {/* Status buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {ord.status === 'pending' && (
                      <button
                        onClick={() => handleQuickStatus(ord.id, 'confirmed')}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 text-[11px] font-bold transition border border-emerald-500/30"
                      >
                        ✅ Duyệt
                      </button>
                    )}
                    {ord.status === 'confirmed' && (
                      <button
                        onClick={() => handleQuickStatus(ord.id, 'preparing')}
                        className="px-2.5 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/30 text-orange-400 text-[11px] font-black transition border border-orange-500/30"
                      >
                        🍳 Nấu
                      </button>
                    )}
                    {ord.status === 'preparing' && (
                      <button
                        onClick={() => handleQuickStatus(ord.id, 'delivering')}
                        className="px-2.5 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/30 text-sky-400 text-[11px] font-black transition border border-sky-500/30"
                      >
                        🛵 Giao
                      </button>
                    )}
                    {ord.status === 'delivering' && (
                      <button
                        onClick={() => handleQuickStatus(ord.id, 'completed')}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 text-[11px] font-black transition border border-emerald-500/30"
                      >
                        ✅ Xong
                      </button>
                    )}
                    {ord.status === 'completed' && (
                      <span className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-[11px] font-black border border-emerald-500/30">
                        ✅ Hoàn Thành
                      </span>
                    )}
                    {ord.status === 'cancelled' && (
                      <span className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-400 text-[11px] font-black border border-rose-500/30">
                        ❌ Đã Hủy
                      </span>
                    )}
                  </div>

                  {/* Print Bill Button */}
                  <button
                    onClick={() => setPrintingOrder(ord)}
                    className="p-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 transition border border-orange-500/30"
                    title="In phiếu giao hàng & bếp"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* THERMAL PRINT BILL MODAL */}
      <PrintBillModal
        order={printingOrder}
        onClose={() => setPrintingOrder(null)}
      />
    </div>
  );
}
