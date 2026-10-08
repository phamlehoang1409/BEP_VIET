const supabase = require('../db/supabase');

// Default starter ingredients for Bếp Việt
const DEFAULT_INGREDIENTS = [
  {
    id: 'ing_1',
    name: 'Vắt Mì Indomie Goreng',
    unit: 'gói',
    stock_quantity: 150,
    min_threshold: 30,
    cost_price: 5500,
    supplier: 'Công ty Thực phẩm Indofood',
    category: 'Mì & Tinh bột',
    updated_at: new Date().toISOString()
  },
  {
    id: 'ing_2',
    name: 'Thịt Bò Mỹ Cắt Lát',
    unit: 'gram',
    stock_quantity: 5000, // 5kg
    min_threshold: 1000,
    cost_price: 280, // 280đ / gram (~280k/kg)
    supplier: 'Nhà cung cấp Thịt Bò Sạch Hà Nội',
    category: 'Thịt & Hải sản',
    updated_at: new Date().toISOString()
  },
  {
    id: 'ing_3',
    name: 'Trứng Gà Tươi Ba Huân',
    unit: 'quả',
    stock_quantity: 120,
    min_threshold: 25,
    cost_price: 3200,
    supplier: 'Trang trại Trứng Sạch',
    category: 'Trứng & Đạm',
    updated_at: new Date().toISOString()
  },
  {
    id: 'ing_4',
    name: 'Thịt Xá Xíu Quay Mật Ong',
    unit: 'gram',
    stock_quantity: 3500,
    min_threshold: 800,
    cost_price: 220,
    supplier: 'Lò Quay Gia Truyền Bếp Việt',
    category: 'Thịt & Hải sản',
    updated_at: new Date().toISOString()
  },
  {
    id: 'ing_5',
    name: 'Mực & Tôm Sa Tế Tươi',
    unit: 'gram',
    stock_quantity: 2500,
    min_threshold: 600,
    cost_price: 320,
    supplier: 'Hải Sản Biển Hải Phòng',
    category: 'Thịt & Hải sản',
    updated_at: new Date().toISOString()
  },
  {
    id: 'ing_6',
    name: 'Nem Chua Rán Tươi Phố Cổ',
    unit: 'chiếc',
    stock_quantity: 80,
    min_threshold: 20,
    cost_price: 4500,
    supplier: 'Nem Chua Phố Cổ Hà Nội',
    category: 'Đồ Ăn Vặt',
    updated_at: new Date().toISOString()
  },
  {
    id: 'ing_7',
    name: 'Khoai Tây Cắt Sợi',
    unit: 'gram',
    stock_quantity: 6000,
    min_threshold: 1500,
    cost_price: 65,
    supplier: 'Đại lý Nông Sản Sạch',
    category: 'Đồ Ăn Vặt',
    updated_at: new Date().toISOString()
  },
  {
    id: 'ing_8',
    name: 'Tắc Tươi Vườn',
    unit: 'gram',
    stock_quantity: 3000,
    min_threshold: 500,
    cost_price: 40,
    supplier: 'Vườn Tắc Hưng Yên',
    category: 'Trà & Giải Khát',
    updated_at: new Date().toISOString()
  },
  {
    id: 'ing_9',
    name: 'Hộp Giấy & Đũa Muỗng Sinh Thái',
    unit: 'bộ',
    stock_quantity: 200,
    min_threshold: 50,
    cost_price: 2200,
    supplier: 'Bao Bì Xanh Việt Nam',
    category: 'Bao Bì & Đóng Gói',
    updated_at: new Date().toISOString()
  }
];

// Default recipe mappings: food_id or food_name pattern -> ingredients required
const DEFAULT_RECIPES = {
  // Mì bò trứng: 1 gói mì, 100g thịt bò, 1 quả trứng, 1 bộ hộp
  'Mì Indomie Trộn Bò Trứng': [
    { ingredient_id: 'ing_1', quantity_required: 1, name: 'Vắt Mì Indomie' },
    { ingredient_id: 'ing_2', quantity_required: 100, name: 'Thịt Bò Mỹ (100g)' },
    { ingredient_id: 'ing_3', quantity_required: 1, name: 'Trứng Gà (1 quả)' },
    { ingredient_id: 'ing_9', quantity_required: 1, name: 'Hộp Giấy & Đũa' }
  ],
  // Mì xá xíu: 1 gói mì, 120g xá xíu, 1 bộ hộp
  'Mì Indomie Xá Xíu Quay Mật Ong': [
    { ingredient_id: 'ing_1', quantity_required: 1, name: 'Vắt Mì Indomie' },
    { ingredient_id: 'ing_4', quantity_required: 120, name: 'Thịt Xá Xíu (120g)' },
    { ingredient_id: 'ing_9', quantity_required: 1, name: 'Hộp Giấy & Đũa' }
  ],
  // Mì hải sản sa tế: 1 gói mì, 100g mực tôm sa tế, 1 bộ hộp
  'Mì Indomie Hải Sản Sa Tế Cay': [
    { ingredient_id: 'ing_1', quantity_required: 1, name: 'Vắt Mì Indomie' },
    { ingredient_id: 'ing_5', quantity_required: 100, name: 'Mực & Tôm Sa Tế (100g)' },
    { ingredient_id: 'ing_9', quantity_required: 1, name: 'Hộp Giấy & Đũa' }
  ],
  // Nem chua rán: 5 chiếc nem chua, 1 bộ hộp
  'Nem Chua Rán Phố Cổ (5 chiếc)': [
    { ingredient_id: 'ing_6', quantity_required: 5, name: 'Nem Chua Rán (5 chiếc)' },
    { ingredient_id: 'ing_9', quantity_required: 1, name: 'Hộp Giấy & Đũa' }
  ],
  // Khoai tây chiên: 150g khoai tây, 1 bộ hộp
  'Khoai Tây Chiên Lắc Phô Mai': [
    { ingredient_id: 'ing_7', quantity_required: 150, name: 'Khoai Tây (150g)' },
    { ingredient_id: 'ing_9', quantity_required: 1, name: 'Hộp Giấy & Đũa' }
  ],
  // Trà tắc: 50g tắc tươi
  'Trà Tắc Khổng Lồ Mật Ong': [
    { ingredient_id: 'ing_8', quantity_required: 50, name: 'Tắc Tươi (50g)' }
  ]
};

