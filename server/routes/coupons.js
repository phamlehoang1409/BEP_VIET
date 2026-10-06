const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/authMiddleware');
const {
  loadCouponsFromDb,
  saveCoupon,
  deleteCoupon,
  validateCouponForOrder
} = require('../services/couponService');

// GET all coupons
router.get('/', async (req, res) => {
  try {
    const { public_only } = req.query;
    const coupons = await loadCouponsFromDb();

    if (public_only === 'true' || public_only === '1') {
      const today = new Date().toISOString().slice(0, 10);
      // Only return general public coupons (not bound to a specific phone)
      const active = coupons.filter(
        (c) =>
          c.is_active !== false &&
          !c.phone &&
          (!c.expiry_date || c.expiry_date >= today)
      );
      return res.json({ success: true, coupons: active });
    }

    return res.json({ success: true, coupons });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST validate coupon code (with phone check)
router.post('/validate', async (req, res) => {
  try {
    const { code, subtotal, phone } = req.body;
    const result = await validateCouponForOrder(code, subtotal, phone);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST create new coupon (Admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      code,
      discount_type,
      discount_value,
      min_order,
      max_discount,
      expiry_date,
      description,
      phone,
      is_active
    } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'Mã khuyến mãi không được để trống' });
    }
    if (!discount_value || Number(discount_value) <= 0) {
      return res.status(400).json({ error: 'Giá trị giảm giá phải lớn hơn 0' });
    }

    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '');
    const newCoupon = {
      code: cleanCode,
      discount_type: discount_type === 'fixed' ? 'fixed' : 'percent',
      discount_value: Number(discount_value),
      min_order: Number(min_order) || 0,
      max_discount: max_discount ? Number(max_discount) : null,
      expiry_date: expiry_date || '2027-12-31',
      description: description
        ? description.trim()
        : discount_type === 'fixed'
        ? `Giảm ${new Intl.NumberFormat('vi-VN').format(discount_value)}₫`
        : `Giảm ${discount_value}%`,
      phone: phone ? phone.trim() : undefined,
      is_active: is_active !== undefined ? !!is_active : true,
      created_at: new Date().toISOString()
    };

    await saveCoupon(newCoupon);

    return res.status(201).json({
      success: true,
      message: `Tạo mã giảm giá ${cleanCode} thành công!`,
      coupon: newCoupon
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// DELETE remove coupon (Admin only)
router.delete('/:code', requireAdmin, async (req, res) => {
  try {
    const { code } = req.params;
    await deleteCoupon(code);

    return res.json({
      success: true,
      message: `Đã xóa mã khuyến mãi ${code} thành công!`
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
