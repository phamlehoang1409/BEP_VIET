import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { Gift } from 'lucide-react';

// Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { ChatProvider } from './context/ChatContext';
import { ToastProvider } from './components/Toast';

// Customer Components
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import CartDrawer from './components/CartDrawer';
import LiveChatWidget from './components/LiveChatWidget';
import LoginModal from './components/LoginModal';
import LuckyWheelModal from './components/LuckyWheelModal';

// Customer Pages
import Home from './pages/Home';
import Menu from './pages/Menu';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import MyOrders from './pages/MyOrders';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import FoodManagement from './pages/admin/FoodManagement';
import OrderManagement from './pages/admin/OrderManagement';
import CouponManagement from './pages/admin/CouponManagement';
import ReviewManagement from './pages/admin/ReviewManagement';
import AdminChat from './pages/admin/AdminChat';
import AdminLogin from './pages/admin/AdminLogin';

import Footer from './components/Footer';

// Production Error Boundary to prevent any blank white screen
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('App Render Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF8F5] text-slate-800">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-200 text-center space-y-4">
            <span className="text-5xl">🍲</span>
            <h2 className="text-xl font-black text-slate-900">Bếp Việt Gourmet</h2>
            <p className="text-sm text-slate-500">
              Hệ thống vừa cập nhật phiên bản mới. Vui lòng nhấn nút bên dưới để tải lại dữ liệu mới nhất.
            </p>
            <button
              onClick={() => {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(regs => {
                    for (const r of regs) r.unregister();
                  });
                }
                caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
                window.location.reload();
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-sm shadow-lg shadow-orange-500/30 active:scale-95 transition"
            >
              Tải Lại Trang Ngay
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Customer Layout Shell
function CustomerLayout() {
  const { storeSettings } = useCart();
  const [isWheelOpen, setIsWheelOpen] = useState(false);

  return (
    <ChatProvider>
      <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <CartDrawer />
        <LiveChatWidget />
        <BottomNav />
        <LoginModal />

        {/* Floating Lucky Wheel Button (Bottom Left) */}
        <button
          onClick={() => setIsWheelOpen(true)}
          className="fixed left-4 bottom-20 md:bottom-6 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-black text-xs shadow-xl shadow-orange-500/35 hover:scale-105 active:scale-95 transition border-2 border-amber-300"
          title="Vòng quay may mắn nhận mã giảm giá"
        >
          <Gift className="w-4 h-4 text-amber-200 animate-bounce" />
          <span className="hidden sm:inline">Vòng Quay May Mắn</span>
          <span className="sm:hidden">Quay Thưởng</span>
        </button>

        <LuckyWheelModal
          isOpen={isWheelOpen}
          onClose={() => setIsWheelOpen(false)}
        />

        {/* Customer Footer */}
        <Footer />
      </div>
    </ChatProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <div
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }}
              className="min-h-screen select-none"
            >
              <BrowserRouter>
                <Routes>
                  {/* Customer Storefront Routes */}
                  <Route element={<CustomerLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/menu" element={<Menu />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/order-success/:id" element={<OrderSuccess />} />
                    <Route path="/orders" element={<MyOrders />} />
                  </Route>

                  {/* Block /admin/login - kicks unauthorized visitors out to homepage */}
                  <Route path="/admin/login" element={<Navigate to="/" replace />} />

                  {/* Secret Merchant Admin Portals (Only known to the shop owner) */}
                  <Route path="/chu-quan-1409" element={<AdminLogin />} />
                  <Route path="/bepviet-secret-1409" element={<AdminLogin />} />

                  {/* Separated Merchant Admin Routes (Protected by AdminLayout) */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="foods" element={<FoodManagement />} />
                    <Route path="orders" element={<OrderManagement />} />
                    <Route path="coupons" element={<CouponManagement />} />
                    <Route path="reviews" element={<ReviewManagement />} />
                    <Route path="chat" element={<AdminChat />} />
                  </Route>

                  {/* Fallback */}
                  <Route path="*" element={<Home />} />
                </Routes>
              </BrowserRouter>
            </div>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
