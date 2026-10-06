import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, UtensilsCrossed, AlertCircle, Clock } from 'lucide-react';
import { getFoods, getCategories } from '../api';
import { useCart } from '../context/CartContext';
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
  const [sortBy, setSortBy] = useState('default');
  const [selectedFood, setSelectedFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const { storeSettings, showStoreClosedModal } = useCart();

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
        if (selectedCategory !== 'all') params.category = selectedCategory;
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 pb-24 md:pb-12 space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
              Giao Hỏa Tốc Nội Thành Hà Nội
            </span>
            <a href="tel:0353859726" className="text-[11px] font-bold text-amber-600 hover:underline">
              📞 Hotline: 0353859726
            </a>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Thực Đơn Mì Indomie & Đồ Ăn Vặt Bếp Việt
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Mì Indomie trộn sốt cay ngọt, đồ ăn vặt chiên giòn, topping phong phú và nước giải khát mát lạnh
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Tìm theo tên món hoặc mô tả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#141824] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 text-sm outline-none shadow-sm transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
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
              <p className="text-xs text-rose-800/80 dark:text-rose-400 mt-0.5">
                Quý khách có thể xem trước thực đơn. Hệ thống sẽ mở nhận đơn ngay khi bắt đầu giờ phục vụ!
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
      )}

      {/* Filter and Sorting Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#12151E] p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <button
            onClick={() => handleCategorySelect('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md shadow-orange-500/20'
                : 'bg-slate-50 dark:bg-[#161922] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            🍽️ Tất cả
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => handleCategorySelect(c.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === c.slug
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-md shadow-orange-500/20'
                  : 'bg-slate-50 dark:bg-[#161922] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-[#161922] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-amber-500"
          >
            <option value="default">Sắp xếp: Mặc định</option>
            <option value="popular">Bán chạy nhất</option>
            <option value="rating">Đánh giá cao nhất</option>
            <option value="price_asc">Giá: Thấp đến cao</option>
            <option value="price_desc">Giá: Cao đến thấp</option>
          </select>
        </div>
      </div>

      {/* Dishes Count */}
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
        Đang hiển thị <strong className="text-slate-800 dark:text-amber-400">{foods.length}</strong> món ăn ngon miệng
      </div>

      {/* Foods Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-3">
              <div className="w-full aspect-[4/3] rounded-2xl shimmer" />
              <div className="h-4 w-3/4 rounded shimmer" />
              <div className="h-4 w-1/2 rounded shimmer" />
            </div>
          ))}
        </div>
      ) : foods.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 mx-auto flex items-center justify-center">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Không tìm thấy món ăn phù hợp</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Thử tìm kiếm với từ khóa khác hoặc bấm nút bên dưới để xem lại tất cả món ăn.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="px-5 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition"
          >
            Xem toàn bộ món ăn
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {foods.map((food) => (
            <FoodCard key={food.id} food={food} onOpenDetail={setSelectedFood} />
          ))}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedFood && (
        <FoodDetailModal food={selectedFood} onClose={() => setSelectedFood(null)} />
      )}
    </div>
  );
}
