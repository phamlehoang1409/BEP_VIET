import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { Gift, Bot, Sparkles, Coins } from 'lucide-react';

// Providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { ChatProvider } from './context/ChatContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LoyaltyProvider, useLoyalty } from './context/LoyaltyContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { ToastProvider, useToast } from './components/Toast';
import { awardSpinForCompletedOrder } from './utils/luckyWheelService';

// Customer Components
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import CartDrawer from './components/CartDrawer';
import LiveChatWidget from './components/LiveChatWidget';
import LoginModal from './components/LoginModal';
import LuckyWheelModal from './components/LuckyWheelModal';
import LoyaltyModal from './components/LoyaltyModal';
import AIFoodAssistantModal from './components/AIFoodAssistantModal';
import Footer from './components/Footer';

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

// API & Services
import { getFoods, getSocket } from './api';
import { notificationService } from './utils/notificationService';

// Production Error Boundary
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
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF8F5] dark:bg-[#0A0C13] text-slate-800 dark:text-slate-100">
          <div className="max-w-md w-full bg-white dark:bg-[#141824] p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
            <span className="text-5xl">🍲</span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Bếp Việt Gourmet</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Hệ thống vừa cập nhật phiên bản mới. Vui lòng nhấn nút bên dưới để tải lại dữ liệu mới nhất.
            </p>
            <button
              onClick={() => {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then((regs) => {
                    for (const r of regs) r.unregister();
                  });
                }
                caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
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
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [isLoyaltyOpen, setIsLoyaltyOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [availableFoods, setAvailableFoods] = useState([]);

  useEffect(() => {
    getFoods({ available_only: true })
      .then((res) => {
        if (res.success && res.foods) setAvailableFoods(res.foods);
      })
      .catch(() => {});
  }, []);

  // Web Notification Socket Listener for Delivery Updates & Spin Award on Completion
  useEffect(() => {
    const socket = getSocket();
    const handleStatusUpdate = (updatedOrder) => {
      if (updatedOrder && updatedOrder.status) {
        notificationService.notifyOrderStatus(
          updatedOrder.order_code || updatedOrder.id,
          updatedOrder.status,
          updatedOrder.customer_name || user?.name || 'Bạn'
        );

        // Award Lucky Wheel spin ONLY when order reaches 'completed'
        if (updatedOrder.status === 'completed') {
          const awarded = awardSpinForCompletedOrder(updatedOrder);
          if (awarded) {
            showToast(
              `🎁 Đơn hàng #${updatedOrder.order_code} đã giao hoàn thành! Bạn nhận được +1 lượt quay Vòng Quay May Mắn!`,
              'success',
              8000
            );
          }
        }
      }
    };

    socket.on('order_status_updated', handleStatusUpdate);
    return () => socket.off('order_status_updated', handleStatusUpdate);
  }, [user]);

  return (
    <ChatProvider>
      <div className="min-h-screen flex flex-col bg-[#FAF8F5] dark:bg-[#0A0C13] text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <Navbar
          onOpenAI={() => setIsAIOpen(true)}
          onOpenLoyalty={() => setIsLoyaltyOpen(true)}
        />
        <main className="flex-1">
          <Outlet />
        </main>
        <CartDrawer />
        <LiveChatWidget />
        <BottomNav />
        <LoginModal />

        {/* Floating AI Food Assistant & Lucky Wheel Stack (Bottom Left) */}
        <div className="fixed left-4 bottom-20 md:bottom-6 z-40 flex flex-col gap-2.5">
          {/* AI Sommelier Button */}
          <button
            onClick={() => setIsAIOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 hover:from-purple-700 hover:to-amber-600 text-white font-black text-xs shadow-xl shadow-purple-600/35 hover:scale-105 active:scale-95 transition border-2 border-amber-300 group"
            title="Trợ lý AI tư vấn món ăn theo tâm trạng & calo"
          >
            <Bot className="w-4 h-4 text-amber-200 group-hover:rotate-12 transition" />
            <span className="hidden sm:inline">AI Tư Vấn Món</span>
            <span className="sm:hidden">AI Món Ngon</span>
          </button>

          {/* Lucky Wheel Button */}
          <button
            onClick={() => setIsWheelOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-black text-xs shadow-xl shadow-orange-500/35 hover:scale-105 active:scale-95 transition border-2 border-amber-300"
            title="Vòng quay may mắn nhận mã giảm giá"
          >
            <Gift className="w-4 h-4 text-amber-200 animate-bounce" />
            <span className="hidden sm:inline">Vòng Quay May Mắn</span>
            <span className="sm:hidden">Quay Thưởng</span>
          </button>
        </div>

        <LuckyWheelModal
          isOpen={isWheelOpen}
          onClose={() => setIsWheelOpen(false)}
        />

        <LoyaltyModal
          isOpen={isLoyaltyOpen}
          onClose={() => setIsLoyaltyOpen(false)}
        />

        <AIFoodAssistantModal
          isOpen={isAIOpen}
          onClose={() => setIsAIOpen(false)}
          foods={availableFoods}
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
      <ThemeProvider>
        <AuthProvider>
          <FavoritesProvider>
            <LoyaltyProvider>
              <CartProvider>
                <ToastProvider>
                  <div
                    onContextMenu={(e) => {
                      try {
                        const isAdmin = Boolean(
                          localStorage.getItem('bepviet_admin_token') ||
                            localStorage.getItem('bepviet_is_admin') === 'true' ||
                            window.location.search.includes('dev=1') ||
                            window.location.pathname.startsWith('/admin') ||
                            window.location.pathname.includes('chu-quan')
                        );
                        if (isAdmin) return true;
                      } catch (err) {}
                      e.preventDefault();
                      e.stopPropagation();
                      return false;
                    }}
                    className="min-h-screen bg-[#FAF8F5] dark:bg-[#0A0C13] transition-colors duration-300"
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

                        {/* Block /admin/login */}
                        <Route path="/admin/login" element={<Navigate to="/" replace />} />

                        {/* Secret Merchant Admin Portals */}
                        <Route path="/chu-quan-1409" element={<AdminLogin />} />
                        <Route path="/bepviet-secret-1409" element={<AdminLogin />} />

                        {/* Merchant Admin Routes */}
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
            </LoyaltyProvider>
          </FavoritesProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
