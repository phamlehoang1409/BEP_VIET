const supabase = require('../db/supabase');

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
  }
];

let memoryCoupons = [...DEFAULT_COUPONS];

function normalizePhone(phone) {
  if (!phone) return '';
  let cleaned = phone.trim().replace(/\s+/g, '').replace(/-/g, '');
  if (cleaned.startsWith('+84')) {
    cleaned = '0' + cleaned.slice(3);
  }
  return cleaned;
}

async function loadCouponsFromDb() {
  if (!supabase) return memoryCoupons;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('phone, name')
      .eq('role', 'coupon');

    if (data && data.length > 0) {
      const dbCoupons = [];
      for (const row of data) {
        try {
          const parsed = JSON.parse(row.name);
          dbCoupons.push(parsed);
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
    console.error('[Coupon Service] Lỗi tải mã giảm giá:', err.message);
  }
  return memoryCoupons;
}

// Initial load
loadCouponsFromDb().catch(() => {});

async function saveCoupon(coupon) {
  const cleanCode = (coupon.code || '').toUpperCase().trim();
  coupon.code = cleanCode;

  // Update memory
  const idx = memoryCoupons.findIndex((c) => c.code === cleanCode);
  if (idx > -1) {
    memoryCoupons[idx] = coupon;
  } else {
    memoryCoupons.push(coupon);
  }

  // Save to DB
  if (supabase) {
    try {
      await supabase.from('users').upsert(
        {
          phone: 'CPN_' + cleanCode,
          name: JSON.stringify(coupon),
          role: 'coupon'
        },
        { onConflict: 'phone' }
      );
    } catch (err) {
      console.error('[Coupon Service] Lỗi lưu mã giảm giá:', err.message);
    }
  }
  return coupon;
}

async function deleteCoupon(code) {
  if (!code) return;
  const cleanCode = code.toUpperCase().trim();
  memoryCoupons = memoryCoupons.filter((c) => c.code !== cleanCode);

  if (supabase) {
    try {
      await supabase
        .from('users')
        .delete()
        .eq('phone', 'CPN_' + cleanCode)
        .eq('role', 'coupon');
    } catch (err) {
      console.error('[Coupon Service] Lỗi xóa mã giảm giá:', err.message);
    }
  }
}

async function getCoupon(code) {
  if (!code) return null;
  const cleanCode = code.toUpperCase().trim();
  const coupons = await loadCouponsFromDb();
  return coupons.find((c) => c.code === cleanCode) || null;
}

async function validateCouponForOrder(code, subtotal, phone) {
  if (!code || !code.trim()) {
    return { success: false, error: 'Vui lòng nhập mã giảm giá' };
  }

  const cleanCode = code.trim().toUpperCase();
  const coupons = await loadCouponsFromDb();
  const coupon = coupons.find((c) => c.code === cleanCode);

  if (!coupon) {
    return { success: false, error: `Mã giảm giá "${cleanCode}" không tồn tại hoặc đã được sử dụng!` };
  }

  if (coupon.is_active === false) {
    return { success: false, error: `Mã giảm giá "${cleanCode}" đã bị vô hiệu hóa hoặc đã dùng!` };
  }

  if (coupon.expiry_date) {
    const today = new Date().toISOString().slice(0, 10);
    if (coupon.expiry_date < today) {
      return { success: false, error: `Mã giảm giá "${cleanCode}" đã hết hạn sử dụng (${coupon.expiry_date}).` };
    }
  }

  // Check phone exclusivity if coupon is bound to phone
  if (coupon.phone) {
    const inputPhone = normalizePhone(phone);
    const couponPhone = normalizePhone(coupon.phone);
    if (!inputPhone || inputPhone !== couponPhone) {
      return {
        success: false,
        error: `Mã giảm giá "${cleanCode}" được tạo riêng cho số điện thoại ${coupon.phone}. Số điện thoại của bạn (${inputPhone || 'chưa nhập'}) không được phép áp dụng mã này!`
      };
    }
  }

  const sub = Number(subtotal) || 0;
  if (coupon.min_order && sub < Number(coupon.min_order)) {
    return {
      success: false,
      error: `Đơn hàng tối thiểu ${new Intl.NumberFormat('vi-VN').format(coupon.min_order)}₫ mới được áp dụng mã này (Đơn hiện tại: ${new Intl.NumberFormat('vi-VN').format(sub)}₫).`
    };
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

  return {
    success: true,
    valid: true,
    discount_amount: discountAmount,
    coupon,
    message: `Áp dụng mã ${coupon.code} thành công! Giảm ${new Intl.NumberFormat('vi-VN').format(discountAmount)}₫.`
  };
}

module.exports = {
  loadCouponsFromDb,
  saveCoupon,
  deleteCoupon,
  getCoupon,
  validateCouponForOrder,
  normalizePhone
};
