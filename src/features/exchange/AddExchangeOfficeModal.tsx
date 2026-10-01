import React, { useState } from 'react';
import { Modal } from '../../shared/components/ui/Modal';
import { Input } from '../../shared/components/ui/Input';
import { Button } from '../../shared/components/ui/Button';
import { ExchangeOffice } from '../../types';

interface AddExchangeOfficeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddOffice: (office: ExchangeOffice) => void;
}

export const AddExchangeOfficeModal: React.FC<AddExchangeOfficeModalProps> = ({
  isOpen,
  onClose,
  onAddOffice,
}) => {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [balanceAmount, setBalanceAmount] = useState('0');
  const [balanceDirection, setBalanceDirection] = useState<'our_credit' | 'their_credit'>('our_credit');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const numericAmount = Math.abs(Number(balanceAmount) || 0);
    const finalBalance = balanceDirection === 'our_credit' ? numericAmount : -numericAmount;

    onAddOffice({
      id: `ex-${Date.now()}`,
      name: name.trim(),
      city: city.trim() || 'بغداد',
      contactPerson: contactPerson.trim() || 'المدير المسؤول',
      phone: phone.trim() || '-',
      balanceUsd: finalBalance,
    });

    setName('');
    setCity('');
    setContactPerson('');
    setPhone('');
    setBalanceAmount('0');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="إضافة مكتب / شركة صرافة جديدة"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 dir-rtl text-right text-xs">
        <Input
          label="اسم شركة أو مكتب الصرافة"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="المدينة والفرع"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          <Input
            label="اسم الشخص المسؤول / جهة الاتصال"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
          />
        </div>

        <Input
          label="رقم الهاتف للتواصل"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        {/* الرصيد الافتتاحي واتجاهه */}
        <div className="bg-[#F9FBFA] p-3 rounded-2xl border border-slate-100 space-y-2.5">
          <label className="block text-[11px] font-bold text-slate-700">
            الرصيد الافتتاحي الحالي ($)
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setBalanceDirection('our_credit')}
              className={`py-2 px-3 rounded-xl border font-semibold text-center transition-all ${
                balanceDirection === 'our_credit'
                  ? 'bg-[#164E33] text-white border-[#164E33]'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              بذمة الصيرفة لنا (+)
            </button>

            <button
              type="button"
              onClick={() => setBalanceDirection('their_credit')}
              className={`py-2 px-3 rounded-xl border font-semibold text-center transition-all ${
                balanceDirection === 'their_credit'
                  ? 'bg-[#164E33] text-white border-[#164E33]'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              مستحق للصيرفة بذمتنا (-)
            </button>
          </div>

          <Input
            type="number"
            value={balanceAmount}
            onChange={(e) => setBalanceAmount(e.target.value)}
          />
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" size="sm">
            حفظ وإضافة الصيرفة
          </Button>
        </div>
      </form>
    </Modal>
  );
};
