// Web Notification Service for Order Delivery Updates & Admin Desktop Alerts
import { formatVND } from './vietnamData';

class NotificationService {
  constructor() {
    this.isSupported = typeof window !== 'undefined' && 'Notification' in window;
    this.titleInterval = null;
    this.originalTitle = typeof document !== 'undefined' ? document.title : 'Bếp Việt Gourmet';
  }

  getPermission() {
    if (!this.isSupported) return 'denied';
    return Notification.permission;
  }

  async requestPermission() {
    if (!this.isSupported) return false;
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return false;
    }
  }

  playChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {}
  }

  // Flashing Browser Tab Title when new order arrives
  startFlashingTitle(alertText = '🚨 CÓ ĐƠN HÀNG MỚI!') {
    this.stopFlashingTitle();
    this.originalTitle = document.title;
    let isAlert = true;

    this.titleInterval = setInterval(() => {
      document.title = isAlert ? alertText : this.originalTitle;
      isAlert = !isAlert;
    }, 1000);
  }

  stopFlashingTitle() {
    if (this.titleInterval) {
      clearInterval(this.titleInterval);
      this.titleInterval = null;
      if (typeof document !== 'undefined') {
        document.title = this.originalTitle || 'Bếp Việt Gourmet';
      }
    }
  }

  // Native Windows / Chrome Desktop Notification for Merchant Admin
  notifyNewOrderAdmin(order) {
    if (!this.isSupported) return;

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const orderCode = order.order_code || order.id || 'MỚI';
    const title = `🚨 CÓ ĐƠN HÀNG MỚI! #${orderCode}`;
    const itemsText = (order.items || [])
      .map((i) => `${i.quantity}x ${i.food_name || i.name}`)
      .join(', ');
    const body = `👤 ${order.customer_name || 'Khách Hàng'} (${order.customer_phone || ''})\n💰 Tổng tiền: ${formatVND(order.total_amount || 0)}\n🍜 Món: ${itemsText || 'Xem chi tiết'}\n📍 Đ/c: ${order.delivery_address || 'Hà Nội'}`;

    this.playChime();
    this.startFlashingTitle(`🔴 (1) ĐƠN MỚI #${orderCode}!`);

    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=200&q=80',
          badge: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=96&q=80',
          requireInteraction: true, // Keeps notification active on Desktop until clicked
          tag: `admin-order-${orderCode}`,
          renotify: true
        });

        notif.onclick = () => {
          window.focus();
          this.stopFlashingTitle();
          notif.close();
        };
      } catch (e) {
        console.warn('Native desktop notification error:', e);
      }
    }
  }

  // Customer Delivery Updates
  notifyOrderStatus(orderCode, status, customerName = 'Bạn') {
    if (!this.isSupported || Notification.permission !== 'granted') return;

    let title = '🍜 Bếp Việt Gourmet';
    let body = '';

    switch (status) {
      case 'preparing':
        title = '🔥 Đang Nấu Món Nóng Hổi!';
        body = `Đơn hàng #${orderCode} của ${customerName} đang được đầu bếp chế biến nóng giòn.`;
        break;
      case 'delivering':
        title = '🛵 Shipper Đang Giao Tới Cửa!';
        body = `Đơn hàng #${orderCode} đã xuất phát! Shipper đang trên đường giao tới trong ít phút.`;
        break;
      case 'completed':
        title = '🎉 Giao Hàng Thành Công!';
        body = `Đơn hàng #${orderCode} đã giao hoàn tất. Chúc bạn có bữa ăn thật ngon miệng!`;
        break;
      case 'cancelled':
        title = '❌ Thông Báo Đơn Hàng';
        body = `Đơn hàng #${orderCode} đã được hủy theo yêu cầu.`;
        break;
      default:
        body = `Đơn hàng #${orderCode} vừa được cập nhật trạng thái mới.`;
    }

    this.playChime();

    try {
      const notif = new Notification(title, {
        body,
        icon: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=200&q=80',
        badge: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=96&q=80',
        tag: `order-${orderCode}`,
        renotify: true
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (e) {
      console.warn('Customer notification error:', e);
    }
  }
}

export const notificationService = new NotificationService();
