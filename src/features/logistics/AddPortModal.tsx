import React, { useState, useEffect } from 'react';
import { Modal } from '../../shared/components/ui/Modal';
import { Input } from '../../shared/components/ui/Input';
import { Button } from '../../shared/components/ui/Button';
import { Port, ExtraCostItem } from '../../types';
import { Ship, Anchor, Plus, Trash2, ShieldAlert } from 'lucide-react';

interface AddPortModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'loading' | 'destination';
  onAddPort: (port: Port) => void;
}

export const AddPortModal: React.FC<AddPortModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'loading',
  onAddPort,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [country, setCountry] = useState(defaultType === 'loading' ? 'USA' : 'العراق');
  const [type, setType] = useState<'loading' | 'destination'>(defaultType);
  const [defaultOceanCost, setDefaultOceanCost] = useState('1500');
  const [clearanceCost, setClearanceCost] = useState('0');
  const [extraCosts, setExtraCosts] = useState<ExtraCostItem[]>([]);

  useEffect(() => {
    setType(defaultType);
    setCountry(defaultType === 'loading' ? 'USA' : 'العراق');
    setExtraCosts([]);
    setDefaultOceanCost(defaultType === 'loading' ? '1500' : '1500');
    setClearanceCost(defaultType === 'destination' ? '250' : '0');
  }, [defaultType, isOpen]);

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
    if (!name.trim() || !code.trim()) return;

    onAddPort({
      id: `port-${Date.now()}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      country: country.trim(),
      type,
      defaultOceanCost: Number(defaultOceanCost) || 1500,
      clearanceCost: type === 'destination' ? (Number(clearanceCost) || 0) : 0,
      extraCosts: extraCosts.filter((c) => c.name.trim() && c.amount > 0),
    });

    setName('');
    setCode('');
    setExtraCosts([]);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'loading' ? 'إضافة ميناء تحميل جديد (USA)' : 'إضافة ميناء وصول وتفريغ دولي'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 dir-rtl text-right text-xs">
        {/* Toggle Type */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setType('loading');
              setCountry('USA');
            }}
            className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              type === 'loading'
                ? 'bg-[#164E33] text-white border-[#164E33]'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Ship className="w-3.5 h-3.5" />
            <span>ميناء تحميل (USA)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setType('destination');
              setCountry('العراق');
            }}
            className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              type === 'destination'
                ? 'bg-[#164E33] text-white border-[#164E33]'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Anchor className="w-3.5 h-3.5" />
            <span>ميناء وصول (دولي)</span>
          </button>
        </div>

        {/* Port Name */}
        <Input
          label="اسم الميناء الكامل"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* Code & Country */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="رمز الميناء (Port Code)"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">الدولة</label>
            <input
              type="text"
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
            />
          </div>
        </div>

        {/* Base Ocean Freight Price for auto-generated routes */}
        <Input
          label="سعر الشحن المبدئي للمسارات المقابلة ($)"
          type="number"
          value={defaultOceanCost}
          onChange={(e) => setDefaultOceanCost(e.target.value)}
        />

        {/* Customs & Clearance Fee for Destination Ports */}
        {type === 'destination' && (
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              أجور التخليص والكمرك / الضريبة المعتمدة ($)
            </label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={clearanceCost}
              onChange={(e) => setClearanceCost(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-emerald-800 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              يتم اعتماد هذا المبلغ كرسوم كمرك وتخليص لهذا الميناء في حاسبة الشحن بدلاً من أي قيمة افتراضية.
            </p>
          </div>
        )}

        {/* Dynamic Extra Costs Section (Port-specific fees) */}
        <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="font-bold text-slate-800 text-[11px]">
                رسوم الميناء الخاصة (رسوم تفريغ THC، رسوم أرضيات الميناء...)
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddExtraCost}
              className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ إضافة تكلفة</span>
            </button>
          </div>

          {extraCosts.length === 0 ? (
            <div className="text-center py-2 text-[11px] text-slate-400 bg-white/60 rounded-xl border border-dashed border-amber-200">
              لا توجد تكاليف إضافية مضافة حالياً. اضغط (+ إضافة تكلفة) إذا كان هناك رسم حرب أو وقود.
            </div>
          ) : (
            <div className="space-y-2">
              {extraCosts.map((cost, idx) => (
                <div
                  key={cost.id || idx}
                  className="flex items-center gap-2 bg-white p-2 rounded-xl border border-amber-200"
                >
                  <input
                    type="text"
                    placeholder="اسم الرسم"
                    value={cost.name}
                    onChange={(e) => handleUpdateExtraCost(idx, 'name', e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <div className="flex items-center gap-1 w-28">
                    <input
                      type="number"
                      placeholder="المبلغ ($)"
                      value={cost.amount || ''}
                      onChange={(e) => handleUpdateExtraCost(idx, 'amount', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-amber-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <span className="text-xs font-bold text-slate-500">$</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveExtraCost(idx)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                    title="حذف الرسم"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" size="sm">
            حفظ الميناء والأسعار
          </Button>
        </div>
      </form>
    </Modal>
  );
};
