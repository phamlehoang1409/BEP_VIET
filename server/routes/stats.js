const express = require('express');
const router = express.Router();
const { query, queryOne } = require('../db/database');

// GET dashboard summary stats
router.get('/summary', (req, res) => {
  try {
    const totalRevenueRow = queryOne(`
      SELECT SUM(total_amount) as total_revenue
      FROM orders
      WHERE status != 'cancelled'
    `);
    const totalRevenue = totalRevenueRow ? totalRevenueRow.total_revenue || 0 : 0;

    const totalOrdersRow = queryOne('SELECT COUNT(*) as count FROM orders');
    const totalOrders = totalOrdersRow ? totalOrdersRow.count : 0;

    const pendingOrdersRow = queryOne('SELECT COUNT(*) as count FROM orders WHERE status = "pending"');
    const pendingOrders = pendingOrdersRow ? pendingOrdersRow.count : 0;

    const deliveringOrdersRow = queryOne('SELECT COUNT(*) as count FROM orders WHERE status = "delivering"');
    const deliveringOrders = deliveringOrdersRow ? deliveringOrdersRow.count : 0;

    const completedOrdersRow = queryOne('SELECT COUNT(*) as count FROM orders WHERE status = "completed"');
    const completedOrders = completedOrdersRow ? completedOrdersRow.count : 0;

    const totalFoodsRow = queryOne('SELECT COUNT(*) as count FROM foods');
    const totalFoods = totalFoodsRow ? totalFoodsRow.count : 0;

    const totalCustomersRow = queryOne('SELECT COUNT(*) as count FROM users WHERE role = "customer"');
    const totalCustomers = totalCustomersRow ? totalCustomersRow.count : 0;

    // Top 5 best selling foods
    const topFoods = query(`
      SELECT f.id, f.name, f.price, f.image, f.sales_count, c.name as category_name
      FROM foods f
      LEFT JOIN categories c ON f.category_id = c.id
      ORDER BY f.sales_count DESC
      LIMIT 5
    `);

    // Recent 5 orders
    const recentOrders = query(`
      SELECT id, order_code, customer_name, customer_phone, total_amount, payment_method, status, created_at
      FROM orders
      ORDER BY id DESC
      LIMIT 5
    `);

    return res.json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        pendingOrders,
        deliveringOrders,
        completedOrders,
        totalFoods,
        totalCustomers,
        topFoods,
        recentOrders
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
