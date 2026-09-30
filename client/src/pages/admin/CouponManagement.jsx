import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Clock,
  DollarSign,
  Percent,
  Search,
  RotateCw,
  Gift
} from 'lucide-react';
import { getCoupons, createCoupon, deleteCoupon } from '../../api';
import { formatVND } from '../../utils/vietnamData';
import { useToast } from '../../components/Toast';

export default function CouponManagement() {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrder, setMinOrder] = useState('80000');
  const [maxDiscount, setMaxDiscount] = useState('40000');
  const [expiryDate, setExpiryDate] = useState('2027-12-31');
  const [description, setDescription] = useState('');

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await getCoupons();
      if (res.success && res.coupons) {
        setCoupons(res.coupons);
      }
    } catch (err) {
      console.error(err);
      showToast('Lỗi tải danh sách mã khuyến mãi', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleOpenAdd = () => {
    setCode('');
    setDiscountType('percent');
    setDiscountValue('20');
    setMinOrder('80000');
    setMaxDiscount('40000');
    setExpiryDate('2027-12-31');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!code.trim()) {
      showToast('Vui lòng nhập mã khuyến mãi', 'error');
      return;
    }
    if (!discountValue || Number(discountValue) <= 0) {
      showToast('Vui lòng nhập giá trị giảm hợp lệ', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: Number(discountValue),
        min_order: Number(minOrder) || 0,
        max_discount: discountType === 'percent' && maxDiscount ? Number(maxDiscount) : null,
        expiry_date: expiryDate,
        description: description.trim() || undefined,
        is_active: true
      };

      const res = await createCoupon(payload);
      if (res.success) {
        showToast(`Tạo mã "${payload.code}" thành công!`, 'success');
        setIsModalOpen(false);
        fetchCoupons();
      }
    } catch (err) {
      showToast(err.message || 'Lỗi tạo mã giảm giá', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (couponCode) => {
    if (!window.confirm(`Bạn có chắc muốn xóa mã giảm giá "${couponCode}"?`)) return;
    try {
      await deleteCoupon(couponCode);
      showToast(`Đã xóa mã "${couponCode}"!`, 'success');
      fetchCoupons();
    } catch (err) {
      showToast(err.message || 'Lỗi khi xóa mã', 'error');
    }
  };

  const copyCode = (text) => {
    navigator.clipboard?.writeText(text);
    showToast(`Đã sao chép mã "${text}" vào bộ nhớ tạm!`, 'info');
  };

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Gift className="w-8 h-8 text-amber-400" />
            <span>Quản Lý Mã Khuyến Mãi (Vouchers)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Tạo mã giảm giá theo %, trừ tiền trực tiếp hoặc hỗ trợ phí ship cho khách hàng Bếp Việt
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCoupons}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Làm mới</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Mã Mới</span>
          </button>
        </div>
      </div>

      {/* Search and Summary */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800/80 p-4 rounded-3xl border border-slate-700/60 shadow-xl">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Tìm theo mã hoặc mô tả..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>

        <div className="text-xs text-slate-400 font-semibold">
          Tổng cộng: <strong className="text-amber-400">{coupons.length}</strong> mã khuyến mãi
        </div>
      </div>

      {/* Coupons Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-slate-800/60 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-12 text-center text-slate-400 space-y-3">
          <Tag className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm">Chưa có mã khuyến mãi nào.</p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
          >
            Tạo Mã Đầu Tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCoupons.map((coupon) => (
            <div
              key={coupon.code}
              className="bg-gradient-to-br from-slate-900 to-slate-800/90 border border-amber-500/20 hover:border-amber-400/50 rounded-3xl p-5 shadow-xl transition-all duration-300 relative group flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 text-sm font-black tracking-wider uppercase flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      {coupon.code}
                    </span>
                    <button
                      onClick={() => copyCode(coupon.code)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                      title="Sao chép mã"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(coupon.code)}
                    className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 flex items-center justify-center transition"
                    title="Xóa mã này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-3 space-y-1.5">
                  <div className="text-lg font-black text-white flex items-center gap-1.5">
                    {coupon.discount_type === 'percent' ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <Percent className="w-4 h-4" /> Giảm {coupon.discount_value}%
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <DollarSign className="w-4 h-4" /> Giảm {formatVND(coupon.discount_value)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{coupon.description}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-700/60 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
                <span>Đơn tối thiểu: <strong className="text-slate-200">{formatVND(coupon.min_order)}</strong></span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  HSD: {coupon.expiry_date || 'Vô thời hạn'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/30 w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Tạo Mã Khuyến Mãi Mới</h3>
                  <p className="text-xs text-slate-400">Khách hàng có thể nhập mã này tại bước thanh toán</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">
                  Mã Giảm Giá (Code) *
                </label>
                <input
                  type="text"
                  placeholder="VD: INDOMIE20, HANOI15K, BEPVIETVIP"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 focus:border-amber-400 text-white font-mono text-sm uppercase outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">
                    Loại Giảm Giá
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none"
                  >
                    <option value="percent">Giảm theo % (Phần trăm)</option>
                    <option value="fixed">Giảm số tiền cố định (₫)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">
                    Giá Trị Giảm *
                  </label>
                  <input
                    type="number"
                    placeholder={discountType === 'percent' ? 'VD: 20 (%)' : 'VD: 20000 (₫)'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">
                    Đơn Tối Thiểu (₫)
                  </label>
                  <input
                    type="number"
                    placeholder="VD: 80000"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none"
                  />
                </div>

                {discountType === 'percent' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">
                      Giảm Tối Đa (₫)
                    </label>
                    <input
                      type="number"
                      placeholder="VD: 50000"
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">
                    Hạn Sử Dụng
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">
                    Ghi Chú / Mô Tả
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Giảm 20% đơn từ 100k"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 disabled:opacity-50 transition"
                >
                  {submitting ? 'Đang tạo...' : 'Kích Hoạt Mã'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
