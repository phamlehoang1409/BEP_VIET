const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { requireAdmin } = require('../middleware/authMiddleware');

// Seed default coupons if none exist
const DEFAULT_COUPONS = [
  {
    code: 'INDOMIE20',
    discount_type: 'percent',
    discount_value: 20,
    min_order: 100000,
    max_discount: 40000,
    expiry_date: '2027-12-31',
    description: 'Giảm 20% cho đơn Mì Indomie từ 100.000₫ (Tối đa 40.000₫)',
    is_active: true
  },
  {
    code: 'HANOI15K',
    discount_type: 'fixed',
    discount_value: 15000,
    min_order: 80000,
    max_discount: 15000,
    expiry_date: '2027-12-31',
    description: 'Giảm ngay 15.000₫ phí ship cho đơn nội thành Hà Nội từ 80.000₫',
    is_active: true
  },
  {
    code: 'BEPVIETVIP',
    discount_type: 'percent',
    discount_value: 25,
    min_order: 200000,
    max_discount: 80000,
    expiry_date: '2027-12-31',
    description: 'Ưu đãi VIP Bếp Việt: Giảm 25% cho đơn tiệc gia đình từ 200.000₫',
    is_active: true
  },
  {
    code: 'MAYMAN10K',
    discount_type: 'fixed',
    discount_value: 10000,
    min_order: 50000,
    max_discount: 10000,
    expiry_date: '2027-12-31',
    description: 'Voucher May Mắn: Giảm 10.000₫ cho đơn từ 50.000₫',
    is_active: true
  },
  {
    code: 'FREESHIP15K',
    discount_type: 'fixed',
    discount_value: 15000,
    min_order: 60000,
    max_discount: 15000,
    expiry_date: '2027-12-31',
    description: 'Voucher May Mắn: Miễn phí vận chuyển 15.000₫ cho đơn từ 60.000₫',
    is_active: true
  }
];

let memoryCoupons = [...DEFAULT_COUPONS];

// Helper to load coupons from Supabase
async function loadCouponsFromDb() {
  if (!supabase) return memoryCoupons;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('name')
      .eq('role', 'coupon');

    if (data && data.length > 0) {
      const dbCoupons = [];
      for (const row of data) {
        try {
          dbCoupons.push(JSON.parse(row.name));
        } catch (e) {}
      }
      if (dbCoupons.length > 0) {
        memoryCoupons = dbCoupons;
        return memoryCoupons;
      }
    }

    // Seed defaults into database if empty
    for (const c of DEFAULT_COUPONS) {
      await supabase.from('users').upsert({
        phone: 'CPN_' + c.code.toUpperCase(),
        name: JSON.stringify(c),
        role: 'coupon'
      }, { onConflict: 'phone' });
    }
  } catch (err) {
    console.error('Error loading coupons from DB:', err.message);
  }
  return memoryCoupons;
}

// Initial load
loadCouponsFromDb().catch(() => {});

// GET all coupons
router.get('/', async (req, res) => {
  try {
    const { public_only } = req.query;
    const coupons = await loadCouponsFromDb();

    if (public_only === 'true' || public_only === '1') {
      const today = new Date().toISOString().slice(0, 10);
      const active = coupons.filter(c => c.is_active !== false && (!c.expiry_date || c.expiry_date >= today));
      return res.json({ success: true, coupons: active });
    }

    return res.json({ success: true, coupons });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST validate coupon code
router.post('/validate', async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập mã giảm giá' });
    }

    const cleanCode = code.trim().toUpperCase();
    const sub = Number(subtotal) || 0;
    const coupons = await loadCouponsFromDb();
    const coupon = coupons.find(c => c.code.toUpperCase() === cleanCode);

    if (!coupon) {
      return res.status(400).json({ error: `Mã giảm giá "${cleanCode}" không tồn tại hoặc đã hết hạn!` });
    }

    if (coupon.is_active === false) {
      return res.status(400).json({ error: `Mã giảm giá "${cleanCode}" hiện đang tạm ngừng áp dụng.` });
    }

    if (coupon.expiry_date) {
      const today = new Date().toISOString().slice(0, 10);
      if (coupon.expiry_date < today) {
        return res.status(400).json({ error: `Mã giảm giá "${cleanCode}" đã hết hạn sử dụng (${coupon.expiry_date}).` });
      }
    }

    if (coupon.min_order && sub < Number(coupon.min_order)) {
      return res.status(400).json({
        error: `Đơn hàng tối thiểu ${new Intl.NumberFormat('vi-VN').format(coupon.min_order)}₫ mới được áp dụng mã này (Đơn hiện tại: ${new Intl.NumberFormat('vi-VN').format(sub)}₫).`
      });
    }

    let discountAmount = 0;
    if (coupon.discount_type === 'percent') {
      discountAmount = Math.round((sub * Number(coupon.discount_value)) / 100);
      if (coupon.max_discount && discountAmount > Number(coupon.max_discount)) {
        discountAmount = Number(coupon.max_discount);
      }
    } else {
      discountAmount = Number(coupon.discount_value);
    }

    discountAmount = Math.min(discountAmount, sub);

    return res.json({
      success: true,
      valid: true,
      message: `Áp dụng mã ${coupon.code} thành công! Giảm ${new Intl.NumberFormat('vi-VN').format(discountAmount)}₫.`,
      discount_amount: discountAmount,
      coupon
    });
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
      description: description ? description.trim() : (discount_type === 'fixed' ? `Giảm ${new Intl.NumberFormat('vi-VN').format(discount_value)}₫` : `Giảm ${discount_value}%`),
      is_active: is_active !== undefined ? !!is_active : true,
      created_at: new Date().toISOString()
    };

    // Update memory
    const existingIdx = memoryCoupons.findIndex(c => c.code === cleanCode);
    if (existingIdx >= 0) {
      memoryCoupons[existingIdx] = newCoupon;
    } else {
      memoryCoupons.push(newCoupon);
    }

    // Persist to Supabase
    if (supabase) {
      await supabase.from('users').upsert({
        phone: 'CPN_' + cleanCode,
        name: JSON.stringify(newCoupon),
        role: 'coupon'
      }, { onConflict: 'phone' });
    }

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
    const cleanCode = code.trim().toUpperCase();

    memoryCoupons = memoryCoupons.filter(c => c.code !== cleanCode);

    if (supabase) {
      await supabase.from('users').delete().eq('phone', 'CPN_' + cleanCode);
    }

    return res.json({
      success: true,
      message: `Đã xóa mã khuyến mãi ${cleanCode} thành công!`
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
