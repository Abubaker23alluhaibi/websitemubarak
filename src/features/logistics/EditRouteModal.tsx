import React, { useState, useEffect } from 'react';
import { Modal } from '../../shared/components/ui/Modal';
import { Input } from '../../shared/components/ui/Input';
import { Button } from '../../shared/components/ui/Button';
import { useData } from '../../shared/context/DataContext';
import { ShippingRoute, ExtraCostItem } from '../../types';
import { Plus, Trash2, ShieldAlert } from 'lucide-react';

interface EditRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: ShippingRoute | null;
}

export const EditRouteModal: React.FC<EditRouteModalProps> = ({ isOpen, onClose, route }) => {
  const { ports, updateRoute } = useData();
  const loadingPorts = ports.filter((p) => p.type === 'loading');
  const destinationPorts = ports.filter((p) => p.type === 'destination');

  const [formData, setFormData] = useState({
    loadingPortId: '',
    destinationPortId: '',
    oceanFreightCost: 1500,
    estimatedDays: 25,
  });

  const [extraCosts, setExtraCosts] = useState<ExtraCostItem[]>([]);

  useEffect(() => {
    if (route) {
      setFormData({
        loadingPortId: route.loadingPortId || '',
        destinationPortId: route.destinationPortId || '',
        oceanFreightCost: route.oceanFreightCost || 1500,
        estimatedDays: route.estimatedDays || 25,
      });
      setExtraCosts(Array.isArray(route.extraCosts) ? [...route.extraCosts] : []);
    }
  }, [route]);

  if (!route) return null;

  const handleAddExtraCost = () => {
    setExtraCosts((prev) => [
      ...prev,
      {
        id: `cost-${Date.now()}-${prev.length}`,
        name: prev.length === 0 ? 'رسوم مخاطر حرب' : 'رسوم وقود إضافية',
        amount: 150,
      },
    ]);
  };

  const handleUpdateExtraCost = (index: number, field: 'name' | 'amount', value: any) => {
    setExtraCosts((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: field === 'amount' ? Number(value) || 0 : value } : item
      )
    );
  };

  const handleRemoveExtraCost = (index: number) => {
    setExtraCosts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.loadingPortId || !formData.destinationPortId) return;

    const updated: ShippingRoute = {
      ...route,
      loadingPortId: formData.loadingPortId,
      destinationPortId: formData.destinationPortId,
      oceanFreightCost: Number(formData.oceanFreightCost) || 0,
      estimatedDays: Number(formData.estimatedDays) || 0,
      extraCosts: extraCosts.filter((c) => c.name.trim() && c.amount > 0),
    };

    updateRoute(updated);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تعديل مسار الشحن والرسوم">
      <form onSubmit={handleSubmit} className="space-y-4 dir-rtl text-right text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              ميناء التحميل (USA)
            </label>
            <select
              value={formData.loadingPortId}
              onChange={(e) => setFormData({ ...formData, loadingPortId: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
            >
              {loadingPorts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">ميناء الوصول</label>
            <select
              value={formData.destinationPortId}
              onChange={(e) => setFormData({ ...formData, destinationPortId: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
            >
              {destinationPorts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="تكلفة الشحن البحري ($ Ocean Freight)"
            type="number"
            required
            value={formData.oceanFreightCost}
            onChange={(e) => setFormData({ ...formData, oceanFreightCost: Number(e.target.value) })}
          />

          <Input
            label="المدة التقديرية للإبحار (أيام)"
            type="number"
            required
            value={formData.estimatedDays}
            onChange={(e) => setFormData({ ...formData, estimatedDays: Number(e.target.value) })}
          />
        </div>

        {/* Dynamic Extra Costs Section for this route */}
        <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
              رسوم أو تكاليف إضافية خاصة بالمسار (رسوم حرب، وقود...)
            </span>
            <button
              type="button"
              onClick={handleAddExtraCost}
              className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>+ إضافة تكلفة</span>
            </button>
          </div>

          {extraCosts.length === 0 ? (
            <div className="text-center py-2 text-[10px] text-slate-400">
              لا توجد تكاليف إضافية مسجلة لهذا المسار.
            </div>
          ) : (
            <div className="space-y-1.5">
              {extraCosts.map((cost, idx) => (
                <div key={cost.id || idx} className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-amber-200">
                  <input
                    type="text"
                    placeholder="اسم الرسم"
                    value={cost.name}
                    onChange={(e) => handleUpdateExtraCost(idx, 'name', e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800"
                  />
                  <div className="flex items-center gap-1 w-24">
                    <input
                      type="number"
                      placeholder="المبلغ ($)"
                      value={cost.amount || ''}
                      onChange={(e) => handleUpdateExtraCost(idx, 'amount', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-amber-900"
                    />
                    <span className="text-xs font-bold text-slate-500">$</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveExtraCost(idx)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary">
            حفظ التعديلات
          </Button>
        </div>
      </form>
    </Modal>
  );
};
