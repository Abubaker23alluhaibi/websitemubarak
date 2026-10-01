import React, { useState, useEffect } from 'react';
import { Modal } from '../../shared/components/ui/Modal';
import { Input } from '../../shared/components/ui/Input';
import { Button } from '../../shared/components/ui/Button';
import { useData } from '../../shared/context/DataContext';
import { MoneyTransfer, TransferDirection, TransferPurpose } from '../../types';

interface EditTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  transfer: MoneyTransfer | null;
}

export const EditTransferModal: React.FC<EditTransferModalProps> = ({
  isOpen,
  onClose,
  transfer,
}) => {
  const { updateTransfer } = useData();

  const [formData, setFormData] = useState({
    customerName: '',
    carLot: '',
    purpose: 'car_purchase' as TransferPurpose,
    customPurpose: '',
    direction: 'inbound' as TransferDirection,
    originalAmount: 0,
    currency: 'USD' as 'USD' | 'IQD' | 'EUR',
    exchangeRate: 1,
    location: '',
    receivedAt: '',
    notes: '',
    hasCommission: false,
    commissionType: 'on_us' as 'on_us' | 'for_us',
    commissionRate: 0,
    commissionAmount: 0,
  });

  useEffect(() => {
    if (transfer) {
      setFormData({
        customerName: transfer.customerName || '',
        carLot: transfer.carLot || '',
        purpose: (transfer.purpose as TransferPurpose) || 'car_purchase',
        customPurpose: transfer.customPurpose || '',
        direction: transfer.direction || 'inbound',
        originalAmount: transfer.originalAmount || 0,
        currency: (transfer.currency as 'USD' | 'IQD' | 'EUR') || 'USD',
        exchangeRate: transfer.exchangeRate || 1,
        location: transfer.location || '',
        receivedAt: transfer.receivedAt || new Date().toISOString().split('T')[0],
        notes: transfer.notes || '',
        hasCommission: transfer.hasCommission || false,
        commissionType: transfer.commissionType || 'on_us',
        commissionRate: transfer.commissionRate || 0,
        commissionAmount: transfer.commissionAmount || 0,
      });
    }
  }, [transfer]);

  if (!transfer) return null;

  // Real-time calculation
  const amountUsd =
    formData.currency === 'USD'
      ? Number(formData.originalAmount)
      : Math.round(Number(formData.originalAmount) / (Number(formData.exchangeRate) || 1));

  let commissionAmountUsd = 0;
  if (formData.hasCommission) {
    if (formData.commissionRate > 0) {
      commissionAmountUsd = Math.round(amountUsd * (formData.commissionRate / 100));
    } else {
      commissionAmountUsd =
        formData.currency === 'USD'
          ? Number(formData.commissionAmount)
          : Math.round(Number(formData.commissionAmount) / (Number(formData.exchangeRate) || 1));
    }
  }

  const netOfficeAmountUsd =
    formData.direction === 'inbound'
      ? formData.commissionType === 'on_us'
        ? amountUsd - commissionAmountUsd
        : amountUsd + commissionAmountUsd
      : formData.commissionType === 'on_us'
      ? amountUsd + commissionAmountUsd
      : amountUsd - commissionAmountUsd;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transfer) return;

    const updated: MoneyTransfer = {
      ...transfer,
      customerName: formData.customerName.trim() || 'عميل',
      carLot: formData.carLot.trim() || undefined,
      purpose: formData.purpose,
      customPurpose: formData.customPurpose.trim() || undefined,
      direction: formData.direction,
      originalAmount: Number(formData.originalAmount) || 0,
      currency: formData.currency,
      exchangeRate: Number(formData.exchangeRate) || 1,
      amountUsd,
      location: formData.location.trim() || undefined,
      receivedAt: formData.receivedAt,
      notes: formData.notes.trim() || undefined,
      hasCommission: formData.hasCommission,
      commissionType: formData.hasCommission ? formData.commissionType : undefined,
      commissionRate: formData.hasCommission ? Number(formData.commissionRate) : undefined,
      commissionAmount: formData.hasCommission ? Number(formData.commissionAmount) : undefined,
      commissionAmountUsd: formData.hasCommission ? commissionAmountUsd : undefined,
      netOfficeAmountUsd: formData.hasCommission ? netOfficeAmountUsd : undefined,
    };

    updateTransfer(updated);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`تعديل سند الحركة المالية: ${transfer.transferNumber}`}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 dir-rtl text-right text-xs">
        {/* Direction & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              نوع الحركة المالية
            </label>
            <select
              value={formData.direction}
              onChange={(e) =>
                setFormData({ ...formData, direction: e.target.value as TransferDirection })
              }
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
            >
              <option value="inbound">إيداع وارد من العميل (لنا في الصيرفة)</option>
              <option value="outbound">سحب صادر للشركة (مسحوب من الصيرفة)</option>
            </select>
          </div>

          <Input
            label="تاريخ الحركة"
            type="date"
            value={formData.receivedAt}
            onChange={(e) => setFormData({ ...formData, receivedAt: e.target.value })}
          />
        </div>

        {/* Amount & Currency */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="المبلغ المدفوع"
            type="number"
            required
            value={formData.originalAmount || ''}
            onChange={(e) => setFormData({ ...formData, originalAmount: Number(e.target.value) })}
          />

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">العملة</label>
            <select
              value={formData.currency}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  currency: e.target.value as 'USD' | 'IQD',
                  exchangeRate: e.target.value === 'USD' ? 1 : 1530,
                })
              }
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
            >
              <option value="USD">دولار أمريكي ($ USD)</option>
              <option value="IQD">دينار عراقي (د.ع IQD)</option>
            </select>
          </div>

          {formData.currency === 'IQD' ? (
            <Input
              label="سعر الصرف للدولار"
              type="number"
              value={formData.exchangeRate}
              onChange={(e) => setFormData({ ...formData, exchangeRate: Number(e.target.value) })}
            />
          ) : (
            <div className="bg-slate-50 p-2 rounded-xl flex flex-col justify-center">
              <span className="text-[10px] text-slate-400">المعادل بالدولار:</span>
              <span className="font-bold text-[#164E33] text-sm">${amountUsd.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Customer & Lot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="اسم العميل أو المستلم"
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
          />

          <Input
            label="رقم اللوت (Lot) المرتبط (اختياري)"
            value={formData.carLot}
            onChange={(e) => setFormData({ ...formData, carLot: e.target.value })}
          />
        </div>

        {/* Purpose */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">الغرض من الدفعة</label>
            <select
              value={formData.purpose}
              onChange={(e) =>
                setFormData({ ...formData, purpose: e.target.value as TransferPurpose })
              }
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
            >
              <option value="car_purchase">شراء سيارة</option>
              <option value="shipping_cost">أجور شحن</option>
              <option value="combined">شراء + شحن</option>
              <option value="customs_clearance">تخليص جمركي</option>
              <option value="other">غرض آخر مخصص</option>
            </select>
          </div>

          {formData.purpose === 'other' ? (
            <Input
              label="بيان الغرض المخصص"
              value={formData.customPurpose}
              onChange={(e) => setFormData({ ...formData, customPurpose: e.target.value })}
            />
          ) : (
            <Input
              label="الموقع أو فرع الاستلام"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          )}
        </div>

        {/* Commission Checkbox */}
        <div className="bg-emerald-50/50 border border-emerald-200/70 p-3 rounded-2xl space-y-2.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.hasCommission}
              onChange={(e) => setFormData({ ...formData, hasCommission: e.target.checked })}
              className="w-4 h-4 rounded text-[#164E33] focus:ring-[#164E33]"
            />
            <span className="font-bold text-slate-800 text-xs">توجد عمولة تحويل في هذه الحركة</span>
          </label>

          {formData.hasCommission && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-emerald-200/50">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">العمولة على عاتق من؟</label>
                <select
                  value={formData.commissionType}
                  onChange={(e) =>
                    setFormData({ ...formData, commissionType: e.target.value as any })
                  }
                  className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800"
                >
                  <option value="on_us">علينا (تخصم من رصيدنا)</option>
                  <option value="for_us">لنا (عمولة ربح لحسابنا)</option>
                </select>
              </div>

              <Input
                label="نسبة العمولة (%)"
                type="number"
                value={formData.commissionRate || ''}
                onChange={(e) => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
              />

              <div className="flex flex-col justify-center">
                <span className="text-[10px] text-slate-500">صافي القيد المسجل للصيرفة:</span>
                <span className="font-mono font-bold text-xs text-slate-800">
                  ${netOfficeAmountUsd.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">ملاحظات السند</label>
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
