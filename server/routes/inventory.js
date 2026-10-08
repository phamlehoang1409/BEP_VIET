const express = require('express');
const router = express.Router();
const inventoryService = require('../services/inventoryService');

// GET /api/inventory/summary
router.get('/summary', async (req, res) => {
  try {
    const ingredients = await inventoryService.getIngredients();
    const totalItems = ingredients.length;
    const lowStockItems = ingredients.filter(i => i.stock_quantity <= i.min_threshold && i.stock_quantity > 0);
    const outOfStockItems = ingredients.filter(i => i.stock_quantity === 0);
    const totalInventoryValue = ingredients.reduce((sum, i) => sum + (i.stock_quantity * (i.cost_price || 0)), 0);

    return res.json({
      success: true,
      summary: {
        totalItems,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        totalInventoryValue,
        lowStockItems,
        outOfStockItems
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/inventory/ingredients
router.get('/ingredients', async (req, res) => {
  try {
    const ingredients = await inventoryService.getIngredients();
    return res.json({ success: true, ingredients });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/inventory/ingredients
router.post('/ingredients', async (req, res) => {
  try {
    const { name, unit, stock_quantity, min_threshold, cost_price, supplier, category } = req.body;
    if (!name || !unit) {
      return res.status(400).json({ error: 'Tên nguyên liệu và đơn vị tính là bắt buộc' });
    }

    const ingredients = await inventoryService.getIngredients();
    const newIngredient = {
      id: `ing_${Date.now()}`,
      name: name.trim(),
      unit: unit.trim(),
      stock_quantity: Number(stock_quantity) || 0,
      min_threshold: Number(min_threshold) || 10,
      cost_price: Number(cost_price) || 0,
      supplier: supplier ? supplier.trim() : '',
      category: category ? category.trim() : 'Khác',
      updated_at: new Date().toISOString()
    };

    ingredients.push(newIngredient);
    await inventoryService.saveIngredients(ingredients);
    await inventoryService.addLog({
      type: 'ADD_INGREDIENT',
      description: `Thêm nguyên liệu mới: ${newIngredient.name} (${newIngredient.stock_quantity} ${newIngredient.unit})`
    });

    return res.json({ success: true, ingredient: newIngredient });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PUT /api/inventory/ingredients/:id
router.put('/ingredients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, unit, min_threshold, cost_price, supplier, category } = req.body;
    const ingredients = await inventoryService.getIngredients();
    const idx = ingredients.findIndex(i => i.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: 'Không tìm thấy nguyên liệu' });
    }

    ingredients[idx] = {
      ...ingredients[idx],
      name: name ? name.trim() : ingredients[idx].name,
      unit: unit ? unit.trim() : ingredients[idx].unit,
      min_threshold: min_threshold !== undefined ? Number(min_threshold) : ingredients[idx].min_threshold,
      cost_price: cost_price !== undefined ? Number(cost_price) : ingredients[idx].cost_price,
      supplier: supplier !== undefined ? supplier.trim() : ingredients[idx].supplier,
      category: category !== undefined ? category.trim() : ingredients[idx].category,
      updated_at: new Date().toISOString()
    };

    await inventoryService.saveIngredients(ingredients);
    return res.json({ success: true, ingredient: ingredients[idx] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/inventory/ingredients/:id/restock
router.post('/ingredients/:id/restock', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, note = '' } = req.body;
    const qtyToAdd = Number(quantity);

    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      return res.status(400).json({ error: 'Số lượng nhập kho phải lớn hơn 0' });
    }

    const ingredients = await inventoryService.getIngredients();
    const idx = ingredients.findIndex(i => i.id === id);

    if (idx === -1) {
      return res.status(404).json({ error: 'Không tìm thấy nguyên liệu' });
    }

    const oldStock = ingredients[idx].stock_quantity;
    ingredients[idx].stock_quantity += qtyToAdd;
    ingredients[idx].updated_at = new Date().toISOString();

    await inventoryService.saveIngredients(ingredients);
    await inventoryService.addLog({
      type: 'RESTOCK',
      description: `Nhập kho +${qtyToAdd} ${ingredients[idx].unit} "${ingredients[idx].name}" (Tồn mới: ${ingredients[idx].stock_quantity})`,
      note
    });

    return res.json({ success: true, ingredient: ingredients[idx], message: `Nhập kho thành công +${qtyToAdd} ${ingredients[idx].unit}` });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// DELETE /api/inventory/ingredients/:id
router.delete('/ingredients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let ingredients = await inventoryService.getIngredients();
    const target = ingredients.find(i => i.id === id);
    if (!target) {
      return res.status(404).json({ error: 'Không tìm thấy nguyên liệu' });
    }

    ingredients = ingredients.filter(i => i.id !== id);
    await inventoryService.saveIngredients(ingredients);
    await inventoryService.addLog({
      type: 'DELETE_INGREDIENT',
      description: `Xóa nguyên liệu: ${target.name}`
    });

    return res.json({ success: true, message: `Đã xóa nguyên liệu "${target.name}"` });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/inventory/recipes
router.get('/recipes', async (req, res) => {
  try {
    const recipes = await inventoryService.getRecipes();
    return res.json({ success: true, recipes });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/inventory/recipes
router.post('/recipes', async (req, res) => {
  try {
    const { food_name, ingredients_required } = req.body;
    if (!food_name || !Array.isArray(ingredients_required)) {
      return res.status(400).json({ error: 'Tên món ăn và danh sách nguyên liệu định lượng là bắt buộc' });
    }

    const recipes = await inventoryService.getRecipes();
    recipes[food_name] = ingredients_required;
    await inventoryService.saveRecipes(recipes);

    await inventoryService.addLog({
      type: 'UPDATE_RECIPE',
      description: `Cập nhật công thức định lượng cho món: "${food_name}" (${ingredients_required.length} nguyên liệu)`
    });

    return res.json({ success: true, recipes, message: `Đã lưu công thức cho món "${food_name}"` });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/inventory/logs
router.get('/logs', async (req, res) => {
  try {
    const logs = await inventoryService.getLogs();
    return res.json({ success: true, logs });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
