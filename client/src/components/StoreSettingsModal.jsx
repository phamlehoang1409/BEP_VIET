import React, { useState, useEffect } from 'react';
import { Clock, Store, Phone, MapPin, X, Save, AlertCircle, Bell, Truck, DollarSign } from 'lucide-react';
import { getStoreSettings, updateStoreSettings } from '../api';
import { useToast } from './Toast';

export default function StoreSettingsModal({ isOpen, onClose, onSettingsUpdated }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [storeName, setStoreName] = useState('Bếp Việt Gourmet - Indomie Bar');
  const [hotline, setHotline] = useState('0353859726');
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('23:00');
  const [isOpenStore, setIsOpenStore] = useState(true);
  const [deliveryArea, setDeliveryArea] = useState('Nội thành Hà Nội (30-45 phút)');
  const [deliveryFeeDefault, setDeliveryFeeDefault] = useState(15000);
  const [freeShipThreshold, setFreeShipThreshold] = useState(200000);
  const [address, setAddress] = useState('Số 18, Phố Tràng Thi, Hoàn Kiếm, Hà Nội');
  const [announcement, setAnnouncement] = useState('🌟 Bếp Việt Gourmet: Giao hàng hỏa tốc nội thành Hà Nội. Mì Indomie thượng hạng!');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getStoreSettings()
        .then((res) => {
          if (res.success && res.settings) {
            setStoreName(res.settings.store_name || 'Bếp Việt Gourmet - Indomie Bar');
            setHotline(res.settings.hotline || '0353859726');
            setOpenTime(res.settings.open_time || '08:00');
            setCloseTime(res.settings.close_time || '23:00');
            setIsOpenStore(res.settings.is_open !== false);
            setDeliveryArea(res.settings.delivery_area || 'Nội thành Hà Nội');
            setDeliveryFeeDefault(
              res.settings.delivery_fee_default !== undefined
                ? Number(res.settings.delivery_fee_default)
                : 15000
            );
            setFreeShipThreshold(
              res.settings.free_ship_threshold !== undefined
                ? Number(res.settings.free_ship_threshold)
                : 200000
            );
            setAddress(res.settings.address || 'Số 18, Phố Tràng Thi, Hoàn Kiếm, Hà Nội');
            setAnnouncement(res.settings.announcement || '');
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    try {
      const payload = {
        store_name: storeName.trim(),
        hotline: hotline.trim(),
        open_time: openTime,
        close_time: closeTime,
        is_open: isOpenStore,
        delivery_area: deliveryArea.trim(),
        delivery_fee_default: Math.max(0, Number(deliveryFeeDefault) || 0),
        free_ship_threshold: Math.max(0, Number(freeShipThreshold) || 0),
        address: address.trim(),
        announcement: announcement.trim()
      };

      const res = await updateStoreSettings(payload);
      if (res.success) {
        showToast('Cập nhật cài đặt cửa hàng & phí ship thành công!', 'success');
        if (onSettingsUpdated) onSettingsUpdated(res.settings);
        onClose();
      }
    } catch (err) {
      showToast(err.message || 'Lỗi cập nhật cài đặt', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-amber-500/30 w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-scale-up text-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Cài Đặt Cửa Hàng & Phí Vận Chuyển</h3>
              <p className="text-xs text-slate-400">Tùy chỉnh phí ship, giờ mở cửa, hotline và khu vực giao hàng</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Đang tải thông tin cửa hàng...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Store Toggle */}
            <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-amber-400" />
                  <span>Trạng Thái Nhận Đơn</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isOpenStore ? '🟢 Quán đang nhận đơn bình thường' : '🔴 Quán đang tạm nghỉ, không nhận đơn'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOpenStore}
                  onChange={(e) => setIsOpenStore(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* SHIPPING FEE SETTINGS (Admin Adjustable - Not Hardcoded 15k) */}
            <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                  Điều Chỉnh Phí Vận Chuyển (Ship)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Standard Shipping Fee */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Phí ship tiêu chuẩn (₫)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={deliveryFeeDefault}
                    onChange={(e) => setDeliveryFeeDefault(e.target.value)}
                    placeholder="15000"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono font-bold text-sm outline-none focus:border-amber-400 transition"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {Number(deliveryFeeDefault) === 0 ? '🎉 Miễn phí ship toàn bộ' : `Áp dụng: ${Number(deliveryFeeDefault).toLocaleString('vi-VN')} ₫/đơn`}
                  </p>
                </div>

                {/* Free Shipping Threshold */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Mức đơn miễn phí ship (₫)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={freeShipThreshold}
                    onChange={(e) => setFreeShipThreshold(e.target.value)}
                    placeholder="200000"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono font-bold text-sm outline-none focus:border-amber-400 transition"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {Number(freeShipThreshold) === 0 ? 'Luôn tính phí ship' : `Đơn từ ${Number(freeShipThreshold).toLocaleString('vi-VN')} ₫ sẽ freeship`}
                  </p>
                </div>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Giờ Mở Cửa</span>
                </label>
                <input
                  type="time"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-semibold outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Giờ Đóng Cửa</span>
                </label>
                <input
                  type="time"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm font-semibold outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Hotline & Delivery Area */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hotline Bếp Việt</span>
                </label>
                <input
                  type="text"
                  value={hotline}
                  onChange={(e) => setHotline(e.target.value)}
                  placeholder="0353859726"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Khu Vực Giao Hàng</span>
                </label>
                <input
                  type="text"
                  value={deliveryArea}
                  onChange={(e) => setDeliveryArea(e.target.value)}
                  placeholder="Nội thành Hà Nội"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">
                Địa Chỉ Quán
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số 18, Phố Tràng Thi, Hoàn Kiếm, Hà Nội"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none focus:border-amber-400"
              />
            </div>

            {/* Announcement Banner */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase flex items-center gap-1">
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>Thông Báo Đầu Trang</span>
              </label>
              <input
                type="text"
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="Thông báo khuyến mãi, ưu đãi..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                Hủy Bỏ
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 disabled:opacity-50 transition flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Đang lưu...' : 'Lưu Cài Đặt'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
