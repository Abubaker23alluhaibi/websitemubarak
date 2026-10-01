import React, { useState } from 'react';
import { Modal } from '../../shared/components/ui/Modal';
import { Button } from '../../shared/components/ui/Button';
import {
  Percent,
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  Printer,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { MoneyTransfer, ExchangeOffice } from '../../types';
import { formatCurrency, formatDate } from '../../shared/lib/formatters';

interface CommissionAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  office?: ExchangeOffice;
  transfers: MoneyTransfer[];
}

export const CommissionAnalyticsModal: React.FC<CommissionAnalyticsModalProps> = ({
  isOpen,
  onClose,
  office,
  transfers,
}) => {
  const [typeFilter, setTypeFilter] = useState<'all' | 'for_us' | 'on_us'>('all');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'inbound' | 'outbound'>('all');

  if (!isOpen) return null;

  // 1. تصفية الحوالات الخاصة بهذه الصيرفة (أو كافة الصيرفات) والتي تحتوي على عمولة
  const targetTransfers = transfers.filter((t) => {
    const matchesOffice = office ? t.exchangeOfficeId === office.id : true;
    const hasCommissionValue = t.hasCommission && Number(t.commissionAmountUsd || 0) > 0;
    return matchesOffice && hasCommissionValue;
  });

  // 2. الحسابات والتحليل المالي للعمولات
  const totalCommissionVolume = targetTransfers.reduce(
    (sum, t) => sum + Number(t.commissionAmountUsd || 0),
    0
  );

  const totalCommissionsForUs = targetTransfers
    .filter((t) => t.commissionType === 'for_us')
    .reduce((sum, t) => sum + Number(t.commissionAmountUsd || 0), 0);

  const totalCommissionsOnUs = targetTransfers
    .filter((t) => t.commissionType === 'on_us')
    .reduce((sum, t) => sum + Number(t.commissionAmountUsd || 0), 0);

  const netCommissionPosition = totalCommissionsForUs - totalCommissionsOnUs;

  // 3. التصفية التفاعلية للجدول
  const filteredList = targetTransfers.filter((t) => {
    const matchesType = typeFilter === 'all' || t.commissionType === typeFilter;
    const matchesDirection = directionFilter === 'all' || t.direction === directionFilter;
    return matchesType && matchesDirection;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        office
          ? `سجل وتحليل عمولات: ${office.name}`
          : 'سجل وتحليل العمولات العام لكافة الصيرفات'
      }
      maxWidth="5xl"
    >
      <div className="space-y-5 dir-rtl text-right text-xs">
        {/* 1. Analytics KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Card 1: Total Commissions */}
          <div className="bg-[#F9FBFA] border border-slate-200/80 rounded-2xl p-3.5 space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>إجمالي مبالغ العمولات</span>
              <Percent className="w-4 h-4 text-[#164E33]" />
            </div>
            <div className="text-lg font-black text-slate-900">
              {formatCurrency(totalCommissionVolume)}
            </div>
            <span className="text-[10px] text-slate-400 block">
              إجمالي {targetTransfers.length} عملية بعمولة
            </span>
          </div>

          {/* Card 2: Commissions For Us */}
          <div className="bg-[#F9FBFA] border border-emerald-200/80 rounded-2xl p-3.5 space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-700 text-[11px] font-bold">
              <span>عمولات لنا (أرباح الشركة)</span>
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-lg font-black text-emerald-800">
              {formatCurrency(totalCommissionsForUs)}
            </div>
            <span className="text-[10px] text-emerald-600 block">
              عائدات مقيدة لصالح حساب شركتنا
            </span>
          </div>

          {/* Card 3: Commissions On Us */}
          <div className="bg-[#F9FBFA] border border-amber-200/80 rounded-2xl p-3.5 space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-amber-800 text-[11px] font-bold">
              <span>عمولات علينا (أجور الصيرفة)</span>
              <ArrowUpRight className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-lg font-black text-amber-900">
              {formatCurrency(totalCommissionsOnUs)}
            </div>
            <span className="text-[10px] text-amber-700 block">
              أجور تقتطعها وتأخذها شركة الصيرفة
            </span>
          </div>

          {/* Card 4: Net Position */}
          <div
            className={`border rounded-2xl p-3.5 space-y-1 shadow-2xs ${
              netCommissionPosition >= 0
                ? 'bg-emerald-50/40 border-emerald-200/80'
                : 'bg-amber-50/40 border-amber-200/80'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className={netCommissionPosition >= 0 ? 'text-emerald-900' : 'text-amber-900'}>
                صافي موقف العمولات
              </span>
              <Scale className="w-4 h-4 text-slate-500" />
            </div>
            <div
              className={`text-lg font-black ${
                netCommissionPosition >= 0 ? 'text-emerald-800' : 'text-amber-900'
              }`}
            >
              {netCommissionPosition >= 0 ? '+' : ''}
              {formatCurrency(netCommissionPosition)}
            </div>
            <span
              className={`text-[10px] block ${
                netCommissionPosition >= 0 ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {netCommissionPosition >= 0
                ? 'فائض أرباح عمولات لصالحنا'
                : 'صافي تكاليف عمولات مدفوعة للصيرفة'}
            </span>
          </div>
        </div>

        {/* 2. Filter Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 border-b border-slate-200/80 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Type */}
            <div className="flex bg-slate-100 p-0.5 rounded-full border border-slate-200/60">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                  typeFilter === 'all'
                    ? 'bg-[#164E33] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                كل العمولات ({targetTransfers.length})
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('for_us')}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                  typeFilter === 'for_us'
                    ? 'bg-[#164E33] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                عمولات لنا فقط ({targetTransfers.filter((t) => t.commissionType === 'for_us').length})
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('on_us')}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                  typeFilter === 'on_us'
                    ? 'bg-[#164E33] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                عمولات علينا للصيرفة ({targetTransfers.filter((t) => t.commissionType === 'on_us').length})
              </button>
            </div>

            {/* Filter by Direction */}
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value as any)}
              className="bg-white border border-slate-200 text-[11px] rounded-full px-3 py-1 text-slate-700 outline-none focus:ring-1 focus:ring-[#164E33]"
            >
              <option value="all">كل الحركات (إيداع وسحب)</option>
              <option value="inbound">إيداعات فقط</option>
              <option value="outbound">سحوبات فقط</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-semibold px-3 py-1 rounded-full transition-all shadow-2xs flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>طباعة تقرير العمولات</span>
            </button>
          </div>
        </div>

        {/* 3. Detailed Commission Transactions Ledger Table */}
        <div className="bg-[#F9FBFA] border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200/80 text-slate-500 font-bold text-[11px]">
                <th className="py-2.5 pr-3">رقم السند</th>
                <th className="py-2.5">التاريخ</th>
                {!office && <th className="py-2.5">شركة الصيرفة</th>}
                <th className="py-2.5">نوع الحركة</th>
                <th className="py-2.5">العميل / المستلم / اللوت</th>
                <th className="py-2.5">المبلغ الأصلي</th>
                <th className="py-2.5">مبلغ العمولة</th>
                <th className="py-2.5">جهة الاستحقاق</th>
                <th className="py-2.5">الصافي المؤثر بالرصيد</th>
                <th className="py-2.5 pl-3">البيان والملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {filteredList.map((tr) => {
                const isForUs = tr.commissionType === 'for_us';
                const commUsd = Number(tr.commissionAmountUsd || 0);

                return (
                  <tr key={tr.id} className="hover:bg-white transition-colors">
                    <td className="py-3 pr-3 font-mono font-bold text-slate-800">
                      {tr.transferNumber}
                    </td>
                    <td className="py-3 text-slate-500">{formatDate(tr.receivedAt)}</td>
                    {!office && (
                      <td className="py-3 font-semibold text-slate-700">
                        {tr.exchangeOfficeName || 'صيرفة'}
                      </td>
                    )}
                    <td className="py-3">
                      {tr.direction === 'inbound' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <ArrowDownLeft className="w-2.5 h-2.5 text-emerald-600" />
                          <span>إيداع</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <ArrowUpRight className="w-2.5 h-2.5 text-amber-700" />
                          <span>سحب</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="font-bold text-slate-800">{tr.customerName || '-'}</div>
                      {tr.carLot && (
                        <div className="text-[10px] font-mono text-slate-400">Lot: {tr.carLot}</div>
                      )}
                    </td>
                    <td className="py-3 font-bold text-slate-800 font-mono">
                      {formatCurrency(tr.amountUsd)}
                    </td>
                    <td className="py-3 font-black text-slate-900 font-mono">
                      <div className={isForUs ? 'text-emerald-700' : 'text-amber-800'}>
                        {formatCurrency(commUsd)}
                      </div>
                      {tr.commissionCurrency === 'IQD' && tr.commissionAmount && (
                        <div className="text-[9px] text-slate-400 font-normal">
                          {tr.commissionAmount.toLocaleString()} د.ع
                        </div>
                      )}
                    </td>
                    <td className="py-3">
                      {isForUs ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>لنا (إيراد لشركتنا)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          <span>علينا (تأخذها الصيرفة)</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 font-mono font-black text-slate-800">
                      {formatCurrency(tr.netOfficeAmountUsd ?? tr.amountUsd)}
                    </td>
                    <td className="py-3 text-slate-500 pl-3 text-[11px] max-w-xs truncate">
                      {tr.notes || tr.customPurpose || tr.purpose}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredList.length === 0 && (
            <div className="py-12 text-center text-slate-400 space-y-1">
              <p className="font-bold text-slate-600 text-xs">لا توجد عمليات عمولة مسجلة مطابقة للفلتر</p>
              <p className="text-[11px] text-slate-400">
                عند قيد حوالة أو سحب مالي وتفعيل خيار العمولة، ستظهر كافة العمليات وتحليلاتها هنا فوراً.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
          <div className="text-[11px] text-slate-500">
            إجمالي العمليات المفروزة:{' '}
            <strong className="text-slate-800">{filteredList.length}</strong> حركة بعمولة
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </div>
    </Modal>
  );
};
