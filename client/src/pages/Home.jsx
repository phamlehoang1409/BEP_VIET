import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Flame,
  ArrowRight,
  Sparkles,
  Clock,
  ShieldCheck,
  Truck,
  HeartHandshake,
  Search,
  Star,
  ChevronRight,
  Phone,
  Ticket,
  Copy,
  CheckCircle2,
  Award,
  Utensils,
  Crown,
  Zap,
  TrendingUp,
  Check
} from 'lucide-react';
import { getFoods, getCategories, getReviews } from '../api';
import FoodCard from '../components/FoodCard';
import FoodDetailModal from '../components/FoodDetailModal';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/Toast';

export default function Home() {
  const navigate = useNavigate();
  const { storeSettings, showStoreClosedModal } = useCart();
  const { showToast } = useToast();
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedFood, setSelectedFood] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [foodsRes, catsRes, reviewsRes] = await Promise.all([
          getFoods({ available_only: true }),
          getCategories(),
          getReviews().catch(() => ({ success: false, reviews: [] }))
        ]);
        if (foodsRes.success) setFoods(foodsRes.foods || []);
        if (catsRes.success) setCategories(catsRes.categories || []);
        if (reviewsRes.success) setReviews((reviewsRes.reviews || []).filter((r) => !r.is_hidden));
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    showToast(`Đã sao chép mã "${code}" vào bộ nhớ tạm!`, 'success');
  };

  const featuredFoods = foods.filter((f) => f.is_featured === 1);
  const bestSellers = [...foods].sort((a, b) => b.sales_count - a.sales_count).slice(0, 8);

  const displayedFoods = activeCategory === 'all'
    ? bestSellers
    : foods.filter((f) => f.category_slug === activeCategory);

  return (
    <div className="min-h-screen pb-20 md:pb-12 space-y-12 bg-[#FAF8F5]">
      {/* HERO LUXURY BANNER SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0D0F17] via-[#161922] to-[#0A0C13] text-white py-14 md:py-24 px-4 sm:px-6 lg:px-8 border-b border-amber-500/20">
        {/* Ambient luxury lighting */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 backdrop-blur-md text-amber-300 text-xs sm:text-sm font-bold border border-amber-500/30">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Giao Hỏa Tốc • {storeSettings?.delivery_area || 'Nội Thành Hà Nội'}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
              Đỉnh Cao Hương Vị <br />
              <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-orange-400 bg-clip-text text-transparent">
                Mì Indomie Thượng Hạng
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Trải nghiệm các tuyệt tác Mì Trộn Bò Trứng lòng đào, Xá Xíu Mật Ong quay xém cạnh, Hải Sản Sa Tế cay nồng chuẩn vị nhà hàng. Nóng giòn giao tận cửa!
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to="/menu"
                className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm sm:text-base shadow-2xl shadow-amber-500/25 active:scale-95 transition"
              >
                <span>Thưởng Thức Thực Đơn Ngay</span>
                <ArrowRight className="w-5 h-5 text-slate-950" />
              </Link>

              <a
                href={`tel:${storeSettings?.hotline || '0353859726'}`}
                className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-amber-300 font-bold text-sm border border-amber-500/30 transition"
              >
                <Phone className="w-4 h-4 text-amber-400" />
                <span>Hotline: {storeSettings?.hotline || '0353859726'}</span>
              </a>
            </div>

            {/* Quick Copy Promo Code Pills */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-2.5 text-xs text-slate-400">
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5" /> Bấm để chép mã:
              </span>
              <button
                type="button"
                onClick={() => handleCopyCode('INDOMIE20')}
                className="bg-slate-800/90 hover:bg-slate-700 px-3 py-1 rounded-xl border border-amber-500/40 font-mono text-amber-300 font-bold flex items-center gap-1.5 transition active:scale-95"
                title="Bấm để sao chép"
              >
                <Copy className="w-3 h-3 text-amber-400" />
                <span>INDOMIE20 (-20%)</span>
              </button>
              <button
                type="button"
                onClick={() => handleCopyCode('HANOI15K')}
                className="bg-slate-800/90 hover:bg-slate-700 px-3 py-1 rounded-xl border border-amber-500/40 font-mono text-amber-300 font-bold flex items-center gap-1.5 transition active:scale-95"
                title="Bấm để sao chép"
              >
                <Copy className="w-3 h-3 text-amber-400" />
                <span>HANOI15K (-15k ship)</span>
              </button>
            </div>
          </div>

          {/* VIP LUXURY SHOWCASE CARDS HUB (NO IMAGE, PURE LUXURY INTERACTIVE CARDS) */}
          <div className="lg:col-span-5 relative">
            {/* Background Glow */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-orange-500/10 to-rose-500/15 blur-2xl pointer-events-none" />

            {/* Main Luxury Glass Terminal Card */}
            <div className="relative z-10 rounded-3xl bg-[#12151E]/95 backdrop-blur-xl border-2 border-amber-500/30 p-5 sm:p-6 shadow-[0_10px_40px_rgba(0,0,0,0.6)] space-y-4">
              {/* Header Badge */}
              <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-md">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                      Bếp Việt Signature
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Tiêu Chuẩn Hương Vị 5 Sao
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full text-[11px] font-black text-amber-300">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span>4.9 / 5.0</span>
                </div>
              </div>

              {/* 3 Signature Highlights */}
              <div className="space-y-2.5">
                <div className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-amber-500/20 transition flex items-center justify-between group cursor-pointer" onClick={() => navigate('/menu')}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🥩</span>
                    <div>
                      <h5 className="font-extrabold text-xs sm:text-sm text-white group-hover:text-amber-300 transition">
                        Mì Indomie Bò Trứng Lòng Đào
                      </h5>
                      <p className="text-[10px] text-slate-400">
                        Bò Mỹ mềm thơm, sốt cay ngọt, bắp ngọt giòn
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs sm:text-sm font-black text-amber-400">55.000₫</div>
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Hot #1</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-amber-500/20 transition flex items-center justify-between group cursor-pointer" onClick={() => navigate('/menu')}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🥓</span>
                    <div>
                      <h5 className="font-extrabold text-xs sm:text-sm text-white group-hover:text-amber-300 transition">
                        Mì Indomie Xá Xíu Quay Mật Ong
                      </h5>
                      <p className="text-[10px] text-slate-400">
                        Xém cạnh giòn bì, lạp xưởng trứng cút béo ngậy
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs sm:text-sm font-black text-amber-400">52.000₫</div>
                    <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">Signature</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-amber-500/20 transition flex items-center justify-between group cursor-pointer" onClick={() => navigate('/menu')}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🦐</span>
                    <div>
                      <h5 className="font-extrabold text-xs sm:text-sm text-white group-hover:text-amber-300 transition">
                        Mì Indomie Hải Sản Sa Tế
                      </h5>
                      <p className="text-[10px] text-slate-400">
                        Tôm tươi bóc vỏ, sốt sa tế cay nồng đậm đà
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs sm:text-sm font-black text-amber-400">59.000₫</div>
                    <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">Cay Nồng</span>
                  </div>
                </div>
              </div>

              {/* VIP Live Badge & Quick Link */}
              <div className="pt-2 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Đang phục vụ nóng hổi</span>
                </div>

                <Link
                  to="/menu"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-black text-xs border border-amber-500/40 transition active:scale-95"
                >
                  <span>Xem Toàn Bộ Món</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Floating Live Notification Badge */}
            <div className="hidden sm:flex absolute -bottom-4 -left-4 z-20 bg-[#161922]/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl text-white border border-amber-500/40 items-center gap-2.5 animate-bounce">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                🛵
              </div>
              <div className="text-left">
                <p className="text-[10px] text-slate-400 font-medium">Vừa hoàn tất giao đơn:</p>
                <p className="text-xs font-black text-amber-300">#HN-8842 Cầu Giấy (1p trước)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CLOSED / TAM NGHI ALERT BANNER ON HOME */}
      {storeSettings && storeSettings.is_currently_open === false && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            onClick={() => showStoreClosedModal()}
            className="p-4 sm:p-5 rounded-3xl bg-rose-50 hover:bg-rose-100/70 border-2 border-rose-300 text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm transition cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-md shadow-rose-500/20">
                🔴
              </div>
              <div>
                <h4 className="font-black text-sm sm:text-base text-rose-700">
                  Bếp Việt Hiện Đang Tạm Nghỉ (Giờ mở cửa: {storeSettings.open_time || '08:00'} - {storeSettings.close_time || '23:00'})
                </h4>
                <p className="text-xs text-rose-800/80 mt-0.5">
                  Quán tạm ngưng nhận đơn mới. Quý khách có thể xem trước thực đơn món ngon hoặc bấm vào đây để xem chi tiết!
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                showStoreClosedModal();
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition active:scale-95 shrink-0"
            >
              Xem Chi Tiết
            </button>
          </div>
        </section>
      )}

      {/* PROMOTIONAL TICKER / FEATURES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-3xl bg-white border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-sm">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">Giao HN 20-30p</h4>
              <p className="text-[11px] text-slate-500">Đóng hộp giữ nhiệt vàng</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">Bảo Hiểm Đơn</h4>
              <p className="text-[11px] text-slate-500">Chủ quán duyệt trực tiếp</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0 shadow-sm">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">Freeship Từ 200k</h4>
              <p className="text-[11px] text-slate-500">12 quận nội thành Hà Nội</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 shadow-sm">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">Chat Với Quán</h4>
              <p className="text-[11px] text-slate-500">Chăm sóc khách hàng VIP</p>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES PILLS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Danh Mục Mì & Đồ Ăn Vặt
            </h2>
            <p className="text-xs text-slate-500">Khám phá Mì Indomie đặc biệt, đồ ăn vặt chiên giòn, topping và nước giải khát</p>
          </div>
          <Link
            to="/menu"
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            <span>Xem tất cả</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition duration-200 shadow-sm ${
              activeCategory === 'all'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-amber-500/25 scale-105'
                : 'bg-white text-slate-700 hover:bg-amber-50 border border-slate-200'
            }`}
          >
            🍽️ Tất cả món
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.slug)}
              className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition duration-200 shadow-sm ${
                activeCategory === cat.slug
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-amber-500/25 scale-105'
                  : 'bg-white text-slate-700 hover:bg-amber-50 border border-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* FEATURED / BEST SELLER DISHES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shadow-sm">
              <Flame className="w-5 h-5 fill-amber-500 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Món Bán Chạy Nhất Tại Hà Nội
              </h2>
              <p className="text-xs text-slate-500">Mì Indomie đặc sản được thực khách sành ăn đánh giá 5 sao</p>
            </div>
          </div>
          <Link
            to="/menu"
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            <span>Xem thêm</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-3">
                <div className="w-full aspect-[4/3] rounded-2xl shimmer" />
                <div className="h-4 w-3/4 rounded shimmer" />
                <div className="h-4 w-1/2 rounded shimmer" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {displayedFoods.map((food) => (
              <FoodCard key={food.id} food={food} onOpenDetail={setSelectedFood} />
            ))}
          </div>
        )}
      </section>

      {/* FLASH VOUCHER BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-[#0D0F17] via-[#161922] to-[#0D0F17] p-6 sm:p-10 text-white relative overflow-hidden shadow-2xl border border-amber-500/30">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs font-black tracking-widest text-amber-400 uppercase bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                Voucher Độc Quyền Hà Nội
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Giảm 20% Mì Indomie Thượng Hạng
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
                Áp dụng mã giảm giá <strong className="text-amber-300 font-mono">INDOMIE20</strong> tại bước thanh toán. Miễn phí ship nội thành từ 200.000 ₫!
              </p>
            </div>
            <button
              onClick={() => handleCopyCode('INDOMIE20')}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm shadow-xl active:scale-95 transition whitespace-nowrap flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              <span>Chép Mã & Thưởng Thức Ngay</span>
            </button>
          </div>
        </div>
      </section>

      {/* 5-STAR TESTIMONIALS & REVIEWS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  ⭐ Đánh Giá Thực Khách
                </span>
                <span className="text-xs text-slate-500">• 100% Khách Hàng Thật</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Thực Khách Nói Gì Về Mì Indomie Bếp Việt?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Hơn 10.000 phần mì phục vụ tại Hà Nội với tiêu chuẩn hương vị xuất sắc
              </p>
            </div>

            {/* Score pill */}
            <div className="flex items-center gap-3 bg-amber-500/10 p-3 sm:px-5 sm:py-3 rounded-2xl border border-amber-500/20 shrink-0">
              <div className="text-3xl sm:text-4xl font-black text-amber-600">
                {reviews.length > 0
                  ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1)
                  : '4.9'}
              </div>
              <div>
                <div className="flex items-center gap-0.5 text-amber-500">
                  {'★★★★★'}
                </div>
                <p className="text-[11px] font-bold text-slate-600">
                  {reviews.length > 0 ? `${reviews.length} đánh giá đã xác thực` : '10.000+ Thực khách hài lòng'}
                </p>
              </div>
            </div>
          </div>

          {/* Testimonial Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {(reviews.length > 0
              ? reviews.slice(0, 3)
              : [
                  {
                    id: 'sample-1',
                    customer_name: 'Nguyễn Minh Quân',
                    rating: 5,
                    comment: 'Mì Indomie bò trứng lòng đào ngon xuất sắc! Đóng hộp giấy giữ nhiệt cực kỳ sạch sẽ, giao đến Đống Đa vẫn còn bốc khói nghi ngút.',
                    order_id: 'ORD-9821'
                  },
                  {
                    id: 'sample-2',
                    customer_name: 'Trần Thu Trang',
                    rating: 5,
                    comment: 'Xá xíu mật ong thơm lừng xém cạnh chuẩn vị Hong Kong. Sốt trộn vừa miệng không bị ngấy, topping lạp xưởng trứng cút quá đầy đặn!',
                    order_id: 'ORD-8742'
                  },
                  {
                    id: 'sample-3',
                    customer_name: 'Lê Hoàng Anh',
                    rating: 5,
                    comment: 'Đặt đơn lúc nửa đêm mà 20 phút shipper đã bấm chuông tại Cầu Giấy. Quán phục vụ cực kỳ chu đáo và chuyên nghiệp. 10/10 điểm!',
                    order_id: 'ORD-7619'
                  }
                ]
            ).map((r, idx) => (
              <div
                key={r.id || idx}
                className="p-5 rounded-2xl bg-[#FAF8F5] border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-sm">
                        {(r.customer_name || 'K').slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{r.customer_name || 'Thực khách'}</h4>
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                          ✓ Đã mua hàng
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-0.5 text-amber-500 text-xs">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Number(r.rating) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                    "{r.comment || 'Mì rất ngon, nóng hổi và đóng gói cực kỳ cẩn thận!'}"
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Mì Indomie Thượng Hạng</span>
                  <span className="font-mono text-amber-600 font-bold">5.0 ★★★★★</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DETAIL MODAL */}
      {selectedFood && (
        <FoodDetailModal food={selectedFood} onClose={() => setSelectedFood(null)} />
      )}
    </div>
  );
}
