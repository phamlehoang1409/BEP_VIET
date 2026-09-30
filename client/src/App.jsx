import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';

// Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ChatProvider } from './context/ChatContext';
import { ToastProvider } from './components/Toast';

// Customer Components
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import CartDrawer from './components/CartDrawer';
import LiveChatWidget from './components/LiveChatWidget';
import LoginModal from './components/LoginModal';
import PwaInstallBanner from './components/PwaInstallBanner';

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
import AdminChat from './pages/admin/AdminChat';
import AdminLogin from './pages/admin/AdminLogin';

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
        <PwaInstallBanner />

        {/* Customer Footer */}
        <footer className="hidden md:block bg-[#0D0F17] border-t border-amber-900/30 py-8 mt-12 text-slate-400 text-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🍜</span>
              <span className="font-black text-sm text-amber-300">Bếp Việt Gourmet</span>
              <span className="text-slate-500">• Đỉnh Cao Mì Indomie Thượng Hạng</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="tel:0353859726" className="text-amber-400 font-bold hover:underline flex items-center gap-1.5">
                <span>📞 Hotline:</span> 0353859726
              </a>
              <span>Mở cửa: 08:00 - 23:00</span>
              <span className="text-amber-400 font-bold bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                🚀 Giao hỏa tốc Nội thành Hà Nội
              </span>
            </div>
          </div>
        </footer>
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

                {/* Admin Login Route */}
                <Route path="/admin/login" element={<AdminLogin />} />

                {/* Separated Merchant Admin Routes (Protected by AdminLayout) */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="foods" element={<FoodManagement />} />
                  <Route path="orders" element={<OrderManagement />} />
                  <Route path="coupons" element={<CouponManagement />} />
                  <Route path="chat" element={<AdminChat />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Home />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
