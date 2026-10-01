import React from 'react';
import { Car, Truck, Ship, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../shared/lib/formatters';

export const DashboardStats: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* 1. Primary Highlight Emerald Card (السيارات النشطة) */}
      <div className="bg-brand-dark text-white rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between group transition-transform hover:-translate-y-0.5">
        <div className="flex justify-between items-start">
          <span className="text-xs font-semibold text-emerald-200/80">إجمالي السيارات قيد الشحن</span>
          <div className="p-2.5 bg-white/10 rounded-2xl">
            <Car className="w-5 h-5 text-brand-accent" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-extrabold tracking-tight">24</h3>
            <span className="text-xs text-emerald-300 font-bold bg-white/10 px-2 py-0.5 rounded-full">+3 هذا الأسبوع</span>
          </div>
          <p className="text-[11px] text-emerald-300/70 mt-1">سيارات بمختلف مراحل النقل والشحن</p>
        </div>
      </div>

      {/* 2. White Card (النقل الداخلي الأمريكي) */}
      <div className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all hover:-translate-y-0.5">
        <div className="flex justify-between items-start">
          <span className="text-xs font-bold text-slate-500">النقل الداخلي الأمريكي</span>
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
            <Truck className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-extrabold text-slate-800">10</h3>
          <p className="text-[11px] text-slate-400 mt-1">في ساحات المزاد أو قيد السحب للميناء</p>
        </div>
      </div>

      {/* 3. White Card (الشحن البحري الدولي) */}
      <div className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all hover:-translate-y-0.5">
        <div className="flex justify-between items-start">
          <span className="text-xs font-bold text-slate-500">الشحن البحري الدولي</span>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Ship className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-extrabold text-slate-800">12</h3>
          <p className="text-[11px] text-slate-400 mt-1">داخل الحاويات في عرض البحر</p>
        </div>
      </div>

      {/* 4. White Card (المبالغ غير المسددة) */}
      <div className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all hover:-translate-y-0.5">
        <div className="flex justify-between items-start">
          <span className="text-xs font-bold text-slate-500">مستحقات بانتظار التحصيل</span>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-extrabold text-slate-800">{formatCurrency(42500)}</h3>
          <p className="text-[11px] text-slate-400 mt-1">فواتير سيارات بانتظار تسديد الزبائن</p>
        </div>
      </div>
    </div>
  );
};
