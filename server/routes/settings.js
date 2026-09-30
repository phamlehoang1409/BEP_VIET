const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

const SETTINGS_ROW_PHONE = 'STORE_SETTINGS';

// Default store settings
const DEFAULT_SETTINGS = {
  store_name: 'Bếp Việt Gourmet - Indomie Bar',
  hotline: '0353859726',
  open_time: '08:00',
  close_time: '23:00',
  is_open: true,
  delivery_area: 'Nội thành Hà Nội',
  delivery_fee_default: 15000,
  free_ship_threshold: 200000,
  address: 'Số 18, Phố Tràng Thi, Hoàn Kiếm, Hà Nội',
  announcement: '🌟 Bếp Việt Gourmet: Giao hàng hỏa tốc nội thành Hà Nội 30-45 phút. Mì Indomie thượng hạng!'
};

// In-memory cache for ultra-fast response
let cachedSettings = { ...DEFAULT_SETTINGS };

// Helper to load settings from Supabase
async function loadSettingsFromDb() {
  if (!supabase) return cachedSettings;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('name')
      .eq('phone', SETTINGS_ROW_PHONE)
      .eq('role', 'store_settings')
      .maybeSingle();

    if (data && data.name) {
      try {
        const parsed = JSON.parse(data.name);
        cachedSettings = { ...DEFAULT_SETTINGS, ...parsed };
      } catch (e) {}
    }
  } catch (err) {
    console.error('Error loading settings from DB:', err.message);
  }
  return cachedSettings;
}

// Initial load
loadSettingsFromDb().catch(() => {});

// GET current store settings
router.get('/', async (req, res) => {
  try {
    const settings = await loadSettingsFromDb();
    
    // Check if current time is within open hours
    const now = new Date();
    // Convert to Vietnam time (UTC+7)
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const vnMinutes = (utcHours * 60 + utcMinutes + 7 * 60) % (24 * 60);
    const [openH, openM] = (settings.open_time || '08:00').split(':').map(Number);
    const [closeH, closeM] = (settings.close_time || '23:00').split(':').map(Number);
    const openTotal = openH * 60 + (openM || 0);
    const closeTotal = closeH * 60 + (closeM || 0);

    // is_open is the admin manual override switch
    // When is_open = true, always open (admin controls)
    // When is_open = false, always closed (admin shut down)
    let isCurrentlyOpen = !!settings.is_open;

    return res.json({
      success: true,
      settings: {
        ...settings,
        is_currently_open: isCurrentlyOpen
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// PUT update store settings (Admin)
router.put('/', async (req, res) => {
  try {
    const {
      store_name,
      hotline,
      open_time,
      close_time,
      is_open,
      delivery_area,
      delivery_fee_default,
      free_ship_threshold,
      address,
      announcement
    } = req.body;

    const newSettings = {
      ...cachedSettings,
      store_name: store_name || cachedSettings.store_name,
      hotline: hotline || cachedSettings.hotline,
      open_time: open_time || cachedSettings.open_time,
      close_time: close_time || cachedSettings.close_time,
      is_open: is_open !== undefined ? !!is_open : cachedSettings.is_open,
      delivery_area: delivery_area || cachedSettings.delivery_area,
      delivery_fee_default: delivery_fee_default !== undefined ? Number(delivery_fee_default) : cachedSettings.delivery_fee_default,
      free_ship_threshold: free_ship_threshold !== undefined ? Number(free_ship_threshold) : cachedSettings.free_ship_threshold,
      address: address || cachedSettings.address,
      announcement: announcement !== undefined ? announcement : cachedSettings.announcement
    };

    cachedSettings = newSettings;

    if (supabase) {
      await supabase.from('users').upsert({
        phone: SETTINGS_ROW_PHONE,
        name: JSON.stringify(newSettings),
        role: 'store_settings'
      }, { onConflict: 'phone' });
    }

    // Broadcast updated settings to clients via socket if available
    const io = req.app.get('io');
    if (io) {
      io.emit('store_settings_updated', newSettings);
    }

    return res.json({
      success: true,
      message: 'Cập nhật cài đặt cửa hàng thành công!',
      settings: newSettings
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
