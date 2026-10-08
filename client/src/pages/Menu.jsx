import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  SlidersHorizontal,
  UtensilsCrossed,
  AlertCircle,
  Clock,
  Heart,
  Flame,
  Star,
  Sparkles,
  Zap,
  TrendingUp,
  X
} from 'lucide-react';
import { getFoods, getCategories } from '../api';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import FoodCard from '../components/FoodCard';
import FoodDetailModal from '../components/FoodDetailModal';

export default function Menu() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const initialSearch = searchParams.get('search') || '';

  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [priceFilter, setPriceFilter] = useState('all'); // 'all' | 'under35' | '35to60' | 'above60'
  const [quickFilter, setQuickFilter] = useState('all'); // 'all' | 'bestseller' | 'discount' | 'spicy' | 'toprated'
  const [sortBy, setSortBy] = useState('default');
  const [selectedFood, setSelectedFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const { storeSettings, showStoreClosedModal } = useCart();
  const { favorites, isFavorite } = useFavorites();

  // Sync state if query params change
  useEffect(() => {
    if (searchParams.get('category')) setSelectedCategory(searchParams.get('category'));
    if (searchParams.get('search')) setSearchQuery(searchParams.get('search'));
  }, [searchParams]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await getCategories();
        if (res.success) setCategories(res.categories || []);
      } catch (err) {
        console.error(err);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchMenu() {
      try {
        setLoading(true);
        const params = {};
        if (selectedCategory !== 'all' && selectedCategory !== 'favorites') {
          params.category = selectedCategory;
        }
        if (searchQuery.trim()) params.search = searchQuery.trim();
        if (sortBy !== 'default') params.sort = sortBy;

        const res = await getFoods(params);
        if (res.success) setFoods(res.foods || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(fetchMenu, 250);
    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery, sortBy]);

  const handleCategorySelect = (slug) => {
    setSelectedCategory(slug);
    const newParams = new URLSearchParams(searchParams);
    if (slug === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', slug);
    }
    setSearchParams(newParams);
  };

  // Client-side filtering for favorites, price ranges, quick filters
  const filteredFoods = useMemo(() => {
    let result = [...foods];

    // Favorites Filter
    if (selectedCategory === 'favorites') {
      result = result.filter((f) => isFavorite(f.id));
    }

    // Price Filter
    if (priceFilter === 'under35') {
      result = result.filter((f) => f.price < 35000);
    } else if (priceFilter === '35to60') {
      result = result.filter((f) => f.price >= 35000 && f.price <= 60000);
    } else if (priceFilter === 'above60') {
      result = result.filter((f) => f.price > 60000);
    }

    // Quick Feature Filter
    if (quickFilter === 'bestseller') {
      result = result.filter((f) => f.is_featured === 1 || f.sales_count > 10);
    } else if (quickFilter === 'discount') {
      result = result.filter((f) => f.original_price && f.original_price > f.price);
    } else if (quickFilter === 'spicy') {
      result = result.filter((f) => f.spicy_level > 0);
    } else if (quickFilter === 'toprated') {
      result = result.filter((f) => (f.rating || 5) >= 4.8);
    }

    return result;
  }, [foods, selectedCategory, priceFilter, quickFilter, favorites]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 pb-24 md:pb-12 space-y-6">
      {/* Title & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/20">
              Giao Hỏa Tốc Nội Thành Hà Nội
            </span>
            <a href="tel:0353859726" className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline">
              📞 Hotline: 0353859726
            </a>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Thực Đơn Món Ăn Bếp Việt Gourmet
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Mì Indomie trộn đậm đà, nem chua rán, gà chiên giòn, trà tắc mát lạnh & topping thơm lừng
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Tìm theo tên món hoặc hương vị..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#141824] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 text-sm outline-none shadow-sm transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* CLOSED / TAM NGHI ALERT BANNER */}
      {storeSettings && storeSettings.is_currently_open === false && (
        <div
          onClick={() => showStoreClosedModal()}
          className="p-4 sm:p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100/70 dark:hover:bg-rose-900/40 border-2 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-black text-lg shrink-0">
              🔴
            </div>
            <div>
              <h4 className="font-black text-sm sm:text-base text-rose-700 dark:text-rose-300">
                Bếp Việt Hiện Đang Tạm Nghỉ (Giờ mở cửa: {storeSettings.open_time || '08:00'} - {storeSettings.close_time || '23:00'})
              </h4>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                Bạn vẫn có thể xem món, thêm vào giỏ hàng và chọn giờ giao trước. Bấm vào đây để xem chi tiết.
              </p>
            </div>
          </div>
          <span className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shrink-0">
            Xem Thông Báo Quán
          </span>
        </div>
      )}

      {/* Category Horizontal Scrolling Tabs */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => handleCategorySelect('all')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all duration-200 shrink-0 ${
            selectedCategory === 'all'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-orange-500/25 scale-102'
              : 'bg-white dark:bg-[#141824] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-amber-400'
          }`}
        >
          <span>🍜</span>
          <span>Tất Cả Món</span>
        </button>

        {/* Favorites Tab */}
        <button
          onClick={() => handleCategorySelect('favorites')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all duration-200 shrink-0 ${
            selectedCategory === 'favorites'
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/25 scale-102'
              : 'bg-white dark:bg-[#141824] text-rose-500 border border-rose-200 dark:border-rose-900/40 hover:border-rose-400'
          }`}
        >
          <Heart className={`w-4 h-4 ${selectedCategory === 'favorites' ? 'fill-white' : 'fill-rose-500'}`} />
          <span>Món Yêu Thích ({favorites.length})</span>
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategorySelect(cat.slug)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all duration-200 shrink-0 ${
              selectedCategory === cat.slug
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-orange-500/25 scale-102'
                : 'bg-white dark:bg-[#141824] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-amber-400'
            }`}
          >
            <span>{cat.icon || '🍲'}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Smart Quick Filters & Sorters */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#12151E] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Lọc nhanh:
            </span>

            <button
              onClick={() => setQuickFilter(quickFilter === 'bestseller' ? 'all' : 'bestseller')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition ${
                quickFilter === 'bestseller'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Bán Chạy Nhất</span>
            </button>

            <button
              onClick={() => setQuickFilter(quickFilter === 'discount' ? 'all' : 'discount')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition ${
                quickFilter === 'discount'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-rose-500" />
              <span>Đang Giảm Giá ⚡</span>
            </button>

            <button
              onClick={() => setQuickFilter(quickFilter === 'spicy' ? 'all' : 'spicy')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition ${
                quickFilter === 'spicy'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span>Món Cay Sa Tế 🌶️</span>
            </button>

            <button
              onClick={() => setQuickFilter(quickFilter === 'toprated' ? 'all' : 'toprated')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition ${
                quickFilter === 'toprated'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span>Đánh Giá Cao ⭐</span>
            </button>
          </div>

          {/* Price & Sort Selectors */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Price Range Filter */}
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="all">💰 Mọi Mức Giá</option>
              <option value="under35">Dưới 35.000đ</option>
              <option value="35to60">35.000đ - 60.000đ</option>
              <option value="above60">Trên 60.000đ</option>
            </select>

            {/* Sorter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="default">Sắp xếp: Mặc Định</option>
              <option value="price_asc">Giá: Thấp đến Cao 📈</option>
              <option value="price_desc">Giá: Cao đến Thấp 📉</option>
              <option value="rating">Đánh Giá: Cao Nhất ⭐</option>
              <option value="popular">Bán Chạy Nhất 🔥</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Food Items */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#141824] rounded-3xl p-4 space-y-3 border border-slate-100 dark:border-slate-800 animate-pulse"
            >
              <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-800 rounded-2xl" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2" />
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredFoods.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredFoods.map((food) => (
            <FoodCard
              key={food.id}
              food={food}
              onOpenDetail={(f) => setSelectedFood(f)}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-[#141824] rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 flex items-center justify-center text-3xl mx-auto">
            {selectedCategory === 'favorites' ? '❤️' : '🔍'}
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            {selectedCategory === 'favorites'
              ? 'Chưa có món yêu thích nào'
              : 'Không tìm thấy món ăn phù hợp'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {selectedCategory === 'favorites'
              ? 'Hãy nhấn biểu tượng trái tim ❤️ trên các món ăn để lưu vào danh sách yêu thích và đặt lại nhanh chóng!'
              : 'Hãy thử tìm kiếm với từ khóa khác hoặc bỏ các bộ lọc để xem toàn bộ thực đơn nhé.'}
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
              setPriceFilter('all');
              setQuickFilter('all');
              setSortBy('default');
            }}
            className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition"
          >
            Xem Tất Cả Thực Đơn
          </button>
        </div>
      )}

      {/* Dish Detail Modal */}
      {selectedFood && (
        <FoodDetailModal
          food={selectedFood}
          onClose={() => setSelectedFood(null)}
        />
      )}
    </div>
  );
}
