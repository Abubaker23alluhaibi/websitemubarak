import React, { useState } from 'react';
import { Modal } from '../../shared/components/ui/Modal';
import { ExchangeOffice, MoneyTransfer } from '../../types';
import { formatCurrency, formatDate } from '../../shared/lib/formatters';
import { Building2, Phone, MapPin, ArrowDownLeft, ArrowUpRight, Plus, Minus } from 'lucide-react';
import { NewTransferModal } from './NewTransferModal';

interface ExchangeOfficeDetailsModalProps {
  office: ExchangeOffice;
  isOpen: boolean;
  onClose: () => void;
  transfers: MoneyTransfer[];
  onAddTransaction: (transaction: Partial<MoneyTransfer>) => void;
}

export const ExchangeOfficeDetailsModal: React.FC<ExchangeOfficeDetailsModalProps> = ({
  office,
  isOpen,
  onClose,
  transfers,
  onAddTransaction,
}) => {
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  // حركات هذه الصيرفة فقط
  const officeTransfers = transfers.filter((t) => t.exchangeOfficeId === office.id);

  // احتساب الرصيد الجاري الفعلي بعد العمولات
  const totalInbound = officeTransfers
    .filter((t) => t.direction === 'inbound')
    .reduce((sum, t) => sum + Number(t.netOfficeAmountUsd ?? t.amountUsd ?? 0), 0);

  const totalOutbound = officeTransfers
    .filter((t) => t.direction === 'outbound')
    .reduce((sum, t) => sum + Number(t.netOfficeAmountUsd ?? t.amountUsd ?? 0), 0);

  const currentBalance = office.balanceUsd + totalInbound - totalOutbound;
  const isPositive = currentBalance >= 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`كشف حساب: ${office.name}`}
      maxWidth="3xl"
    >
      <div className="space-y-4 dir-rtl text-right text-xs">
        {/* معلومات الصيرفة وبطاقة الرصيد وأزرار الإيداع والسحب */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* معلومات الفرع والمسؤول */}
          <div className="bg-[#F9FBFA] border border-slate-100 p-3.5 rounded-2xl space-y-2 col-span-1 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-[#164E33]">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm leading-tight">{office.name}</h3>
                <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {office.city}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white/80 p-2 rounded-xl mt-2">
              <div>
                <span className="text-[10px] text-slate-400 block">الشخص المسؤول:</span>
                <span className="font-semibold">{office.contactPerson}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">رقم الهاتف:</span>
                <span className="font-mono flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {office.phone}
                </span>
              </div>
            </div>
          </div>

          {/* الرصيد الحالي الصافي */}
          <div className="bg-[#F9FBFA] border border-slate-100 p-3.5 rounded-2xl flex flex-col justify-between space-y-2">
            <div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400">الرصيد الجاري الصافي:</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isPositive ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'
                  }`}
                >
                  {isPositive ? 'بذمتهم لنا' : 'مستحق لهم'}
                </span>
              </div>
              <div
                className={`text-xl font-black mt-1 ${
                  isPositive ? 'text-[#164E33]' : 'text-red-600'
                }`}
              >
                {formatCurrency(Math.abs(currentBalance))}
              </div>
            </div>

            {/* أزرار الإيداع والسحب السريعة */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                onClick={() => setIsDepositOpen(true)}
                className="bg-[#164E33] hover:bg-[#1B5E3F] text-white text-[11px] font-bold py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إيداع / قبض</span>
              </button>

              <button
                onClick={() => setIsWithdrawOpen(true)}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-[11px] font-bold py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-all shadow-xs"
              >
                <Minus className="w-3.5 h-3.5 text-red-500" />
                <span>سحب / صرف</span>
              </button>
            </div>
          </div>
        </div>

        {/* كشف حساب الحركات المالية للصيرفة */}
        <div className="bg-[#F9FBFA] border border-slate-100 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-800 text-xs">كشف الحركات المالية للصيرفة:</span>
            <span className="text-[10px] text-slate-400">إجمالي {officeTransfers.length} عملية</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold pb-2">
                  <th className="pb-2 pr-2">رقم الحوالة</th>
                  <th className="pb-2">النوع</th>
                  <th className="pb-2">العميل / اللوت</th>
                  <th className="pb-2">المبلغ الأصلي</th>
                  <th className="pb-2">المعادل بالدولار</th>
                  <th className="pb-2">الغرض</th>
                  <th className="pb-2">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {officeTransfers.map((tr) => (
                  <tr key={tr.id} className="hover:bg-white/80 transition-colors">
                    <td className="py-2.5 pr-2 font-mono font-medium text-slate-800">
                      {tr.transferNumber}
                    </td>
                    <td className="py-2.5">
                      {tr.direction === 'inbound' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                          <span>إيداع / قبض</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                          <ArrowUpRight className="w-3 h-3 text-red-600" />
                          <span>سحب / صرف</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <div className="font-semibold text-slate-800">{tr.customerName || 'عام'}</div>
                      {tr.carLot && (
                        <div className="text-[10px] font-mono text-slate-400">Lot: {tr.carLot}</div>
                      )}
                    </td>
                    <td className="py-2.5 font-medium text-slate-800">
                      {formatCurrency(tr.originalAmount, tr.currency)}
                    </td>
                    <td className="py-2.5 font-black text-slate-800">
                      <div className={tr.direction === 'inbound' ? 'text-[#164E33]' : 'text-red-600'}>
                        {formatCurrency(tr.amountUsd)}
                      </div>
                      {tr.hasCommission && tr.commissionAmountUsd && tr.commissionAmountUsd > 0 && (
                        <div className="mt-0.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border ${
                              tr.commissionType === 'on_us'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            عمولة: {formatCurrency(tr.commissionAmountUsd)} ({tr.commissionType === 'on_us' ? 'علينا للصيرفة' : 'لنا'})
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 text-slate-600">{tr.customPurpose || tr.purpose}</td>
                    <td className="py-2.5 text-slate-400">{formatDate(tr.receivedAt)}</td>
                  </tr>
                ))}
                {officeTransfers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      لا توجد حركات مالية مسجلة لهذه الصيرفة حتى الآن
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* نافذة الإيداع المباشر */}
      {isDepositOpen && (
        <NewTransferModal
          isOpen={isDepositOpen}
          offices={[office]}
          onClose={() => setIsDepositOpen(false)}
          onAddTransfer={(t) => {
            onAddTransaction({ ...t, direction: 'inbound', exchangeOfficeId: office.id });
            setIsDepositOpen(false);
          }}
        />
      )}

      {/* نافذة السحب المباشر */}
      {isWithdrawOpen && (
        <NewTransferModal
          isOpen={isWithdrawOpen}
          offices={[office]}
          onClose={() => setIsWithdrawOpen(false)}
          onAddTransfer={(t) => {
            onAddTransaction({ ...t, direction: 'outbound', exchangeOfficeId: office.id });
            setIsWithdrawOpen(false);
          }}
        />
      )}
    </Modal>
  );
};
