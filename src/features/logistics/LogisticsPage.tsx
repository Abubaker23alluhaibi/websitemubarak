import React, { useState } from 'react';
import { useData } from '../../shared/context/DataContext';
import { Port, USState, ShippingRoute } from '../../types';
import { formatCurrency } from '../../shared/lib/formatters';
import { AddPortModal } from './AddPortModal';
import { EditPortModal } from './EditPortModal';
import { AddStateModal } from './AddStateModal';
import { EditStateModal } from './EditStateModal';
import { AddRouteModal } from './AddRouteModal';
import { EditRouteModal } from './EditRouteModal';
import { ConfirmDeleteModal } from '../../shared/components/ui/ConfirmDeleteModal';
import { Ship, Anchor, Search, Trash2, Plus, Edit3 } from 'lucide-react';

export const LogisticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'loading_ports' | 'dest_ports' | 'states' | 'routes'>('loading_ports');

  const {
    ports,
    states,
    routes,
    addPort,
    deletePort,
    addState,
    deleteState,
    addRoute,
    deleteRoute,
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');

  const [isAddPortOpen, setIsAddPortOpen] = useState(false);
  const [addPortDefaultType, setAddPortDefaultType] = useState<'loading' | 'destination'>('loading');
  const [portToEdit, setPortToEdit] = useState<Port | null>(null);
  const [portToDelete, setPortToDelete] = useState<Port | null>(null);

  const [isAddStateOpen, setIsAddStateOpen] = useState(false);
  const [stateToEdit, setStateToEdit] = useState<USState | null>(null);
  const [stateToDelete, setStateToDelete] = useState<USState | null>(null);

  const [isAddRouteOpen, setIsAddRouteOpen] = useState(false);
  const [routeToEdit, setRouteToEdit] = useState<ShippingRoute | null>(null);
  const [routeToDelete, setRouteToDelete] = useState<ShippingRoute | null>(null);

  const loadingPorts = ports.filter((p) => p.type === 'loading');
  const destinationPorts = ports.filter((p) => p.type === 'destination');

  const filteredLoadingPorts = loadingPorts.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDestPorts = destinationPorts.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.toLowerCase().includes(searchQuery.toLowerCase()) || p.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStates = states.filter((st) =>
    st.name.toLowerCase().includes(searchQuery.toLowerCase()) || st.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 dir-rtl text-right text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="font-bold text-slate-800 text-sm">إدارة الموانئ والولايات</h2>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {activeTab === 'loading_ports' && (
            <button
              onClick={() => {
                setAddPortDefaultType('loading');
                setIsAddPortOpen(true);
              }}
              className="bg-[#164E33] hover:bg-[#1B5E3F] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ إضافة ميناء تحميل (أمريكا)</span>
            </button>
          )}

          {activeTab === 'dest_ports' && (
            <button
              onClick={() => {
                setAddPortDefaultType('destination');
                setIsAddPortOpen(true);
              }}
              className="bg-[#164E33] hover:bg-[#1B5E3F] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ إضافة ميناء وصول (دولي)</span>
            </button>
          )}

          {activeTab === 'states' && (
            <button
              onClick={() => setIsAddStateOpen(true)}
              className="bg-[#164E33] hover:bg-[#1B5E3F] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ إضافة ولاية أمريكية</span>
            </button>
          )}

          {activeTab === 'routes' && (
            <button
              onClick={() => setIsAddRouteOpen(true)}
              className="bg-[#164E33] hover:bg-[#1B5E3F] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ تسعير مسار بحري</span>
            </button>
          )}
        </div>
      </div>

      {/* Clean Tab Switcher (فقط قوائم التحميل، الوصول، الولايات، والمسارات) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('loading_ports')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'loading_ports'
                ? 'bg-[#164E33] text-white'
                : 'bg-[#F7F9F8] text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Ship className="w-3.5 h-3.5" />
            <span>موانئ التحميل (أمريكا) ({loadingPorts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('dest_ports')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'dest_ports'
                ? 'bg-[#164E33] text-white'
                : 'bg-[#F7F9F8] text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Anchor className="w-3.5 h-3.5" />
            <span>موانئ الوصول والتفريغ ({destinationPorts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('states')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'states'
                ? 'bg-[#164E33] text-white'
                : 'bg-[#F7F9F8] text-slate-600 hover:bg-slate-100'
            }`}
          >
            الولايات والنقل الداخلي ({states.length})
          </button>

          <button
            onClick={() => setActiveTab('routes')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'routes'
                ? 'bg-[#164E33] text-white'
                : 'bg-[#F7F9F8] text-slate-600 hover:bg-slate-100'
            }`}
          >
            مصفوفة الأسعار والمسارات ({routes.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-56">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث..."
            className="w-full bg-[#F7F9F8] border border-slate-200/80 rounded-full pr-8 pl-3 py-1 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2" />
        </div>
      </div>

      {/* 1. LOADING PORTS LIST (أمريكا) */}
      {activeTab === 'loading_ports' && (
        <div className="bg-[#F9FBFA] border border-slate-100 rounded-2xl p-4 overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold pb-2.5">
                <th className="pb-2.5 pr-2">ميناء التحميل (USA)</th>
                <th className="pb-2.5">الرمز (Code)</th>
                <th className="pb-2.5">الدولة</th>
                <th className="pb-2.5">سعر الشحن الأساسي ($)</th>
                <th className="pb-2.5">رسوم إضافية (حرب / وقود)</th>
                <th className="pb-2.5 text-left pl-2">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {filteredLoadingPorts.map((p) => {
                const extraCosts = Array.isArray(p.extraCosts) ? p.extraCosts : [];
                return (
                  <tr key={p.id} className="hover:bg-white/80 transition-colors">
                    <td className="py-3 pr-2 font-bold text-slate-800 flex items-center gap-2">
                      <Ship className="w-3.5 h-3.5 text-[#164E33]" />
                      <span>{p.name}</span>
                    </td>
                    <td className="py-3 font-mono font-bold text-slate-700">{p.code}</td>
                    <td className="py-3 text-slate-600">{p.country}</td>
                    <td className="py-3 font-black text-[#164E33]">
                      {formatCurrency(p.defaultOceanCost || 1500)}
                    </td>
                    <td className="py-3">
                      {extraCosts.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {extraCosts.map((ec, idx) => (
                            <span
                              key={idx}
                              className="bg-amber-100 text-amber-900 border border-amber-300/80 px-2 py-0.5 rounded-lg text-[10px] font-bold"
                            >
                              {ec.name}: ${ec.amount}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3 text-left pl-2">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPortToEdit(p)}
                          className="text-emerald-700 hover:text-emerald-900 p-1 hover:bg-emerald-50 rounded-md transition-colors"
                          title="تعديل الميناء والأسعار"
                        >
                          <Edit3 className="w-3.5 h-3.5 inline" />
                        </button>
                        <button
                          onClick={() => setPortToDelete(p)}
                          className="text-slate-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-md transition-colors"
                          title="حذف الميناء"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. DESTINATION PORTS LIST (الوصول الدولي) */}
      {activeTab === 'dest_ports' && (
        <div className="bg-[#F9FBFA] border border-slate-100 rounded-2xl p-4 overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold pb-2.5">
                <th className="pb-2.5 pr-2">ميناء الوصول والتفريغ</th>
                <th className="pb-2.5">الرمز (Code)</th>
                <th className="pb-2.5">دولة الوصول</th>
                <th className="pb-2.5">سعر الشحن الأساسي ($)</th>
                <th className="pb-2.5">رسوم إضافية (حرب / وقود)</th>
                <th className="pb-2.5 text-left pl-2">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {filteredDestPorts.map((p) => {
                const extraCosts = Array.isArray(p.extraCosts) ? p.extraCosts : [];
                return (
                  <tr key={p.id} className="hover:bg-white/80 transition-colors">
                    <td className="py-3 pr-2 font-bold text-slate-800 flex items-center gap-2">
                      <Anchor className="w-3.5 h-3.5 text-blue-600" />
                      <span>{p.name}</span>
                    </td>
                    <td className="py-3 font-mono font-bold text-slate-700">{p.code}</td>
                    <td className="py-3 text-slate-600 font-medium">{p.country}</td>
                    <td className="py-3 font-black text-[#164E33]">
                      {formatCurrency(p.defaultOceanCost || 1500)}
                    </td>
                    <td className="py-3">
                      {extraCosts.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {extraCosts.map((ec, idx) => (
                            <span
                              key={idx}
                              className="bg-amber-100 text-amber-900 border border-amber-300/80 px-2 py-0.5 rounded-lg text-[10px] font-bold"
                            >
                              {ec.name}: ${ec.amount}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3 text-left pl-2">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPortToEdit(p)}
                          className="text-emerald-700 hover:text-emerald-900 p-1 hover:bg-emerald-50 rounded-md transition-colors"
                          title="تعديل الميناء والأسعار"
                        >
                          <Edit3 className="w-3.5 h-3.5 inline" />
                        </button>
                        <button
                          onClick={() => setPortToDelete(p)}
                          className="text-slate-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-md transition-colors"
                          title="حذف الميناء"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. STATES LIST */}
      {activeTab === 'states' && (
        <div className="bg-[#F9FBFA] border border-slate-100 rounded-2xl p-4 overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold pb-2.5">
                <th className="pb-2.5 pr-2">الولاية الأمريكية</th>
                <th className="pb-2.5">الكود</th>
                <th className="pb-2.5">ميناء التحميل المربوط تلقائياً</th>
                <th className="pb-2.5">أجور النقل الداخلي ($)</th>
                <th className="pb-2.5">رسوم إضافية</th>
                <th className="pb-2.5 text-left pl-2">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {filteredStates.map((st) => {
                const port = ports.find((p) => p.id === st.defaultLoadingPortId);
                const extraCosts = Array.isArray(st.extraCosts) ? st.extraCosts : [];
                const cost = st.inlandCost !== undefined ? Number(st.inlandCost) : (st.towingCostAvg || 250);
                return (
                  <tr key={st.id} className="hover:bg-white/80 transition-colors">
                    <td className="py-3 pr-2 font-bold text-slate-800">{st.name}</td>
                    <td className="py-3 font-mono text-slate-600 font-bold">{st.code}</td>
                    <td className="py-3">
                      <span className="font-semibold text-slate-700 bg-white border border-slate-200/60 px-2.5 py-1 rounded-xl">
                        {port?.name || 'غير محدد'}
                      </span>
                    </td>
                    <td className="py-3 font-black text-[#164E33]">
                      {formatCurrency(cost)}
                    </td>
                    <td className="py-3">
                      {extraCosts.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {extraCosts.map((ec, idx) => (
                            <span
                              key={idx}
                              className="bg-slate-100 text-slate-800 border border-slate-300 px-2 py-0.5 rounded-lg text-[10px] font-bold"
                            >
                              {ec.name}: ${ec.amount}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3 text-left pl-2">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setStateToEdit(st)}
                          className="text-emerald-700 hover:text-emerald-900 p-1 hover:bg-emerald-50 rounded-md transition-colors"
                          title="تعديل الولاية"
                        >
                          <Edit3 className="w-3.5 h-3.5 inline" />
                        </button>
                        <button
                          onClick={() => setStateToDelete(st)}
                          className="text-slate-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-md transition-colors"
                          title="حذف الولاية"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. ROUTES LIST */}
      {activeTab === 'routes' && (
        <div className="bg-[#F9FBFA] border border-slate-100 rounded-2xl p-4 overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold pb-2.5">
                <th className="pb-2.5 pr-2">ميناء التحميل (USA)</th>
                <th className="pb-2.5">ميناء الوصول الدولي</th>
                <th className="pb-2.5">سعر الشحن البحري</th>
                <th className="pb-2.5">رسوم إضافية للمسار</th>
                <th className="pb-2.5">المدة التقديرية</th>
                <th className="pb-2.5 text-left pl-2">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {routes.map((rt) => {
                const loadPort = ports.find((p) => p.id === rt.loadingPortId);
                const destPort = ports.find((p) => p.id === rt.destinationPortId);
                const extraCosts = Array.isArray(rt.extraCosts) ? rt.extraCosts : [];
                return (
                  <tr key={rt.id} className="hover:bg-white/80 transition-colors">
                    <td className="py-3 pr-2 font-bold text-slate-800">{loadPort?.name || 'غير معروف'}</td>
                    <td className="py-3 font-semibold text-slate-700">{destPort?.name || 'غير معروف'}</td>
                    <td className="py-3 font-black text-[#164E33]">
                      {formatCurrency(rt.oceanFreightCost)}
                    </td>
                    <td className="py-3">
                      {extraCosts.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {extraCosts.map((ec, idx) => (
                            <span
                              key={idx}
                              className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-lg text-[10px] font-bold"
                            >
                              {ec.name}: ${ec.amount}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3 text-slate-500">{rt.estimatedDays} يوم</td>
                    <td className="py-3 text-left pl-2">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setRouteToEdit(rt)}
                          className="text-emerald-700 hover:text-emerald-900 p-1 hover:bg-emerald-50 rounded-md transition-colors"
                          title="تعديل المسار"
                        >
                          <Edit3 className="w-3.5 h-3.5 inline" />
                        </button>
                        <button
                          onClick={() => setRouteToDelete(rt)}
                          className="text-slate-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-md transition-colors"
                          title="حذف المسار"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <AddPortModal
        isOpen={isAddPortOpen}
        defaultType={addPortDefaultType}
        onClose={() => setIsAddPortOpen(false)}
        onAddPort={addPort}
      />
      {portToEdit && (
        <EditPortModal
          port={portToEdit}
          isOpen={!!portToEdit}
          onClose={() => setPortToEdit(null)}
        />
      )}
      {portToDelete && (
        <ConfirmDeleteModal
          isOpen={!!portToDelete}
          onClose={() => setPortToDelete(null)}
          onConfirm={() => {
            deletePort(portToDelete.id);
            setPortToDelete(null);
          }}
          title="حذف الميناء"
          message={`هل أنت متأكد من حذف الميناء ${portToDelete.name}؟`}
        />
      )}

      <AddStateModal
        isOpen={isAddStateOpen}
        onClose={() => setIsAddStateOpen(false)}
        loadingPorts={loadingPorts}
        onAddState={addState}
      />
      {stateToEdit && (
        <EditStateModal
          state={stateToEdit}
          isOpen={!!stateToEdit}
          onClose={() => setStateToEdit(null)}
        />
      )}
      {stateToDelete && (
        <ConfirmDeleteModal
          isOpen={!!stateToDelete}
          onClose={() => setStateToDelete(null)}
          onConfirm={() => {
            deleteState(stateToDelete.id);
            setStateToDelete(null);
          }}
          title="حذف الولاية"
          message={`هل أنت متأكد من حذف الولاية ${stateToDelete.name} (${stateToDelete.code})؟`}
        />
      )}

      <AddRouteModal
        isOpen={isAddRouteOpen}
        onClose={() => setIsAddRouteOpen(false)}
        loadingPorts={loadingPorts}
        destinationPorts={destinationPorts}
        onAddRoute={addRoute}
      />
      {routeToEdit && (
        <EditRouteModal
          route={routeToEdit}
          isOpen={!!routeToEdit}
          onClose={() => setRouteToEdit(null)}
        />
      )}
      {routeToDelete && (
        <ConfirmDeleteModal
          isOpen={!!routeToDelete}
          onClose={() => setRouteToDelete(null)}
          onConfirm={() => {
            deleteRoute(routeToDelete.id);
            setRouteToDelete(null);
          }}
          title="حذف المسار البحري"
          message="هل أنت متأكد من حذف هذا المسار الملاحي؟"
        />
      )}
    </div>
  );
};
