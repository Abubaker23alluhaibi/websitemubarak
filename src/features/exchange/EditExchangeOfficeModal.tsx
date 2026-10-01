import React, { useState, useEffect } from 'react';
import { Modal } from '../../shared/components/ui/Modal';
import { Input } from '../../shared/components/ui/Input';
import { Button } from '../../shared/components/ui/Button';
import { useData } from '../../shared/context/DataContext';
import { ExchangeOffice } from '../../types';

interface EditExchangeOfficeModalProps {
  isOpen: boolean;
  onClose: () => void;
  office: ExchangeOffice | null;
}

export const EditExchangeOfficeModal: React.FC<EditExchangeOfficeModalProps> = ({
  isOpen,
  onClose,
  office,
}) => {
  const { updateExchangeOffice } = useData();

  const [formData, setFormData] = useState({
    name: '',
    city: '',
    contactPerson: '',
    phone: '',
    balanceUsd: 0,
    notes: '',
  });

  useEffect(() => {
    if (office) {
      setFormData({
        name: office.name || '',
        city: office.city || '',
        contactPerson: office.contactPerson || '',
        phone: office.phone || '',
        balanceUsd: office.balanceUsd || 0,
        notes: office.notes || '',
      });
    }
  }, [office]);

  if (!office) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const updated: ExchangeOffice = {
      ...office,
      name: formData.name.trim(),
      city: formData.city.trim(),
      contactPerson: formData.contactPerson.trim(),
      phone: formData.phone.trim(),
      balanceUsd: Number(formData.balanceUsd) || 0,
      notes: formData.notes.trim() || undefined,
    };

    updateExchangeOffice(updated);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`تعديل بيانات الصيرفة: ${office.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4 dir-rtl text-right text-xs">
        <Input
          label="اسم مكتب الصرافة / الشركة"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="المدينة / المحافظة"
            required
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />

          <Input
            label="اسم الشخص المسؤول"
            required
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="رقم الهاتف"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <Input
            label="الرصيد الافتتاحي المبدئي ($)"
            type="number"
            value={formData.balanceUsd}
            onChange={(e) => setFormData({ ...formData, balanceUsd: Number(e.target.value) })}
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            ملاحظات إضافية
          </label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
          />
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
