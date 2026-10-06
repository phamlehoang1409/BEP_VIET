import React, { createContext, useContext, useState, useEffect } from 'react';
import { validateCoupon, getStoreSettings, getSocket } from '../api';
import StoreClosedModal from '../components/StoreClosedModal';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('bepviet_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');

  // Store Closed Modal state (Center modal for both Mobile & Desktop)
  const [isStoreClosedModalOpen, setIsStoreClosedModalOpen] = useState(false);
  const [storeClosedCustomMsg, setStoreClosedCustomMsg] = useState('');

  const showStoreClosedModal = (msg = '') => {
    setStoreClosedCustomMsg(msg);
    setIsStoreClosedModalOpen(true);
  };

  const closeStoreClosedModal = () => {
    setIsStoreClosedModalOpen(false);
  };

  // Store Settings (Dynamic shipping fee & free ship threshold configured by Admin)
  const [storeSettings, setStoreSettings] = useState({
    delivery_fee_default: 15000,
    free_ship_threshold: 200000,
    is_currently_open: true
  });

  // Load store settings on mount
  useEffect(() => {
    getStoreSettings()
      .then((res) => {
        if (res.success && res.settings) {
          setStoreSettings(res.settings);
        }
      })
      .catch(() => {});
  }, []);

  // Listen to store settings updates in real time
  useEffect(() => {
    const socket = getSocket();
    const handleSettingsUpdated = (newSettings) => {
      if (newSettings) {
        setStoreSettings((prev) => ({ ...prev, ...newSettings }));
      }
    };

    socket.on('store_settings_updated', handleSettingsUpdated);
    return () => socket.off('store_settings_updated', handleSettingsUpdated);
  }, []);

  useEffect(() => {
    localStorage.setItem('bepviet_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (food, quantity = 1, note = '') => {
    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.food.id === food.id);
      if (existingIndex > -1) {
        const next = [...prevItems];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
          note: note || next[existingIndex].note
        };
        return next;
      } else {
        return [...prevItems, { food, quantity, note }];
      }
    });
  };

  const removeFromCart = (foodId) => {
    setCartItems((prev) => prev.filter((item) => item.food.id !== foodId));
  };

  const updateQuantity = (foodId, qty) => {
    if (qty <= 0) {
      removeFromCart(foodId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.food.id === foodId ? { ...item, quantity: qty } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setPromoCode('');
    setDiscount(0);
    setPromoMessage('');
  };

  const reorderItems = (orderItems) => {
    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) return 0;
    setCartItems((prevItems) => {
      const next = [...prevItems];
      for (const item of orderItems) {
        const foodId = item.food_id || item.id || item.food?.id;
        const foodObj = {
          id: foodId,
          name: item.food_name || item.name,
          price: Number(item.price) || 0,
          image: item.food_image || item.image || item.food?.image,
          is_available: true
        };
        const qty = Number(item.quantity) || 1;
        const existingIdx = next.findIndex((ci) => ci.food.id === foodId);
        if (existingIdx > -1) {
          next[existingIdx] = {
            ...next[existingIdx],
            quantity: next[existingIdx].quantity + qty
          };
        } else {
          next.push({ food: foodObj, quantity: qty, note: item.note || '' });
        }
      }
      return next;
    });
    return orderItems.length;
  };

  // Subtotal calculation
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.food.price * item.quantity,
    0
  );

  // Dynamic delivery fee based on Admin store settings (NOT hardcoded 15k)
  const baseShippingFee =
    storeSettings.delivery_fee_default !== undefined
      ? Number(storeSettings.delivery_fee_default)
      : 15000;

  const freeShipThreshold =
    storeSettings.free_ship_threshold !== undefined
      ? Number(storeSettings.free_ship_threshold)
      : 200000;

  const deliveryFee =
    subtotal === 0 || (freeShipThreshold > 0 && subtotal >= freeShipThreshold)
      ? 0
      : baseShippingFee;

  // Remove applied promo voucher
  const removePromo = () => {
    setPromoCode('');
    setDiscount(0);
    setPromoMessage('');
  };

  // Apply promo vouchers using backend validation (Strictly 1 coupon per order)
  const applyPromo = async (code, phone = '') => {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      removePromo();
      return { success: false, message: 'Vui lòng nhập mã giảm giá' };
    }

    const previousCode = promoCode;

    try {
      const res = await validateCoupon(cleanCode, subtotal, phone);
      if (res.success) {
        setPromoCode(cleanCode);
        setDiscount(res.discount_amount || 0);
        const replaceNote = (previousCode && previousCode !== cleanCode)
          ? ` (thay thế mã ${previousCode})`
          : '';
        const msg = res.message 
          ? `${res.message}${replaceNote}`
          : `Đã áp dụng mã ${cleanCode}${replaceNote}! (Mỗi đơn áp dụng tối đa 1 mã)`;
        setPromoMessage(msg);
        return { 
          success: true, 
          discount: res.discount_amount, 
          replaced: !!(previousCode && previousCode !== cleanCode),
          previousCode,
          code: cleanCode,
          message: msg
        };
      } else {
        setDiscount(0);
        setPromoMessage(res.error || 'Mã không hợp lệ');
        return { success: false, message: res.error };
      }
    } catch (err) {
      // Offline fallback checks for default codes
      if (cleanCode === 'INDOMIE20') {
        if (subtotal < 80000) {
          setDiscount(0);
          setPromoMessage('Mã INDOMIE20 áp dụng cho đơn từ 80.000 ₫');
          return { success: false, message: 'Đơn hàng chưa đạt mức tối thiểu' };
        }
        const disc = Math.min(50000, Math.round(subtotal * 0.2));
        setPromoCode('INDOMIE20');
        setDiscount(disc);
        const replaceNote = (previousCode && previousCode !== 'INDOMIE20') ? ` (thay thế mã ${previousCode})` : '';
        const msg = `Đã áp dụng giảm 20% (-${disc.toLocaleString('vi-VN')} ₫)${replaceNote}!`;
        setPromoMessage(msg);
        return { success: true, discount: disc, replaced: !!(previousCode && previousCode !== 'INDOMIE20'), code: 'INDOMIE20', message: msg };
      }
      if (cleanCode === 'HANOI15K') {
        const disc = Math.min(baseShippingFee || 15000, 15000);
        setPromoCode('HANOI15K');
        setDiscount(disc);
        const replaceNote = (previousCode && previousCode !== 'HANOI15K') ? ` (thay thế mã ${previousCode})` : '';
        const msg = `Đã trừ ${disc.toLocaleString('vi-VN')} ₫ phí ship nội thành Hà Nội${replaceNote}!`;
        setPromoMessage(msg);
        return { success: true, discount: disc, replaced: !!(previousCode && previousCode !== 'HANOI15K'), code: 'HANOI15K', message: msg };
      }
      if (cleanCode === 'BEPVIETVIP') {
        const disc = Math.min(100000, Math.round(subtotal * 0.25));
        setPromoCode('BEPVIETVIP');
        setDiscount(disc);
        const replaceNote = (previousCode && previousCode !== 'BEPVIETVIP') ? ` (thay thế mã ${previousCode})` : '';
        const msg = `Đã áp dụng giảm 25% VIP (-${disc.toLocaleString('vi-VN')} ₫)${replaceNote}!`;
        setPromoMessage(msg);
        return { success: true, discount: disc, replaced: !!(previousCode && previousCode !== 'BEPVIETVIP'), code: 'BEPVIETVIP', message: msg };
      }

      setDiscount(0);
      setPromoMessage(err.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn.');
      return { success: false, message: err.message };
    }
  };

  const total = Math.max(0, subtotal - discount + deliveryFee);
  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        reorderItems,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        subtotal,
        deliveryFee,
        baseShippingFee,
        freeShipThreshold,
        storeSettings,
        setStoreSettings,
        discount,
        promoCode,
        promoMessage,
        applyPromo,
        removePromo,
        total,
        itemCount,
        isStoreClosedModalOpen,
        setIsStoreClosedModalOpen,
        showStoreClosedModal,
        closeStoreClosedModal
      }}
    >
      {children}
      <StoreClosedModal
        isOpen={isStoreClosedModalOpen}
        onClose={closeStoreClosedModal}
        storeSettings={storeSettings}
        customMessage={storeClosedCustomMsg}
      />
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
