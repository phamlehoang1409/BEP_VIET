import React, { createContext, useContext, useState, useEffect } from 'react';

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

  // Subtotal calculation
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.food.price * item.quantity,
    0
  );

  // Delivery fee: 15.000 VND, or free if subtotal >= 250.000 VND
  const deliveryFee = subtotal >= 250000 || subtotal === 0 ? 0 : 15000;

  // Apply promo vouchers
  const applyPromo = (code) => {
    const cleanCode = (code || '').trim().toUpperCase();
    if (!cleanCode) {
      setDiscount(0);
      setPromoMessage('');
      return;
    }

    if (cleanCode === 'BEPVIET20') {
      if (subtotal < 100000) {
        setPromoMessage('Mã BEPVIET20 chỉ áp dụng cho đơn từ 100.000 ₫');
        setDiscount(0);
      } else {
        setPromoCode('BEPVIET20');
        setDiscount(20000);
        setPromoMessage('Đã áp dụng mã giảm 20.000 ₫ thành công!');
      }
    } else if (cleanCode === 'GIAM10') {
      setPromoCode('GIAM10');
      const disc = Math.round(subtotal * 0.1);
      setDiscount(disc);
      setPromoMessage(`Đã áp dụng giảm 10% (-${disc.toLocaleString('vi-VN')} ₫)!`);
    } else if (cleanCode === 'FREESHIP') {
      setPromoCode('FREESHIP');
      setDiscount(15000);
      setPromoMessage('Đã áp dụng mã Miễn phí vận chuyển (trừ 15.000 ₫)!');
    } else {
      setPromoMessage('Mã giảm giá không hợp lệ hoặc đã hết hạn.');
      setDiscount(0);
    }
  };

  const total = Math.max(0, subtotal - discount + deliveryFee);
  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        subtotal,
        deliveryFee,
        discount,
        promoCode,
        promoMessage,
        applyPromo,
        total,
        itemCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
