import React, { createContext, useContext, useState, useEffect } from 'react';

const LoyaltyContext = createContext();

export const LOYALTY_TIERS = {
  BRONZE: {
    id: 'bronze',
    name: 'Thành Viên Đồng',
    icon: '🥉',
    minSpend: 0,
    earnRate: 0.03, // 3% points cashback
    badgeClass: 'bg-amber-800/20 text-amber-500 border-amber-800/40',
    benefits: ['Tích 3% điểm mỗi đơn ship', 'Quà sinh nhật voucher 20k']
  },
  SILVER: {
    id: 'silver',
    name: 'Thành Viên Bạc',
    icon: '🥈',
    minSpend: 500000,
    earnRate: 0.05, // 5% points cashback
    badgeClass: 'bg-slate-400/20 text-slate-300 border-slate-400/40',
    benefits: ['Tích 5% điểm mỗi đơn ship', 'Freeship đơn từ 150k', 'Quà voucher 50k']
  },
  GOLD: {
    id: 'gold',
    name: 'Thành Viên Vàng',
    icon: '🥇',
    minSpend: 1500000,
    earnRate: 0.07, // 7% points cashback
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    benefits: ['Tích 7% điểm mỗi đơn ship', 'Freeship mọi đơn từ 100k', 'Ưu tiên bếp ra món trước']
  },
  DIAMOND: {
    id: 'diamond',
    name: 'Kim Cương VIP',
    icon: '💎',
    minSpend: 3000000,
    earnRate: 0.10, // 10% points cashback
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    benefits: ['Tích 10% điểm mỗi đơn ship', 'Freeship 100% không giới hạn', 'Tặng món bí mật mỗi đơn', 'CSKH riêng 24/7']
  }
};

export function LoyaltyProvider({ children }) {
  const [points, setPoints] = useState(() => {
    try {
      const saved = localStorage.getItem('bepviet_loyalty_points');
      return saved ? parseInt(saved, 10) : 15000; // default 15k welcome points for testing
    } catch {
      return 15000;
    }
  });

  const [lifetimeSpend, setLifetimeSpend] = useState(() => {
    try {
      const saved = localStorage.getItem('bepviet_lifetime_spend');
      return saved ? parseInt(saved, 10) : 650000; // default silver tier
    } catch {
      return 650000;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('bepviet_loyalty_points', points.toString());
      localStorage.setItem('bepviet_lifetime_spend', lifetimeSpend.toString());
    } catch (e) {}
  }, [points, lifetimeSpend]);

  // Determine Tier from lifetimeSpend
  const getCurrentTier = () => {
    if (lifetimeSpend >= LOYALTY_TIERS.DIAMOND.minSpend) return LOYALTY_TIERS.DIAMOND;
    if (lifetimeSpend >= LOYALTY_TIERS.GOLD.minSpend) return LOYALTY_TIERS.GOLD;
    if (lifetimeSpend >= LOYALTY_TIERS.SILVER.minSpend) return LOYALTY_TIERS.SILVER;
    return LOYALTY_TIERS.BRONZE;
  };

  const currentTier = getCurrentTier();

  // Add points from completed order
  const addOrderPoints = (orderAmount) => {
    const earned = Math.round(orderAmount * currentTier.earnRate);
    setPoints(prev => prev + earned);
    setLifetimeSpend(prev => prev + orderAmount);
    return earned;
  };

  // Redeem points for discount (1 point = 1 VND)
  const usePoints = (pointsToUse) => {
    const actualUse = Math.min(points, pointsToUse);
    setPoints(prev => Math.max(0, prev - actualUse));
    return actualUse;
  };

  return (
    <LoyaltyContext.Provider
      value={{
        points,
        lifetimeSpend,
        currentTier,
        addOrderPoints,
        usePoints,
        TIERS: LOYALTY_TIERS
      }}
    >
      {children}
    </LoyaltyContext.Provider>
  );
}

export function useLoyalty() {
  const context = useContext(LoyaltyContext);
  if (!context) {
    throw new Error('useLoyalty must be used within a LoyaltyProvider');
  }
  return context;
}
