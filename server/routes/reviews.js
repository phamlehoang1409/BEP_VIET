const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

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

// POST a new review
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

    return res.json({ success: true, review: newReview });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH toggle review visibility
router.patch('/:id/toggle', async (req, res) => {
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

module.exports = router;
