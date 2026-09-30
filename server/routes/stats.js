const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');
const { requireAdmin } = require('../middleware/authMiddleware');

// GET dashboard summary stats (Admin only)
router.get('/summary', requireAdmin, async (req, res) => {
  try {
    if (!supabase) {
      return res.json({
        success: true,
        stats: {
          totalRevenue: 0,
          totalOrders: 0,
          pendingOrders: 0,
          deliveringOrders: 0,
          completedOrders: 0,
          totalFoods: 0,
          totalCustomers: 0,
          topFoods: [],
          recentOrders: []
        }
      });
    }

    // 1. Fetch Orders
    const { data: ordersData, error: ordersErr } = await supabase
      .from('orders')
      .select('*')
      .order('id', { ascending: false });

    const allOrders = ordersData || [];
    const totalRevenue = allOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    const totalOrders = allOrders.length;
    const pendingOrders = allOrders.filter(o => o.status === 'pending').length;
    const deliveringOrders = allOrders.filter(o => o.status === 'delivering').length;
    const completedOrders = allOrders.filter(o => o.status === 'completed').length;

    // 2. Fetch Foods
    const { data: foodsData } = await supabase
      .from('foods')
      .select('*, categories(name)')
      .order('sales_count', { ascending: false });

    const allFoods = foodsData || [];
    const totalFoods = allFoods.length;
    const topFoods = allFoods.slice(0, 5).map(f => ({
      id: f.id,
      name: f.name,
      price: f.price,
      image: f.image,
      sales_count: f.sales_count || 0,
      category_name: f.categories ? f.categories.name : null
    }));

    // 3. Fetch Customers count
    const { data: customersData } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'customer');

    const totalCustomers = (customersData || []).length;

    // 4. Recent 5 orders
    const recentOrders = allOrders.slice(0, 5).map(o => ({
      id: o.id,
      order_code: o.order_code,
      customer_name: o.customer_name,
      customer_phone: o.customer_phone,
      total_amount: o.total_amount,
      payment_method: o.payment_method,
      status: o.status,
      created_at: o.created_at
    }));

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
