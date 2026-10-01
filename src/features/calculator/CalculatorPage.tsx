import React, { useState } from 'react';
import { useData } from '../../shared/context/DataContext';
import { formatCurrency } from '../../shared/lib/formatters';
import { ShieldAlert, RefreshCw } from 'lucide-react';

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
  const [includeClearance, setIncludeClearance] = useState<boolean>(true);
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

  const clearanceEstimate = includeClearance ? 300 : 0;
  const totalEstimated = inlandCost + oceanCost + extraCostsTotal + clearanceEstimate;

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
    <div className="max-w-3xl mx-auto space-y-4 dir-rtl text-right text-xs">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-800 text-sm">حاسبة الشحن التقديرية الحية</h2>
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

      <div className="bg-[#F9FBFA] border border-slate-100 rounded-2xl p-5 space-y-4">
        {/* Vehicle Type */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">نوع المركبة</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'sedan', label: 'صالون (Sedan)', add: '+$0' },
              { id: 'suv', label: 'دفع رباعي (SUV)', add: '+$200' },
              { id: 'heavy', label: 'بيك آب / آلية (Heavy)', add: '+$500' },
            ].map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setVehicleType(type.id as any)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center flex flex-col items-center justify-center gap-0.5 ${
                  vehicleType === type.id
                    ? 'bg-[#164E33] text-white border-[#164E33]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{type.label}</span>
                <span className={`text-[10px] ${vehicleType === type.id ? 'text-emerald-200' : 'text-slate-400'}`}>
                  {type.add}
                </span>
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
              {states.map((st) => {
                const cost = st.inlandCost !== undefined ? Number(st.inlandCost) : (st.towingCostAvg || 250);
                return (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.code}) - ${cost}
                  </option>
                );
              })}
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
                {p.name} ({p.country}) - أساسي: ${p.defaultOceanCost || 1500}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic War/Fuel Surcharges Notification */}
        {allExtraCosts.length > 0 && (
          <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px]">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <span>رسوم وتكاليف إضافية مفعلة لهذا المسار / الميناء:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {allExtraCosts.map((ec) => (
                <span
                  key={ec.id || ec.name}
                  className="bg-white border border-amber-300 text-amber-950 font-bold px-2.5 py-1 rounded-xl text-xs flex items-center gap-1"
                >
                  <span>{ec.name}:</span>
                  <span className="text-amber-800">${ec.amount}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Optional Clearance Toggle */}
        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
          <label className="text-[11px] font-semibold text-slate-700 cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeClearance}
              onChange={(e) => setIncludeClearance(e.target.checked)}
              className="rounded text-[#164E33] focus:ring-[#164E33] w-4 h-4 cursor-pointer"
            />
            <span>احتساب رسوم الميناء والتخليص الجمركي التقديري (+300$)</span>
          </label>
          <span className="text-[10px] text-slate-400 font-medium">اختياري</span>
        </div>

        {/* Detailed Breakdown Summary */}
        <div className="border-t border-slate-200/60 pt-4 space-y-2.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>النقل الداخلي الأمريكي ({activeState?.name || 'الولاية'}):</span>
            <span className="font-bold text-slate-800">{formatCurrency(inlandCost)}</span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>الشحن البحري الدولي ({activeLoadingPort?.code || 'تحميل'} ← {activeDestPort?.name || 'وصول'}):</span>
            <span className="font-bold text-slate-800">{formatCurrency(oceanCost)}</span>
          </div>

          {/* Dynamic Extra Costs Itemized */}
          {allExtraCosts.map((ec) => (
            <div key={ec.id || ec.name} className="flex justify-between text-amber-900 font-semibold bg-amber-50/70 px-2 py-1 rounded-lg">
              <span className="flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-600 inline" />
                {ec.name}:
              </span>
              <span>+{formatCurrency(ec.amount)}</span>
            </div>
          ))}

          {includeClearance && (
            <div className="flex justify-between text-slate-600">
              <span>التخليص والميناء التقديري:</span>
              <span className="font-bold text-slate-800">{formatCurrency(clearanceEstimate)}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-sm font-bold text-slate-900 border-t border-slate-200 pt-3">
            <div>
              <span>المجموع الإجمالي الشامل:</span>
              <p className="text-[10px] font-normal text-slate-400">يشمل النقل والشحن والرسوم الإضافية</p>
            </div>
            <span className="text-[#164E33] font-black text-lg">{formatCurrency(totalEstimated)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
