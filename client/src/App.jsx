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
import AdminChat from './pages/admin/AdminChat';
import AdminLogin from './pages/admin/AdminLogin';

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
        <footer className="hidden md:block bg-white border-t border-slate-100 py-10 mt-12 text-slate-500 text-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🍲</span>
              <span className="font-extrabold text-sm text-slate-800">Bếp Việt Gourmet</span>
              <span className="text-slate-400">• Ẩm thực tinh hoa Việt Nam</span>
            </div>
            <div className="flex items-center gap-6">
              <span>Hotline: 1900 6868</span>
              <span>Mở cửa: 06:00 - 23:00</span>
              <span className="text-orange-600 font-bold">Giao hàng 63 tỉnh thành</span>
            </div>
          </div>
        </footer>
      </div>
    </ChatProvider>
  );
}

export default function App() {
  return (
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
                <Route path="chat" element={<AdminChat />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Home />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}
