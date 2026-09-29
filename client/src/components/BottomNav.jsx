import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Utensils, ShoppingBag, Package, MessageCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useChat } from '../context/ChatContext';

export default function BottomNav() {
  const { itemCount, setIsCartOpen } = useCart();
  const { unreadCount, setIsChatOpen } = useChat();

  const navClass = ({ isActive }) =>
    `flex flex-col items-center justify-center flex-1 py-1.5 transition ${
      isActive ? 'text-orange-600 font-bold' : 'text-slate-500 hover:text-slate-800'
    }`;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe">
      <div className="flex items-center justify-around h-14">
        {/* Home */}
        <NavLink to="/" className={navClass}>
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Trang chủ</span>
        </NavLink>

        {/* Menu */}
        <NavLink to="/menu" className={navClass}>
          <Utensils className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Thực đơn</span>
        </NavLink>

        {/* Cart Drawer Trigger */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1.5 text-slate-500 relative transition"
        >
          <div className="relative">
            <div className="-mt-5 w-11 h-11 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/40 border-2 border-white">
              <ShoppingBag className="w-5 h-5" />
            </div>
            {itemCount > 0 && (
              <span className="absolute -top-6 -right-1 bg-red-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow">
                {itemCount}
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-600 font-semibold mt-0.5">Giỏ hàng</span>
        </button>

        {/* Orders */}
        <NavLink to="/orders" className={navClass}>
          <Package className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Đơn hàng</span>
        </NavLink>

        {/* Live Chat */}
        <button
          onClick={() => setIsChatOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1.5 text-slate-500 relative transition"
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5 mb-0.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Chat Quán</span>
        </button>
      </div>
    </div>
  );
}
