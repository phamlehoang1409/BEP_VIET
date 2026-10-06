const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { requireAdmin } = require('../middleware/authMiddleware');

const REVIEWS_ROW_PHONE = 'STORE_REVIEWS';

// GET all reviews
router.get('/', async (req, res) => {
  try {
    if (!supabase) return res.json({ success: true, reviews: [] });
    const { data } = await supabase
      .from('users')
      .select('name')
      .eq('phone', REVIEWS_ROW_PHONE)
      .eq('role', 'store_reviews')
      .maybeSingle();

    const reviews = data && data.name ? JSON.parse(data.name) : [];
    return res.json({ success: true, reviews });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET check if an order has been reviewed
router.get('/check/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    let reviews = [];
    if (supabase) {
      const { data } = await supabase
        .from('users')
        .select('name')
        .eq('phone', REVIEWS_ROW_PHONE)
        .eq('role', 'store_reviews')
        .maybeSingle();
      if (data && data.name) reviews = JSON.parse(data.name);
    }
    const isReviewed = reviews.some(
      (r) => String(r.order_id).trim() === String(orderId).trim()
    );
    return res.json({ success: true, is_reviewed: isReviewed });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST a new review (Chỉ cho phép đánh giá 1 lần duy nhất)
router.post('/', async (req, res) => {
  try {
    const { order_id, customer_name, customer_phone, rating, comment } = req.body;
    if (!rating) return res.status(400).json({ error: 'Vui lòng chọn số sao' });

    let reviews = [];
    if (supabase) {
      const { data } = await supabase
        .from('users')
        .select('name')
        .eq('phone', REVIEWS_ROW_PHONE)
        .eq('role', 'store_reviews')
        .maybeSingle();
      if (data && data.name) reviews = JSON.parse(data.name);
    }

    // Kiểm tra xem đơn hàng này đã được đánh giá chưa (chỉ cho phép 1 lần duy nhất)
    if (order_id) {
      const alreadyReviewed = reviews.some(
        (r) => String(r.order_id).trim() === String(order_id).trim()
      );
      if (alreadyReviewed) {
        return res.status(400).json({
          error: 'Đơn hàng này đã được đánh giá rồi! Mỗi đơn hàng chỉ được gửi đánh giá 1 lần duy nhất.'
        });
      }
    }

    const newReview = {
      id: Date.now().toString(),
      order_id,
      customer_name,
      customer_phone,
      rating: Number(rating),
      comment: comment || '',
      created_at: new Date().toISOString(),
      is_hidden: false
    };

    reviews.unshift(newReview); // Add to top

    if (supabase) {
      await supabase.from('users').upsert({
        phone: REVIEWS_ROW_PHONE,
        role: 'store_reviews',
        name: JSON.stringify(reviews)
      }, { onConflict: 'phone' });
    }

    return res.json({ success: true, review: newReview, message: 'Cảm ơn Quý khách đã gửi đánh giá!' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH toggle review visibility (Admin only)
router.patch('/:id/toggle', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    let reviews = [];
    if (supabase) {
      const { data } = await supabase
        .from('users')
        .select('name')
        .eq('phone', REVIEWS_ROW_PHONE)
        .eq('role', 'store_reviews')
        .maybeSingle();
      if (data && data.name) reviews = JSON.parse(data.name);
    }

    const index = reviews.findIndex(r => r.id === id);
    if (index > -1) {
      reviews[index].is_hidden = !reviews[index].is_hidden;
      if (supabase) {
        await supabase.from('users').upsert({
          phone: REVIEWS_ROW_PHONE,
          role: 'store_reviews',
          name: JSON.stringify(reviews)
        }, { onConflict: 'phone' });
      }
    }

    return res.json({ success: true, reviews });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// DELETE review by id (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    let reviews = [];
    if (supabase) {
      const { data } = await supabase
        .from('users')
        .select('name')
        .eq('phone', REVIEWS_ROW_PHONE)
        .eq('role', 'store_reviews')
        .maybeSingle();
      if (data && data.name) reviews = JSON.parse(data.name);
    }

    const initialLength = reviews.length;
    reviews = reviews.filter((r) => String(r.id) !== String(id));

    if (reviews.length === initialLength) {
      return res.status(404).json({ error: 'Không tìm thấy đánh giá cần xóa' });
    }

    if (supabase) {
      await supabase.from('users').upsert({
        phone: REVIEWS_ROW_PHONE,
        role: 'store_reviews',
        name: JSON.stringify(reviews)
      }, { onConflict: 'phone' });
    }

    return res.json({ success: true, message: 'Đã xóa đánh giá thành công!', reviews });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
