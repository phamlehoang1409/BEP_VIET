import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Upload,
  Link as LinkIcon,
  Check,
  X,
  AlertCircle,
  Clock,
  Flame,
  Star,
  DollarSign
} from 'lucide-react';
import {
  getFoods,
  getCategories,
  createFood,
  updateFood,
  updateFoodPrice,
  toggleFoodStatus,
  deleteFood,
  uploadImageFile
} from '../../api';
import { formatVND } from '../../utils/vietnamData';
import { useToast } from '../../components/Toast';

export default function FoodManagement() {
  const { showToast } = useToast();
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState(null); // null = Add, object = Edit

  // Form Fields
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(1);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [prepTime, setPrepTime] = useState(15);
  const [spicyLevel, setSpicyLevel] = useState(0);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  // Image upload type: 'url' or 'file'
  const [imageType, setImageType] = useState('url');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Quick price editing state
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [quickPrice, setQuickPrice] = useState('');

  // Delete Confirm Modal
  const [deletingFood, setDeletingFood] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchFoods = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory && selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (search && search.trim()) {
        params.search = search.trim();
      }
      const [fRes, cRes] = await Promise.all([
        getFoods(params),
        getCategories()
      ]);
      if (fRes.success) setFoods(fRes.foods || []);
      if (cRes.success) setCategories(cRes.categories || []);
    } catch (err) {
      console.error(err);
      showToast('Lỗi tải danh sách món ăn', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchFoods, 200);
    return () => clearTimeout(timer);
  }, [selectedCategory, search]);

  // Open modal for Adding new dish
  const handleOpenAddModal = () => {
    setEditingFood(null);
    setName('');
    setCategoryId(categories[0]?.id || 1);
    setDescription('');
    setPrice('');
    setOriginalPrice('');
    setImageUrl('');
    setPrepTime(15);
    setSpicyLevel(0);
    setIsFeatured(false);
    setIsAvailable(true);
    setImageType('url');
    setIsModalOpen(true);
  };

  // Open modal for Editing dish
  const handleOpenEditModal = (food) => {
    setEditingFood(food);
    setName(food.name);
    setCategoryId(food.category_id);
    setDescription(food.description || '');
    setPrice(food.price.toString());
    setOriginalPrice(food.original_price ? food.original_price.toString() : '');
    setImageUrl(food.image || '');
    setPrepTime(food.prep_time || 15);
    setSpicyLevel(food.spicy_level || 0);
    setIsFeatured(food.is_featured === 1);
    setIsAvailable(food.is_available === 1);
    setImageType('url');
    setIsModalOpen(true);
  };

  // Handle direct file upload via multer
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await uploadImageFile(file);
      if (res.success && res.url) {
        setImageUrl(res.url);
        showToast('Tải ảnh lên thành công!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Lỗi tải ảnh lên', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  // Save dish (Create or Update)
  const handleSaveFood = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!name.trim()) {
      showToast('Vui lòng nhập tên món ăn', 'error');
      return;
    }
    if (!price || Number(price) <= 0) {
      showToast('Vui lòng nhập giá hợp lệ lớn hơn 0', 'error');
      return;
    }
    if (!imageUrl.trim()) {
      showToast('Vui lòng cung cấp link ảnh hoặc tải ảnh lên từ máy', 'error');
      return;
    }

    const payload = {
      name: name.trim(),
      category_id: Number(categoryId),
      description: description.trim(),
      price: Number(price),
      original_price: originalPrice ? Number(originalPrice) : null,
      image: imageUrl.trim(),
      prep_time: Number(prepTime),
      spicy_level: Number(spicyLevel),
      is_featured: isFeatured ? 1 : 0,
      is_available: isAvailable ? 1 : 0
    };

    setSubmitting(true);
    try {
      if (editingFood) {
        await updateFood(editingFood.id, payload);
        showToast(`Đã cập nhật món "${name}" thành công!`, 'success');
      } else {
        await createFood(payload);
        showToast(`Đã thêm món "${name}" vào thực đơn!`, 'success');
      }
      setIsModalOpen(false);
      fetchFoods();
    } catch (err) {
      showToast(err.message || 'Có lỗi xảy ra', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick edit price
  const handleSaveQuickPrice = async (foodId) => {
    if (!quickPrice || Number(quickPrice) <= 0) {
      showToast('Giá tiền không hợp lệ', 'error');
      return;
    }
    try {
      await updateFoodPrice(foodId, Number(quickPrice));
      showToast('Đã cập nhật giá mới!', 'success');
      setEditingPriceId(null);
      fetchFoods();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Toggle stock availability
  const handleToggleStock = async (foodId) => {
    try {
      const res = await toggleFoodStatus(foodId);
      showToast(res.message, 'success');
      fetchFoods();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Delete dish
  const handleDeleteFood = async () => {
    if (!deletingFood) return;
    try {
      await deleteFood(deletingFood.id);
      showToast(`Đã xóa món "${deletingFood.name}"!`, 'success');
      setDeletingFood(null);
      fetchFoods();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Quản Lý Món Ăn Bếp Việt
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Thêm mới, sửa thông tin, đổi giá tiền, dán link ảnh hoặc tải ảnh từ máy tính
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm shadow-xl shadow-orange-500/30 active:scale-95 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Thêm Món Mới</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800/80 p-4 rounded-3xl border border-slate-700/60 shadow-xl">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Tìm theo tên món ăn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-orange-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>

        {/* Categories pills */}
        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Tất cả
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.slug)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === c.slug
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Foods Table */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-700">
              <tr>
                <th className="py-4 px-5">Món Ăn</th>
                <th className="py-4 px-4">Danh Mục</th>
                <th className="py-4 px-4">Giá Bán</th>
                <th className="py-4 px-4">Đã Bán</th>
                <th className="py-4 px-4">Trạng Thái</th>
                <th className="py-4 px-5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    Đang tải dữ liệu thực đơn...
                  </td>
                </tr>
              ) : foods.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    Không tìm thấy món ăn nào.
                  </td>
                </tr>
              ) : (
                foods.map((food) => (
                  <tr key={food.id} className="hover:bg-slate-700/30 transition">
                    {/* Food Info & Thumbnail */}
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={food.image}
                          alt={food.name}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
                          }}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-900"
                        />
                        <div>
                          <h4 className="font-extrabold text-sm text-white">{food.name}</h4>
                          <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">
                            {food.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 font-semibold text-[11px]">
                        {food.category_name || 'Món chính'}
                      </span>
                    </td>

                    {/* Price & Quick Edit */}
                    <td className="py-3 px-4">
                      {editingPriceId === food.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={quickPrice}
                            onChange={(e) => setQuickPrice(e.target.value)}
                            className="w-24 px-2 py-1 rounded-lg bg-slate-900 border border-orange-500 text-white text-xs font-bold"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveQuickPrice(food.id)}
                            className="p-1 rounded-lg bg-emerald-600 text-white"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingPriceId(null)}
                            className="p-1 rounded-lg bg-slate-700 text-slate-300"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingPriceId(food.id);
                            setQuickPrice(food.price.toString());
                          }}
                          className="group cursor-pointer flex items-center gap-1.5"
                          title="Bấm vào để đổi giá nhanh"
                        >
                          <span className="font-extrabold text-sm text-orange-400">
                            {formatVND(food.price)}
                          </span>
                          <Edit2 className="w-3 h-3 text-slate-500 group-hover:text-orange-400 transition" />
                        </div>
                      )}
                    </td>

                    {/* Sales count */}
                    <td className="py-3 px-4">
                      <span className="text-slate-300 font-bold">{food.sales_count}</span>
                    </td>

                    {/* Availability toggle */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStock(food.id)}
                        className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition ${
                          food.is_available === 1
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {food.is_available === 1 ? 'Còn Món' : 'Hết Món'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(food)}
                          className="p-2 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Chỉnh sửa món ăn"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingFood(food)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                          title="Xóa món ăn"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD / EDIT DISH */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-slate-900 rounded-3xl border border-slate-700 p-6 sm:p-8 text-white shadow-2xl my-8 animate-scale-up space-y-6"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-black text-white">
                  {editingFood ? 'Chỉnh Sửa Món Ăn' : 'Thêm Món Ăn Mới'}
                </h3>
                <p className="text-xs text-slate-400">
                  Cập nhật giá, ảnh URL hoặc tải file ảnh trực tiếp lên hệ thống
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFood} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Dish Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Tên Món Ăn <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Cơm Tấm Sườn Nướng"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-sm font-semibold outline-none focus:border-orange-500"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Danh Mục
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-sm font-semibold outline-none focus:border-orange-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price & Original Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Giá Bán Hiện Tại (VND) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="55000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-sm font-semibold text-orange-400 outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Giá Gốc (Trước khi giảm - tùy chọn)
                  </label>
                  <input
                    type="number"
                    placeholder="65000"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-sm font-semibold text-slate-400 outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* IMAGE SELECTION TABS: URL vs DIRECT FILE UPLOAD */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
                    <span>Hình Ảnh Món Ăn</span> <span className="text-rose-400">*</span>
                  </label>

                  {/* Mode switcher */}
                  <div className="flex gap-1 bg-slate-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setImageType('url')}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition ${
                        imageType === 'url' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Link URL</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageType('file')}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition ${
                        imageType === 'file' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Tải Từ Máy Tính</span>
                    </button>
                  </div>
                </div>

                {/* Tab 1: Image URL input */}
                {imageType === 'url' ? (
                  <div>
                    <input
                      type="url"
                      placeholder="Dán link ảnh (hỗ trợ cả link Google Images, Unsplash, CDN...)"
                      value={imageUrl}
                      onChange={(e) => {
                        let val = e.target.value.trim();
                        if (val.includes('google.com/imgres') || val.includes('google.com/url')) {
                          try {
                            const parsed = new URL(val);
                            const realImg = parsed.searchParams.get('imgurl') || parsed.searchParams.get('url');
                            if (realImg) val = decodeURIComponent(realImg);
                          } catch (err) {}
                        }
                        setImageUrl(val);
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono outline-none focus:border-orange-500"
                    />
                  </div>
                ) : (
                  /* Tab 2: Direct File Upload */
                  <div>
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-700 hover:border-orange-500 rounded-2xl cursor-pointer bg-slate-900 transition">
                      <Upload className="w-8 h-8 text-orange-400 mb-2" />
                      <span className="text-xs font-bold text-slate-300">
                        {uploadingImage ? 'Đang tải file lên...' : 'Nhấp để chọn ảnh từ máy tính'}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-1">
                        Hỗ trợ JPG, PNG, WEBP, GIF (Tối đa 10MB)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                )}

                {/* Live Image Preview */}
                {imageUrl && (
                  <div className="flex items-center gap-3 pt-2">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover border border-slate-700"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
                      }}
                    />
                    <div className="text-xs text-slate-400 truncate flex-1">
                      <span className="text-emerald-400 font-bold block">✓ Ảnh xem trước hợp lệ</span>
                      <span className="font-mono text-[10px] truncate block">{imageUrl}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                  Mô Tả Hương Vị & Thành Phần
                </label>
                <textarea
                  rows="3"
                  placeholder="Mô tả nguyên liệu tươi sạch, gia vị đậm đà..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-xs outline-none focus:border-orange-500"
                />
              </div>

              {/* Details: Prep time, spicy, featured */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Thời Gian Nấu (Phút)
                  </label>
                  <input
                    type="number"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Độ Cay
                  </label>
                  <select
                    value={spicyLevel}
                    onChange={(e) => setSpicyLevel(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold"
                  >
                    <option value="0">0 - Không cay</option>
                    <option value="1">1 - Cay nhẹ</option>
                    <option value="2">2 - Cay vừa</option>
                    <option value="3">3 - Siêu cay</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2 bg-slate-800 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="rounded text-orange-500 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-amber-300">Món Nổi Bật</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-extrabold shadow-lg shadow-orange-500/30 transition flex items-center gap-2"
                >
                  {submitting && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{editingFood ? 'Lưu Thay Đổi' : 'Tạo Món Ăn'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingFood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-3xl max-w-sm w-full text-center space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-white">Xác nhận xóa món ăn</h3>
            <p className="text-xs text-slate-400">
              Bạn có chắc chắn muốn xóa món <strong className="text-white">"{deletingFood.name}"</strong> khỏi thực đơn SQL không?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeletingFood(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteFood}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
