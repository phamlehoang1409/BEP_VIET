import React, { useState, useEffect } from 'react';
import { Star, MessageCircle, Eye, EyeOff, Search } from 'lucide-react';
import { getReviews, toggleReviewVisibility } from '../../api';
import { useToast } from '../../components/Toast';

export default function ReviewManagement() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchReviews = async () => {
    try {
      const res = await getReviews();
      if (res.success) setReviews(res.reviews || []);
    } catch (err) {
      showToast('Lỗi tải đánh giá', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleToggle = async (id) => {
    try {
      const res = await toggleReviewVisibility(id);
      if (res.success) {
        setReviews(res.reviews);
        showToast('Đã cập nhật trạng thái hiển thị!', 'success');
      }
    } catch (err) {
      showToast('Lỗi', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Quản Lý Đánh Giá</h1>
        <p className="text-slate-400 text-sm mt-1">Xem và ẩn/hiện đánh giá của khách hàng</p>
      </div>

      {loading ? (
        <div className="text-white">Đang tải...</div>
      ) : reviews.length === 0 ? (
        <div className="bg-slate-800 p-8 rounded-2xl text-center text-slate-400">Chưa có đánh giá nào.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((r) => (
            <div key={r.id} className={`p-5 rounded-2xl border ${r.is_hidden ? 'bg-slate-900 border-rose-500/30' : 'bg-slate-800 border-slate-700'}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-bold text-white">{r.customer_name}</h4>
                  <p className="text-xs text-slate-400">{r.customer_phone}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Mã đơn: {r.order_id}</p>
                </div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-700 text-slate-700'}`} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-slate-300 italic">"{r.comment || 'Không có bình luận'}"</p>
              
              <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-end">
                <button onClick={() => handleToggle(r.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${r.is_hidden ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {r.is_hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span>{r.is_hidden ? 'Hiển thị lại' : 'Ẩn đánh giá'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
