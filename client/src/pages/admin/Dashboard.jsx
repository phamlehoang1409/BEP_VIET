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
  ChevronRight
} from 'lucide-react';
import { getDashboardStats, updateOrderStatus } from '../../api';
import { formatVND } from '../../utils/vietnamData';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Tổng Quan Cửa Hàng Bếp Việt
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Số liệu kinh doanh thời gian thực & tình trạng phục vụ món ăn
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/foods"
            className="px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/25 transition"
          >
            + Thêm Món Ăn
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

        {/* Total Dishes */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-800/80 border border-slate-700/60 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Món Trên Thực Đơn
            </span>
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {stats?.totalFoods || 0}
          </div>
          <p className="text-[11px] text-sky-400 font-medium">
            Có thể thêm, sửa, đổi giá bất kỳ lúc nào
          </p>
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

        {/* Recent Orders */}
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
                    <span>• Tổng: <strong className="text-amber-400">{formatVND(ord.total_amount)}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
