import React, { useState } from 'react';
import { useData } from '../../shared/context/DataContext';
import { formatCurrency } from '../../shared/lib/formatters';
import { RefreshCw, Calculator, CheckCircle2 } from 'lucide-react';

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
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync if selection became empty
  const activeState = states.find((s) => s.id === selectedStateId) || states[0];
  const activeLoadingPort = loadingPorts.find((p) => p.id === selectedLoadingPortId) || loadingPorts[0];
  const activeDestPort = destPorts.find((p) => p.id === selectedDestPortId) || destPorts[0];

  const inlandCost = activeState ? Number(activeState.inlandCost ?? (activeState as any).towingCostAvg ?? 350) : 350;

  // Search for direct shipping route in dynamic logistics matrix
  const matchedRoute = routes.find(
    (r) =>
      activeLoadingPort &&
      activeDestPort &&
      r.loadingPortId === activeLoadingPort.id &&
      r.destinationPortId === activeDestPort.id
  );

  // Base ocean freight cost: route cost or destination port default or 1500
  const baseOceanCost = matchedRoute
    ? Number(matchedRoute.oceanFreightCost)
    : activeDestPort?.defaultOceanCost
    ? Number(activeDestPort.defaultOceanCost)
    : 1500;

  let vehicleSurcharge = 0;
  if (vehicleType === 'suv') vehicleSurcharge = 200;
  if (vehicleType === 'heavy') vehicleSurcharge = 500;

  const oceanCost = baseOceanCost + vehicleSurcharge;

  // Dynamic extra costs collection (War surcharges, fuel, port fees, etc.)
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

  // Clearance / Customs fee: strictly uses the destination port's configured clearanceCost (no hardcoded fallback)
  const clearanceCost = activeDestPort?.clearanceCost !== undefined ? Number(activeDestPort.clearanceCost) : 0;

  // Final Total Inclusive Shipping with Customs and Clearance
  const totalFinalShipping = inlandCost + oceanCost + extraCostsTotal + clearanceCost;

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#164E33]">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm">حاسبة الشحن الفورية</h2>
            <p className="text-[11px] text-slate-400">احتساب الشحن النهائي الكامل مع الكمرك والتخليص</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all shadow-2xs"
          title="تحديث البيانات من السيرفر"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#164E33]' : 'text-slate-400'}`} />
          <span>تحديث الأسعار</span>
        </button>
      </div>

      <div className="bg-[#F9FBFA] border border-slate-100 rounded-2xl p-5 space-y-5">
        {/* Vehicle Type */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">نوع المركبة</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'sedan', label: 'صالون (Sedan)' },
              { id: 'suv', label: 'دفع رباعي (SUV)' },
              { id: 'heavy', label: 'بيك آب / آلية (Heavy)' },
            ].map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setVehicleType(type.id as any)}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                  vehicleType === type.id
                    ? 'bg-[#164E33] text-white border-[#164E33] shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* State & Ports */}
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

        {/* Total Final Inclusive Shipping (الشحن النهائي الكامل مع الكمرك) */}
        <div className="bg-gradient-to-br from-[#164E33] to-[#0E3523] rounded-2xl p-6 text-white shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/80 pb-4">
            <div>
              <span className="text-emerald-300 text-[11px] font-bold block mb-1">
                نتيجة الحساب الشاملة
              </span>
              <h3 className="text-base sm:text-lg font-black text-white">
                الشحن النهائي الكامل مع الكمرك
              </h3>
            </div>
            <div className="text-right sm:text-left">
              <span className="text-3xl sm:text-4xl font-black text-emerald-300 tracking-tight block">
                {formatCurrency(totalFinalShipping)}
              </span>
              <span className="text-[10px] text-emerald-200/90 font-bold">
                المبلغ الإجمالي الصافي (USD)
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 text-emerald-100/95 text-xs leading-relaxed">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
            <span>
              هذا المبلغ هو السعر النهائي الشامل لكافة مراحل النقل الداخلي الأمريكي، الشحن البحري، والتخليص الجمركي والكمرك المعتمد لميناء ({activeDestPort?.name || 'الوصول'}) مع كافة الرسوم.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
