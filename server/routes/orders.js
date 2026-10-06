const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { requireAdmin } = require('../middleware/authMiddleware');
const { getCoupon, deleteCoupon, validateCouponForOrder } = require('../services/couponService');

const VN_PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

function normalizePhone(phone) {
  if (!phone) return '';
  let cleaned = phone.trim().replace(/\s+/g, '').replace(/-/g, '');
  if (cleaned.startsWith('+84')) {
    cleaned = '0' + cleaned.slice(3);
  }
  return cleaned;
}

function generateOrderCode() {
  const date = new Date();
  const dateStr = `${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  const randomStr = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${dateStr}-${randomStr}`;
}

// Tính thời điểm 00:00:00 hôm nay theo giờ Việt Nam (UTC+7)
function getStartOfTodayVietnamISO() {
  const now = new Date();
  const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const year = vnTime.getUTCFullYear();
  const month = vnTime.getUTCMonth();
  const date = vnTime.getUTCDate();

  // 00:00:00 của ngày hôm nay theo giờ VN quy đổi về UTC ISO
  const startOfVnDayInUtc = new Date(Date.UTC(year, month, date, 0, 0, 0) - 7 * 60 * 60 * 1000);
  return startOfVnDayInUtc.toISOString();
}

// Tự động xóa các đơn hàng trong ngày đã hoàn thành hoặc hủy khi sang ngày hôm sau
async function autoCleanupOldCompletedOrders() {
  if (!supabase) return { deletedCount: 0 };
  try {
    const startOfTodayISO = getStartOfTodayVietnamISO();

    // Lấy tất cả các đơn hàng có trạng thái completed hoặc cancelled được tạo TRƯỚC ngày hôm nay
    const { data: oldOrders, error: findErr } = await supabase
      .from('orders')
      .select('id, order_code, status, created_at')
      .in('status', ['completed', 'cancelled'])
      .lt('created_at', startOfTodayISO);

    if (findErr) {
      console.error('[Auto Cleanup Orders] Lỗi tìm đơn hàng cũ:', findErr.message);
      return { deletedCount: 0, error: findErr.message };
    }

    if (!oldOrders || oldOrders.length === 0) {
      return { deletedCount: 0 };
    }

    const oldIds = oldOrders.map((o) => o.id);

    // 1. Xóa chi tiết các món trong order_items trước để tránh lỗi khóa ngoại
    await supabase
      .from('order_items')
      .delete()
      .in('order_id', oldIds);

    // 2. Xóa đơn hàng trong bảng orders của Supabase
    const { error: delErr } = await supabase
      .from('orders')
      .delete()
      .in('id', oldIds);

    if (delErr) {
      console.error('[Auto Cleanup Orders] Lỗi khi xóa đơn hàng khỏi Supabase:', delErr.message);
      return { deletedCount: 0, error: delErr.message };
    }

    console.log(
      `[Auto Cleanup Orders] 🧹 Đã tự động xóa sạch ${oldOrders.length} đơn hàng hoàn thành/hủy từ ngày hôm trước khỏi Supabase:`,
      oldOrders.map((o) => o.order_code).join(', ')
    );

    return { deletedCount: oldOrders.length, deletedOrders: oldOrders };
  } catch (err) {
    console.error('[Auto Cleanup Orders] Ngoại lệ khi dọn dẹp đơn cũ:', err.message);
    return { deletedCount: 0, error: err.message };
  }
}

// Chạy định kỳ mỗi 15 phút
setInterval(() => {
  autoCleanupOldCompletedOrders().catch(() => {});
}, 15 * 60 * 1000);

// Chạy dọn dẹp ngay khi khởi động
autoCleanupOldCompletedOrders().catch(() => {});

