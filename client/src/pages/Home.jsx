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
  ChevronRight
} from 'lucide-react';
import { getFoods, getCategories } from '../api';
import FoodCard from '../components/FoodCard';
import FoodDetailModal from '../components/FoodDetailModal';

export default function Home() {
  const navigate = useNavigate();
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedFood, setSelectedFood] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [foodsRes, catsRes] = await Promise.all([
          getFoods({ available_only: true }),
          getCategories()
        ]);
        if (foodsRes.success) setFoods(foodsRes.foods || []);
        if (catsRes.success) setCategories(catsRes.categories || []);
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const featuredFoods = foods.filter((f) => f.is_featured === 1);
  const bestSellers = [...foods].sort((a, b) => b.sales_count - a.sales_count).slice(0, 6);

  return (
    <div className="min-h-screen pb-20 md:pb-12 space-y-12">
      {/* HERO BANNER SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 text-white py-12 md:py-20 px-4 sm:px-6 lg:px-8">
        {/* Background decorative bubbles */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-orange-400/20 blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-amber-200 text-xs sm:text-sm font-bold border border-white/20">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Giao Hỏa Tốc Trong 20 Phút • Nóng Hổi Chuẩn Vị</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
              Món Ngon Đậm Vị <br />
              <span className="text-amber-300 underline decoration-amber-400 decoration-wavy decoration-2">
                Ẩm Thực Việt
              </span>{' '}
              Giao Tận Nơi
            </h1>

            <p className="text-sm sm:text-base text-orange-100 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Từ bát Phở Bò Tái Lăn sôi sùng sục, Cơm Tấm sườn nướng than hoa đến ly Trà Sữa đường đen béo ngậy. Đặt ngay, shipper có mặt tức thì!
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to="/menu"
                className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-900 text-amber-300 hover:text-amber-200 font-extrabold text-sm sm:text-base shadow-2xl active:scale-95 transition"
              >
                <span>Xem Toàn Bộ Thực Đơn</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <div className="text-left hidden sm:block pl-2">
                <p className="text-xs text-orange-200 font-semibold">Ưu đãi hôm nay</p>
                <p className="text-sm font-bold text-white">Nhập <span className="bg-white/20 px-2 py-0.5 rounded text-amber-200 font-mono">BEPVIET20</span> giảm 20k</p>
              </div>
            </div>
          </div>

          {/* Hero Image Showcase */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-72 sm:w-88 md:w-96 aspect-square">
              <div className="absolute inset-0 rounded-full bg-white/20 blur-xl animate-pulseGlow" />
              <img
                src="https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80"
                alt="Phở Bò Việt Nam"
                className="w-full h-full object-cover rounded-full border-4 border-white/60 shadow-2xl animate-float relative z-10"
              />
              {/* Floating review card */}
              <div className="absolute -bottom-2 -left-4 sm:bottom-4 sm:left-0 z-20 bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl shadow-xl text-slate-800 border border-orange-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-lg">
                  🍲
                </div>
                <div>
                  <div className="flex items-center gap-1 text-amber-500">
                    {'★★★★★'}
                    <span className="text-xs font-bold text-slate-700 ml-1">4.9/5</span>
                  </div>
                  <p className="text-xs font-extrabold text-slate-800">5.000+ Đơn giao nóng hổi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROMOTIONAL TICKER / FEATURES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-3xl bg-white border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-800">Giao Nhanh 20p</h4>
              <p className="text-[11px] text-slate-400">Đóng gói giữ nhiệt</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-800">Chuẩn Vệ Sinh</h4>
              <p className="text-[11px] text-slate-400">100% Tươi sạch</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-800">Freeship Từ 250k</h4>
              <p className="text-[11px] text-slate-400">Không lo phí vận chuyển</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-800">Chat Với Quán</h4>
              <p className="text-[11px] text-slate-400">Hỗ trợ tức thời 24/7</p>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES PILLS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Danh Mục Món Ăn
            </h2>
            <p className="text-xs text-slate-500">Khám phá các món ăn theo từng sở thích của bạn</p>
          </div>
          <Link
            to="/menu"
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            <span>Tất cả</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition duration-200 shadow-sm ${
              activeCategory === 'all'
                ? 'bg-orange-500 text-white shadow-orange-500/25'
                : 'bg-white text-slate-700 hover:bg-orange-50 border border-slate-100'
            }`}
          >
            🍽️ Tất cả món
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.slug)}
              className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition duration-200 shadow-sm ${
                activeCategory === cat.slug
                  ? 'bg-orange-500 text-white shadow-orange-500/25'
                  : 'bg-white text-slate-700 hover:bg-orange-50 border border-slate-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* FEATURED DISHES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              <Flame className="w-5 h-5 fill-orange-500" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Món Bán Chạy Nhất Tuần
              </h2>
              <p className="text-xs text-slate-500">Được khách hàng yêu thích và đặt nhiều nhất</p>
            </div>
          </div>
          <Link
            to="/menu"
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
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
            {(activeCategory === 'all'
              ? bestSellers
              : foods.filter((f) => f.category_slug === activeCategory)
            ).map((food) => (
              <FoodCard key={food.id} food={food} onOpenDetail={setSelectedFood} />
            ))}
          </div>
        )}
      </section>

      {/* FLASH VOUCHER BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-10 text-white relative overflow-hidden shadow-2xl border border-slate-800">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="text-xs font-black tracking-widest text-amber-400 uppercase bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                Ưu Đãi Độc Quyền
              </span>
              <h3 className="text-2xl sm:text-3xl font-black">
                Giảm 20.000 ₫ Cho Đơn Hàng Đầu Tiên
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg">
                Áp dụng mã giảm giá <strong className="text-amber-300 font-mono">BEPVIET20</strong> cho đơn từ 100.000 ₫. Đặt ngay kẻo lỡ!
              </p>
            </div>
            <Link
              to="/menu"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm shadow-xl active:scale-95 transition whitespace-nowrap"
            >
              Áp Dụng & Đặt Ngay
            </Link>
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
