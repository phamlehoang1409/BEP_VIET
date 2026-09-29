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
  FileText
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import {
  formatVND,
  validateVietnamPhone,
  validateDeliveryAddress,
  VIETNAM_PROVINCES,
  CITY_DISTRICTS
} from '../utils/vietnamData';
import { placeOrder } from '../api';

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, subtotal, deliveryFee, discount, total, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [streetAddress, setStreetAddress] = useState(user?.address || '');
  const [province, setProvince] = useState(user?.province || 'TP. Hồ Chí Minh');
  const [district, setDistrict] = useState(user?.district || 'Quận 1');
  const [ward, setWard] = useState(user?.ward || '');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Sync if user logged in
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name || '');
      if (!customerPhone) setCustomerPhone(user.phone || '');
      if (user.address && !streetAddress) setStreetAddress(user.address);
      if (user.province && !province) setProvince(user.province);
      if (user.district && !district) setDistrict(user.district);
    }
  }, [user]);

  // Update available districts when province changes
  const availableDistricts = CITY_DISTRICTS[province] || [
    'Quận / Huyện Trung Tâm',
    'Khu Vực 1',
    'Khu Vực 2'
  ];

  const handleProvinceChange = (e) => {
    const newProv = e.target.value;
    setProvince(newProv);
    const firstDistrict = CITY_DISTRICTS[newProv]?.[0] || 'Quận / Huyện Trung Tâm';
    setDistrict(firstDistrict);
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

    // Validate Address
    const addressVal = validateDeliveryAddress(streetAddress, province, district);
    if (!addressVal.isValid) {
      newErrors.address = addressVal.error;
    }

    if (cartItems.length === 0) {
      newErrors.cart = 'Giỏ hàng đang trống! Vui lòng chọn món trước khi đặt.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Vui lòng kiểm tra lại thông tin nhận hàng!', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const orderPayload = {
        customer_name: customerName.trim(),
        customer_phone: phoneVal.normalized,
        delivery_address: streetAddress.trim(),
        province,
        district,
        ward,
        note,
        payment_method: paymentMethod,
        discount,
        items: cartItems.map((item) => ({
          food_id: item.food.id,
          quantity: item.quantity
        }))
      };

      const res = await placeOrder(orderPayload);
      if (res.success && res.order) {
        clearCart();
        showToast('Đặt hàng thành công!', 'success');
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
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full mx-auto flex items-center justify-center">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-800">Giỏ hàng của bạn đang trống</h2>
        <p className="text-sm text-slate-500">
          Hãy chọn các món ăn thơm ngon từ thực đơn Bếp Việt trước khi thanh toán nhé!
        </p>
        <button
          onClick={() => navigate('/menu')}
          className="px-6 py-3 rounded-2xl bg-orange-500 text-white font-bold text-sm shadow-md hover:bg-orange-600 transition"
        >
          Khám Phá Thực Đơn
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10 pb-24 md:pb-12">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Xác Nhận Đơn Hàng & Giao Nhận
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Vui lòng kiểm tra địa chỉ và số điện thoại nhận hàng tại Việt Nam
        </p>
      </div>

      <form onSubmit={handleSubmitOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Customer & Address Form */}
          <div className="lg:col-span-7 space-y-6">
            {/* Contact Information */}
            <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    1. Thông Tin Người Nhận
                  </h3>
                  <p className="text-xs text-slate-400">Shipper sẽ gọi theo số này khi giao tới</p>
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
                    placeholder="VD: Nguyễn Văn An"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (errors.name) setErrors({ ...errors, name: null });
                    }}
                    className={`w-full px-4 py-2.5 rounded-2xl bg-slate-50 border text-sm font-semibold outline-none transition ${
                      errors.name
                        ? 'border-rose-400 bg-rose-50/20'
                        : 'border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100'
                    }`}
                  />
                  {errors.name && (
                    <p className="text-xs text-rose-500 mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Số Điện Thoại Việt Nam <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="0912 345 678"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        if (errors.phone) setErrors({ ...errors, phone: null });
                      }}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border text-sm font-semibold outline-none transition ${
                        errors.phone
                          ? 'border-rose-400 bg-rose-50/20'
                          : 'border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100'
                      }`}
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                  {errors.phone ? (
                    <p className="text-xs text-rose-500 mt-1">{errors.phone}</p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">Đầu số hợp lệ: 03, 05, 07, 08, 09 (10 số)</p>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    2. Địa Chỉ Giao Hàng Tại Việt Nam
                  </h3>
                  <p className="text-xs text-slate-400">Đảm bảo địa chỉ chính xác để nhận đồ nóng</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Province */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Tỉnh / Thành Phố <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={province}
                    onChange={handleProvinceChange}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold outline-none focus:bg-white focus:border-orange-500 transition"
                  >
                    {VIETNAM_PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Quận / Huyện <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold outline-none focus:bg-white focus:border-orange-500 transition"
                  >
                    {availableDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Street Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Số nhà, Tên Đường, Phường/Xã <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Số 45 Lê Duẩn, Tòa nhà Bitexco, Tầng 3..."
                  value={streetAddress}
                  onChange={(e) => {
                    setStreetAddress(e.target.value);
                    if (errors.address) setErrors({ ...errors, address: null });
                  }}
                  className={`w-full px-4 py-2.5 rounded-2xl bg-slate-50 border text-sm font-semibold outline-none transition ${
                    errors.address
                      ? 'border-rose-400 bg-rose-50/20'
                      : 'border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-100'
                  }`}
                />
                {errors.address && (
                  <p className="text-xs text-rose-500 mt-1">{errors.address}</p>
                )}
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Ghi Chú Cho Shipper / Đầu Bếp (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="VD: Gọi trước khi tới 5 phút, để trước cửa nhà, không ớt..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm outline-none focus:bg-white focus:border-orange-500 transition"
                />
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
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
                      ? 'border-orange-500 bg-orange-50/40 text-orange-900 shadow-sm'
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
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-orange-500 flex items-center justify-center">
                      {paymentMethod === 'COD' && (
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                      )}
                    </span>
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-800">Tiền Mặt (COD)</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">Trả khi nhận món ăn</p>
                  </div>
                </label>

                {/* Banking / QR */}
                <label
                  className={`p-4 rounded-2xl border-2 flex flex-col justify-between cursor-pointer transition ${
                    paymentMethod === 'BANKING'
                      ? 'border-orange-500 bg-orange-50/40 text-orange-900 shadow-sm'
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
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-orange-500 flex items-center justify-center">
                      {paymentMethod === 'BANKING' && (
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                      )}
                    </span>
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-800">VietQR / Banking</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">Chuyển khoản liên ngân hàng</p>
                  </div>
                </label>

                {/* Momo */}
                <label
                  className={`p-4 rounded-2xl border-2 flex flex-col justify-between cursor-pointer transition ${
                    paymentMethod === 'MOMO'
                      ? 'border-orange-500 bg-orange-50/40 text-orange-900 shadow-sm'
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
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-orange-500 flex items-center justify-center">
                      {paymentMethod === 'MOMO' && (
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                      )}
                    </span>
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-800">Ví MoMo</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">Thanh toán tức thời</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT: Order Summary */}
          <div className="lg:col-span-5 bg-white p-5 sm:p-7 rounded-3xl border border-slate-100 shadow-sm space-y-5 sticky top-24">
            <h3 className="font-extrabold text-base text-slate-900 pb-3 border-b border-slate-100">
              Tóm Tắt Đơn Hàng ({cartItems.length} món)
            </h3>

            {/* Items review */}
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
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
                  <span>Ưu đãi voucher:</span>
                  <span>-{formatVND(discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Phí vận chuyển:</span>
                <span className="font-semibold text-slate-800">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-600 font-bold uppercase">Miễn phí</span>
                  ) : (
                    formatVND(deliveryFee)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-3 border-t border-slate-100">
                <span>Tổng cộng:</span>
                <span className="text-xl font-black text-orange-600">{formatVND(total)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm shadow-xl shadow-orange-500/30 active:scale-95 transition"
            >
              <span>{submitting ? 'Đang tạo đơn hàng...' : 'Xác Nhận Đặt Món Ngay'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Cam kết giao nóng hổi, bảo hiểm 100% món ăn</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
