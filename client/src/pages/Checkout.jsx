import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Phone,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ShoppingBag,
  Ticket,
  CheckCircle2,
  Sparkles,
  Tag,
  Check,
  Clock
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLoyalty } from '../context/LoyaltyContext';
import { useToast } from '../components/Toast';
import {
  formatVND,
  validateVietnamPhone,
  HANOI_INNER_DISTRICTS,
  HANOI_DISTRICT_WARDS
} from '../utils/vietnamData';
import { placeOrder, getCoupons } from '../api';

export default function Checkout() {
  const navigate = useNavigate();
  const {
    cartItems,
    subtotal,
    deliveryFee,
    baseShippingFee,
    freeShipThreshold,
    storeSettings,
    discount,
    promoCode,
    promoMessage,
    applyPromo,
    removePromo,
    total,
    clearCart,
    showStoreClosedModal
  } = useCart();
  const { user } = useAuth();
  const { points: userPoints, currentTier, usePoints } = useLoyalty();
  const { showToast } = useToast();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [streetAddress, setStreetAddress] = useState(user?.address || '');
  const [district, setDistrict] = useState(user?.district || 'Quận Hoàn Kiếm');
  const [ward, setWard] = useState(user?.ward || 'Phường Hàng Bạc');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');

  // Feature 2: Delivery Timing
  const [deliveryType, setDeliveryType] = useState('instant'); // 'instant' | 'scheduled'
  const [scheduledTime, setScheduledTime] = useState('11:30 - 12:00');

  // Feature 5: Tip for Driver
  const [driverTip, setDriverTip] = useState(0);

  // Feature 3: Redeem Points
  const [usePointsDiscount, setUsePointsDiscount] = useState(false);
  const maxRedeemablePoints = Math.min(userPoints, Math.floor(subtotal * 0.5)); // up to 50% order
  const pointsDiscountAmount = usePointsDiscount ? maxRedeemablePoints : 0;

  const [inputCoupon, setInputCoupon] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Sync if user logged in
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name || '');
      if (!customerPhone) setCustomerPhone(user.phone || '');
      if (user.address && !streetAddress) setStreetAddress(user.address);
      if (user.district && HANOI_INNER_DISTRICTS.includes(user.district)) setDistrict(user.district);
      if (user.ward) setWard(user.ward);
    }
  }, [user]);

  // Fetch public vouchers for easy 1-click select
  useEffect(() => {
    async function loadCoupons() {
      try {
        const res = await getCoupons({ public_only: true });
        if (res.success && res.coupons) {
          setAvailableCoupons(res.coupons);
        }
      } catch (err) {
        // Fallback default vouchers
        setAvailableCoupons([
          { code: 'INDOMIE20', discount_type: 'percent', discount_value: 20, min_order: 80000, description: 'Giảm 20% đơn từ 80k' },
          { code: 'HANOI15K', discount_type: 'fixed', discount_value: 15000, min_order: 0, description: 'Trừ 15k phí ship Hà Nội' },
          { code: 'BEPVIETVIP', discount_type: 'percent', discount_value: 25, min_order: 120000, description: 'VIP giảm 25% tối đa 100k' }
        ]);
      }

      // Check if user won a voucher from Lucky Wheel
      try {
        const luckyCode = localStorage.getItem('bepviet_lucky_voucher');
        if (luckyCode && !promoCode) {
          setInputCoupon(luckyCode);
        }
      } catch (e) {}
    }
    loadCoupons();
  }, []);

  // Update wards when district changes
  const wards = HANOI_DISTRICT_WARDS[district] || ['Phường Trung Tâm'];

  const handleDistrictChange = (e) => {
    const newDist = e.target.value;
    setDistrict(newDist);
    const newWards = HANOI_DISTRICT_WARDS[newDist] || ['Phường Trung Tâm'];
    setWard(newWards[0]);
  };

  const handleApplyCoupon = async (codeToApply) => {
    const code = (codeToApply || inputCoupon).trim();
    if (!code) {
      showToast('Vui lòng nhập mã giảm giá', 'error');
      return;
    }
    setApplyingCoupon(true);
    try {
      const res = await applyPromo(code, customerPhone);
      if (res.success) {
        if (res.replaced) {
          showToast(`Đã đổi sang mã ${res.code} (thay thế mã ${res.previousCode} - Mỗi đơn áp dụng 1 mã)`, 'success', 5000);
        } else {
          showToast(res.message || `Đã áp dụng mã ${res.code}!`, 'success');
        }
        setInputCoupon('');
      } else {
        showToast(res.message || 'Mã giảm giá không hợp lệ', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Lỗi khi áp dụng mã', 'error');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    // Check if store is currently closed
    if (storeSettings && storeSettings.is_currently_open === false) {
      showStoreClosedModal();
      return;
    }

    const newErrors = {};

    // Validate Name
    if (!customerName || customerName.trim().length < 2) {
      newErrors.name = 'Vui lòng nhập họ tên người nhận (tối thiểu 2 ký tự)';
    }

    // Validate VN Phone
    const phoneVal = validateVietnamPhone(customerPhone);
    if (!phoneVal.isValid) {
      newErrors.phone = phoneVal.error;
    }

    // Simple, reliable address validation
    if (!streetAddress || streetAddress.trim().length < 2) {
      newErrors.address = 'Vui lòng nhập địa chỉ nhận hàng (số nhà, tên đường, ngõ ngách...)';
    }

    if (cartItems.length === 0) {
      newErrors.cart = 'Giỏ hàng đang trống! Vui lòng chọn món trước khi đặt.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Vui lòng kiểm tra lại thông tin nhận hàng tại Hà Nội!', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const fullDeliveryAddress = `${streetAddress.trim()}, ${ward}, ${district}, Hà Nội`;
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullDeliveryAddress)}`;
      
      const combinedNote = [
        deliveryType === 'scheduled' ? `[⏰ HẸN GIỜ: ${scheduledTime}]` : '[⚡ GIAO HỎA TỐC 20-30P]',
        driverTip > 0 ? `[🛵 Tip Shipper: ${formatVND(driverTip)}]` : '',
        pointsDiscountAmount > 0 ? `[💎 Trừ điểm VIP: -${formatVND(pointsDiscountAmount)}]` : '',
        note ? note.trim() : ''
      ].filter(Boolean).join(' | ');

      const orderPayload = {
        customer_name: customerName.trim(),
        customer_phone: phoneVal.normalized,
        delivery_address: fullDeliveryAddress,
        google_maps_url: googleMapsUrl,
        province: 'Hà Nội',
        district,
        ward,
        note: combinedNote,
        payment_method: paymentMethod,
        discount: discount + pointsDiscountAmount,
        delivery_fee: deliveryFee,
        driver_tip: driverTip,
        delivery_type: deliveryType,
        scheduled_time: deliveryType === 'scheduled' ? scheduledTime : null,
        coupon_code: promoCode || null,
        items: cartItems.map((item) => ({
          food_id: item.food.id,
          quantity: item.quantity
        }))
      };

      const res = await placeOrder(orderPayload);
      if (res.success && res.order) {
        if (pointsDiscountAmount > 0) {
          usePoints(pointsDiscountAmount);
        }
        clearCart();
        try {
          localStorage.removeItem('bepviet_lucky_voucher');
        } catch (e) {}

        showToast('🎉 Đặt hàng thành công! Quán đang bắt đầu xử lý đơn của bạn.', 'success', 5000);
        navigate(`/order-success/${res.order.id}`, { state: { order: res.order } });
      }
    } catch (err) {
      showToast(err.message || 'Có lỗi xảy ra khi tạo đơn hàng', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full mx-auto flex items-center justify-center border border-amber-500/30">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-800">Giỏ hàng của bạn đang trống</h2>
        <p className="text-sm text-slate-500">
          Hãy chọn các món Mì Indomie thượng hạng từ Bếp Việt trước khi thanh toán nhé!
        </p>
        <button
          onClick={() => navigate('/menu')}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-sm shadow-md hover:from-amber-600 hover:to-orange-600 transition"
        >
          Khám Phá Thực Đơn Indomie
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 pb-24 md:pb-12">
      {/* Title */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
            {storeSettings?.delivery_area || 'Giao Hàng Hỏa Tốc Nội Thành Hà Nội'}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Xác Nhận Đơn Hàng & Giao Nhận
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Khu vực giao: <strong>{storeSettings?.delivery_area || 'Nội thành Hà Nội'}</strong>. Giờ nhận đơn: <strong>{storeSettings?.open_time || '08:00'} - {storeSettings?.close_time || '23:00'}</strong>. Bảo hiểm nóng sốt 100%.
        </p>
      </div>

      {/* CLOSED / TAM NGHI ALERT BANNER */}
      {storeSettings && storeSettings.is_currently_open === false && (
        <div 
          onClick={() => showStoreClosedModal()}
          className="mb-6 p-5 sm:p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100/70 dark:hover:bg-rose-900/40 border-2 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md transition cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-md shadow-rose-500/25">
              🔴
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-rose-700 dark:text-rose-400">
                Bếp Việt Gourmet Hiện Đang Tạm Nghỉ - Không Nhận Đơn Mới!
              </h3>
              <p className="text-xs sm:text-sm text-rose-800/90 dark:text-rose-300 mt-0.5 leading-relaxed">
                Quán đang tạm ngưng nhận đơn đặt món để chuẩn bị nguyên liệu và bảo dưỡng bếp. Giờ phục vụ: <strong>{storeSettings.open_time || '08:00'} - {storeSettings.close_time || '23:00'}</strong>. Quý khách vui lòng quay lại sau hoặc liên hệ Hotline <strong>{storeSettings.hotline || '0353859726'}</strong>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                showStoreClosedModal();
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition active:scale-95"
            >
              Xem Chi Tiết
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/menu');
              }}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-slate-700 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700 font-bold text-xs transition"
            >
              Thực Đơn
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmitOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Customer & Address Form */}
          <div className="lg:col-span-7 space-y-6">
            {/* Contact Information */}
            <div className="bg-white dark:bg-[#12151E] p-5 sm:p-7 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    1. Thông Tin Người Nhận
                  </h3>
                  <p className="text-xs text-slate-400">Shipper và quán sẽ gọi theo số này khi xác nhận & giao tới</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Họ và Tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Nguyễn Hoàng Anh"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (errors.name) setErrors({ ...errors, name: null });
                    }}
                    className={`w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#181C2A] border text-sm font-semibold outline-none transition text-slate-900 dark:text-white ${
                      errors.name
                        ? 'border-rose-400 bg-rose-50/20'
                        : 'border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-[#1e2335] focus:border-amber-500 focus:ring-4 focus:ring-amber-100 dark:focus:ring-amber-900/30'
                    }`}
                  />
                  {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Số Điện Thoại Việt Nam <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="0353 859 726"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        if (errors.phone) setErrors({ ...errors, phone: null });
                      }}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#181C2A] border text-sm font-semibold outline-none transition text-slate-900 dark:text-white ${
                        errors.phone
                          ? 'border-rose-400 bg-rose-50/20'
                          : 'border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-[#1e2335] focus:border-amber-500 focus:ring-4 focus:ring-amber-100 dark:focus:ring-amber-900/30'
                      }`}
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                  {errors.phone ? (
                    <p className="text-xs text-rose-500 mt-1">{errors.phone}</p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">Đầu số: 03, 05, 07, 08, 09 (10 số)</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Delivery Address */}
            <div className="bg-white dark:bg-[#12151E] p-5 sm:p-7 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold border border-amber-500/30 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>2. Địa Chỉ Giao Hàng</span>
                    <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                      Hà Nội
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Giao hàng hỏa tốc tận nơi cho Quý khách</p>
                </div>
              </div>

              {/* District & Ward selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* District */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Quận / Huyện <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={district}
                    onChange={handleDistrictChange}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#181C2A] border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none focus:bg-white dark:focus:bg-[#1e2335] focus:border-amber-500 transition text-slate-900 dark:text-white"
                  >
                    {HANOI_INNER_DISTRICTS.map((d) => (
                      <option key={d} value={d} className="bg-white dark:bg-[#181C2A] text-slate-900 dark:text-white">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ward */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Phường / Xã
                  </label>
                  <select
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#181C2A] border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none focus:bg-white dark:focus:bg-[#1e2335] focus:border-amber-500 transition text-slate-900 dark:text-white"
                  >
                    {wards.map((w) => (
                      <option key={w} value={w} className="bg-white dark:bg-[#181C2A] text-slate-900 dark:text-white">
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Street Address Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  Số nhà, Tên Đường, Tòa nhà, Chung cư <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="VD: Ngõ 131 Thái Hà, Số 12 Hàng Bạc, Chung cư Royal City..."
                    value={streetAddress}
                    onChange={(e) => {
                      setStreetAddress(e.target.value);
                      if (errors.address) setErrors({ ...errors, address: null });
                    }}
                    className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-[#181C2A] border text-sm font-semibold outline-none transition text-slate-900 dark:text-white ${
                      errors.address
                        ? 'border-rose-400 bg-rose-50/20'
                        : 'border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-[#1e2335] focus:border-amber-500 focus:ring-4 focus:ring-amber-100 dark:focus:ring-amber-900/30'
                    }`}
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>

                {errors.address && (
                  <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.address}</span>
                  </p>
                )}
              </div>

              {/* Quick Packaging Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  Ghi Chú Đóng Gói Nhanh (1 Chạm):
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    'Tách riêng nước sốt/nước dùng',
                    'Đóng hộp 2 lớp giữ nhiệt nóng',
                    'Treo cổng bấm chuông không gọi',
                    'Giao sảnh lễ tân/bảo vệ',
                    'Không ớt / ít cay'
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        if (note.includes(chip)) return;
                        setNote(prev => (prev ? `${prev}, ${chip}` : chip));
                      }}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-slate-700 dark:text-slate-300 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 transition"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="VD: Nhiều sốt sa tế, trứng lòng đào, để trước sảnh bảo vệ..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#151926] border border-slate-200 dark:border-slate-700 text-sm outline-none focus:bg-white dark:focus:bg-[#1a1f30] focus:border-amber-500 transition text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Feature 2: Delivery Timing (Hẹn Giờ / Hỏa Tốc) */}
            <div className="bg-white dark:bg-[#12151E] p-5 sm:p-7 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-500 flex items-center justify-center font-bold border border-amber-500/30 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    3. Thời Gian Nhận Món
                  </h3>
                  <p className="text-xs text-slate-400">Chọn giao hỏa tốc hoặc hẹn giờ nhận món trước</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Instant delivery */}
                <button
                  type="button"
                  onClick={() => setDeliveryType('instant')}
                  className={`p-4 rounded-2xl border-2 text-left transition flex items-start justify-between ${
                    deliveryType === 'instant'
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151926] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-black text-sm flex items-center gap-1.5">
                      <span>⚡ Giao Ngay Hỏa Tốc</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                      Bếp chế biến & giao tận cửa trong <strong>20 - 30 phút</strong>
                    </p>
                  </div>
                  {deliveryType === 'instant' && <Check className="w-5 h-5 text-amber-500 shrink-0" />}
                </button>

                {/* Scheduled delivery */}
                <button
                  type="button"
                  onClick={() => setDeliveryType('scheduled')}
                  className={`p-4 rounded-2xl border-2 text-left transition flex items-start justify-between ${
                    deliveryType === 'scheduled'
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#151926] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-black text-sm flex items-center gap-1.5">
                      <span>⏰ Hẹn Giờ Giao Món</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                      Đặt trước cho bữa trưa / bữa tối chuẩn giờ
                    </p>
                  </div>
                  {deliveryType === 'scheduled' && <Check className="w-5 h-5 text-amber-500 shrink-0" />}
                </button>
              </div>

              {/* Time Slots selector if scheduled */}
              {deliveryType === 'scheduled' && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2.5 animate-fade-in">
                  <label className="block text-xs font-black text-amber-400 uppercase tracking-wider">
                    Chọn Khung Giờ Giao Hôm Nay:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      '11:30 - 12:00',
                      '12:00 - 12:30',
                      '18:00 - 18:30',
                      '19:00 - 19:30',
                      '20:30 - 21:00',
                      '21:30 - 22:00'
                    ].map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setScheduledTime(slot)}
                        className={`py-2 px-3 rounded-xl font-bold text-xs transition border ${
                          scheduledTime === slot
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                            : 'bg-slate-900/60 text-slate-300 border-slate-700 hover:border-amber-400/50'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Feature 5: Tip for Driver */}
            <div className="bg-white dark:bg-[#12151E] p-5 sm:p-7 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛵</span>
                  <div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">
                      Tip Cho Bác Tài Giao Hỏa Tốc
                    </h4>
                    <p className="text-[11px] text-slate-400">Động viên bác tài vượt mưa gió giao nóng hổi ❤️</p>
                  </div>
                </div>
                {driverTip > 0 && (
                  <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                    +{formatVND(driverTip)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-5 gap-2">
                {[
                  { label: '0đ', val: 0 },
                  { label: '5k', val: 5000 },
                  { label: '10k', val: 10000 },
                  { label: '20k', val: 20000 },
                  { label: '50k', val: 50000 }
                ].map(item => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setDriverTip(item.val)}
                    className={`py-2.5 rounded-xl font-bold text-xs transition border ${
                      driverTip === item.val
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-black'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white dark:bg-[#12151E] p-5 sm:p-7 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    4. Phương Thức Thanh Toán
                  </h3>
                  <p className="text-xs text-slate-400">Chọn cách thức thanh toán tiện lợi nhất cho bạn</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* COD */}
                <label
                  className={`p-4 rounded-2xl border-2 flex flex-col justify-between cursor-pointer transition ${
                    paymentMethod === 'COD'
                      ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-[#181C2A]'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between mb-2">
                    <Banknote className="w-5 h-5 text-emerald-500" />
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-500 flex items-center justify-center">
                      {paymentMethod === 'COD' && (
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </span>
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">Tiền Mặt (COD)</h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Trả khi nhận đồ ăn</p>
                  </div>
                </label>

                {/* Banking / QR */}
                <label
                  className={`p-4 rounded-2xl border-2 flex flex-col justify-between cursor-pointer transition ${
                    paymentMethod === 'BANKING'
                      ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-[#181C2A]'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="BANKING"
                    checked={paymentMethod === 'BANKING'}
                    onChange={() => setPaymentMethod('BANKING')}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between mb-2">
                    <CreditCard className="w-5 h-5 text-sky-400" />
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-500 flex items-center justify-center">
                      {paymentMethod === 'BANKING' && (
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </span>
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">VietQR / Banking</h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Chuyển khoản tức thì</p>
                  </div>
                </label>

                {/* Momo */}
                <label
                  className={`p-4 rounded-2xl border-2 flex flex-col justify-between cursor-pointer transition ${
                    paymentMethod === 'MOMO'
                      ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-[#181C2A]'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="MOMO"
                    checked={paymentMethod === 'MOMO'}
                    onChange={() => setPaymentMethod('MOMO')}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between mb-2">
                    <Smartphone className="w-5 h-5 text-pink-400" />
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-500 flex items-center justify-center">
                      {paymentMethod === 'MOMO' && (
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </span>
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">Ví MoMo</h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Quét mã ví MoMo</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT: Order Summary & Coupon Picker */}
          <div className="lg:col-span-5 space-y-6 sticky top-24">
            {/* COUPON & VOUCHER BOX (MỖI ĐƠN HÀNG CHỈ ÁP DỤNG 1 MÃ) */}
            <div className="bg-white dark:bg-[#12151E] p-5 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-amber-500" />
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Mã Giảm Giá & Voucher
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Tối đa 1 mã / đơn
                </span>
              </div>

              {/* Policy note */}
              <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                💡 <strong>Quy định:</strong> Mỗi đơn hàng chỉ áp dụng tối đa <strong>1 mã giảm giá</strong>. Khi chọn mã mới, hệ thống sẽ tự động cập nhật thay thế mã cũ.
              </div>

              {/* Active Applied Coupon Card */}
              {promoCode && discount > 0 && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 flex items-center justify-between gap-3 animate-fade-in">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                      ✓
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-black text-emerald-800 dark:text-emerald-300 text-xs tracking-wider">
                          {promoCode}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200">
                          Đang áp dụng
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold mt-0.5">
                        Giảm: -{formatVND(discount)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const old = promoCode;
                      removePromo();
                      showToast(`Đã gỡ mã giảm giá ${old}`, 'info');
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-[11px] font-bold transition shrink-0 active:scale-95 shadow-sm"
                  >
                    Gỡ mã
                  </button>
                </div>
              )}

              {/* Coupon input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã (VD: INDOMIE20)"
                  value={inputCoupon}
                  onChange={(e) => setInputCoupon(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#181C2A] border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold uppercase tracking-wider outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-[#1e2335] text-slate-900 dark:text-white transition"
                />
                <button
                  type="button"
                  onClick={() => handleApplyCoupon(inputCoupon)}
                  disabled={applyingCoupon || !inputCoupon.trim()}
                  className="px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-amber-300 dark:text-slate-950 font-bold text-xs transition"
                >
                  {applyingCoupon ? '...' : 'Áp Dụng'}
                </button>
              </div>

              {promoMessage && !promoCode && (
                <p
                  className="text-xs font-medium px-3 py-2 rounded-xl flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{promoMessage}</span>
                </p>
              )}

              {/* Quick voucher cards */}
              {availableCoupons.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Voucher Có Sẵn (Bấm 1 chạm để áp dụng):
                  </p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {availableCoupons.map((c) => (
                      <button
                        type="button"
                        key={c.code}
                        onClick={() => handleApplyCoupon(c.code)}
                        className={`w-full text-left p-2.5 rounded-2xl border transition flex items-center justify-between text-xs ${
                          promoCode === c.code
                            ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 text-amber-950 dark:text-amber-300 font-bold'
                            : 'bg-slate-50/70 dark:bg-[#181C2A] border-slate-200/80 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-500 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <div>
                            <span className="font-mono font-black text-amber-600 dark:text-amber-400">{c.code}</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1.5">
                              {c.description || (c.discount_type === 'percent' ? `Giảm ${c.discount_value}%` : `Giảm ${formatVND(c.discount_value)}`)}
                            </span>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition ${
                          promoCode === c.code 
                            ? 'bg-amber-500 text-slate-950 border-amber-600 font-black' 
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {promoCode === c.code ? 'Đang Dùng' : 'Áp Dụng'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* LOYALTY POINTS BOX */}
            {userPoints > 0 && (
              <div className="bg-white dark:bg-[#12151E] p-4 sm:p-5 rounded-3xl border border-purple-500/30 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{currentTier.icon}</span>
                    <div>
                      <h4 className="font-extrabold text-xs text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                        <span>Điểm Thưởng VIP</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono font-bold">
                          {currentTier.name}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Khả dụng: <strong className="text-purple-600 dark:text-purple-400 font-black">{userPoints.toLocaleString()} điểm</strong> ({formatVND(userPoints)})
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={usePointsDiscount}
                      onChange={(e) => setUsePointsDiscount(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                {usePointsDiscount && (
                  <div className="text-[11px] text-purple-800 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-950/50 p-2.5 rounded-xl border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                    <span>Trừ điểm VIP (1đ = 1.000đ):</span>
                    <span className="font-black text-purple-600 dark:text-purple-400">-{formatVND(pointsDiscountAmount)}</span>
                  </div>
                )}
              </div>
            )}

            {/* SUMMARY & SUBMIT */}
            <div className="bg-white dark:bg-[#12151E] p-5 sm:p-7 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-5 text-slate-900 dark:text-slate-100">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span>Tóm Tắt Đơn Hàng ({cartItems.length} món)</span>
                {deliveryType === 'scheduled' ? (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    ⏰ Hẹn giờ: {scheduledTime}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    ⚡ Giao hỏa tốc
                  </span>
                )}
              </h3>

              {/* Items review */}
              <div className="max-h-56 overflow-y-auto space-y-3 pr-1">
                {cartItems.map((item) => (
                  <div key={item.food.id} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={item.food.image}
                        alt={item.food.name}
                        className="w-10 h-10 rounded-xl object-cover shrink-0"
                      />
                      <div className="truncate">
                        <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.food.name}</p>
                        <p className="text-[11px] text-slate-400">SL: {item.quantity} phần</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-300 shrink-0">
                      {formatVND(item.food.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Calculations */}
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Tạm tính:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{formatVND(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>Voucher ({promoCode}):</span>
                    <span>-{formatVND(discount)}</span>
                  </div>
                )}
                {pointsDiscountAmount > 0 && (
                  <div className="flex justify-between text-purple-600 dark:text-purple-400 font-semibold">
                    <span>Điểm VIP ({currentTier.name}):</span>
                    <span>-{formatVND(pointsDiscountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span>Phí ship nội thành Hà Nội:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                        Miễn phí {freeShipThreshold > 0 ? `(Đơn > ${formatVND(freeShipThreshold)})` : ''}
                      </span>
                    ) : (
                      <span>
                        {formatVND(deliveryFee)}
                        {freeShipThreshold > 0 && (
                          <span className="text-[11px] text-slate-400 font-normal ml-1">
                            (Freeship từ {formatVND(freeShipThreshold)})
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                </div>
                {driverTip > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>Tip Bác Tài Shipper:</span>
                    <span>+{formatVND(driverTip)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span>Tổng thanh toán:</span>
                  <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                    {formatVND(Math.max(0, total + driverTip - pointsDiscountAmount))}
                  </span>
                </div>
              </div>

              {/* Order Confirmation Notice Requirement */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <span>🔔</span>
                  <span>Quy trình xác nhận đơn hàng:</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Sau khi bấm đặt món, đơn hàng sẽ được gửi tới Admin Bếp Việt. Đơn được coi là <strong>đặt thành công</strong> ngay khi chủ quán bấm <strong>Xác Nhận</strong>!
                </p>
              </div>

              {/* ORDER INSURANCE - BẢO HIỂM ĐƠN HÀNG 100% */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 text-xs text-emerald-950 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-emerald-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Bảo Hiểm Món Ăn Bếp Việt (Miễn Phí 100%)</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full shrink-0">
                    Đã Kích Hoạt
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                  🛡️ <strong>Cam kết vàng:</strong> Mì Indomie giao tận tay nóng hổi giòn rụm trong 20-30 phút. Bồi thường đổi mới trong 15 phút hoặc hoàn lại 100% nếu món bị nguội hoặc đổ vỡ do vận chuyển!
                </p>
              </div>

              {/* Submit Button */}
              {storeSettings && storeSettings.is_currently_open === false ? (
                <button
                  type="button"
                  onClick={() => showStoreClosedModal()}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm transition bg-rose-50 hover:bg-rose-100 text-rose-600 border-2 border-rose-300 shadow-md active:scale-95"
                >
                  <span>🔴 Quán Đang Tạm Nghỉ (Bấm để xem thông báo)</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm transition bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 shadow-xl shadow-amber-500/25 active:scale-95"
                >
                  {submitting ? (
                    <span>Đang gửi đơn hàng tới Bếp Việt...</span>
                  ) : (
                    <>
                      <span>Gửi Đơn Món Chờ Quán Duyệt</span>
                      <ArrowRight className="w-4 h-4 text-slate-950" />
                    </>
                  )}
                </button>
              )}

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Hotline hỗ trợ: <strong className="text-slate-700">0353859726</strong></span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
