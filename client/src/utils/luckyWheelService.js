// Helper service to manage Lucky Wheel spins only when orders are completed

export const awardSpinForCompletedOrder = (order) => {
  if (!order || !order.id || order.status !== 'completed') return false;
  try {
    const orderKey = String(order.order_code || order.id).trim();
    const rawAwarded = localStorage.getItem('bepviet_awarded_spin_orders');
    const awardedList = rawAwarded ? JSON.parse(rawAwarded) : [];

    if (!awardedList.includes(orderKey)) {
      awardedList.push(orderKey);
      localStorage.setItem('bepviet_awarded_spin_orders', JSON.stringify(awardedList));

      const currentSpins = parseInt(localStorage.getItem('bepviet_user_spins') || '0', 10);
      const nextSpins = (isNaN(currentSpins) ? 0 : currentSpins) + 1;
      localStorage.setItem('bepviet_user_spins', nextSpins.toString());

      // Trigger custom event so any open LuckyWheel component updates immediately
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bepviet_spins_updated', { detail: { spins: nextSpins, orderCode: orderKey } }));
      }
      return true;
    }
  } catch (e) {
    console.error('Error awarding spin for completed order:', e);
  }
  return false;
};

export const getUserSpins = () => {
  try {
    const saved = parseInt(localStorage.getItem('bepviet_user_spins') || '0', 10);
    return isNaN(saved) ? 0 : saved;
  } catch (e) {
    return 0;
  }
};

export const isOrderSpinAwarded = (order) => {
  if (!order) return false;
  try {
    const orderKey = String(order.order_code || order.id).trim();
    const rawAwarded = localStorage.getItem('bepviet_awarded_spin_orders');
    const awardedList = rawAwarded ? JSON.parse(rawAwarded) : [];
    return awardedList.includes(orderKey);
  } catch (e) {
    return false;
  }
};
