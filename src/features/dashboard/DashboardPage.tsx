import React, { useState } from 'react';
import { ExternalLink, ShieldCheck, Zap } from 'lucide-react';
import { useData } from '../../shared/context/DataContext';
import { formatCurrency } from '../../shared/lib/formatters';
import { CarDetailsModal } from '../cars/CarDetailsModal';
import { VinInspectorModal } from '../cars/VinInspectorModal';
import { Car } from '../../types';
import { POPULAR_DEMO_VINS } from '../../shared/lib/vinService';

export const DashboardPage: React.FC = () => {
  const { cars, exchangeOffices } = useData();
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'month' | 'year'>('month');
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  // NHTSA VIN Inspector State
  const [isVinInspectorOpen, setIsVinInspectorOpen] = useState(false);
  const [dashboardVinInput, setDashboardVinInput] = useState('');
  const [selectedVinToInspect, setSelectedVinToInspect] = useState<string>('');

  const activeCarsCount = cars.filter((c) => c.status !== 'delivered').length;
  const arrivedCarsCount = cars.filter((c) => c.status === 'arrived').length;

  const handleLaunchVinCheck = (vin?: string) => {
    const target = (vin || dashboardVinInput).trim().toUpperCase();
    if (target) {
      setSelectedVinToInspect(target);
      setIsVinInspectorOpen(true);
    } else {
      setIsVinInspectorOpen(true);
    }
  };

  return (
    <div className="space-y-5 text-slate-800 dir-rtl text-right text-xs">
      {/* 0. PROMINENT VIN DECODER BANNER (NHTSA & NMVTIS) */}
      <div className="bg-gradient-to-l from-[#123E28] via-[#164E33] to-[#1E6B47] text-white rounded-3xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
        {/* Subtle Decorative Background Circles */}
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-1/4 -top-12 w-36 h-36 bg-emerald-400/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Text & Header */}
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-xs text-emerald-200 border border-white/20 text-[10px] font-bold px-3 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>النظام الفيدرالي الأمريكي المفتوح (NHTSA vPIC + NMVTIS)</span>
            </div>

            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
              فاحص وتدقيق الشاصي الفيدرالي المباشر (VIN Decoder)
            </h2>
          </div>

          {/* Quick Input & CTA */}
          <div className="w-full lg:w-auto lg:min-w-[420px] bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 space-y-2.5">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={dashboardVinInput}
                  onChange={(e) => setDashboardVinInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && handleLaunchVinCheck()}
                  onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 200)}
                  placeholder="اكتب أو الصق رقم اللوت (Lot #) أو الشاصي (VIN)..."
                  maxLength={25}
                  className="w-full bg-white text-slate-900 placeholder-slate-400 font-mono text-xs rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-amber-400 uppercase font-bold"
                />
              </div>

              <button
                type="button"
                onClick={() => handleLaunchVinCheck()}
                className="bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm text-xs shrink-0 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                <span>فحص وبحث ⚡</span>
              </button>
            </div>

            {/* Quick Demo Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] text-emerald-200 font-medium">أمثلة سريعة:</span>
              <button
                type="button"
                onClick={() => {
                  setDashboardVinInput('54892102');
                  handleLaunchVinCheck('54892102');
                }}
                className="bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-300/30 text-[10px] font-bold px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>لوت: 54892102</span>
              </button>
              {POPULAR_DEMO_VINS.slice(0, 2).map((demo) => (
                <button
                  key={demo.vin}
                  type="button"
                  onClick={() => {
                    setDashboardVinInput(demo.vin);
                    handleLaunchVinCheck(demo.vin);
                  }}
                  className="bg-white/15 hover:bg-white/25 text-white border border-white/20 text-[10px] px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                >
                  {demo.label.split(' ')[0]} {demo.label.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 1. TOP ROW: Analytics Bar Chart (Left) + Trend Metric Card (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Analytics Monthly Bar Chart (2 cols) */}
        <div className="lg:col-span-2 bg-[#F9FBFA] border border-slate-100 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 text-sm">حركة الشحن (Analytics)</span>
            <button className="bg-[#164E33] text-white text-[11px] font-semibold px-3 py-1 rounded-full">
              آخر 3 أشهر
            </button>
          </div>

          {/* Minimalist Bar Chart Area */}
          <div className="relative pt-6 pb-2">
            {/* Dashed Target Line */}
            <div className="absolute top-10 left-0 right-0 border-b border-dashed border-amber-300 z-0"></div>

            {/* Bars container */}
            <div className="grid grid-cols-3 gap-8 items-end h-40 relative z-10 px-4">
              {/* October */}
              <div className="flex justify-center items-end gap-1.5 h-full">
                <div className="w-4 bg-slate-200 rounded-t-sm h-[45%]"></div>
                <div className="w-4 bg-[#84C0A2] rounded-t-sm h-[70%]"></div>
                <div className="w-4 bg-slate-200 rounded-t-sm h-[55%]"></div>
              </div>

              {/* November */}
              <div className="flex justify-center items-end gap-1.5 h-full">
                <div className="w-4 bg-slate-200 rounded-t-sm h-[60%]"></div>
                <div className="w-4 bg-[#164E33] rounded-t-sm h-[95%]"></div>
                <div className="w-4 bg-[#84C0A2] rounded-t-sm h-[75%]"></div>
              </div>

              {/* December */}
              <div className="flex justify-center items-end gap-1.5 h-full">
                <div className="w-4 bg-slate-200 rounded-t-sm h-[35%]"></div>
                <div className="w-4 bg-[#84C0A2] rounded-t-sm h-[65%]"></div>
                <div className="w-4 bg-slate-200 rounded-t-sm h-[40%]"></div>
              </div>
            </div>

            {/* Month labels */}
            <div className="grid grid-cols-3 text-center text-[11px] font-medium text-slate-400 mt-3 pt-2 border-t border-slate-100">
              <span>تشرين الأول (Oct)</span>
              <span className="font-bold text-slate-700">تشرين الثاني (Nov)</span>
              <span>كانون الأول (Dec)</span>
            </div>
          </div>
        </div>

        {/* Right: Trend Curve & Metric Summary (1 col) */}
        <div className="bg-[#F9FBFA] border border-slate-100 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-800 text-sm">ملخص الشحن</span>
            <div className="bg-slate-100 rounded-full p-0.5 flex gap-1 text-[10px]">
              <span className="px-2.5 py-0.5 rounded-full bg-white font-bold text-slate-700 shadow-2xs">الكل</span>
              <span className="px-2.5 py-0.5 rounded-full text-slate-500">البحري</span>
            </div>
          </div>

          {/* Numbers Header */}
          <div className="grid grid-cols-3 text-center pt-2">
            <div>
              <div className="text-base font-bold text-slate-800">{activeCarsCount}</div>
              <div className="text-[10px] text-slate-400">قيد الشحن</div>
            </div>
            <div>
              <div className="text-base font-bold text-slate-800">{arrivedCarsCount}</div>
              <div className="text-[10px] text-slate-400">وصلت الميناء</div>
            </div>
            <div>
              <div className="text-base font-bold text-slate-800">$1,530</div>
              <div className="text-[10px] text-slate-400">سعر الصرف</div>
            </div>
          </div>

          {/* Simple Vector Wave Trend */}
          <div className="h-16 flex items-center justify-center">
            <svg className="w-full h-12 text-[#164E33]" viewBox="0 0 200 40" fill="none">
              <path
                d="M 0 25 C 30 10, 60 30, 90 20 C 120 10, 150 35, 200 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Time Filter Pills */}
          <div className="flex justify-center gap-1.5 pt-1">
            {[
              { id: 'year', label: 'سنوي' },
              { id: 'month', label: 'شهري' },
              { id: 'day', label: 'يومي' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id as any)}
                className={`px-3 py-1 rounded-full text-[10px] font-medium transition-all ${
                  selectedPeriod === p.id
                    ? 'bg-[#164E33] text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. MIDDLE ROW: Simple Financial & Logistics Sparkline Stats */}
      <div className="bg-[#F9FBFA] border border-slate-100 rounded-2xl p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stat 1 */}
          <div className="flex items-center justify-between border-l border-slate-100 pl-4 last:border-l-0">
            <div>
              <div className="text-[11px] text-slate-400">السيارات النشطة</div>
              <div className="text-lg font-bold text-slate-800 mt-0.5">24 سيارة</div>
            </div>
            <svg className="w-16 h-8 text-[#84C0A2]" viewBox="0 0 50 20" fill="none">
              <path d="M0 15 Q 25 0, 50 10" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>

          {/* Stat 2 */}
          <div className="flex items-center justify-between border-l border-slate-100 pl-4 last:border-l-0">
            <div>
              <div className="text-[11px] text-slate-400">نسبة الشحن بالموعد</div>
              <div className="text-lg font-bold text-slate-800 mt-0.5">92%</div>
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              +4%
            </span>
          </div>

          {/* Stat 3 */}
          <div className="flex items-center justify-between border-l border-slate-100 pl-4 last:border-l-0">
            <div>
              <div className="text-[11px] text-slate-400">إجمالي الحوالات الموثقة</div>
              <div className="text-lg font-bold text-slate-800 mt-0.5">$212.9K</div>
            </div>
            <svg className="w-16 h-8 text-blue-400" viewBox="0 0 50 20" fill="none">
              <path d="M0 10 Q 25 20, 50 5" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>

          {/* Stat 4 */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400">متوسط وقت التفريغ</div>
              <div className="text-lg font-bold text-slate-800 mt-0.5">14 يوم</div>
            </div>
            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              مستقر
            </span>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM ROW: 3 Donut Indicator Gauges (Left) + Minimal Text Lists (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: 3 Donut Gauges (2 cols) */}
        <div className="lg:col-span-2 bg-[#F9FBFA] border border-slate-100 rounded-2xl p-5">
          <span className="font-bold text-slate-800 text-sm block mb-4">مؤشرات الأداء اللوجستي</span>
          <div className="grid grid-cols-3 gap-4 text-center">
            {/* Donut 1 */}
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-amber-400"
                    strokeDasharray="85, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-xs font-bold text-slate-800">85%</span>
              </div>
              <span className="text-[11px] font-medium text-slate-600 mt-2">الالتزام بالجدول</span>
              <span className="text-[10px] text-slate-400">22 سيارة</span>
            </div>

            {/* Donut 2 */}
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#164E33]"
                    strokeDasharray="40, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-xs font-bold text-slate-800">40%</span>
              </div>
              <span className="text-[11px] font-medium text-slate-600 mt-2">سعة الحاويات</span>
              <span className="text-[10px] text-slate-400">حاويات شاغرة</span>
            </div>

            {/* Donut 3 */}
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-slate-400"
                    strokeDasharray="65, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-xs font-bold text-slate-800">65%</span>
              </div>
              <span className="text-[11px] font-medium text-slate-600 mt-2">تحصيل الفواتير</span>
              <span className="text-[10px] text-slate-400">مسددة بالكامل</span>
            </div>
          </div>
        </div>

        {/* Right: Clean Minimal Text Summary Lists (1 col) */}
        <div className="bg-[#F9FBFA] border border-slate-100 rounded-2xl p-5 flex justify-between gap-4">
          {/* Top Cars */}
          <div className="space-y-2 flex-1">
            <span className="font-bold text-slate-700 text-xs block border-b border-slate-100 pb-1.5">
              أحدث الشحنات
            </span>
            <ol className="space-y-1.5 text-[11px] text-slate-600">
              {cars.slice(0, 3).map((car, i) => (
                <li key={car.id} className="flex justify-between items-center">
                  <span>{i + 1}. {car.make} {car.model}</span>
                  {car.auctionUrl && (
                    <a
                      href={car.auctionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-700"
                      title="معاينة المزاد"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </li>
              ))}
            </ol>
          </div>

          {/* Top Exchange Offices */}
          <div className="space-y-2 flex-1">
            <span className="font-bold text-slate-700 text-xs block border-b border-slate-100 pb-1.5">
              مكاتب الصرافة
            </span>
            <ol className="space-y-1.5 text-[11px] text-slate-600">
              {exchangeOffices.map((ex, i) => (
                <li key={ex.id} className="flex justify-between items-center">
                  <span className="truncate">{i + 1}. {ex.name.replace('شركة ', '').replace('مكتب ', '')}</span>
                  <span className="font-mono text-[10px] text-slate-500 font-semibold">{formatCurrency(Math.abs(ex.balanceUsd))}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Selected Car Details Modal */}
      {selectedCar && (
        <CarDetailsModal
          car={selectedCar}
          isOpen={!!selectedCar}
          onClose={() => setSelectedCar(null)}
        />
      )}

      {/* NHTSA Vin Inspector Modal */}
      <VinInspectorModal
        isOpen={isVinInspectorOpen}
        onClose={() => {
          setIsVinInspectorOpen(false);
          setSelectedVinToInspect('');
        }}
        initialVin={selectedVinToInspect || dashboardVinInput}
      />
    </div>
  );
};
