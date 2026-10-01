import React, { useState, useEffect } from 'react';
import { Modal } from '../../shared/components/ui/Modal';
import { Input } from '../../shared/components/ui/Input';
import { Button } from '../../shared/components/ui/Button';
import { useData } from '../../shared/context/DataContext';
import { Port, ExtraCostItem } from '../../types';
import { Plus, Trash2, ShieldAlert } from 'lucide-react';

interface EditPortModalProps {
  isOpen: boolean;
  onClose: () => void;
  port: Port | null;
}

export const EditPortModal: React.FC<EditPortModalProps> = ({ isOpen, onClose, port }) => {
  const { updatePort } = useData();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    country: '',
    type: 'loading' as 'loading' | 'destination',
    defaultOceanCost: 1500,
  });

  const [extraCosts, setExtraCosts] = useState<ExtraCostItem[]>([]);

  useEffect(() => {
    if (port) {
      setFormData({
        name: port.name || '',
        code: port.code || '',
        country: port.country || '',
        type: port.type || 'loading',
        defaultOceanCost: port.defaultOceanCost ? Number(port.defaultOceanCost) : 1500,
      });
      setExtraCosts(Array.isArray(port.extraCosts) ? [...port.extraCosts] : []);
    }
  }, [port]);

  if (!port) return null;

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
    if (!formData.name.trim() || !formData.code.trim()) return;

    const updated: Port = {
      ...port,
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      country: formData.country.trim(),
      type: formData.type,
      defaultOceanCost: Number(formData.defaultOceanCost) || 1500,
      extraCosts: extraCosts.filter((c) => c.name.trim() && c.amount > 0),
    };

    updatePort(updated);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`تعديل الميناء والأسعار: ${port.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4 dir-rtl text-right text-xs">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">نوع الميناء</label>
          <select
            value={formData.type}
            onChange={(e) =>
              setFormData({ ...formData, type: e.target.value as 'loading' | 'destination' })
            }
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
          >
            <option value="loading">ميناء تحميل وتصدير (Loading Port - USA)</option>
            <option value="destination">ميناء وصول وتفريغ (Destination Port)</option>
          </select>
        </div>

        <Input
          label="اسم الميناء الرسمي"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="رمز الميناء الدولي (Code)"
            required
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          />

          <Input
            label="الدولة / الإقليم"
            required
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          />
        </div>

        {/* Base Ocean Freight Price */}
        <Input
          label="سعر الشحن المبدئي للمسارات المقابلة ($)"
          type="number"
          value={formData.defaultOceanCost}
          onChange={(e) => setFormData({ ...formData, defaultOceanCost: Number(e.target.value) })}
        />

        {/* Dynamic Extra Costs Section (Port-specific fees) */}
        <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="font-bold text-slate-800 text-[11px]">
                رسوم الميناء الخاصة (رسوم تفريغ THC، رسوم أرضيات...)
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddExtraCost}
              className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>+ إضافة تكلفة</span>
            </button>
          </div>

          {extraCosts.length === 0 ? (
            <div className="text-center py-2 text-[11px] text-slate-400 bg-white/60 rounded-xl border border-dashed border-amber-200">
              لا توجد تكاليف إضافية مسجلة لهذا الميناء. اضغط (+ إضافة تكلفة) لإضافة بند جديد.
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

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary">
            حفظ التعديلات والأسعار
          </Button>
        </div>
      </form>
    </Modal>
  );
};
