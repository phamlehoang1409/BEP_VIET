import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, User, UtensilsCrossed, Shield, Search, PhoneCall, LogOut, Package, Clock, Phone } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatVND } from '../utils/vietnamData';
import { getStoreSettings } from '../api';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { itemCount, subtotal, setIsCartOpen, storeSettings } = useCart();
  const { user, logout, setIsAuthModalOpen, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [userDropdown, setUserDropdown] = useState(false);

  // Secret admin entry: Click logo 5 times in 2.5s OR Ctrl+Shift+A
  const logoClicksRef = React.useRef({ count: 0, lastTime: 0 });

  const handleLogoClick = (e) => {
    const now = Date.now();
    if (now - logoClicksRef.current.lastTime > 2500) {
      logoClicksRef.current.count = 1;
    } else {
      logoClicksRef.current.count += 1;
    }
    logoClicksRef.current.lastTime = now;

    if (logoClicksRef.current.count >= 5) {
      e.preventDefault();
      logoClicksRef.current.count = 0;
      navigate('/chu-quan-1409');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) ||
        (e.altKey && (e.key === 'a' || e.key === 'A'))
      ) {
        e.preventDefault();
        navigate('/chu-quan-1409');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) return;
    if (q.toLowerCase().includes('admin')) {
      // Disallow searching admin keywords
      setSearchTerm('');
      navigate('/');
      return;
    }
    navigate(`/menu?search=${encodeURIComponent(q)}`);
  };

  const isCurrent = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-[#0D0F17]/95 backdrop-blur-md border-b border-amber-500/20 text-white transition-all duration-300">
      {/* Top micro bar: Store Status + Hotline + Delivery Area */}
      <div className="bg-[#08090E] border-b border-amber-500/10 py-1.5 px-4 sm:px-6 lg:px-8 text-[11px] text-slate-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                storeSettings?.is_currently_open ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="font-semibold text-slate-300">
              {storeSettings?.is_currently_open
                ? `Đang Mở Cửa (${storeSettings?.open_time || '08:00'} - ${storeSettings?.close_time || '23:00'})`
                : 'Tạm Nghỉ'}
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="hidden sm:inline text-amber-300/90 font-medium">
              {storeSettings?.delivery_area || 'Giao hỏa tốc Nội thành Hà Nội'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={`tel:${storeSettings?.hotline || '0353859726'}`}
              className="text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 transition"
            >
              <Phone className="w-3 h-3 text-amber-400" />
              <span>Hotline: {storeSettings?.hotline || '0353859726'}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Optional Announcement Banner from Admin */}
      {storeSettings?.announcement && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/20 to-amber-500/15 border-b border-amber-500/20 py-1 px-4 text-center text-xs text-amber-200 font-semibold tracking-wide flex items-center justify-center gap-2">
          <span>📢</span>
          <span className="truncate">{storeSettings.announcement}</span>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          {/* Logo with secret 5-click admin entry */}
          <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2.5 shrink-0 group select-none">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition duration-300">
              <span className="text-xl sm:text-2xl">🍜</span>
            </div>
            <div>
              <span className="text-lg sm:text-2xl font-black tracking-tight bg-gradient-to-r from-amber-300 via-amber-200 to-orange-400 bg-clip-text text-transparent">
                Bếp Việt Gourmet
              </span>
              <span className="hidden sm:block text-[10px] font-black tracking-widest text-amber-400/90 uppercase -mt-0.5">
                Mì Indomie Thượng Hạng
              </span>
            </div>
          </Link>

          {/* Search bar (Desktop) */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Tìm Mì Indomie bò trứng, xá xíu, hải sản sa tế..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-full bg-slate-900/90 hover:bg-slate-900 focus:bg-slate-900 border border-slate-700/80 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none text-xs text-white placeholder-slate-500 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3" />
            </div>
          </form>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7">
            <Link
              to="/"
              className={`text-sm font-bold transition ${
                isCurrent('/') ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'
              }`}
            >
              Trang Chủ
            </Link>
            <Link
              to="/menu"
              className={`text-sm font-bold transition ${
                isCurrent('/menu') ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'
              }`}
            >
              Thực Đơn Indomie
            </Link>
            <Link
              to="/orders"
              className={`text-sm font-bold transition ${
                isCurrent('/orders') ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300'
              }`}
            >
              Đơn Của Tôi
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-sm transition duration-200 border border-amber-500/30"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow">
                    {itemCount}
                  </span>
                )}
              </div>
              <span className="hidden md:inline text-xs font-bold text-slate-200">
                {formatVND(subtotal)}
              </span>
            </button>

            {/* User Profile / Login */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdown(!userDropdown)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-800 transition border border-transparent hover:border-slate-700"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-sm">
                    {user.name ? user.name.slice(0, 1).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-black text-amber-300 leading-tight truncate max-w-[100px]">
                      {user.name || 'Khách hàng'}
                    </p>
                    <p className="text-[10px] text-slate-400">{user.phone}</p>
                  </div>
                </button>

                {userDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#161922] rounded-2xl shadow-2xl border border-amber-500/30 py-2 z-50 animate-scale-up text-white">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-xs text-slate-400">Đăng nhập tài khoản</p>
                      <p className="text-sm font-bold text-amber-300">{user.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{user.phone}</p>
                    </div>
                    <Link
                      to="/orders"
                      onClick={() => setUserDropdown(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-200 hover:bg-amber-500/10 hover:text-amber-300 transition"
                    >
                      <Package className="w-4 h-4" />
                      Lịch sử đơn hàng
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdown(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 active:scale-95 transition"
              >
                <User className="w-4 h-4 text-slate-950" />
                <span>Đăng nhập</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
