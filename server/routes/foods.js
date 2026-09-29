const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../db/database');

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

// GET all categories
router.get('/categories', (req, res) => {
  try {
    const categories = query('SELECT * FROM categories ORDER BY display_order ASC, name ASC');
    return res.json({ success: true, categories });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET all foods with filters
router.get('/', (req, res) => {
  try {
    const { category, search, sort, available_only } = req.query;
    let sql = `
      SELECT f.*, c.name as category_name, c.slug as category_slug
      FROM foods f
      LEFT JOIN categories c ON f.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'all') {
      sql += ' AND (c.slug = ? OR f.category_id = ?)';
      params.push(category, category);
    }

    if (search && search.trim()) {
      sql += ' AND (f.name LIKE ? OR f.description LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    if (available_only === 'true' || available_only === '1') {
      sql += ' AND f.is_available = 1';
    }

    // Sort order
    if (sort === 'price_asc') {
      sql += ' ORDER BY f.price ASC';
    } else if (sort === 'price_desc') {
      sql += ' ORDER BY f.price DESC';
    } else if (sort === 'rating') {
      sql += ' ORDER BY f.rating DESC';
    } else if (sort === 'popular') {
      sql += ' ORDER BY f.sales_count DESC';
    } else {
      sql += ' ORDER BY f.is_featured DESC, f.id DESC';
    }

    const foods = query(sql, params);
    return res.json({ success: true, foods });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET single food by ID
router.get('/:id', (req, res) => {
  try {
    const food = queryOne(`
      SELECT f.*, c.name as category_name
      FROM foods f
      LEFT JOIN categories c ON f.category_id = c.id
      WHERE f.id = ?
    `, [req.params.id]);

    if (!food) {
      return res.status(404).json({ error: 'Món ăn không tồn tại' });
    }
    return res.json({ success: true, food });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST create new food
router.post('/', (req, res) => {
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

    const result = run(`
      INSERT INTO foods (
        name, category_id, description, price, original_price,
        image, prep_time, spicy_level, is_featured, is_available
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name.trim(),
      category_id || 1,
      description ? description.trim() : '',
      Number(price),
      original_price ? Number(original_price) : null,
      finalImage,
      prep_time ? Number(prep_time) : 20,
      spicy_level ? Number(spicy_level) : 0,
      is_featured ? 1 : 0,
      is_available !== undefined ? (is_available ? 1 : 0) : 1
    ]);

    const newFood = queryOne('SELECT * FROM foods WHERE id = ?', [Number(result.lastInsertRowid)]);
    return res.status(201).json({
      success: true,
      message: 'Thêm món ăn thành công!',
      food: newFood
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PUT update food details
router.put('/:id', (req, res) => {
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

    const existing = queryOne('SELECT * FROM foods WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Món ăn không tồn tại' });
    }

    const finalImage = image ? cleanImageUrl(image) : existing.image;

    run(`
      UPDATE foods SET
        name = ?,
        category_id = ?,
        description = ?,
        price = ?,
        original_price = ?,
        image = ?,
        prep_time = ?,
        spicy_level = ?,
        is_featured = ?,
        is_available = ?
      WHERE id = ?
    `, [
      name ? name.trim() : existing.name,
      category_id !== undefined ? category_id : existing.category_id,
      description !== undefined ? description : existing.description,
      price !== undefined ? Number(price) : existing.price,
      original_price !== undefined ? (original_price ? Number(original_price) : null) : existing.original_price,
      image ? image.trim() : existing.image,
      prep_time !== undefined ? Number(prep_time) : existing.prep_time,
      spicy_level !== undefined ? Number(spicy_level) : existing.spicy_level,
      is_featured !== undefined ? (is_featured ? 1 : 0) : existing.is_featured,
      is_available !== undefined ? (is_available ? 1 : 0) : existing.is_available,
      id
    ]);

    const updated = queryOne('SELECT * FROM foods WHERE id = ?', [id]);
    return res.json({
      success: true,
      message: 'Cập nhật món ăn thành công!',
      food: updated
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH quick edit price
router.patch('/:id/price', (req, res) => {
  try {
    const { id } = req.params;
    const { price, original_price } = req.body;

    if (!price || Number(price) <= 0) {
      return res.status(400).json({ error: 'Giá tiền phải lớn hơn 0' });
    }

    run(
      'UPDATE foods SET price = ?, original_price = ? WHERE id = ?',
      [Number(price), original_price ? Number(original_price) : null, id]
    );

    const updated = queryOne('SELECT * FROM foods WHERE id = ?', [id]);
    return res.json({
      success: true,
      message: 'Cập nhật giá thành công!',
      food: updated
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH toggle stock status
router.patch('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const food = queryOne('SELECT is_available FROM foods WHERE id = ?', [id]);
    if (!food) {
      return res.status(404).json({ error: 'Món ăn không tồn tại' });
    }

    const nextStatus = food.is_available === 1 ? 0 : 1;
    run('UPDATE foods SET is_available = ? WHERE id = ?', [nextStatus, id]);

    return res.json({
      success: true,
      message: nextStatus === 1 ? 'Đã bật phục vụ món này' : 'Đã chuyển thành Hết Món',
      is_available: nextStatus
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// DELETE food
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = queryOne('SELECT * FROM foods WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Món ăn không tồn tại' });
    }

    run('DELETE FROM foods WHERE id = ?', [id]);
    return res.json({
      success: true,
      message: `Đã xoá món "${existing.name}" thành công!`
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
