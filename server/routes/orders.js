const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../db/database');

const VN_PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

function normalizePhone(phone) {
  if (!phone) return '';
  let cleaned = phone.trim().replace(/\s+/g, '').replace(/-/g, '');
  if (cleaned.startsWith('+84')) {
    cleaned = '0' + cleaned.slice(3);
  }
  return cleaned;
}

// Generate human-friendly order code (e.g. ORD-2609-4821)
function generateOrderCode() {
  const date = new Date();
  const dateStr = `${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  const randomStr = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${dateStr}-${randomStr}`;
}

// Place a new order
router.post('/', (req, res) => {
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
      discount = 0
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

    // Calculate subtotal
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const food = queryOne('SELECT * FROM foods WHERE id = ?', [item.food_id]);
      if (!food) {
        return res.status(400).json({ error: `Món ăn mã #${item.food_id} không tồn tại!` });
      }
      if (food.is_available === 0) {
        return res.status(400).json({ error: `Món "${food.name}" hiện đang tạm hết, vui lòng chọn món khác!` });
      }

      const qty = Math.max(1, parseInt(item.quantity) || 1);
      const itemTotal = food.price * qty;
      subtotal += itemTotal;

      validatedItems.push({
        food_id: food.id,
        food_name: food.name,
        food_image: food.image,
        price: food.price,
        quantity: qty,
        total: itemTotal
      });
    }

    const delivery_fee = subtotal >= 250000 ? 0 : 15000;
    const total_amount = Math.max(0, subtotal - Number(discount) + delivery_fee);
    const order_code = generateOrderCode();

    // Find or link user
    let user = queryOne('SELECT id FROM users WHERE phone = ?', [normalizedPhone]);
    let userId = user ? user.id : null;
    if (!userId) {
      const uRes = run(
        'INSERT INTO users (phone, name, address, province, district, ward) VALUES (?, ?, ?, ?, ?, ?)',
        [normalizedPhone, customer_name.trim(), delivery_address.trim(), province || '', district || '', ward || '']
      );
      userId = Number(uRes.lastInsertRowid);
    } else {
      // Update latest address
      run(
        'UPDATE users SET address = ?, province = ?, district = ?, ward = ? WHERE id = ?',
        [delivery_address.trim(), province || '', district || '', ward || '', userId]
      );
    }

    // Full delivery address string
    const fullAddress = [delivery_address.trim(), ward, district, province].filter(Boolean).join(', ');

    // Insert Order
    const orderRes = run(`
      INSERT INTO orders (
        order_code, user_id, customer_name, customer_phone, delivery_address,
        province, district, note, subtotal, discount, delivery_fee, total_amount, payment_method, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      order_code,
      userId,
      customer_name.trim(),
      normalizedPhone,
      fullAddress,
      province || '',
      district || '',
      note ? note.trim() : '',
      subtotal,
      Number(discount),
      delivery_fee,
      total_amount,
      payment_method || 'COD'
    ]);

    const orderId = Number(orderRes.lastInsertRowid);

    // Insert Items
    const insertItem = queryOne ? (foodItem) => {
      run(`
        INSERT INTO order_items (order_id, food_id, food_name, food_image, price, quantity, total)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [orderId, foodItem.food_id, foodItem.food_name, foodItem.food_image, foodItem.price, foodItem.quantity, foodItem.total]);

      // Update sales count
      run('UPDATE foods SET sales_count = sales_count + ? WHERE id = ?', [foodItem.quantity, foodItem.food_id]);
    } : null;

    for (const item of validatedItems) {
      insertItem(item);
    }

    const createdOrder = queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);
    createdOrder.items = validatedItems;

    // Emit Socket notification to Admin
    const io = req.app.get('io');
    if (io) {
      io.to('admin_room').emit('new_order', createdOrder);
    }

    return res.status(201).json({
      success: true,
      message: 'Đặt món thành công! Bếp Việt đang chuẩn bị món ăn cho bạn.',
      order: createdOrder
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET all orders (for Admin)
router.get('/', (req, res) => {
  try {
    const { status, search, limit = 50 } = req.query;
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (search && search.trim()) {
      sql += ' AND (order_code LIKE ? OR customer_phone LIKE ? OR customer_name LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY id DESC LIMIT ?';
    params.push(Number(limit));

    const orders = query(sql, params);

    // Attach items to each order
    for (const order of orders) {
      order.items = query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    }

    return res.json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET customer orders by phone
router.get('/user/:phone', (req, res) => {
  try {
    const normalized = normalizePhone(req.params.phone);
    const orders = query('SELECT * FROM orders WHERE customer_phone = ? ORDER BY id DESC', [normalized]);

    for (const order of orders) {
      order.items = query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    }

    return res.json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET order by order_code or ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    let order;
    if (isNaN(id)) {
      order = queryOne('SELECT * FROM orders WHERE order_code = ?', [id]);
    } else {
      order = queryOne('SELECT * FROM orders WHERE id = ? OR order_code = ?', [id, id]);
    }

    if (!order) {
      return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    }

    order.items = query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    return res.json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH update order status
router.patch('/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'preparing', 'delivering', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Trạng thái đơn hàng không hợp lệ' });
    }

    const order = queryOne('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }

    run(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    const updated = queryOne('SELECT * FROM orders WHERE id = ?', [id]);
    updated.items = query('SELECT * FROM order_items WHERE order_id = ?', [id]);

    // Notify Customer and Admin via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`room_${order.customer_phone}`).emit('order_status_updated', updated);
      io.to('admin_room').emit('order_status_updated', updated);
    }

    return res.json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công!',
      order: updated
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
