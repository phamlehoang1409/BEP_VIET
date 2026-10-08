import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, Navigate, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Package,
  MessageSquare,
  ArrowLeft,
  Menu,
  X,
  Store,
  ShieldCheck,
  LogOut,
  Tag,
  Clock,
  Bell,
  Volume2,
  VolumeX,
  CheckCircle2,
  Phone,
  MapPin,
  ExternalLink,
  Star,
  Printer,
  Warehouse
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getSocket, getChatRooms, getAllOrders, confirmOrder, rejectOrder, getStoreSettings, updateStoreSettings } from '../../api';
import { formatVND } from '../../utils/vietnamData';
import { useToast } from '../../components/Toast';
import StoreSettingsModal from '../../components/StoreSettingsModal';
import RejectOrderModal from '../../components/RejectOrderModal';
import PrintBillModal from '../../components/PrintBillModal';
import { startOrderAlarm, stopOrderAlarm, playNewOrderChime } from '../../utils/orderAlertSound';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, adminLogout } = useAuth();
  const { showToast } = useToast();

  const [adminUnreadTotal, setAdminUnreadTotal] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Store Reception Status (Open vs Paused)
  const [isOpenStore, setIsOpenStore] = useState(true);
  const [togglingStore, setTogglingStore] = useState(false);

  // New Order Modal Alert & Print
  const [alertOrder, setAlertOrder] = useState(null);
  const [confirmingOrder, setConfirmingOrder] = useState(false);
  const [printingOrder, setPrintingOrder] = useState(null);
  const [rejectModalOrder, setRejectModalOrder] = useState(null);
  const [rejectingOrder, setRejectingOrder] = useState(false);

  // STRICT ACCESS CONTROL: Must be logged in as Admin with password 14092006
  // Anyone typing /admin or any /admin/* without admin session is INSTANTLY kicked out to homepage
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Periodic polling & Socket for pending orders & chat unread
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      socket.emit('join_admin_room');
    }

    const checkUpdates = async () => {
      try {
        const [roomsRes, ordersRes] = await Promise.all([
          getChatRooms(),
          getAllOrders({ status: 'pending' })
        ]);

        if (roomsRes.success && roomsRes.rooms) {
          const totalUnread = roomsRes.rooms.reduce((sum, r) => sum + (r.unread_count || 0), 0);
          setAdminUnreadTotal(totalUnread);
        }

        if (ordersRes.success && ordersRes.orders) {
          const pending = ordersRes.orders;
          setPendingOrdersCount(pending.length);

          // If there's an unconfirmed pending order and alert modal is not showing, trigger alert
          if (pending.length > 0 && !alertOrder) {
            const newest = pending[0];
            // Only trigger if order is within last 1 hour
            const diffMinutes = (Date.now() - new Date(newest.created_at).getTime()) / (1000 * 60);
            if (diffMinutes < 60) {
              setAlertOrder(newest);
              if (soundEnabled) {
                startOrderAlarm(newest.order_code);
              }
            }
          }
        }
      } catch (err) {
        // silent polling catch
      }
    };

    checkUpdates();
    const pollInterval = setInterval(checkUpdates, 4000);

    // Socket event handlers
    const handleNewOrder = (newOrder) => {
      showToast(`🔔 CÓ ĐƠN HÀNG MỚI: #${newOrder.order_code}! Vui lòng bấm Xác Nhận Đơn.`, 'info', 8000);
      setPendingOrdersCount((c) => c + 1);
      setAlertOrder(newOrder);
      if (soundEnabled) {
        startOrderAlarm(newOrder.order_code);
      }
    };

    const handleNewMessage = (msg) => {
      if (msg.sender_role === 'customer') {
        setAdminUnreadTotal((c) => c + 1);
      }
    };

    if (socket) {
      socket.on('new_order', handleNewOrder);
      socket.on('new_message', handleNewMessage);
    }

    return () => {
      clearInterval(pollInterval);
      stopOrderAlarm();
      if (socket) {
        socket.off('new_order', handleNewOrder);
        socket.off('new_message', handleNewMessage);
      }
    };
  }, [soundEnabled, alertOrder]);

  // Fetch initial store settings and listen to socket updates
  useEffect(() => {
    getStoreSettings()
      .then((res) => {
        if (res.success && res.settings) {
          setIsOpenStore(res.settings.is_open !== false);
        }
      })
      .catch(() => {});

    const socket = getSocket();
    if (socket) {
      const handleSettingsUpdate = (settings) => {
        if (settings && settings.is_open !== undefined) {
          setIsOpenStore(settings.is_open !== false);
        }
      };
      socket.on('store_settings_updated', handleSettingsUpdate);
      return () => socket.off('store_settings_updated', handleSettingsUpdate);
    }
  }, []);

  const handleToggleStoreStatus = async () => {
    if (togglingStore) return;
    const nextStatus = !isOpenStore;
    setTogglingStore(true);
    try {
      const res = await updateStoreSettings({ is_open: nextStatus });
      if (res.success) {
        setIsOpenStore(nextStatus);
        showToast(
          nextStatus
            ? '🟢 Đã BẬT nhận đơn! Khách hàng có thể tiếp tục đặt món.'
            : '🔴 Đã TẠM NGƯNG nhận đơn! Khách hàng sẽ thấy thông báo quán tạm nghỉ.',
          nextStatus ? 'success' : 'warning',
          5000
        );
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi cập nhật trạng thái nhận đơn', 'error');
    } finally {
      setTogglingStore(false);
    }
  };

  const handleConfirmAlertOrder = async () => {
    if (!alertOrder || confirmingOrder) return;
    setConfirmingOrder(true);
    try {
      await confirmOrder(alertOrder.id);
      showToast(`🎉 Đã xác nhận đơn #${alertOrder.order_code} thành công!`, 'success');
      stopOrderAlarm();
      setAlertOrder(null);
      setPendingOrdersCount((c) => Math.max(0, c - 1));
      navigate('/admin/orders');
    } catch (err) {
      showToast(err.message || 'Lỗi khi xác nhận đơn hàng', 'error');
    } finally {
      setConfirmingOrder(false);
    }
  };

  const handleOpenRejectAlert = () => {
    if (!alertOrder) return;
    stopOrderAlarm();
    setRejectModalOrder(alertOrder);
  };

  const handleExecuteReject = async (orderId, reason) => {
    setRejectingOrder(true);
    try {
      const res = await rejectOrder(orderId, reason);
      if (res.success) {
        showToast(`❌ Đã từ chối đơn hàng #${alertOrder?.order_code || orderId}!`, 'info');
        setRejectModalOrder(null);
        setAlertOrder(null);
        stopOrderAlarm();
        setPendingOrdersCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi từ chối đơn hàng', 'error');
    } finally {
      setRejectingOrder(false);
    }
  };

  const handleDismissAlert = () => {
    stopOrderAlarm();
    setAlertOrder(null);
  };

  const navLinks = [
    { to: '/admin', label: 'Bảng Điều Khiển', icon: LayoutDashboard, exact: true },
    { to: '/admin/foods', label: 'Quản Lý Món Ăn', icon: UtensilsCrossed },
    { to: '/admin/orders', label: 'Quản Lý Đơn Hàng', icon: Package, badge: pendingOrdersCount, badgeColor: 'bg-amber-500' },
    { to: '/admin/inventory', label: 'Kho Nguyên Liệu', icon: Warehouse },
    { to: '/admin/coupons', label: 'Mã Khuyến Mãi', icon: Tag },
    { to: '/admin/reviews', label: 'Đánh Giá', icon: Star },
    { to: '/admin/chat', label: 'Hỗ Trợ Khách Hàng', icon: MessageSquare, badge: adminUnreadTotal, badgeColor: 'bg-red-500' }
  ];

  return (
    <div className="min-h-screen bg-[#0D0F17] text-slate-100 flex flex-col md:flex-row">
      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#141824] border-b border-amber-500/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black text-sm shadow">
            🍲
          </div>
          <div>
            <span className="font-black text-sm text-white block leading-tight">Bếp Việt Hub</span>
            <span className="text-[10px] text-amber-400 font-bold">Admin Portal</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Quick toggle in mobile header */}
          <button
            onClick={handleToggleStoreStatus}
            disabled={togglingStore}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-black border transition flex items-center gap-1 ${
              isOpenStore
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
            }`}
          >
            <span>{isOpenStore ? '🟢 Nhận Đơn' : '🔴 Tạm Nghỉ'}</span>
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl bg-slate-800 text-slate-300"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* SIDEBAR */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-[#121520] border-r border-amber-500/20 flex flex-col justify-between p-5 transition-transform duration-300 shadow-2xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-4">
          {/* Brand */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-amber-500/20">
              🍲
            </div>
            <div>
              <h2 className="font-black text-sm text-white tracking-tight leading-tight">
                Bếp Việt Gourmet
              </h2>
              <span className="inline-block text-[9px] font-black text-amber-400 uppercase tracking-widest bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30 mt-0.5">
                Quản Trị Viên
              </span>
            </div>
          </div>

          {/* STORE STATUS TOGGLE (1-TOUCH CONTROL) */}
          <div className="px-2">
            <div
              className={`p-3 rounded-2xl border transition-all ${
                isOpenStore
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-rose-500/15 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isOpenStore ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-200">
                    {isOpenStore ? 'Đang Nhận Đơn' : 'Tạm Ngưng Nhận'}
                  </span>
                </div>
                <button
                  onClick={handleToggleStoreStatus}
                  disabled={togglingStore}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition active:scale-95 shadow ${
                    isOpenStore
                      ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                      : 'bg-rose-600 text-white hover:bg-rose-500'
                  }`}
                  title="Bấm để chuyển đổi trạng thái nhận đơn của cửa hàng"
                >
                  {togglingStore ? '...' : isOpenStore ? 'Tạm Ngưng' : 'Mở Nhận Đơn'}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                {isOpenStore
                  ? 'Quán đang mở, khách có thể đặt món trên web.'
                  : 'Quán đang tạm nghỉ, web sẽ chặn không cho đặt đơn.'}
              </p>
            </div>
          </div>

          {/* Sound Alert Toggle */}
          <div className="px-2">
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (!next) stopOrderAlarm();
                showToast(next ? 'Đã bật chuông thông báo đơn hàng mới' : 'Đã tắt chuông thông báo', 'info');
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-xs font-semibold text-slate-300 transition"
            >
              <span className="flex items-center gap-2">
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                <span>Chuông báo đơn:</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${soundEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                {soundEnabled ? 'BẬT' : 'TẮT'}
              </span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = link.exact
                ? location.pathname === link.to
                : location.pathname.startsWith(link.to);

              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-bold text-xs transition duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </div>
                  {link.badge > 0 && (
                    <span className={`${link.badgeColor || 'bg-red-500'} text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce shadow`}>
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Store Settings & Actions */}
        <div className="pt-3 border-t border-slate-800 space-y-2">
          {/* Store Settings Button */}
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center justify-between w-full p-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition group"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span>Giờ Mở Cửa & Quán</span>
            </div>
            <span className="text-[10px] bg-amber-400/20 px-2 py-0.5 rounded-md">
              Cài đặt
            </span>
          </button>

          {/* Switch to customer view */}
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-700/60 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về Trang Khách Hàng</span>
          </Link>

          {/* Admin Logout Button */}
          <button
            onClick={adminLogout}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-bold border border-rose-500/30 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng Xuất Admin</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-h-screen bg-[#0D0F17] p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <Outlet />
      </main>

      {/* STORE SETTINGS MODAL */}
      <StoreSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSettingsUpdated={(settings) => {
          if (settings && settings.is_open !== undefined) {
            setIsOpenStore(settings.is_open !== false);
          }
        }}
      />

      {/* FLOATING REAL-TIME ORDER ALERT POPUP MODAL */}
      {alertOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-b from-[#1E2333] to-[#121624] border-2 border-amber-400 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-500/30 space-y-5 animate-scale-up text-white relative">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center font-black animate-bounce">
                  <Bell className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Mới Đặt!
                    </span>
                    <span className="text-xs text-amber-200">Nội thành Hà Nội</span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-0.5">
                    ĐƠN HÀNG MỚI CHỜ BẠN DUYỆT!
                  </h3>
                </div>
              </div>
              <button
                onClick={handleDismissAlert}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Order Details Card */}
            <div className="bg-slate-900/90 border border-slate-700/80 p-4 rounded-2xl space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-mono font-bold text-amber-400 text-sm">
                  #{alertOrder.order_code}
                </span>
                <span className="font-extrabold text-sm text-emerald-400">
                  {formatVND(alertOrder.total_amount)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-300">
                <span className="font-bold text-white">Khách hàng:</span>
                <span>{alertOrder.customer_name}</span>
                <span className="text-slate-400 font-mono">({alertOrder.customer_phone})</span>
              </div>

              <div className="flex items-start gap-1.5 text-slate-300">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{alertOrder.delivery_address}</span>
              </div>

              {alertOrder.note && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl text-amber-200 text-[11px]">
                  <strong>Ghi chú:</strong> {alertOrder.note}
                </div>
              )}
            </div>

            {/* Actions: CONFIRM vs REJECT */}
            <div className="space-y-2.5 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={handleConfirmAlertOrder}
                  disabled={confirmingOrder}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs shadow-xl shadow-emerald-500/30 active:scale-95 transition flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{confirmingOrder ? 'Đang duyệt...' : '✅ NHẬN ĐƠN (DUYỆT)'}</span>
                </button>

                <button
                  onClick={handleOpenRejectAlert}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow-xl shadow-rose-600/30 active:scale-95 transition flex items-center justify-center gap-1.5 border border-rose-500/40"
                >
                  <span>❌ KHÔNG NHẬN (TỪ CHỐI)</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    handleDismissAlert();
                    setPrintingOrder(alertOrder);
                  }}
                  className="py-2.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-orange-500/30"
                  title="In phiếu bếp & shipper 80mm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In Phiếu</span>
                </button>

                <button
                  onClick={() => {
                    handleDismissAlert();
                    navigate('/admin/orders');
                  }}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Xem Tất Cả</span>
                </button>

                <button
                  onClick={handleDismissAlert}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold transition"
                >
                  Tắt Chuông
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECT ORDER MODAL */}
      <RejectOrderModal
        order={rejectModalOrder}
        isOpen={!!rejectModalOrder}
        onClose={() => setRejectModalOrder(null)}
        onConfirmReject={handleExecuteReject}
        loading={rejectingOrder}
      />

      {/* PRINT BILL MODAL */}
      <PrintBillModal
        order={printingOrder}
        onClose={() => setPrintingOrder(null)}
      />
    </div>
  );
}
