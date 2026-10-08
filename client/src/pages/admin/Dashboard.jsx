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
  Layers,
  FileSpreadsheet,
  Download,
  CreditCard,
  Banknote,
  Star,
  Users
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
  const [timeFilter, setTimeFilter] = useState('7days'); // 'today' | '7days' | '30days' | 'all'
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

  // Export orders and revenue to Excel (CSV with UTF-8 BOM)
  const handleExportCSV = () => {
    if (!stats || !stats.recentOrders || stats.recentOrders.length === 0) {
      showToast('Chưa có dữ liệu đơn hàng để xuất file', 'error');
      return;
    }

    const headers = ['Mã Đơn', 'Khách Hàng', 'Số Điện Thoại', 'Địa Chỉ', 'Tạm Tính (VNĐ)', 'Giảm Giá (VNĐ)', 'Phí Ship (VNĐ)', 'Tổng Tiền (VNĐ)', 'Thanh Toán', 'Trạng Thái', 'Thời Gian'];
    const rows = stats.recentOrders.map((o) => [
      `"${o.order_code || o.id}"`,
      `"${o.customer_name || ''}"`,
      `"${o.customer_phone || ''}"`,
      `"${(o.delivery_address || '').replace(/"/g, '""')}"`,
      o.subtotal || 0,
      o.discount || 0,
      o.delivery_fee || 0,
      o.total_amount || 0,
      `"${o.payment_method || 'COD'}"`,
      `"${o.status || 'pending'}"`,
      `"${new Date(o.created_at).toLocaleString('vi-VN')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bao_Cao_Doanh_Thu_Bep_Viet_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('📊 Đã xuất file Excel (CSV) thành công!', 'success');
  };

  // Print Summary Report
  const handlePrintSummary = () => {
    window.print();
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
    <div className="space-y-8 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Tổng Quan Doanh Thu Bếp Việt
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Báo cáo bán hàng, biểu đồ doanh thu & quản lý đơn hàng thời gian thực
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Export Excel CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-lg shadow-emerald-600/20 active:scale-95"
            title="Xuất file Excel báo cáo doanh thu"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>

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
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Doanh Thu Hôm Nay */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1C2030] to-[#121522] border border-amber-500/30 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Doanh Thu Hôm Nay
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2">
            {formatVND(stats?.todayRevenue || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>{stats?.todayOrders || 0} đơn hàng trong ngày</span>
          </div>
        </div>

        {/* Tổng Doanh Thu Tích Lũy */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1C2030] to-[#121522] border border-emerald-500/30 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Tổng Doanh Thu
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2">
            {formatVND(stats?.totalRevenue || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Toàn bộ thời gian hoạt động
          </div>
        </div>

        {/* Đơn Chờ Xử Lý */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1C2030] to-[#121522] border border-rose-500/30 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
              Đơn Cần Nấu Ngay
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2">
            {(statusBreakdown.pending || 0) + (statusBreakdown.preparing || 0)}
          </div>
          <div className="text-[11px] text-rose-300 mt-1">
            {statusBreakdown.pending || 0} mới tiếp nhận • {statusBreakdown.preparing || 0} đang nấu
          </div>
        </div>

        {/* Tổng Số Món Thực Đơn */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1C2030] to-[#121522] border border-purple-500/30 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
              Món Đang Bán
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2">
            {stats?.totalFoods || 0}
          </div>
          <div className="text-[11px] text-purple-300 mt-1">
            {stats?.totalCategories || 6} danh mục ẩm thực
          </div>
        </div>
      </div>

      {/* 7-Days Visual Bar Chart & Status Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue / Orders Chart */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-[#121522] border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-black text-white">Biểu Đồ Doanh Thu 7 Ngày Gần Nhất</h3>
            </div>
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveChartTab('revenue')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  activeChartTab === 'revenue'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Doanh Thu (VNĐ)
              </button>
              <button
                onClick={() => setActiveChartTab('orders')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  activeChartTab === 'orders'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Số Lượng Đơn
              </button>
            </div>
          </div>

          {/* Chart Bars */}
          <div className="h-48 sm:h-56 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-800">
            {last7Days.map((d, i) => {
              const heightPercent =
                activeChartTab === 'revenue'
                  ? Math.max(8, Math.round(((d.revenue || 0) / maxDayRevenue) * 100))
                  : Math.max(8, Math.round(((d.orderCount || 0) / maxDayOrders) * 100));

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded shadow border border-slate-700 whitespace-nowrap">
                    {activeChartTab === 'revenue' ? formatVND(d.revenue || 0) : `${d.orderCount || 0} đơn`}
                  </div>
                  <div
                    className="w-full max-w-[36px] rounded-t-xl bg-gradient-to-t from-amber-600 to-orange-400 group-hover:from-amber-500 group-hover:to-orange-300 transition-all duration-300"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[11px] font-bold text-slate-400">{d.dateLabel || d.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-[#121522] border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            Tỷ Lệ Trạng Thái Đơn
          </h3>

          <div className="space-y-3">
            {[
              { label: 'Hoàn Thành', count: statusBreakdown.completed || 0, color: 'bg-emerald-500', text: 'text-emerald-400' },
              { label: 'Đang Giao Hàng', count: statusBreakdown.delivering || 0, color: 'bg-blue-500', text: 'text-blue-400' },
              { label: 'Đang Nấu Bếp', count: statusBreakdown.preparing || 0, color: 'bg-amber-500', text: 'text-amber-400' },
              { label: 'Mới Tiếp Nhận', count: statusBreakdown.pending || 0, color: 'bg-purple-500', text: 'text-purple-400' },
              { label: 'Đã Hủy Đơn', count: statusBreakdown.cancelled || 0, color: 'bg-rose-500', text: 'text-rose-400' }
            ].map((st, i) => {
              const pct = Math.round((st.count / totalOrdersCount) * 100);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-300">{st.label}</span>
                    <span className={st.text}>{st.count} đơn ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${st.color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top 10 Bestselling Foods Table */}
      {stats?.topFoods && stats.topFoods.length > 0 && (
        <div className="p-6 rounded-3xl bg-[#121522] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Bảng Xếp Hạng Top Món Bán Chạy Nhất
            </h3>
            <Link to="/admin/foods" className="text-xs text-amber-400 hover:underline font-bold">
              Quản lý toàn bộ món →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/70 text-slate-400 uppercase font-black tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Hạng</th>
                  <th className="p-3">Tên Món</th>
                  <th className="p-3">Giá Bán</th>
                  <th className="p-3">Đã Bán</th>
                  <th className="p-3">Doanh Số Dự Kiến</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {stats.topFoods.slice(0, 8).map((f, idx) => (
                  <tr key={f.id || idx} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-black text-amber-400">
                      {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                    </td>
                    <td className="p-3 font-bold text-white flex items-center gap-2.5">
                      <img
                        src={f.image}
                        alt={f.name}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-lg object-cover"
                      />
                      <span>{f.name}</span>
                    </td>
                    <td className="p-3 font-semibold text-slate-300">{formatVND(f.price)}</td>
                    <td className="p-3 font-black text-emerald-400">{f.sales_count || 0} phần</td>
                    <td className="p-3 font-bold text-amber-300">
                      {formatVND((f.sales_count || 0) * f.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Orders List with Quick Print Bill */}
      <div className="p-6 rounded-3xl bg-[#121522] border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            Đơn Hàng Gần Đây
          </h3>
          <Link to="/admin/orders" className="text-xs text-amber-400 hover:underline font-bold">
            Xem tất cả đơn hàng →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/70 text-slate-400 uppercase font-black tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Mã Đơn</th>
                <th className="p-3">Khách Hàng</th>
                <th className="p-3">Tổng Tiền</th>
                <th className="p-3">Thanh Toán</th>
                <th className="p-3">Trạng Thái</th>
                <th className="p-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {(stats?.recentOrders || []).slice(0, 6).map((order) => (
                <tr key={order.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 font-mono font-black text-amber-400">
                    #{order.order_code || order.id}
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-white">{order.customer_name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{order.customer_phone}</div>
                  </td>
                  <td className="p-3 font-black text-amber-300">
                    {formatVND(order.total_amount)}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                      {order.payment_method}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                        order.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : order.status === 'delivering'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : order.status === 'preparing'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : order.status === 'cancelled'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}
                    >
                      {order.status === 'completed'
                        ? 'Hoàn thành'
                        : order.status === 'delivering'
                        ? 'Đang giao'
                        : order.status === 'preparing'
                        ? 'Đang nấu'
                        : order.status === 'cancelled'
                        ? 'Đã hủy'
                        : 'Mới tiếp nhận'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setPrintingOrder(order)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition"
                      title="In hóa đơn bếp POS"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Bill Modal */}
      {printingOrder && (
        <PrintBillModal
          order={printingOrder}
          onClose={() => setPrintingOrder(null)}
        />
      )}
    </div>
  );
}
