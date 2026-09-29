const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

function cleanImageUrl(url) {
  if (!url || typeof url !== 'string') return url;
  let cleaned = url.trim();
  if (cleaned.includes('google.com/imgres') || cleaned.includes('google.com/url')) {
    try {
      const parsed = new URL(cleaned);
      const imgurl = parsed.searchParams.get('imgurl') || parsed.searchParams.get('url');
      if (imgurl) {
        cleaned = decodeURIComponent(imgurl);
      }
    } catch (e) {}
  }
  return cleaned;
}

function formatFood(f) {
  if (!f) return null;
  return {
    ...f,
    category_name: f.categories ? f.categories.name : (f.category_name || null),
    category_slug: f.categories ? f.categories.slug : (f.category_slug || null),
    is_available: f.is_available ? 1 : 0,
    is_featured: f.is_featured ? 1 : 0
  };
}

// GET all categories
router.get('/categories', async (req, res) => {
  try {
    if (supabase) {
      const { data: categories, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        return res.status(500).json({ error: error.message });
      }
      return res.json({ success: true, categories: categories || [] });
    }
    return res.json({ success: true, categories: [] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET all foods with filters
router.get('/', async (req, res) => {
  try {
    const { category, search, sort, available_only } = req.query;

    if (!supabase) {
      return res.json({ success: true, foods: [] });
    }

    let query = supabase.from('foods').select('*, categories(name, slug)');

    if (category && category !== 'all') {
      if (!isNaN(category)) {
        query = query.eq('category_id', Number(category));
      } else {
        query = query.eq('categories.slug', category);
      }
    }

    if (search && search.trim()) {
      query = query.ilike('name', `%${search.trim()}%`);
    }

    if (available_only === 'true' || available_only === '1') {
      query = query.eq('is_available', true);
    }

    if (sort === 'price_asc') {
      query = query.order('price', { ascending: true });
    } else if (sort === 'price_desc') {
      query = query.order('price', { ascending: false });
    } else if (sort === 'rating') {
      query = query.order('rating', { ascending: false });
    } else if (sort === 'popular') {
      query = query.order('sales_count', { ascending: false });
    } else {
      query = query.order('is_featured', { ascending: false }).order('id', { ascending: false });
    }

    const { data, error } = await query;
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const foods = (data || []).map(formatFood);
    return res.json({ success: true, foods });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET single food by ID
router.get('/:id', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(404).json({ error: 'Món ăn không tồn tại' });
    }

    const { data: food, error } = await supabase
      .from('foods')
      .select('*, categories(name, slug)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !food) {
      return res.status(404).json({ error: 'Món ăn không tồn tại' });
    }

    return res.json({ success: true, food: formatFood(food) });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST create new food
router.post('/', async (req, res) => {
  try {
    const {
      name,
      category_id,
      description,
      price,
      original_price,
      image,
      prep_time,
      spicy_level,
      is_featured,
      is_available
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Tên món ăn không được để trống' });
    }
    if (!price || Number(price) <= 0) {
      return res.status(400).json({ error: 'Giá món ăn phải lớn hơn 0' });
    }
    if (!image || !image.trim()) {
      return res.status(400).json({ error: 'Vui lòng cung cấp hình ảnh cho món ăn' });
    }

    const finalImage = cleanImageUrl(image);

    const { data: newFood, error } = await supabase
      .from('foods')
      .insert({
        name: name.trim(),
        category_id: Number(category_id) || 1,
        description: description ? description.trim() : '',
        price: Number(price),
        original_price: original_price ? Number(original_price) : null,
        image: finalImage,
        prep_time: prep_time ? Number(prep_time) : 20,
        spicy_level: spicy_level ? Number(spicy_level) : 0,
        is_featured: !!is_featured,
        is_available: is_available !== undefined ? !!is_available : true
      })
      .select('*, categories(name, slug)')
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({
      success: true,
      message: 'Thêm món ăn thành công!',
      food: formatFood(newFood)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PUT update food details
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category_id,
      description,
      price,
      original_price,
      image,
      prep_time,
      spicy_level,
      is_featured,
      is_available
    } = req.body;

    const updateFields = {};
    if (name !== undefined) updateFields.name = name.trim();
    if (category_id !== undefined) updateFields.category_id = Number(category_id);
    if (description !== undefined) updateFields.description = description.trim();
    if (price !== undefined) updateFields.price = Number(price);
    if (original_price !== undefined) updateFields.original_price = original_price ? Number(original_price) : null;
    if (image !== undefined) updateFields.image = cleanImageUrl(image);
    if (prep_time !== undefined) updateFields.prep_time = Number(prep_time);
    if (spicy_level !== undefined) updateFields.spicy_level = Number(spicy_level);
    if (is_featured !== undefined) updateFields.is_featured = !!is_featured;
    if (is_available !== undefined) updateFields.is_available = !!is_available;

    const { data: updated, error } = await supabase
      .from('foods')
      .update(updateFields)
      .eq('id', id)
      .select('*, categories(name, slug)')
      .maybeSingle();

    if (error || !updated) {
      return res.status(error ? 500 : 404).json({ error: error ? error.message : 'Món ăn không tồn tại' });
    }

    return res.json({
      success: true,
      message: 'Cập nhật món ăn thành công!',
      food: formatFood(updated)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH quick edit price
router.patch('/:id/price', async (req, res) => {
  try {
    const { id } = req.params;
    const { price, original_price } = req.body;

    if (!price || Number(price) <= 0) {
      return res.status(400).json({ error: 'Giá tiền phải lớn hơn 0' });
    }

    const { data: updated, error } = await supabase
      .from('foods')
      .update({
        price: Number(price),
        original_price: original_price ? Number(original_price) : null
      })
      .eq('id', id)
      .select('*, categories(name, slug)')
      .maybeSingle();

    if (error || !updated) {
      return res.status(error ? 500 : 404).json({ error: error ? error.message : 'Món ăn không tồn tại' });
    }

    return res.json({
      success: true,
      message: 'Cập nhật giá thành công!',
      food: formatFood(updated)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH toggle stock status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: food, error: findErr } = await supabase
      .from('foods')
      .select('is_available')
      .eq('id', id)
      .maybeSingle();

    if (findErr || !food) {
      return res.status(404).json({ error: 'Món ăn không tồn tại' });
    }

    const nextStatus = !food.is_available;
    const { error: updateErr } = await supabase
      .from('foods')
      .update({ is_available: nextStatus })
      .eq('id', id);

    if (updateErr) {
      return res.status(500).json({ error: updateErr.message });
    }

    return res.json({
      success: true,
      message: nextStatus ? 'Đã bật phục vụ món này' : 'Đã chuyển thành Hết Món',
      is_available: nextStatus ? 1 : 0
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// DELETE food
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: existing, error: findErr } = await supabase
      .from('foods')
      .select('name')
      .eq('id', id)
      .maybeSingle();

    if (findErr || !existing) {
      return res.status(404).json({ error: 'Món ăn không tồn tại' });
    }

    const { error: delErr } = await supabase.from('foods').delete().eq('id', id);
    if (delErr) {
      return res.status(500).json({ error: delErr.message });
    }

    return res.json({
      success: true,
      message: `Đã xoá món "${existing.name}" thành công!`
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
