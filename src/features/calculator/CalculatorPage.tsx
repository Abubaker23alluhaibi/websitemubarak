import React, { useState } from 'react';
import { useData } from '../../shared/context/DataContext';
import { formatCurrency } from '../../shared/lib/formatters';
import { RefreshCw, Calculator, CheckCircle2, Ship } from 'lucide-react';

export const CalculatorPage: React.FC = () => {
  const { states, ports, routes, refreshFromBackend } = useData();

  const loadingPorts = ports.filter((p) => p.type === 'loading');
  const destPorts = ports.filter((p) => p.type === 'destination');

  const [selectedStateId, setSelectedStateId] = useState<string>(() => states[0]?.id || '');
  const [selectedLoadingPortId, setSelectedLoadingPortId] = useState<string>(
    () => states[0]?.defaultLoadingPortId || loadingPorts[0]?.id || ''
  );
  const [selectedDestPortId, setSelectedDestPortId] = useState<string>(
    () => destPorts[0]?.id || ''
  );
  const [vehicleType, setVehicleType] = useState<'sedan' | 'suv' | 'heavy'>('sedan');
  const includeClearance = true;
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Active selections
  const activeState = states.find((s) => s.id === selectedStateId) || states[0];
  const activeLoadingPort = loadingPorts.find((p) => p.id === selectedLoadingPortId) || loadingPorts[0];
  const activeDestPort = destPorts.find((p) => p.id === selectedDestPortId) || destPorts[0];

  // 1. Inland Towing Cost from state
  const inlandCost = activeState ? Number(activeState.inlandCost ?? (activeState as any).towingCostAvg ?? 350) : 350;

  // 2. Maritime Route Search: (Loading Port <-> Destination Port)
  const matchedRoute = routes.find(
    (r) =>
      activeLoadingPort &&
      activeDestPort &&
      r.loadingPortId === activeLoadingPort.id &&
      r.destinationPortId === activeDestPort.id
  );

  // Fallback if direct route isn't created:
  // First look for any route to this destination port, otherwise port's initial rate or 1500
  const anyRouteToDest = routes.find((r) => activeDestPort && r.destinationPortId === activeDestPort.id);
  const isDirectRoute = Boolean(matchedRoute);

  const baseOceanCost = matchedRoute
    ? Number(matchedRoute.oceanFreightCost)
    : anyRouteToDest
    ? Number(anyRouteToDest.oceanFreightCost)
    : 1500;

  let vehicleSurcharge = 0;
  if (vehicleType === 'suv') vehicleSurcharge = 200;
  if (vehicleType === 'heavy') vehicleSurcharge = 500;

  const oceanCost = baseOceanCost + vehicleSurcharge;

  // 3. Dynamic Extra Costs Collection (Route + Destination Port + State)
  const routeExtraCosts = Array.isArray(matchedRoute?.extraCosts) ? matchedRoute.extraCosts : [];
  const destPortExtraCosts = Array.isArray(activeDestPort?.extraCosts) ? activeDestPort.extraCosts : [];
  const stateExtraCosts = Array.isArray(activeState?.extraCosts) ? activeState.extraCosts : [];

  const extraCostsMap = new Map<string, { id?: string; name: string; amount: number }>();
  [...routeExtraCosts, ...destPortExtraCosts, ...stateExtraCosts].forEach((cost, idx) => {
    if (cost && cost.name && Number(cost.amount) > 0) {
      const key = cost.name.trim().toLowerCase();
      if (!extraCostsMap.has(key)) {
        extraCostsMap.set(key, {
          id: cost.id || `cost-${idx}`,
          name: cost.name.trim(),
          amount: Number(cost.amount),
        });
      }
    }
  });

  const allExtraCosts = Array.from(extraCostsMap.values());
  const extraCostsTotal = allExtraCosts.reduce((sum, item) => sum + item.amount, 0);

  // 4. Customs Clearance & Port Fee (Port-specific, NOT hardcoded 300)
  // Check if this destination port has clearance available
  const portHasClearance = Boolean(
    activeDestPort &&
    activeDestPort.hasClearance !== false &&
    Number(activeDestPort.clearanceCost || 0) > 0
  );
  const portClearanceFee = portHasClearance ? Number(activeDestPort?.clearanceCost || 0) : 0;

  // Clearance amount actually applied based on port capability and user toggle
  const appliedClearanceCost = portHasClearance && includeClearance ? portClearanceFee : 0;

  // 5. Total Comprehensive Shipping
  const totalFinalShipping = inlandCost + oceanCost + extraCostsTotal + appliedClearanceCost;

  const handleStateChange = (stateId: string) => {
    setSelectedStateId(stateId);
    const st = states.find((s) => s.id === stateId);
    if (st && st.defaultLoadingPortId) {
      setSelectedLoadingPortId(st.defaultLoadingPortId);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshFromBackend();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 dir-rtl text-right text-xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#164E33]">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm">حاسبة الشحن الفورية</h2>
            <p className="text-[11px] text-slate-400">
              احتساب الشحن التقديري وفق المسارات الموانئ الملاحية والكمرك المعتمد
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          title="تحديث البيانات من السيرفر"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#164E33]' : 'text-slate-400'}`} />
          <span>تحديث الأسعار</span>
        </button>
      </div>

      <div className="bg-[#F9FBFA] border border-slate-100 rounded-2xl p-5 space-y-4">
        {/* 1. Vehicle Type */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">نوع المركبة</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'sedan', label: 'صالون (Sedan)', sub: 'أساسي' },
              { id: 'suv', label: 'دفع رباعي (SUV)', sub: '+$200' },
              { id: 'heavy', label: 'بيك آب / آلية (Heavy)', sub: '+$500' },
            ].map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setVehicleType(type.id as any)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                  vehicleType === type.id
                    ? 'bg-[#164E33] text-white border-[#164E33] shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{type.label}</span>
                <span className={`text-[10px] ${vehicleType === type.id ? 'text-emerald-200' : 'text-slate-400'}`}>
                  {type.sub}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. US State & Loading Port */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              ولاية المزاد في أمريكا
            </label>
            <select
              value={activeState?.id || ''}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-[#164E33]"
            >
              {states.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              ميناء التحميل (USA Loading Port)
            </label>
            <select
              value={activeLoadingPort?.id || ''}
              onChange={(e) => setSelectedLoadingPortId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-[#164E33]"
            >
              {loadingPorts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. Destination Port */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            ميناء الوصول والتفريغ الدولي
          </label>
          <select
            value={activeDestPort?.id || ''}
            onChange={(e) => setSelectedDestPortId(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-[#164E33]"
          >
            {destPorts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.country})
              </option>
            ))}
          </select>
        </div>

        {/* Maritime Route Info Strip */}
        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-950">
            <Ship className="w-4 h-4 text-[#164E33] shrink-0" />
            <span>
              <strong>المسار الملاحي البحري:</strong> {activeLoadingPort?.code || 'USA'} ← {activeDestPort?.name || 'الوصول'}
            </span>
          </div>
          <span className="text-[11px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
            {isDirectRoute ? `مسار معتمد (${matchedRoute?.estimatedDays || 25} يوم)` : 'تسعير ملاحي تقديري'}
          </span>
        </div>

        {/* Grand Result Highlight Card */}
        <div className="bg-gradient-to-br from-[#164E33] to-[#0E3523] rounded-2xl p-6 text-white shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-800/80 pb-4">
            <div>
              <span className="text-emerald-300 text-xs font-bold block mb-1">
                صافي التكلفة الشاملة المعتمدة
              </span>
              <h3 className="text-lg font-black text-white">
                الشحن النهائي الكامل {appliedClearanceCost > 0 ? 'مع الكمرك' : ''}
              </h3>
            </div>
            <div className="text-right sm:text-left">
              <span className="text-3xl sm:text-4xl font-black text-emerald-300 tracking-tight block">
                {formatCurrency(totalFinalShipping)}
              </span>
              <span className="text-[11px] text-emerald-200/90 font-bold">
                المبلغ الإجمالي الكامل الصافي (USD)
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-emerald-100/95 text-xs leading-relaxed">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
            <span>
              السعر أعلاه يمثل التكلفة الإجمالية الكاملة لشحن السيارة من ولاية ({activeState?.name}) إلى ({activeDestPort?.name})
              {appliedClearanceCost > 0 ? ' شاملاً كافة الرسوم والكمرك.' : '.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
