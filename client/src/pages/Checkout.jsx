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
  Check
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
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
    total,
    clearCart
  } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [streetAddress, setStreetAddress] = useState(user?.address || '');
  const [district, setDistrict] = useState(user?.district || 'Quận Hoàn Kiếm');
  const [ward, setWard] = useState(user?.ward || 'Phường Hàng Bạc');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');

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
        if (luckyCode && !appliedPromo) {
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
      const res = await applyPromo(code);
      if (res.success) {
        showToast(res.message || `Đã áp dụng mã ${code.toUpperCase()}!`, 'success');
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
      const orderPayload = {
        customer_name: customerName.trim(),
        customer_phone: phoneVal.normalized,
        delivery_address: fullDeliveryAddress,
        google_maps_url: googleMapsUrl,
        province: 'Hà Nội',
        district,
        ward,
        note,
        payment_method: paymentMethod,
        discount,
        delivery_fee: deliveryFee,
        coupon_code: promoCode || null,
        items: cartItems.map((item) => ({
          food_id: item.food.id,
          quantity: item.quantity
        }))
      };

      const res = await placeOrder(orderPayload);
      if (res.success && res.order) {
        clearCart();
        // Award +1 spin turn for future purchase!
        try {
          const currentSpins = parseInt(localStorage.getItem('bepviet_user_spins') || '0', 10);
          localStorage.setItem('bepviet_user_spins', (currentSpins + 1).toString());
        } catch (e) {}

        showToast('Đã gửi đơn hàng tới Bếp Việt! Bạn nhận được +1 lượt quay may mắn 🎁', 'success', 6000);
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
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
            {storeSettings?.delivery_area || 'Giao Hàng Hỏa Tốc Nội Thành Hà Nội'}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Xác Nhận Đơn Hàng & Giao Nhận
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Khu vực giao: <strong>{storeSettings?.delivery_area || 'Nội thành Hà Nội'}</strong>. Giờ nhận đơn: <strong>{storeSettings?.open_time || '08:00'} - {storeSettings?.close_time || '23:00'}</strong>. Bảo hiểm nóng sốt 100%.
        </p>
      </div>

      <form onSubmit={handleSubmitOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Customer & Address Form */}
          <div className="lg:col-span-7 space-y-6">
            {/* Contact Information */}
            <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    1. Thông Tin Người Nhận
                  </h3>
                  <p className="text-xs text-slate-400">Shipper và quán sẽ gọi theo số này khi xác nhận & giao tới</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
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
                    className={`w-full px-4 py-2.5 rounded-2xl bg-slate-50 border text-sm font-semibold outline-none transition ${
                      errors.name
                        ? 'border-rose-400 bg-rose-50/20'
                        : 'border-slate-200 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-100'
                    }`}
                  />
                  {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
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
                      className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border text-sm font-semibold outline-none transition ${
                        errors.phone
                          ? 'border-rose-400 bg-rose-50/20'
                          : 'border-slate-200 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-100'
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
            <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-amber-600 flex items-center justify-center font-bold border border-amber-500/30 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    <span>2. Địa Chỉ Giao Hàng</span>
                    <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
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
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Quận / Huyện <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={district}
                    onChange={handleDistrictChange}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold outline-none focus:bg-white focus:border-amber-500 transition"
                  >
                    {HANOI_INNER_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ward */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Phường / Xã
                  </label>
                  <select
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold outline-none focus:bg-white focus:border-amber-500 transition"
                  >
                    {wards.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Street Address Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
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
                    className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border text-sm font-semibold outline-none transition ${
                      errors.address
                        ? 'border-rose-400 bg-rose-50/20'
                        : 'border-slate-200 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-100'
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

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Ghi Chú Cho Quán & Shipper (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="VD: Nhiều sốt sa tế, trứng lòng đào, để trước sảnh bảo vệ..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm outline-none focus:bg-white focus:border-amber-500 transition"
                />
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    3. Phương Thức Thanh Toán
                  </h3>
                  <p className="text-xs text-slate-400">Chọn cách thức thanh toán tiện lợi nhất cho bạn</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* COD */}
                <label
                  className={`p-4 rounded-2xl border-2 flex flex-col justify-between cursor-pointer transition ${
                    paymentMethod === 'COD'
                      ? 'border-amber-500 bg-amber-50/40 text-amber-950 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
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
                    <Banknote className="w-5 h-5 text-emerald-600" />
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-500 flex items-center justify-center">
                      {paymentMethod === 'COD' && (
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </span>
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-800">Tiền Mặt (COD)</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">Trả khi nhận đồ ăn</p>
                  </div>
                </label>

                {/* Banking / QR */}
                <label
                  className={`p-4 rounded-2xl border-2 flex flex-col justify-between cursor-pointer transition ${
                    paymentMethod === 'BANKING'
                      ? 'border-amber-500 bg-amber-50/40 text-amber-950 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
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
                    <CreditCard className="w-5 h-5 text-sky-600" />
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-500 flex items-center justify-center">
                      {paymentMethod === 'BANKING' && (
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </span>
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-800">VietQR / Banking</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">Chuyển khoản tức thì</p>
                  </div>
                </label>

                {/* Momo */}
                <label
                  className={`p-4 rounded-2xl border-2 flex flex-col justify-between cursor-pointer transition ${
                    paymentMethod === 'MOMO'
                      ? 'border-amber-500 bg-amber-50/40 text-amber-950 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50'
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
                    <Smartphone className="w-5 h-5 text-pink-600" />
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-500 flex items-center justify-center">
                      {paymentMethod === 'MOMO' && (
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                      )}
                    </span>
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-800">Ví MoMo</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">Quét mã ví MoMo</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT: Order Summary & Coupon Picker */}
          <div className="lg:col-span-5 space-y-6 sticky top-24">
            {/* COUPON & VOUCHER BOX */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Ticket className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  Mã Giảm Giá & Voucher Bếp Việt
                </h3>
              </div>

              {/* Coupon input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã (VD: INDOMIE20)"
                  value={inputCoupon}
                  onChange={(e) => setInputCoupon(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold uppercase tracking-wider outline-none focus:border-amber-500 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => handleApplyCoupon(inputCoupon)}
                  disabled={applyingCoupon || !inputCoupon.trim()}
                  className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-amber-300 font-bold text-xs transition"
                >
                  {applyingCoupon ? '...' : 'Áp Dụng'}
                </button>
              </div>

              {promoMessage && (
                <p
                  className={`text-xs font-medium px-3 py-2 rounded-xl flex items-center gap-1.5 ${
                    discount > 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-600 border border-rose-200'
                  }`}
                >
                  {discount > 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  <span>{promoMessage}</span>
                </p>
              )}

              {/* Quick voucher cards */}
              {availableCoupons.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Voucher Gợi Ý Cho Bạn (Bấm để áp dụng):
                  </p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {availableCoupons.map((c) => (
                      <button
                        type="button"
                        key={c.code}
                        onClick={() => handleApplyCoupon(c.code)}
                        className={`w-full text-left p-2.5 rounded-2xl border transition flex items-center justify-between text-xs ${
                          promoCode === c.code
                            ? 'bg-amber-50/70 border-amber-400 text-amber-950 font-bold'
                            : 'bg-slate-50/70 border-slate-200/80 hover:border-amber-300 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <div>
                            <span className="font-mono font-black text-amber-600">{c.code}</span>
                            <span className="text-[11px] text-slate-500 ml-1.5">
                              {c.description || (c.discount_type === 'percent' ? `Giảm ${c.discount_value}%` : `Giảm ${formatVND(c.discount_value)}`)}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                          {promoCode === c.code ? 'Đã Chọn' : 'Chọn Mã'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SUMMARY & SUBMIT */}
            <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-100 shadow-sm space-y-5">
              <h3 className="font-extrabold text-base text-slate-900 pb-3 border-b border-slate-100">
                Tóm Tắt Đơn Hàng ({cartItems.length} món)
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
                        <p className="font-bold text-slate-800 truncate">{item.food.name}</p>
                        <p className="text-[11px] text-slate-400">SL: {item.quantity} phần</p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-700 shrink-0">
                      {formatVND(item.food.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Calculations */}
              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Tạm tính:</span>
                  <span className="font-semibold text-slate-800">{formatVND(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Voucher ({promoCode}):</span>
                    <span>-{formatVND(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span>Phí ship nội thành Hà Nội:</span>
                  <span className="font-semibold text-slate-800">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-600 font-bold uppercase">
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
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-3 border-t border-slate-100">
                  <span>Tổng cộng:</span>
                  <span className="text-xl font-black text-amber-600">{formatVND(total)}</span>
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
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 active:scale-95 transition"
              >
                <span>{submitting ? 'Đang gửi đơn hàng tới Bếp Việt...' : 'Gửi Đơn Món Chờ Quán Duyệt'}</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>

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
