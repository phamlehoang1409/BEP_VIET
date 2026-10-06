import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MapPin, Clock, ShieldCheck, Truck, Sparkles, Heart, Award, ArrowUpRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Footer() {
  const { storeSettings } = useCart();

  return (
    <footer className="bg-[#0A0C13] border-t border-amber-500/20 text-slate-400 text-xs mt-16 relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 left-1/4 -mt-24 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 -mb-24 w-96 h-96 rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />

      {/* Trust banner */}
      <div className="border-b border-slate-800/80 bg-[#08090E]/60 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-white text-xs sm:text-sm">Giao Hỏa Tốc 20-30p</h5>
              <p className="text-[11px] text-slate-500">Đóng hộp giữ nhiệt nóng hổi</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-white text-xs sm:text-sm">Vệ Sinh An Toàn 100%</h5>
              <p className="text-[11px] text-slate-500">Nguyên liệu nhập mới trong ngày</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-white text-xs sm:text-sm">Hương Vị Đỉnh Cao</h5>
              <p className="text-[11px] text-slate-500">Công thức sốt độc quyền</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-white text-xs sm:text-sm">Phục Vụ Tận Tâm</h5>
              <p className="text-[11px] text-slate-500">Hỗ trợ khách hàng chu đáo 24/7</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Col 1: Brand details */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 text-2xl">
                🍜
              </div>
              <div>
                <h4 className="text-lg font-black tracking-tight bg-gradient-to-r from-amber-300 via-amber-200 to-orange-400 bg-clip-text text-transparent">
                  {storeSettings?.store_name || 'Bếp Việt Gourmet'}
                </h4>
                <p className="text-[11px] font-bold text-amber-400/80 uppercase tracking-wider">
                  Mì Indomie Thượng Hạng Hà Nội
                </p>
              </div>
            </div>

            <p className="text-slate-400 leading-relaxed text-xs">
              Thương hiệu ẩm thực Mì Indomie trộn sốt đặc sản hàng đầu tại Hà Nội. Đậm đà từng sợi mì, giòn thơm từng miếng xá xíu, bò trứng béo ngậy giao tận tay luôn nóng hổi.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <span className="text-xs text-slate-500">Thanh toán tiện lợi:</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-amber-300">
                VietQR
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-emerald-400">
                Tiền Mặt COD
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-pink-400">
                MoMo / App
              </span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h5 className="font-extrabold text-sm text-white uppercase tracking-wider">
              Khám Phá
            </h5>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-amber-400 transition flex items-center gap-1">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link to="/menu" className="hover:text-amber-400 transition flex items-center gap-1">
                  Thực đơn Indomie
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-amber-400 transition flex items-center gap-1">
                  Tra cứu đơn hàng
                </Link>
              </li>
              <li>
                <Link to="/menu?category=mi-indomie" className="hover:text-amber-400 transition flex items-center gap-1">
                  Món bán chạy
                </Link>
              </li>
              <li>
                <Link to="/menu?category=do-an-vat" className="hover:text-amber-400 transition flex items-center gap-1">
                  Đồ ăn vặt chiên giòn
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Policy & Support */}
          <div className="lg:col-span-3 space-y-3">
            <h5 className="font-extrabold text-sm text-white uppercase tracking-wider">
              Chính Sách & Hỗ Trợ
            </h5>
            <ul className="space-y-2 text-xs">
              <li className="text-slate-400">
                🚀 Giao hỏa tốc 12 quận nội thành Hà Nội
              </li>
              <li className="text-slate-400">
                🏷️ Mã giảm giá độc quyền mỗi ngày
              </li>
              <li className="text-slate-400">
                🛡️ Cam kết hoàn tiền nếu món không đúng yêu cầu
              </li>
              <li className="text-slate-400">
                📦 Hộp đựng giấy kraft sinh học thân thiện môi trường
              </li>
            </ul>
          </div>

          {/* Col 4: Store Contacts */}
          <div className="lg:col-span-3 space-y-3">
            <h5 className="font-extrabold text-sm text-white uppercase tracking-wider">
              Liên Hệ Đặt Quán
            </h5>
            <div className="space-y-2.5 text-xs">
              <a
                href={`tel:${storeSettings?.hotline || '0353859726'}`}
                className="p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-3 text-amber-300 font-bold transition group"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-amber-400/80 font-normal">Hotline / Zalo đặt gấp:</div>
                  <div className="text-sm font-black text-amber-300 group-hover:underline">
                    {storeSettings?.hotline || '0353859726'}
                  </div>
                </div>
              </a>

              <div className="flex items-start gap-2.5 text-slate-300">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Giờ mở cửa: <strong className="text-white">{storeSettings?.open_time || '08:00'} - {storeSettings?.close_time || '23:00'}</strong> (Hằng ngày)
                </span>
              </div>

              {storeSettings?.address && (
                <div className="flex items-start gap-2.5 text-slate-300">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{storeSettings.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom copyright bar */}
        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Bếp Việt Gourmet. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Thiết kế & Vận hành bởi Bếp Việt Gourmet Studio</span>
            <span
              onClick={() => { window.location.href = '/chu-quan-1409'; }}
              className="cursor-default select-none text-slate-800 hover:text-slate-700"
              title="Quản trị"
            >
              •
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
