import React, { useState } from 'react';
import { Modal } from '../../shared/components/ui/Modal';
import { Input } from '../../shared/components/ui/Input';
import { Button } from '../../shared/components/ui/Button';
import { Port, USState, ExtraCostItem } from '../../types';
import { Plus, Trash2, MapPin } from 'lucide-react';

interface AddStateModalProps {
  isOpen: boolean;
  onClose: () => void;
  loadingPorts: Port[];
  onAddState: (state: USState) => void;
}

export const AddStateModal: React.FC<AddStateModalProps> = ({
  isOpen,
  onClose,
  loadingPorts,
  onAddState,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [defaultLoadingPortId, setDefaultLoadingPortId] = useState(
    loadingPorts[0]?.id || ''
  );
  const [inlandCost, setInlandCost] = useState('');
  const [extraCosts, setExtraCosts] = useState<ExtraCostItem[]>([]);

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
    if (!name.trim() || !code.trim() || !inlandCost) return;

    onAddState({
      id: `st-${code.toLowerCase().trim()}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      defaultLoadingPortId: defaultLoadingPortId || loadingPorts[0]?.id,
      inlandCost: Number(inlandCost),
      towingCostAvg: Number(inlandCost),
      extraCosts: extraCosts.filter((c) => c.name.trim() && c.amount > 0),
    });

    setName('');
    setCode('');
    setInlandCost('');
    setExtraCosts([]);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="إضافة ولاية أمريكية وربطها بميناء التحميل"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 dir-rtl text-right text-xs">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Input
              label="اسم الولاية الأمريكية"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Input
              label="كود الولاية (حرفين)"
              required
              maxLength={2}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
            ميناء التحميل الافتراضي الأقرب
            <span className="text-[10px] text-slate-400 mr-1.5">(محصور من الموانئ المسجلة فقط)</span>
          </label>
          <select
            value={defaultLoadingPortId || loadingPorts[0]?.id}
            onChange={(e) => setDefaultLoadingPortId(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
          >
            {loadingPorts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        </div>

        <Input
          label="تكلفة النقل الداخلي الثابتة من ساحات المزاد للميناء ($)"
          type="number"
          required
          value={inlandCost}
          onChange={(e) => setInlandCost(e.target.value)}
        />

        {/* Dynamic Extra Costs for State */}
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

          {extraCosts.length > 0 && (
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

        <div className="pt-3 flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" size="sm">
            حفظ الولاية والربط
          </Button>
        </div>
      </form>
    </Modal>
  );
};
