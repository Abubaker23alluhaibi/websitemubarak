import React, { useState, useEffect } from 'react';
import { Modal } from '../../shared/components/ui/Modal';
import { Input } from '../../shared/components/ui/Input';
import { Button } from '../../shared/components/ui/Button';
import { useData } from '../../shared/context/DataContext';
import { USState, ExtraCostItem } from '../../types';
import { Plus, Trash2, MapPin } from 'lucide-react';

interface EditStateModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: USState | null;
}

export const EditStateModal: React.FC<EditStateModalProps> = ({ isOpen, onClose, state }) => {
  const { ports, updateState } = useData();
  const loadingPorts = ports.filter((p) => p.type === 'loading');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    inlandCost: 350,
    defaultLoadingPortId: '',
  });

  const [extraCosts, setExtraCosts] = useState<ExtraCostItem[]>([]);

  useEffect(() => {
    if (state) {
      setFormData({
        name: state.name || '',
        code: state.code || '',
        inlandCost: state.inlandCost !== undefined ? Number(state.inlandCost) : (state.towingCostAvg || 350),
        defaultLoadingPortId: state.defaultLoadingPortId || '',
      });
      setExtraCosts(Array.isArray(state.extraCosts) ? [...state.extraCosts] : []);
    }
  }, [state]);

  if (!state) return null;

  const handleAddExtraCost = () => {
    setExtraCosts((prev) => [
      ...prev,
      {
        id: `cost-${Date.now()}-${prev.length}`,
        name: prev.length === 0 ? 'رسوم سحب منطقة نائية' : 'رسوم بوابة المزاد',
        amount: 50,
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
    if (!formData.name.trim() || !formData.code.trim()) return;

    const finalInlandCost = Number(formData.inlandCost) || 0;

    const updated: USState = {
      ...state,
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      inlandCost: finalInlandCost,
      towingCostAvg: finalInlandCost,
      defaultLoadingPortId: formData.defaultLoadingPortId,
      extraCosts: extraCosts.filter((c) => c.name.trim() && c.amount > 0),
    };

    updateState(updated);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`تعديل الولاية والأسعار: ${state.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4 dir-rtl text-right text-xs">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="اسم الولاية"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Input
            label="رمز الولاية (2 أرقام/أحرف)"
            required
            maxLength={2}
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="تكلفة النقل الداخلي الثابتة ($ Inland Cost)"
            type="number"
            required
            value={formData.inlandCost}
            onChange={(e) => setFormData({ ...formData, inlandCost: Number(e.target.value) })}
          />

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              ميناء التحميل الافتراضي
            </label>
            <select
              value={formData.defaultLoadingPortId}
              onChange={(e) => setFormData({ ...formData, defaultLoadingPortId: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
            >
              {loadingPorts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Extra Costs */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              رسوم أو تكاليف إضافية خاصة بالولاية (اختياري)
            </span>
            <button
              type="button"
              onClick={handleAddExtraCost}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>+ إضافة تكلفة</span>
            </button>
          </div>

          {extraCosts.length === 0 ? (
            <div className="text-center py-2 text-[10px] text-slate-400">
              لا توجد تكاليف إضافية خاصة بهذه الولاية.
            </div>
          ) : (
            <div className="space-y-1.5">
              {extraCosts.map((cost, idx) => (
                <div key={cost.id || idx} className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200">
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-900"
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
