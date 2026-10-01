import React from 'react';

export const LogisticsPipeline: React.FC = () => {
  const steps = [
    { label: 'ساحة المزاد', count: 4, percent: 16, color: 'bg-slate-300' },
    { label: 'النقل الداخلي', count: 6, percent: 25, color: 'bg-blue-400' },
    { label: 'ميناء التحميل', count: 5, percent: 21, color: 'bg-emerald-400' },
    { label: 'الشحن البحري', count: 7, percent: 29, color: 'bg-brand-dark' },
    { label: 'ميناء الوصول', count: 2, percent: 9, color: 'bg-amber-400' },
  ];

  return (
    <div className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-base">مسار الشحن والمراحل اللوجستية (Logistics Pipeline)</h3>
          <p className="text-xs text-slate-400 mt-0.5">توزيع 24 سيارة نشطة على مراحل النقل الفعلي</p>
        </div>
        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
          24 سيارة في المسار
        </span>
      </div>

      {/* Pill-shaped Multi-Segment Progress Bar */}
      <div className="space-y-2">
        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 gap-1">
          {steps.map((step, idx) => (
            <div
              key={idx}
              style={{ width: `${step.percent}%` }}
              className={`h-full rounded-full transition-all duration-500 ${step.color}`}
              title={`${step.label}: ${step.count} سيارة (${step.percent}%)`}
            />
          ))}
        </div>
      </div>

      {/* Legend & Breakdown Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
        {steps.map((step, idx) => (
          <div key={idx} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className={`w-2 h-2 rounded-full ${step.color}`} />
              <span>{step.label}</span>
            </div>
            <div className="text-lg font-black text-slate-800">{step.count} <span className="text-xs font-normal text-slate-400">سيارات</span></div>
          </div>
        ))}
      </div>
    </div>
  );
};
