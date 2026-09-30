const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

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

    const total_amount = Math.max(0, subtotal - Number(discount) + delivery_fee);
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

// GET all orders for Admin with filters
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;

    if (!supabase) {
      return res.json({ success: true, orders: [] });
    }

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

// PATCH update order status
router.patch('/:id/status', async (req, res) => {
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
router.patch('/:id/confirm', async (req, res) => {
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

// PATCH /api/orders/:id/delivery-fee - Admin adjusts delivery fee for an order
router.patch('/:id/delivery-fee', async (req, res) => {
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

module.exports = router;
