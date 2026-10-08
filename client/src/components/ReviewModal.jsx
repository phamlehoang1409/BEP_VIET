import React, { useState } from 'react';
import { X, Star, Sparkles, CheckCircle2, MessageSquare, ThumbsUp, Heart } from 'lucide-react';
import { submitReview } from '../api';
import { useLoyalty } from '../context/LoyaltyContext';
import { useToast } from './Toast';
import confetti from 'canvas-confetti';

const QUICK_TAGS = [
  '⚡ Giao siêu nhanh',
  '♨️ Món ăn nóng hổi',
  '😋 Vị ngon đậm đà',
  '🍲 Khẩu phần đầy đặn',
  '🎁 Đóng gói cẩn thận',
  '🌶️ Đúng độ cay yêu cầu'
];

export default function ReviewModal({ isOpen, onClose, order, onSuccess }) {
  const { showToast } = useToast();
  const { setPoints } = useLoyalty();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      showToast('Vui lòng chọn số sao đánh giá!', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const fullComment = [
        ...selectedTags,
        comment.trim()
      ].filter(Boolean).join(' • ');

      const payload = {
        order_id: order?.order_code || order?.id || 'DIRECT',
        customer_name: order?.customer_name || 'Khách Hàng',
        customer_phone: order?.customer_phone || '',
        rating,
        comment: fullComment || 'Món ăn rất ngon, dịch vụ chu đáo!'
      };

      const res = await submitReview(payload);
      if (res.success) {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });

        // Reward 5000 loyalty points
        if (setPoints) {
          setPoints((prev) => prev + 5000);
        }

        showToast('🌟 Cảm ơn Quý khách! Bạn được tặng +5.000 Bếp Xu!', 'success', 5000);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        showToast(res.error || 'Không thể gửi đánh giá', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Lỗi gửi đánh giá, vui lòng thử lại', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md bg-white dark:bg-[#141824] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🍲</span>
            <div>
              <h3 className="text-lg font-black leading-tight">Đánh Giá Món Ăn</h3>
              <p className="text-xs font-bold text-slate-900/80">
                Đơn hàng #{order?.order_code || order?.id || 'Bếp Việt'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/15 hover:bg-black/25 text-slate-950 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Rating Stars */}
          <div className="text-center space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Chất lượng món ăn & phục vụ
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating || rating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-2xl sm:text-3xl transition-transform hover:scale-125 active:scale-95 focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        isFilled
                          ? 'text-amber-400 fill-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.4)]'
                          : 'text-slate-300 dark:text-slate-700'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <div className="text-sm font-black text-amber-600 dark:text-amber-400">
              {rating === 5 && 'Tuyệt vời, ngon xuất sắc! ⭐⭐⭐⭐⭐'}
              {rating === 4 && 'Rất ngon, hài lòng! ⭐⭐⭐⭐'}
              {rating === 3 && 'Tạm ổn, có thể cải thiện thêm! ⭐⭐⭐'}
              {rating === 2 && 'Chưa hài lòng! ⭐⭐'}
              {rating === 1 && 'Không hài lòng! ⭐'}
            </div>
          </div>

          {/* Quick Tags */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
              Điểm bạn thích nhất ở đơn này:
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed comment */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
              Nhận xét thêm (tuỳ chọn):
            </label>
            <textarea
              rows={3}
              placeholder="Chia sẻ cảm nhận của bạn về hương vị món ăn, độ cay, đóng gói..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none resize-none transition"
            />
          </div>

          {/* Point Reward Badge */}
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Gửi đánh giá để nhận ngay <strong>+5.000 Bếp Xu</strong> vào tài khoản!</span>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Để Sau
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/25 active:scale-95 transition flex items-center justify-center gap-1.5"
            >
              {submitting ? 'Đang gửi...' : 'Gửi Đánh Giá ⭐'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
