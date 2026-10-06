import React, { useState, useEffect } from 'react';
import { Bike, Navigation, MapPin, Phone, ShieldCheck, Star, Clock, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';

export default function LiveDriverMap({ order }) {
  const [driverProgress, setDriverProgress] = useState(35); // 0 to 100%
  const [etaMinutes, setEtaMinutes] = useState(18);

  const status = order?.status || 'preparing';

  // Driver details
  const driverInfo = {
    name: 'Nguyễn Văn Tuấn',
    phone: '0988 668 899',
    rating: '5.0',
    trips: '1,280+',
    vehicle: 'Honda Wave Alpha • 29B1-868.68',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    bagType: 'Hộp cách nhiệt chuyên dụng 2 lớp'
  };

  useEffect(() => {
    let interval;
    if (status === 'delivering' || status === 'preparing' || status === 'confirmed') {
      interval = setInterval(() => {
        setDriverProgress(prev => {
          if (prev >= 96) return 96;
          return prev + 1;
        });
        setEtaMinutes(prev => {
          if (prev <= 3) return 3;
          return prev - 0.2;
        });
      }, 4000);
    } else if (status === 'completed') {
      setDriverProgress(100);
      setEtaMinutes(0);
    }
    return () => clearInterval(interval);
  }, [status]);

  return (
    <div className="rounded-3xl bg-[#0F121C] border border-amber-500/30 overflow-hidden shadow-2xl text-white">
      {/* Map Header Status Banner */}
      <div className="p-4 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent border-b border-amber-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <h4 className="font-black text-sm text-white flex items-center gap-1.5">
              <span>Lộ Trình Shipper Hỏa Tốc</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                GPS Trực Tiếp
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              {status === 'completed'
                ? 'Đơn hàng đã được giao tận tay bạn'
                : `Dự kiến giao đến trong khoảng ${Math.ceil(etaMinutes)} phút nữa`}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-mono font-black text-amber-400">
            {status === 'completed' ? 'HOÀN TẤT' : `ETA: ~${Math.ceil(etaMinutes)} MIN`}
          </div>
        </div>
      </div>

      {/* Simulated GPS Vector Visual Area */}
      <div className="relative h-56 sm:h-64 bg-[#080A10] overflow-hidden flex flex-col justify-center px-6 sm:px-12 border-b border-slate-800">
        {/* Futuristic Grid Lines */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(245, 158, 11, 0.4) 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* Ambient route glow */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-32 bg-amber-500/10 blur-3xl pointer-events-none" />

        {/* Route Line Track */}
        <div className="relative z-10 w-full flex items-center justify-between">
          {/* Progress Path SVG */}
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 transition-all duration-1000"
              style={{ width: `${driverProgress}%` }}
            />
          </div>

          {/* Point A: Bếp Việt Central Kitchen */}
          <div className="relative z-20 flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/30 ring-4 ring-amber-500/20">
              <span className="text-lg">🍲</span>
            </div>
            <span className="text-[11px] font-black text-amber-300 mt-2 whitespace-nowrap">
              Bếp Việt Phố Cổ
            </span>
            <span className="text-[9px] text-slate-400">Điểm lấy món</span>
          </div>

          {/* Moving Shipper Marker */}
          <div 
            className="absolute z-30 top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-1000 flex flex-col items-center pointer-events-none"
            style={{ left: `calc(24px + (100% - 48px) * ${driverProgress / 100})` }}
          >
            {/* Pulsing Radar Ring */}
            <div className="relative">
              <span className="animate-ping absolute -inset-2 rounded-full bg-amber-400/40 opacity-75" />
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-orange-500 via-amber-400 to-emerald-400 text-slate-950 flex items-center justify-center shadow-xl shadow-orange-500/40 border-2 border-white">
                <Bike className="w-6 h-6 text-slate-950 animate-pulse" />
              </div>
            </div>
            <div className="mt-1 px-2 py-0.5 rounded-full bg-slate-900/90 border border-amber-400/50 text-[10px] font-bold text-amber-300 whitespace-nowrap shadow-md">
              🛵 Đang di chuyển ({Math.round(driverProgress)}%)
            </div>
          </div>

          {/* Point B: Customer Destination */}
          <div className="relative z-20 flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center font-black shadow-lg shadow-emerald-500/20">
              <MapPin className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-[11px] font-black text-emerald-400 mt-2 whitespace-nowrap">
              Địa Chỉ Của Bạn
            </span>
            <span className="text-[9px] text-slate-400 truncate max-w-[120px]">
              {order?.delivery_address ? order.delivery_address.slice(0, 18) + '...' : 'Điểm nhận hàng'}
            </span>
          </div>
        </div>

        {/* Live Distance & ETA badge floating */}
        <div className="mt-8 flex items-center justify-center gap-4 text-xs">
          <div className="px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-700/80 flex items-center gap-1.5 text-slate-300">
            <Navigation className="w-3.5 h-3.5 text-amber-400" />
            <span>Khoảng cách: <strong className="text-white">~2.4 km</strong></span>
          </div>
          <div className="px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-700/80 flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tốc độ: <strong className="text-emerald-400">32 km/h</strong></span>
          </div>
        </div>
      </div>

      {/* Driver Card & Contact */}
      <div className="p-4 sm:p-5 bg-[#0D0F18] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div className="relative shrink-0">
            <img 
              src={driverInfo.avatar} 
              alt={driverInfo.name}
              className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-400/50 shadow-md"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0D0F18]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h5 className="font-extrabold text-white text-sm">{driverInfo.name}</h5>
              <div className="flex items-center text-amber-400 text-xs font-bold gap-0.5 bg-amber-400/10 px-1.5 py-0.5 rounded-md">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{driverInfo.rating}</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{driverInfo.vehicle}</p>
            <p className="text-[10px] text-amber-300/80 mt-0.5">📦 {driverInfo.bagType}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <a
            href={`tel:${driverInfo.phone}`}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition"
          >
            <Phone className="w-4 h-4" />
            <span>Gọi Shipper</span>
          </a>
        </div>
      </div>
    </div>
  );
}
