import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
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
  LogOut
} from 'lucide-react';
import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSocket, getChatRooms } from '../../api';

export default function AdminLayout() {
  const location = useLocation();
  const { isAdmin, adminLogout } = useAuth();
  const [adminUnreadTotal, setAdminUnreadTotal] = useState(0);
  const [isOpenStore, setIsOpenStore] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Track customer unread messages for admin badge
  useEffect(() => {
    if (!isAdmin) return;
    const socket = getSocket();
    socket.emit('join_admin_room');

    const updateUnread = async () => {
      try {
        const res = await getChatRooms();
        if (res.success && res.rooms) {
          const total = res.rooms.reduce((sum, r) => sum + (r.unread_count || 0), 0);
          setAdminUnreadTotal(total);
        }
      } catch (err) {
        console.error(err);
      }
    };

    updateUnread();

    const handleNewMessage = (msg) => {
      if (msg.sender_role === 'customer') {
        updateUnread();
      }
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [isAdmin]);

  // STRICT ACCESS CONTROL: Must be logged in as Admin with password 14092006
  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  const navLinks = [
    { to: '/admin', label: 'Bảng Điều Khiển', icon: LayoutDashboard, exact: true },
    { to: '/admin/foods', label: 'Quản Lý Món Ăn', icon: UtensilsCrossed },
    { to: '/admin/orders', label: 'Quản Lý Đơn Hàng', icon: Package },
    { to: '/admin/chat', label: 'Hỗ Trợ Khách Hàng', icon: MessageSquare, badge: adminUnreadTotal }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-sm">
            BV
          </div>
          <span className="font-extrabold text-sm text-white">Quản Trị Bếp Việt</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl bg-slate-800 text-slate-300"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* SIDEBAR */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between p-5 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Brand */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white font-black shadow-lg shadow-orange-500/30">
              🍲
            </div>
            <div>
              <h2 className="font-black text-base text-white tracking-tight">Bếp Việt Hub</h2>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                Quản Trị Viên
              </span>
            </div>
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
                  className={`flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-xs transition duration-200 ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </div>
                  {link.badge > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Store Switch, Logout & Status */}
        <div className="pt-4 border-t border-slate-800 space-y-2.5">
          {/* Store status toggle */}
          <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <Store className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300 font-medium">Trạng thái:</span>
            </div>
            <button
              onClick={() => setIsOpenStore(!isOpenStore)}
              className={`text-[11px] font-black px-2.5 py-1 rounded-xl transition ${
                isOpenStore
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {isOpenStore ? 'Đang Mở' : 'Nghỉ Bán'}
            </button>
          </div>

          {/* Switch to customer view */}
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold border border-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Về Trang Khách Hàng</span>
          </Link>

          {/* Admin Logout Button */}
          <button
            onClick={adminLogout}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-bold border border-rose-500/30 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng Xuất Admin</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-h-screen bg-slate-900 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
