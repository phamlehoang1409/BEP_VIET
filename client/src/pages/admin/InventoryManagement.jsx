import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  Warehouse,
  FileText,
  Trash2,
  Edit2,
  PackagePlus,
  Layers,
  ArrowRight,
  ShieldAlert,
  History,
  Sparkles,
  X
} from 'lucide-react';
import {
  getInventorySummary,
  getIngredients,
  addIngredient,
  updateIngredient,
  restockIngredient,
  deleteIngredient,
  getRecipes,
  saveRecipe,
  getInventoryLogs,
  getFoods
} from '../../api';
import { formatVND } from '../../utils/vietnamData';
import { useToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';

const CATEGORIES = [
  'Tất Cả',
  'Mì & Tinh bột',
  'Thịt & Hải sản',
  'Trứng & Đạm',
  'Đồ Ăn Vặt',
  'Trà & Giải Khát',
  'Bao Bì & Đóng Gói',
  'Khác'
];

export default function InventoryManagement() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'recipes' | 'logs'
  const [ingredients, setIngredients] = useState([]);
  const [summary, setSummary] = useState(null);
  const [recipes, setRecipes] = useState({});
  const [foods, setFoods] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Tất Cả');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [restockingIngredient, setRestockingIngredient] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockNote, setRestockNote] = useState('');
  const [deletingIngredient, setDeletingIngredient] = useState(null);

  // Form states for Add/Edit
  const [formName, setFormName] = useState('');
  const [formUnit, setFormUnit] = useState('gram');
  const [formStock, setFormStock] = useState('100');
  const [formMinThreshold, setFormMinThreshold] = useState('20');
  const [formCostPrice, setFormCostPrice] = useState('100');
  const [formSupplier, setFormSupplier] = useState('');
  const [formCategory, setFormCategory] = useState('Mì & Tinh bột');

  // Recipe edit modal
  const [editingRecipeFood, setEditingRecipeFood] = useState(null);
  const [recipeIngredientsList, setRecipeIngredientsList] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, ingRes, recRes, foodRes, logRes] = await Promise.all([
        getInventorySummary().catch(() => ({ success: false })),
        getIngredients().catch(() => ({ success: false })),
        getRecipes().catch(() => ({ success: false })),
        getFoods().catch(() => ({ success: false })),
        getInventoryLogs().catch(() => ({ success: false }))
      ]);

      if (sumRes.success && sumRes.summary) setSummary(sumRes.summary);
      if (ingRes.success && ingRes.ingredients) setIngredients(ingRes.ingredients);
      if (recRes.success && recRes.recipes) setRecipes(recRes.recipes);
      if (foodRes.success && foodRes.foods) setFoods(foodRes.foods);
      if (logRes.success && logRes.logs) setLogs(logRes.logs);
    } catch (err) {
      console.error(err);
      showToast('Lỗi tải dữ liệu kho nguyên liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingIngredient(null);
    setFormName('');
    setFormUnit('gram');
    setFormStock('1000');
    setFormMinThreshold('200');
    setFormCostPrice('150');
    setFormSupplier('');
    setFormCategory('Mì & Tinh bột');
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (ing) => {
    setEditingIngredient(ing);
    setFormName(ing.name);
    setFormUnit(ing.unit);
    setFormStock(ing.stock_quantity.toString());
    setFormMinThreshold(ing.min_threshold.toString());
    setFormCostPrice(ing.cost_price ? ing.cost_price.toString() : '0');
    setFormSupplier(ing.supplier || '');
    setFormCategory(ing.category || 'Mì & Tinh bột');
    setIsAddModalOpen(true);
  };

  const handleSaveIngredient = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Vui lòng nhập tên nguyên liệu', 'error');
      return;
    }

    try {
      const payload = {
        name: formName.trim(),
        unit: formUnit.trim(),
        stock_quantity: Number(formStock) || 0,
        min_threshold: Number(formMinThreshold) || 10,
        cost_price: Number(formCostPrice) || 0,
        supplier: formSupplier.trim(),
        category: formCategory
      };

      if (editingIngredient) {
        const res = await updateIngredient(editingIngredient.id, payload);
        if (res.success) {
          showToast(`Đã cập nhật nguyên liệu "${payload.name}"!`, 'success');
        }
      } else {
        const res = await addIngredient(payload);
        if (res.success) {
          showToast(`Đã thêm nguyên liệu "${payload.name}" thành công!`, 'success');
        }
      }

      setIsAddModalOpen(false);
      fetchData();
    } catch (err) {
      showToast('Lỗi khi lưu nguyên liệu', 'error');
    }
  };

  const handleExecuteRestock = async (e) => {
    e.preventDefault();
    if (!restockingIngredient || !restockQty || Number(restockQty) <= 0) {
      showToast('Vui lòng nhập số lượng nhập kho hợp lệ', 'error');
      return;
    }

    try {
      const res = await restockIngredient(
        restockingIngredient.id,
        Number(restockQty),
        restockNote.trim()
      );
      if (res.success) {
        showToast(res.message || 'Nhập kho thành công!', 'success');
        setRestockingIngredient(null);
        setRestockQty('');
        setRestockNote('');
        fetchData();
      }
    } catch (err) {
      showToast('Lỗi nhập kho', 'error');
    }
  };

  const handleExecuteDelete = async () => {
    if (!deletingIngredient) return;
    try {
      const res = await deleteIngredient(deletingIngredient.id);
      if (res.success) {
        showToast(res.message || 'Đã xóa nguyên liệu!', 'success');
        setDeletingIngredient(null);
        fetchData();
      }
    } catch (err) {
      showToast('Lỗi xóa nguyên liệu', 'error');
    }
  };

  // Recipe editing helpers
  const handleOpenRecipeEditor = (food) => {
    setEditingRecipeFood(food);
    const existingRecipe = recipes[food.name] || [];
    setRecipeIngredientsList(
      existingRecipe.map((r) => ({
        ingredient_id: r.ingredient_id,
        quantity_required: r.quantity_required,
        name: r.name || ''
      }))
    );
  };

  const handleAddIngredientToRecipe = () => {
    if (ingredients.length === 0) return;
    const firstIng = ingredients[0];
    setRecipeIngredientsList((prev) => [
      ...prev,
      {
        ingredient_id: firstIng.id,
        quantity_required: 1,
        name: firstIng.name
      }
    ]);
  };

  const handleRemoveIngredientFromRecipe = (index) => {
    setRecipeIngredientsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveRecipe = async () => {
    if (!editingRecipeFood) return;
    try {
      const res = await saveRecipe(editingRecipeFood.name, recipeIngredientsList);
      if (res.success) {
        showToast(`Đã lưu định lượng công thức cho món "${editingRecipeFood.name}"!`, 'success');
        setEditingRecipeFood(null);
        fetchData();
      }
    } catch (err) {
      showToast('Lỗi lưu công thức món ăn', 'error');
    }
  };

  // Filtered ingredients
  const filteredIngredients = ingredients.filter((ing) => {
    const matchSearch =
      ing.name.toLowerCase().includes(search.toLowerCase()) ||
      (ing.supplier && ing.supplier.toLowerCase().includes(search.toLowerCase()));
    const matchCat = categoryFilter === 'Tất Cả' || ing.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-8 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Warehouse className="w-7 h-7 text-amber-400" />
            <span>Quản Lý Kho & Định Lượng Món Ăn</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Theo dõi tồn kho nguyên liệu, tự động trừ kho khi có đơn và cảnh báo hết món
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 text-xs font-black transition shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
            <span>Thêm Nguyên Liệu</span>
          </button>

          <button
            onClick={fetchData}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1C2030] to-[#121522] border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tổng Nguyên Liệu
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2">
            {ingredients.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Mặt hàng trong kho</div>
        </div>

        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1C2030] to-[#121522] border border-amber-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Sắp Hết Hàng (Cảnh Báo)
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-2">
            {summary?.lowStockCount || 0}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">Chạm ngưỡng tối thiểu</div>
        </div>

        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1C2030] to-[#121522] border border-rose-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
              Đã Hết Hàng (Tồn = 0)
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-300 mt-2">
            {summary?.outOfStockCount || 0}
          </div>
          <div className="text-[11px] text-rose-400/80 mt-1">Món liên quan tự động ẩn</div>
        </div>

        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1C2030] to-[#121522] border border-emerald-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Giá Trị Vốn Kho
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-300 mt-2">
            {formatVND(summary?.totalInventoryValue || 0)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Ước tính giá trị vốn nhập</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-[#121522] p-1.5 rounded-2xl border border-slate-800 max-w-lg">
        <button
          onClick={() => setActiveTab('stock')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
            activeTab === 'stock'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Tồn Kho Nguyên Liệu ({ingredients.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('recipes')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
            activeTab === 'recipes'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Định Lượng Món Ăn</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
            activeTab === 'logs'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Lịch Sử Kho ({logs.length})</span>
        </button>
      </div>

      {/* TAB 1: STOCK INGREDIENTS LIST */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="p-4 rounded-3xl bg-[#121522] border border-slate-800 shadow-xl flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Tìm tên nguyên liệu, nhà cung cấp..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400 transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    categoryFilter === cat
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="p-6 rounded-3xl bg-[#121522] border border-slate-800 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-black tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Nguyên Liệu</th>
                    <th className="p-3.5">Danh Mục</th>
                    <th className="p-3.5">Tồn Kho Hiện Tại</th>
                    <th className="p-3.5">Ngưỡng Tối Thiểu</th>
                    <th className="p-3.5">Giá Vốn / Đơn Vị</th>
                    <th className="p-3.5">Trạng Thái</th>
                    <th className="p-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredIngredients.map((ing) => {
                    const isOutOfStock = ing.stock_quantity === 0;
                    const isLowStock = ing.stock_quantity <= ing.min_threshold && !isOutOfStock;
                    const percent = Math.min(100, Math.round((ing.stock_quantity / (ing.min_threshold * 2.5)) * 100));

                    return (
                      <tr key={ing.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5 font-bold text-white">
                          <div>{ing.name}</div>
                          {ing.supplier && (
                            <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                              NCC: {ing.supplier}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                            {ing.category || 'Khác'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-baseline gap-1 font-black text-sm text-white">
                            <span>{ing.stock_quantity.toLocaleString('vi-VN')}</span>
                            <span className="text-xs text-amber-400 font-bold">{ing.unit}</span>
                          </div>
                          <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isOutOfStock
                                  ? 'bg-rose-500'
                                  : isLowStock
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-400 font-semibold">
                          {ing.min_threshold} {ing.unit}
                        </td>
                        <td className="p-3.5 font-bold text-emerald-400">
                          {formatVND(ing.cost_price || 0)} / {ing.unit}
                        </td>
                        <td className="p-3.5">
                          {isOutOfStock ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              🔴 Hết Hàng
                            </span>
                          ) : isLowStock ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                              ⚠️ Sắp Hết
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              ✅ Dồi Dào
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Restock Button */}
                            <button
                              onClick={() => {
                                setRestockingIngredient(ing);
                                setRestockQty('');
                                setRestockNote('');
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1 transition shadow-sm active:scale-95"
                              title="Nhập thêm hàng"
                            >
                              <PackagePlus className="w-3.5 h-3.5" />
                              <span>Nhập Kho</span>
                            </button>

                            <button
                              onClick={() => handleOpenEdit(ing)}
                              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
                              title="Chỉnh sửa thông tin"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setDeletingIngredient(ing)}
                              className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition border border-slate-700"
                              title="Xóa nguyên liệu"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RECIPES & PORTIONS */}
      {activeTab === 'recipes' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-300 flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              <strong>Cơ chế tự động:</strong> Mỗi khi có đơn hàng mới, hệ thống sẽ tự động trừ chính xác số lượng nguyên liệu theo công thức đã cấu hình dưới đây. Nếu nguyên liệu về 0, món ăn sẽ tự động chuyển sang <em>"Tạm hết món"</em>.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {foods.map((food) => {
              const recipeItems = recipes[food.name] || [];
              const estimatedCost = recipeItems.reduce((sum, item) => {
                const ing = ingredients.find((i) => i.id === item.ingredient_id);
                return sum + (ing ? (ing.cost_price || 0) * item.quantity_required : 0);
              }, 0);
              const marginPercent = food.price > 0
                ? Math.round(((food.price - estimatedCost) / food.price) * 100)
                : 0;

              return (
                <div
                  key={food.id}
                  className="p-5 rounded-3xl bg-[#121522] border border-slate-800 shadow-xl space-y-4 hover:border-amber-500/30 transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={food.image}
                          alt={food.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-700"
                        />
                        <div>
                          <h4 className="font-black text-sm text-white">{food.name}</h4>
                          <span className="text-xs font-bold text-amber-400">
                            Giá bán: {formatVND(food.price)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Lợi nhuận gộp</span>
                        <span className="text-xs font-black text-emerald-400">
                          {marginPercent}% ({formatVND(food.price - estimatedCost)})
                        </span>
                      </div>
                    </div>

                    {/* Ingredients Required List */}
                    <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Định lượng 1 phần ăn:
                      </div>
                      {recipeItems.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">
                          Chưa thiết lập công thức nguyên liệu
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {recipeItems.map((r, ri) => (
                            <span
                              key={ri}
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 font-medium"
                            >
                              • {r.name || r.ingredient_id}: <strong>{r.quantity_required}</strong>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenRecipeEditor(food)}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs transition border border-slate-700 flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Chỉnh Sửa Công Thức Định Lượng</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="p-6 rounded-3xl bg-[#121522] border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            Lịch Sử Biến Động Kho Nguyên Liệu
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-black tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Thời Gian</th>
                  <th className="p-3">Hành Động</th>
                  <th className="p-3">Chi Tiết Biến Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-slate-500">
                      Chưa có lịch sử biến động nào được ghi nhận.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleString('vi-VN')}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] ${
                            log.type === 'ORDER_DEDUCT'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : log.type === 'RESTOCK'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {log.type}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-white">
                        {log.description}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Ingredient Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div
            className="relative w-full max-w-md bg-[#121522] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 flex items-center justify-between">
              <h3 className="font-black text-base">
                {editingIngredient ? 'Chỉnh Sửa Nguyên Liệu' : 'Thêm Nguyên Liệu Mới'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-black/15 hover:bg-black/25 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveIngredient} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Tên nguyên liệu:</label>
                <input
                  type="text"
                  placeholder="VD: Thịt Bò Mỹ, Vắt Mì Indomie, Trứng Gà..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Đơn vị tính:</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-amber-400"
                  >
                    <option value="gram">gram (g)</option>
                    <option value="kg">kilogram (kg)</option>
                    <option value="gói">gói</option>
                    <option value="quả">quả</option>
                    <option value="chiếc">chiếc</option>
                    <option value="ml">ml</option>
                    <option value="bộ">bộ / hộp</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Danh mục:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-amber-400"
                  >
                    {CATEGORIES.filter((c) => c !== 'Tất Cả').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Số lượng tồn ban đầu:</label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Ngưỡng cảnh báo:</label>
                  <input
                    type="number"
                    value={formMinThreshold}
                    onChange={(e) => setFormMinThreshold(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Giá vốn nhập (VNĐ):</label>
                  <input
                    type="number"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Nhà cung cấp:</label>
                  <input
                    type="text"
                    placeholder="VD: Cty Thực Phẩm..."
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black transition shadow-md"
                >
                  {editingIngredient ? 'Cập Nhật' : 'Thêm Vào Kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockingIngredient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div
            className="relative w-full max-w-sm bg-[#121522] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-base">Nhập Thêm Hàng Vào Kho</h3>
                <p className="text-xs text-emerald-100">{restockingIngredient.name}</p>
              </div>
              <button
                onClick={() => setRestockingIngredient(null)}
                className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteRestock} className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Tồn kho hiện tại:</span>
                <span className="font-black text-white">
                  {restockingIngredient.stock_quantity} {restockingIngredient.unit}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Số lượng nhập thêm ({restockingIngredient.unit}):
                </label>
                <input
                  type="number"
                  placeholder="VD: 50, 1000..."
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-emerald-400 text-sm font-bold"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Ghi chú (nhà xe, hóa đơn...):</label>
                <input
                  type="text"
                  placeholder="VD: Hàng về ca sáng, nhập từ lò..."
                  value={restockNote}
                  onChange={(e) => setRestockNote(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockingIngredient(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black transition shadow-md"
                >
                  Xác Nhận Nhập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recipe Edit Modal */}
      {editingRecipeFood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div
            className="relative w-full max-w-lg bg-[#121522] rounded-3xl overflow-hidden shadow-2xl border border-slate-800 animate-scale-up flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-black text-base">Cấu Hình Định Lượng Món Ăn</h3>
                <p className="text-xs font-bold text-slate-900/80">{editingRecipeFood.name}</p>
              </div>
              <button
                onClick={() => setEditingRecipeFood(null)}
                className="w-8 h-8 rounded-full bg-black/15 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-300">Nguyên liệu cần cho 1 phần ăn:</label>
                <button
                  type="button"
                  onClick={handleAddIngredientToRecipe}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-bold flex items-center gap-1 border border-amber-500/30"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm nguyên liệu</span>
                </button>
              </div>

              {recipeIngredientsList.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800">
                  Chưa có nguyên liệu nào. Bấm nút "+ Thêm nguyên liệu" ở trên để gán.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recipeIngredientsList.map((item, index) => {
                    const ingObj = ingredients.find((i) => i.id === item.ingredient_id);
                    return (
                      <div
                        key={index}
                        className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2.5"
                      >
                        <select
                          value={item.ingredient_id}
                          onChange={(e) => {
                            const newId = e.target.value;
                            const targetIng = ingredients.find((i) => i.id === newId);
                            setRecipeIngredientsList((prev) =>
                              prev.map((r, i) =>
                                i === index
                                  ? {
                                      ...r,
                                      ingredient_id: newId,
                                      name: targetIng ? targetIng.name : ''
                                    }
                                  : r
                              )
                            );
                          }}
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none"
                        >
                          {ingredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name} ({ing.unit})
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1.5 w-32">
                          <input
                            type="number"
                            value={item.quantity_required}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setRecipeIngredientsList((prev) =>
                                prev.map((r, i) =>
                                  i === index ? { ...r, quantity_required: val } : r
                                )
                              );
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none text-center font-bold"
                          />
                          <span className="text-slate-400 text-[11px] shrink-0">
                            {ingObj ? ingObj.unit : ''}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveIngredientFromRecipe(index)}
                          className="p-2 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800 flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEditingRecipeFood(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition text-xs"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveRecipe}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black transition shadow-md text-xs"
              >
                Lưu Công Thức
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deletingIngredient}
        title="Xóa Nguyên Liệu?"
        message={`Quý khách có chắc chắn muốn xóa nguyên liệu "${deletingIngredient?.name}" khỏi kho không?`}
        confirmText="Xóa Ngay"
        cancelText="Hủy"
        confirmType="danger"
        onConfirm={handleExecuteDelete}
        onCancel={() => setDeletingIngredient(null)}
      />
    </div>
  );
}
