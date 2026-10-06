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

    // 4. Recent 5 orders (with items for instant printing)
    const { data: recentOrdersWithItems } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('id', { ascending: false })
      .limit(6);

    const recentOrders = (recentOrdersWithItems || allOrders.slice(0, 6)).map(o => ({
      id: o.id,
      order_code: o.order_code,
      customer_name: o.customer_name,
      customer_phone: o.customer_phone,
      delivery_address: o.delivery_address,
      notes: o.notes,
      total_amount: o.total_amount,
      subtotal: o.subtotal,
      delivery_fee: o.delivery_fee,
      discount_amount: o.discount_amount || o.discount,
      insurance_fee: o.insurance_fee,
      payment_method: o.payment_method,
      status: o.status,
      created_at: o.created_at,
      items: o.order_items || []
    }));

    // 5. Compute daily revenue for the last 7 days
    const last7Days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('vi-VN', { weekday: 'short' });
      const displayDate = `${d.getDate()}/${d.getMonth() + 1}`;

      const dayOrders = allOrders.filter(o => {
        if (!o.created_at) return false;
        const oDate = o.created_at.split('T')[0];
        return oDate === dayStr && o.status !== 'cancelled';
      });

      const dayRevenue = dayOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      last7Days.push({
        dateKey: dayStr,
        dayName,
        displayDate,
        revenue: dayRevenue,
        orderCount: dayOrders.length
      });
    }

    // 6. Detailed status breakdown
    const statusBreakdown = {
      pending: pendingOrders,
      preparing: allOrders.filter(o => o.status === 'preparing').length,
      delivering: deliveringOrders,
      completed: completedOrders,
      cancelled: allOrders.filter(o => o.status === 'cancelled').length
    };

    const avgOrderValue = completedOrders > 0
      ? Math.round(totalRevenue / (completedOrders || 1))
      : 0;

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
        avgOrderValue,
        topFoods,
        recentOrders,
        last7Days,
        statusBreakdown
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
