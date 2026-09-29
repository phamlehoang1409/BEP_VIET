import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, User, UtensilsCrossed, Shield, Search, PhoneCall, LogOut, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatVND } from '../utils/vietnamData';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { itemCount, subtotal, setIsCartOpen } = useCart();
  const { user, logout, setIsAuthModalOpen, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [userDropdown, setUserDropdown] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/menu?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const isCurrent = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-orange-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-orange-500/25 group-hover:scale-105 transition duration-300">
              <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 bg-clip-text text-transparent">
                Bếp Việt
              </span>
              <span className="hidden sm:block text-[11px] font-semibold tracking-wider text-orange-500 uppercase -mt-1">
                Gourmet & Delivery
              </span>
            </div>
          </Link>

          {/* Search bar (Desktop) */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Tìm phở bò, cơm tấm, trà đào..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none text-sm transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            </div>
          </form>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7">
            <Link
              to="/"
              className={`text-sm font-semibold transition ${
                isCurrent('/') ? 'text-orange-600' : 'text-slate-600 hover:text-orange-600'
              }`}
            >
              Trang Chủ
            </Link>
            <Link
              to="/menu"
              className={`text-sm font-semibold transition ${
                isCurrent('/menu') ? 'text-orange-600' : 'text-slate-600 hover:text-orange-600'
              }`}
            >
              Thực Đơn
            </Link>
            <Link
              to="/orders"
              className={`text-sm font-semibold transition ${
                isCurrent('/orders') ? 'text-orange-600' : 'text-slate-600 hover:text-orange-600'
              }`}
            >
              Đơn Của Tôi
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Admin Switch Button */}
            <Link
              to={isAdmin ? '/admin' : '/admin/login'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 text-xs sm:text-sm font-semibold shadow-md transition duration-200 border border-slate-700"
              title="Chuyển sang trang Quản trị"
            >
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span className="hidden sm:inline">Quản Trị Quán</span>
              <span className="sm:hidden">Admin</span>
            </Link>

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 font-semibold text-sm transition duration-200 border border-orange-200/60"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-orange-600" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow">
                    {itemCount}
                  </span>
                )}
              </div>
              <span className="hidden md:inline text-xs font-bold text-slate-700">
                {formatVND(subtotal)}
              </span>
            </button>

            {/* User Profile / Login */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdown(!userDropdown)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-100 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-400 to-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                    {user.name ? user.name.slice(0, 1).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[100px]">
                      {user.name || 'Khách hàng'}
                    </p>
                    <p className="text-[10px] text-slate-500">{user.phone}</p>
                  </div>
                </button>

                {userDropdown && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-scale-up">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-400">Đăng nhập với số</p>
                      <p className="text-sm font-bold text-slate-800">{user.phone}</p>
                    </div>
                    <Link
                      to="/orders"
                      onClick={() => setUserDropdown(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition"
                    >
                      <Package className="w-4 h-4" />
                      Lịch sử đơn hàng
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdown(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition"
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
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-xs sm:text-sm shadow-md shadow-orange-500/20 transition duration-200"
              >
                <User className="w-4 h-4" />
                <span>Đăng nhập</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
