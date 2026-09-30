import React, { useState, useEffect } from 'react';
import {
  Star,
  Eye,
  EyeOff,
  Trash2,
  Search,
  RefreshCw,
  Sparkles,
  BarChart3,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { getReviews, toggleReviewVisibility, deleteReview } from '../../api';
import { useToast } from '../../components/Toast';

export default function ReviewManagement() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [starFilter, setStarFilter] = useState('all'); // 'all', '5', '4', '3', '2', '1', 'hidden'
  const [deletingId, setDeletingId] = useState(null);
  const { showToast } = useToast();

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await getReviews();
      if (res.success) setReviews(res.reviews || []);
    } catch (err) {
      showToast('Lỗi tải danh sách đánh giá', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleToggle = async (id) => {
    try {
      const res = await toggleReviewVisibility(id);
      if (res.success) {
        setReviews(res.reviews);
        showToast('Đã cập nhật trạng thái hiển thị đánh giá!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Lỗi cập nhật hiển thị', 'error');
    }
  };

  const handleDelete = async (id, customerName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN đánh giá của khách hàng "${customerName || 'này'}" không? Thao tác này không thể hoàn tác.`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await deleteReview(id);
      if (res.success) {
        setReviews(res.reviews);
        showToast('Đã xóa vĩnh viễn đánh giá thành công!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi xóa đánh giá', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // 5-Star Breakdown Analytics
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / totalReviews).toFixed(1)
    : '5.0';

  const starCounts = {
    5: reviews.filter((r) => Number(r.rating) === 5).length,
    4: reviews.filter((r) => Number(r.rating) === 4).length,
    3: reviews.filter((r) => Number(r.rating) === 3).length,
    2: reviews.filter((r) => Number(r.rating) === 2).length,
    1: reviews.filter((r) => Number(r.rating) === 1).length
  };

  const starPercents = {
    5: totalReviews > 0 ? Math.round((starCounts[5] / totalReviews) * 100) : 0,
    4: totalReviews > 0 ? Math.round((starCounts[4] / totalReviews) * 100) : 0,
    3: totalReviews > 0 ? Math.round((starCounts[3] / totalReviews) * 100) : 0,
    2: totalReviews > 0 ? Math.round((starCounts[2] / totalReviews) * 100) : 0,
    1: totalReviews > 0 ? Math.round((starCounts[1] / totalReviews) * 100) : 0
  };

  // Filter & Search
  const filteredReviews = reviews.filter((r) => {
    // Star filter
    if (starFilter === 'hidden') {
      if (!r.is_hidden) return false;
    } else if (starFilter !== 'all') {
      if (Number(r.rating) !== Number(starFilter)) return false;
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = (r.customer_name || '').toLowerCase().includes(q);
      const matchPhone = (r.customer_phone || '').includes(q);
      const matchOrder = (r.order_id || '').toLowerCase().includes(q);
      const matchComment = (r.comment || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchOrder || matchComment;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
              ⭐ Đánh Giá Thực Khách
            </span>
            <span className="text-xs text-slate-400">• Thang điểm 5 Sao</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Quản Lý & Phân Tích Đánh Giá
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Theo dõi tỷ lệ hài lòng của khách hàng, quản trị và xóa bỏ phản hồi không hợp lệ
          </p>
        </div>

        <button
          onClick={fetchReviews}
          className="self-start flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 shadow-md"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm Mới</span>
        </button>
      </div>

      {/* 5-STAR ANALYTICS DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 bg-gradient-to-br from-[#161922] via-[#1a1f2c] to-[#12141c] p-6 rounded-3xl border border-amber-500/20 shadow-xl">
        {/* Left: Overall Score */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 border-b lg:border-b-0 lg:border-r border-slate-700/60 text-center space-y-2">
          <span className="text-xs font-bold text-amber-400/80 uppercase tracking-widest">
            Điểm Đánh Giá Trung Bình
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl sm:text-6xl font-black text-white tracking-tight bg-gradient-to-r from-amber-300 via-amber-200 to-orange-400 bg-clip-text text-transparent">
              {averageRating}
            </span>
            <span className="text-xl font-bold text-slate-400">/ 5.0</span>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(Number(averageRating))
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-slate-700 text-slate-700'
                }`}
              />
            ))}
          </div>
          <p className="text-xs font-semibold text-slate-400 pt-1">
            Dựa trên tổng số <strong className="text-amber-300">{totalReviews}</strong> lượt đánh giá
          </p>
        </div>

        {/* Right: 5-Star Breakdown Progress Bars */}
        <div className="lg:col-span-8 flex flex-col justify-center space-y-2.5 p-2">
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Tỷ Lệ Phân Bố Đánh Giá Trên Thang 5 Sao</span>
            </h4>
            <span className="text-[11px] text-emerald-400 font-bold">
              {totalReviews > 0 ? `${starPercents[5]}% đánh giá 5 sao` : 'Chưa có dữ liệu'}
            </span>
          </div>

          {[5, 4, 3, 2, 1].map((stars) => {
            const count = starCounts[stars];
            const percent = starPercents[stars];
            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <button
                  onClick={() => setStarFilter(starFilter === String(stars) ? 'all' : String(stars))}
                  className="flex items-center gap-1 w-14 shrink-0 font-bold text-slate-300 hover:text-amber-300 transition"
                >
                  <span>{stars}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </button>

                {/* Progress track */}
                <div className="flex-1 h-3 rounded-full bg-slate-800/80 overflow-hidden relative border border-slate-700/50">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      stars === 5
                        ? 'bg-gradient-to-r from-amber-400 to-emerald-400'
                        : stars === 4
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                        : stars === 3
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                        : 'bg-gradient-to-r from-orange-500 to-rose-500'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="w-20 text-right shrink-0">
                  <span className="font-mono font-bold text-slate-200">{count}</span>
                  <span className="text-[10px] text-slate-400 ml-1">({percent}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Star Rating Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setStarFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              starFilter === 'all'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            Tất Cả ({totalReviews})
          </button>
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              onClick={() => setStarFilter(String(s))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 whitespace-nowrap ${
                starFilter === String(s)
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <span>{s}</span>
              <Star className="w-3 h-3 fill-current" />
              <span>({starCounts[s]})</span>
            </button>
          ))}
          <button
            onClick={() => setStarFilter('hidden')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              starFilter === 'hidden'
                ? 'bg-rose-500 text-white font-black'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            Đang Ẩn ({reviews.filter((r) => r.is_hidden).length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT, mã đơn, nội dung..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* REVIEWS LIST */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
          <p className="text-xs">Đang tải dữ liệu đánh giá...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-slate-800/60 p-12 rounded-3xl text-center text-slate-400 border border-slate-700/60 space-y-2">
          <Star className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="font-bold text-white text-sm">Không Có Đánh Giá Nào Phù Hợp</h4>
          <p className="text-xs text-slate-400">
            {searchTerm || starFilter !== 'all'
              ? 'Thử thay đổi bộ lọc số sao hoặc từ khóa tìm kiếm.'
              : 'Chưa có khách hàng nào gửi đánh giá.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map((r) => (
            <div
              key={r.id}
              className={`p-5 rounded-3xl border transition-all duration-200 ${
                r.is_hidden
                  ? 'bg-slate-900/90 border-rose-500/40 opacity-75'
                  : 'bg-slate-800/90 hover:bg-slate-800 border-slate-700 shadow-lg'
              }`}
            >
              {/* Header card */}
              <div className="flex justify-between items-start mb-3 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-white text-sm">
                      {r.customer_name || 'Khách hàng ẩn danh'}
                    </h4>
                    {r.is_hidden && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/30">
                        Đang Ẩn
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {r.customer_phone || 'Không có SĐT'}
                  </p>
                  <p className="text-[10px] text-amber-300 font-mono mt-0.5">
                    Mã đơn: {r.order_id || 'N/A'}
                  </p>
                </div>

                <div className="text-right">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Number(r.rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-slate-700 text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                    {r.created_at ? new Date(r.created_at).toLocaleString('vi-VN') : ''}
                  </span>
                </div>
              </div>

              {/* Comment text */}
              <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-700/50 mb-4">
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic">
                  "{r.comment || 'Không có bình luận chữ, chỉ chấm sao.'}"
                </p>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">
                  Đánh giá: <strong className="text-amber-300">{r.rating} / 5 sao</strong>
                </span>

                <div className="flex items-center gap-2">
                  {/* Toggle Hide/Show */}
                  <button
                    onClick={() => handleToggle(r.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                      r.is_hidden
                        ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300 border-slate-600'
                    }`}
                  >
                    {r.is_hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{r.is_hidden ? 'Hiện Lại' : 'Ẩn'}</span>
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(r.id, r.customer_name)}
                    disabled={deletingId === r.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-xs font-bold transition disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{deletingId === r.id ? 'Đang xóa...' : 'Xóa Bỏ'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