const INGREDIENTS_STORE_KEY = 'STORE_INVENTORY_INGREDIENTS';
const RECIPES_STORE_KEY = 'STORE_INVENTORY_RECIPES';
const INVENTORY_LOGS_KEY = 'STORE_INVENTORY_LOGS';

class InventoryService {
  async getIngredients() {
    try {
      if (supabase) {
        const { data } = await supabase
          .from('users')
          .select('name')
          .eq('phone', INGREDIENTS_STORE_KEY)
          .eq('role', 'inventory_ingredients')
          .maybeSingle();

        if (data && data.name) {
          return JSON.parse(data.name);
        }
      }
    } catch (e) {
      console.error('Error fetching ingredients from DB:', e);
    }
    return DEFAULT_INGREDIENTS;
  }

  async saveIngredients(ingredients) {
    if (supabase) {
      await supabase.from('users').upsert(
        {
          phone: INGREDIENTS_STORE_KEY,
          role: 'inventory_ingredients',
          name: JSON.stringify(ingredients)
        },
        { onConflict: 'phone' }
      );
    }
    return ingredients;
  }

  async getRecipes() {
    try {
      if (supabase) {
        const { data } = await supabase
          .from('users')
          .select('name')
          .eq('phone', RECIPES_STORE_KEY)
          .eq('role', 'inventory_recipes')
          .maybeSingle();

        if (data && data.name) {
          return JSON.parse(data.name);
        }
      }
    } catch (e) {
      console.error('Error fetching recipes from DB:', e);
    }
    return DEFAULT_RECIPES;
  }

  async saveRecipes(recipes) {
    if (supabase) {
      await supabase.from('users').upsert(
        {
          phone: RECIPES_STORE_KEY,
          role: 'inventory_recipes',
          name: JSON.stringify(recipes)
        },
        { onConflict: 'phone' }
      );
    }
    return recipes;
  }

  async getLogs() {
    try {
      if (supabase) {
        const { data } = await supabase
          .from('users')
          .select('name')
          .eq('phone', INVENTORY_LOGS_KEY)
          .eq('role', 'inventory_logs')
          .maybeSingle();

        if (data && data.name) {
          return JSON.parse(data.name);
        }
      }
    } catch (e) {
      console.error('Error fetching inventory logs:', e);
    }
    return [];
  }

  async addLog(logEntry) {
    const logs = await this.getLogs();
    logs.unshift({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...logEntry
    });
    // Keep last 100 logs
    const trimmedLogs = logs.slice(0, 100);
    if (supabase) {
      await supabase.from('users').upsert(
        {
          phone: INVENTORY_LOGS_KEY,
          role: 'inventory_logs',
          name: JSON.stringify(trimmedLogs)
        },
        { onConflict: 'phone' }
      );
    }
    return trimmedLogs;
  }

  // Deduct stock for items in an order and check if any food runs out
  async deductStockForOrder(orderCode, items = []) {
    if (!items || items.length === 0) return { deducted: false };

    const ingredients = await this.getIngredients();
    const recipes = await this.getRecipes();
    const deductedIngredients = [];
    const outOfStockFoodNames = [];

    for (const item of items) {
      const foodName = item.food_name || item.name;
      const qty = Number(item.quantity) || 1;

      // Find matching recipe by exact name or partial match
      let recipe = recipes[foodName];
      if (!recipe) {
        const matchedKey = Object.keys(recipes).find((k) =>
          foodName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(foodName.toLowerCase())
        );
        if (matchedKey) recipe = recipes[matchedKey];
      }

      if (recipe && Array.isArray(recipe)) {
        for (const req of recipe) {
          const totalReqQty = req.quantity_required * qty;
          const ingIndex = ingredients.findIndex((i) => i.id === req.ingredient_id);

          if (ingIndex > -1) {
            const ing = ingredients[ingIndex];
            const oldStock = ing.stock_quantity;
            ing.stock_quantity = Math.max(0, ing.stock_quantity - totalReqQty);
            ing.updated_at = new Date().toISOString();

            deductedIngredients.push({
              name: ing.name,
              used: totalReqQty,
              remaining: ing.stock_quantity,
              unit: ing.unit
            });

            // Check if stock reached 0
            if (ing.stock_quantity === 0) {
              outOfStockFoodNames.push(foodName);
            }
          }
        }
      }
    }

    if (deductedIngredients.length > 0) {
      await this.saveIngredients(ingredients);
      await this.addLog({
        type: 'ORDER_DEDUCT',
        order_code: orderCode,
        description: `Tự động trừ nguyên liệu cho đơn #${orderCode}`,
        details: deductedIngredients
      });
    }

    return {
      deducted: true,
      deductedIngredients,
      outOfStockFoodNames
    };
  }
}

module.exports = new InventoryService();