// Place a new order
router.post('/', async (req, res) => {
  try {
    const {
      customer_name,
      customer_phone,
      delivery_address,
      province,
      district,
      ward,
      note,
      items,
      payment_method,
      discount = 0,
      coupon_code
    } = req.body;

    // 0. Validate Store Status (Block order if store is closed/tam nghi)
    if (supabase) {
      try {
        const { data: settingsData } = await supabase
          .from('users')
          .select('name')
          .eq('phone', 'STORE_SETTINGS')
          .eq('role', 'store_settings')
          .maybeSingle();

        if (settingsData && settingsData.name) {
          const parsedSettings = JSON.parse(settingsData.name);
          if (parsedSettings.is_open === false) {
            return res.status(400).json({
              error: `Quán hiện đang TẠM NGHỈ, không nhận đơn hàng mới! Giờ phục vụ: ${parsedSettings.open_time || '08:00'} - ${parsedSettings.close_time || '23:00'}. Quý khách vui lòng quay lại sau hoặc liên hệ Hotline ${parsedSettings.hotline || '0353859726'}.`
            });
          }
        }
      } catch (err) {
        console.error('Lỗi kiểm tra trạng thái mở cửa quán:', err.message);
      }
    }

    // Validate Customer Name
    if (!customer_name || customer_name.trim().length < 2) {
      return res.status(400).json({ error: 'Vui lòng nhập họ tên người nhận (tối thiểu 2 ký tự).' });
    }

    // Validate Phone Number
    const normalizedPhone = normalizePhone(customer_phone);
    if (!VN_PHONE_REGEX.test(normalizedPhone)) {
      return res.status(400).json({
        error: 'Số điện thoại nhận hàng không hợp lệ! Vui lòng nhập số điện thoại Việt Nam 10 chữ số (Ví dụ: 0912345678, 0987654321).'
      });
    }

    // Validate Address
    if (!delivery_address || delivery_address.trim().length < 8) {
      return res.status(400).json({
        error: 'Địa chỉ giao hàng quá ngắn! Vui lòng nhập địa chỉ cụ thể bao gồm số nhà, tên đường để shipper giao đúng nơi.'
      });
    }

    const addrCleaned = delivery_address.trim().toLowerCase();
    // Chống lặp ký tự vô nghĩa (aaaaa, 11111, xxxxx)
    if (/(.)\1{3,}/.test(addrCleaned)) {
      return res.status(400).json({
        error: 'Địa chỉ chứa chuỗi ký tự lặp vô nghĩa! Vui lòng nhập địa chỉ có thật tại Hà Nội.'
      });
    }

    // Chống từ khóa rác / linh tinh
    const blacklisted = [
      'linh tinh', 'lung tung', 'khong co', 'chua co', 'khong biet', 'chua biet',
      'test', 'demo', 'asdf', 'qwerty', '12345', '11111', 'aaaaa', 'hahaha',
      'dau cung duoc', 'tuy quan', 'ko co', 'fake', 'abcde'
    ];
    if (blacklisted.some((w) => addrCleaned.includes(w))) {
      return res.status(400).json({
        error: 'Địa chỉ giao hàng không hợp lệ! Vui lòng nhập số nhà, tên đường thật để shipper giao hàng.'
      });
    }

    // Phải có nguyên âm
    if (!/[aeiouyáàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ]/i.test(addrCleaned)) {
      return res.status(400).json({
        error: 'Địa chỉ không hợp lệ! Vui lòng nhập tên đường, tòa nhà có nghĩa.'
      });
    }

    // Validate Items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Giỏ hàng trống! Vui lòng chọn ít nhất một món ăn.' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Dịch vụ cơ sở dữ liệu hiện không khả dụng.' });
    }

    // Calculate subtotal
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const { data: food } = await supabase
        .from('foods')
        .select('*')
        .eq('id', item.food_id)
        .maybeSingle();

      if (!food) {
        return res.status(400).json({ error: `Món ăn mã #${item.food_id} không tồn tại!` });
      }
      if (food.is_available === false) {
        return res.status(400).json({ error: `Món "${food.name}" hiện đang tạm hết, vui lòng chọn món khác!` });
      }

      const qty = Math.max(1, parseInt(item.quantity) || 1);
      const itemTotal = Number(food.price) * qty;
      subtotal += itemTotal;

      validatedItems.push({
        food_id: food.id,
        food_name: food.name,
        food_image: food.image,
        price: Number(food.price),
        quantity: qty,
        total: itemTotal
      });
    }

    // Dynamic delivery fee from Store Settings or request body (no hardcoded 15k)
    let dynamicShipFee = 15000;
    let dynamicFreeShipThreshold = 200000;

    try {
      const { data: setRow } = await supabase
        .from('users')
        .select('name')
        .eq('phone', 'STORE_SETTINGS')
        .eq('role', 'store_settings')
        .maybeSingle();

      if (setRow && setRow.name) {
        const parsed = JSON.parse(setRow.name);
        if (parsed.delivery_fee_default !== undefined) {
          dynamicShipFee = Number(parsed.delivery_fee_default);
        }
        if (parsed.free_ship_threshold !== undefined) {
          dynamicFreeShipThreshold = Number(parsed.free_ship_threshold);
        }
      }
    } catch (e) {}

    let delivery_fee = dynamicShipFee;
    if (req.body.delivery_fee !== undefined && !isNaN(Number(req.body.delivery_fee))) {
      delivery_fee = Number(req.body.delivery_fee);
    } else if (dynamicFreeShipThreshold > 0 && subtotal >= dynamicFreeShipThreshold) {
      delivery_fee = 0;
    }

    // Validate and calculate discount strictly with phone verification
    let appliedDiscount = Number(discount) || 0;
    if (coupon_code && coupon_code.trim()) {
      const cleanCoupon = coupon_code.trim().toUpperCase();
      const valRes = await validateCouponForOrder(cleanCoupon, subtotal, normalizedPhone);
      if (valRes.success) {
        appliedDiscount = valRes.discount_amount;
      } else {
        return res.status(400).json({ error: valRes.error });
      }
    }

    const total_amount = Math.max(0, subtotal - appliedDiscount + delivery_fee);
    const order_code = generateOrderCode();

    // Format full address including ward if present
    let fullAddress = delivery_address.trim();
    if (ward && ward.trim() && !fullAddress.toLowerCase().includes(ward.trim().toLowerCase())) {
      fullAddress = `${fullAddress}, ${ward.trim()}`;
    }

    // Support coupon code in note
    const finalNote = coupon_code ? `[Mã giảm giá: ${coupon_code.toUpperCase()}] ${note ? note.trim() : ''}`.trim() : (note ? note.trim() : '');

    // Find or link user
    let { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    let userId = user ? user.id : null;
    if (!userId) {
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          phone: normalizedPhone,
          name: customer_name.trim(),
          address: fullAddress,
          province: province || 'Hà Nội',
          district: district || 'Quận Hoàn Kiếm',
          ward: ward || '',
          role: 'customer'
        })
        .select('id')
        .single();

      if (newUser) userId = newUser.id;
    }

    // Insert order (Initial status: 'pending' - Chờ chủ quán duyệt và xác nhận)
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        order_code,
        user_id: userId,
        customer_name: customer_name.trim(),
        customer_phone: normalizedPhone,
        delivery_address: fullAddress,
        province: province || 'Hà Nội',
        district: district || 'Quận Hoàn Kiếm',
        note: finalNote,
        subtotal,
        discount: Number(discount) || 0,
        delivery_fee,
        total_amount,
        payment_method: payment_method || 'COD',
        status: 'pending'
      })
      .select()
      .single();

    if (orderErr || !order) {
      return res.status(500).json({ error: orderErr ? orderErr.message : 'Không thể tạo đơn hàng' });
    }

    // Insert order items
    const orderItemsData = validatedItems.map(it => ({
      order_id: order.id,
      food_id: it.food_id,
      food_name: it.food_name,
      food_image: it.food_image,
      price: it.price,
      quantity: it.quantity,
      total: it.total
    }));

    await supabase.from('order_items').insert(orderItemsData);

    // Delete single-use or phone-bound lucky voucher immediately so it cannot be reused
    if (coupon_code && coupon_code.trim()) {
      const cleanCoupon = coupon_code.trim().toUpperCase();
      try {
        const foundCoupon = await getCoupon(cleanCoupon);
        if (foundCoupon && (foundCoupon.is_single_use || foundCoupon.phone || cleanCoupon.startsWith('MM') || cleanCoupon.startsWith('LUCKY'))) {
          await deleteCoupon(cleanCoupon);
          console.log(`[Order Route] 🗑️ Đã xóa vĩnh viễn mã giảm giá dùng 1 lần "${cleanCoupon}" sau khi số ${normalizedPhone} sử dụng thành công!`);
        }
      } catch (err) {
        console.error('Lỗi khi xóa mã giảm giá đã dùng:', err.message);
      }
    }

    // Update sales_count asynchronously
    for (const it of validatedItems) {
      try {
        const { data: cur } = await supabase.from('foods').select('sales_count').eq('id', it.food_id).maybeSingle();
        if (cur) {
          await supabase.from('foods').update({ sales_count: (cur.sales_count || 0) + it.quantity }).eq('id', it.food_id);
        }
      } catch (e) {}
    }

    // Emit socket event if io is available
    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('new_order', {
        ...order,
        ward: ward || '',
        items: validatedItems
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công! Quán Bếp Việt đang chuẩn bị món cho bạn.',
      order: {
        ...order,
        ward: ward || '',
        items: validatedItems
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET customer order history by phone
router.get('/user/:phone', async (req, res) => {
  try {
    const normalizedPhone = normalizePhone(req.params.phone);
    if (!normalizedPhone) {
      return res.status(400).json({ error: 'Số điện thoại không hợp lệ' });
    }

    if (!supabase) {
      return res.json({ success: true, orders: [] });
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('customer_phone', normalizedPhone)
      .order('id', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const formatted = (orders || []).map(o => ({
      ...o,
      items: o.order_items || []
    }));

    return res.json({ success: true, orders: formatted });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET all orders for Admin with filters (Yêu cầu quyền Quản Trị Viên)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;

    if (!supabase) {
      return res.json({ success: true, orders: [] });
    }

    // Tự động dọn dẹp các đơn đã hoàn thành/hủy từ ngày hôm trước khỏi Supabase
    await autoCleanupOldCompletedOrders();

    let q = supabase.from('orders').select('*, order_items(*)');

    if (status && status !== 'all' && status !== 'undefined' && status !== 'null') {
      q = q.eq('status', status);
    }

    if (search && search.trim() && search.trim() !== 'undefined' && search.trim() !== 'null') {
      const term = search.trim();
      q = q.or(`customer_phone.ilike.%${term}%,customer_name.ilike.%${term}%,order_code.ilike.%${term}%`);
    }

    q = q.order('id', { ascending: false });

    const { data: orders, error } = await q;
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const formatted = (orders || []).map(o => ({
      ...o,
      items: o.order_items || []
    }));

    return res.json({ success: true, orders: formatted });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET single order by ID
router.get('/:id', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !order) {
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }

    return res.json({
      success: true,
      order: {
        ...order,
        items: order.order_items || []
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH update order status (Chỉ Admin mới có quyền cập nhật trạng thái đơn)
router.patch('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Trạng thái không hợp lệ! Chỉ chấp nhận: ${validStatuses.join(', ')}`
      });
    }

    if (!supabase) {
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }

    const { data: updated, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select('*, order_items(*)')
      .maybeSingle();

    if (error || !updated) {
      return res.status(error ? 500 : 404).json({ error: error ? error.message : 'Đơn hàng không tồn tại' });
    }

    const orderFormatted = {
      ...updated,
      items: updated.order_items || []
    };

    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`room_${updated.customer_phone}`).to('admin_room').emit('order_status_updated', orderFormatted);
    }

    return res.json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công!',
      order: orderFormatted
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH /api/orders/:id/confirm - Admin explicitly confirms an order
router.patch('/:id/confirm', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!supabase) {
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }

    const { data: updated, error } = await supabase
      .from('orders')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, order_items(*)')
      .maybeSingle();

    if (error || !updated) {
      return res.status(error ? 500 : 404).json({ error: error ? error.message : 'Đơn hàng không tồn tại' });
    }

    const orderFormatted = {
      ...updated,
      items: updated.order_items || []
    };

    // Broadcast order_confirmed & order_status_updated to customer and admin
    const io = req.app.get('io');
    if (io) {
      io.to(`room_${updated.customer_phone}`).to('admin_room').emit('order_status_updated', orderFormatted);
      io.to(`room_${updated.customer_phone}`).to('admin_room').emit('order_confirmed', orderFormatted);
    }

    return res.json({
      success: true,
      message: 'Đã xác nhận đơn hàng thành công! Quán bắt đầu nấu món.',
      order: orderFormatted
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH /api/orders/:id/reject - Admin explicitly rejects / denies an order with a reason
router.patch('/:id/reject', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'Quán quá tải / Tạm ngưng phục vụ' } = req.body;

    if (!supabase) {
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }

    // Get current order note
    const { data: curOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!curOrder) {
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }

    const rejectionReason = (reason || 'Quán quá tải / Tạm ngưng phục vụ').trim();
    const updatedNote = curOrder.note
      ? `${curOrder.note} | [Quán từ chối: ${rejectionReason}]`
      : `[Quán từ chối: ${rejectionReason}]`;

    const { data: updated, error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        note: updatedNote,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, order_items(*)')
      .maybeSingle();

    if (error || !updated) {
      return res.status(error ? 500 : 404).json({ error: error ? error.message : 'Lỗi khi từ chối đơn hàng' });
    }

    const orderFormatted = {
      ...updated,
      items: updated.order_items || [],
      reject_reason: rejectionReason
    };

    // Broadcast order_rejected & order_status_updated
    const io = req.app.get('io');
    if (io) {
      io.to(`room_${updated.customer_phone}`).to('admin_room').emit('order_status_updated', orderFormatted);
      io.to(`room_${updated.customer_phone}`).emit('order_rejected', {
        orderId: updated.id,
        orderCode: updated.order_code,
        reason: rejectionReason
      });
    }

    return res.json({
      success: true,
      message: `Đã từ chối đơn hàng #${updated.order_code}!`,
      order: orderFormatted
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH /api/orders/:id/delivery-fee - Admin adjusts delivery fee for an order
router.patch('/:id/delivery-fee', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { delivery_fee } = req.body;
    if (delivery_fee === undefined || isNaN(Number(delivery_fee))) {
      return res.status(400).json({ error: 'Phí ship không hợp lệ' });
    }

    const newFee = Math.max(0, Number(delivery_fee));

    if (!supabase) {
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }

    // Get current order
    const { data: curOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!curOrder) return res.status(404).json({ error: 'Đơn hàng không tồn tại' });

    const newTotal = Math.max(0, Number(curOrder.subtotal) - Number(curOrder.discount || 0) + newFee);

    const { data: updated, error } = await supabase
      .from('orders')
      .update({
        delivery_fee: newFee,
        total_amount: newTotal,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, order_items(*)')
      .maybeSingle();

    if (error || !updated) {
      return res.status(error ? 500 : 404).json({ error: error ? error.message : 'Lỗi cập nhật phí ship' });
    }

    const orderFormatted = { ...updated, items: updated.order_items || [] };

    const io = req.app.get('io');
    if (io) {
      io.to(`room_${updated.customer_phone}`).to('admin_room').emit('order_status_updated', orderFormatted);
    }

    return res.json({
      success: true,
      message: `Đã cập nhật phí ship thành ${newFee.toLocaleString('vi-VN')} ₫`,
      order: orderFormatted
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH /api/orders/:id/cancel - Customer cancels their order (only if pending or confirmed)
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    if (!supabase) {
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }

    // Get current order status
    const { data: curOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!curOrder) {
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }

    // Only allow cancellation when status is 'pending' or 'confirmed'
    if (curOrder.status !== 'pending' && curOrder.status !== 'confirmed') {
      return res.status(400).json({
        error: 'Không thể hủy đơn hàng! Bếp đã bắt đầu nấu món hoặc đơn đã được giao. Vui lòng liên hệ hotline 0353859726 nếu cần hỗ trợ.'
      });
    }

    const { data: updated, error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, order_items(*)')
      .maybeSingle();

    if (error || !updated) {
      return res.status(error ? 500 : 404).json({ error: error ? error.message : 'Lỗi khi hủy đơn hàng' });
    }

    const orderFormatted = { ...updated, items: updated.order_items || [] };

    const io = req.app.get('io');
    if (io) {
      io.to(`room_${updated.customer_phone}`).to('admin_room').emit('order_status_updated', orderFormatted);
    }

    return res.json({
      success: true,
      message: 'Đã hủy đơn hàng thành công!',
      order: orderFormatted
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/orders/cleanup-old - Chủ động dọn dẹp các đơn hàng cũ đã hoàn thành/hủy từ ngày hôm trước (Admin only)
router.post('/cleanup-old', requireAdmin, async (req, res) => {
  try {
    const result = await autoCleanupOldCompletedOrders();
    return res.json({
      success: true,
      message: `Đã dọn dẹp thành công! Đã xóa ${result.deletedCount} đơn hàng cũ đã hoàn thành/hủy khỏi Supabase.`,
      deletedCount: result.deletedCount,
      deletedOrders: result.deletedOrders || []
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH /api/orders/:id/switch-cod - Khách đổi sang trả Tiền Mặt khi nhận hàng (COD)
router.patch('/:id/switch-cod', async (req, res) => {
  try {
    const { id } = req.params;
    if (!supabase) return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    const { data: updated, error } = await supabase
      .from('orders')
      .update({
        payment_method: 'COD',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, order_items(*)')
      .maybeSingle();

    if (error || !updated) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    const formatted = { ...updated, items: updated.order_items || [] };
    const io = req.app.get('io');
    if (io) {
      io.to(`room_${updated.customer_phone}`).to('admin_room').emit('order_status_updated', formatted);
    }
    return res.json({
      success: true,
      order: formatted,
      message: 'Đã đổi sang thanh toán Tiền Mặt (COD) thành công! Shipper sẽ thu tiền khi giao.'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/orders/:id/notify-transfer - Khách bấm "Tôi đã chuyển khoản" -> Báo chủ quán check Techcombank
router.patch('/:id/notify-transfer', async (req, res) => {
  try {
    const { id } = req.params;
    if (!supabase) return res.status(404).json({ error: 'Đơn hàng không tồn tại' });

    const { data: updated, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .maybeSingle();

    if (error || !updated) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    const formatted = { ...updated, items: updated.order_items || [] };

    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('customer_declared_payment', {
        orderId: updated.id,
        orderCode: updated.order_code,
        customerName: updated.customer_name,
        amount: updated.total_amount
      });
      io.to(`room_${updated.customer_phone}`).emit('order_status_updated', formatted);
    }

    return res.json({
      success: true,
      order: formatted,
      message: 'Đã gửi thông báo tới Bếp Việt! Quán đang kiểm tra tài khoản Techcombank.'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
