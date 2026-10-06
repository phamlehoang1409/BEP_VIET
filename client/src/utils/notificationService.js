// Web Notification Service for Order Delivery Updates

class NotificationService {
  constructor() {
    this.isSupported = 'Notification' in window;
    this.audioContext = null;
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
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
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

  notifyOrderStatus(orderCode, status, customerName = 'Bạn') {
    if (!this.isSupported || Notification.permission !== 'granted') return;

    let title = '🍜 Bếp Việt Gourmet';
    let body = '';
    let icon = '/manifest.json';

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
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body,
            icon: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=200&q=80',
            badge: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=96&q=80',
            vibrate: [200, 100, 200],
            tag: `order-${orderCode}`,
            renotify: true
          });
        });
      } else {
        new Notification(title, {
          body,
          icon: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=200&q=80'
        });
      }
    } catch (e) {
      console.warn('Native notification failed:', e);
    }
  }
}

export const notificationService = new NotificationService();
