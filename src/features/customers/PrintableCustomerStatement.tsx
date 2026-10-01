import React from 'react';
import { User, Car, Invoice, MoneyTransfer } from '../../types';
import { formatCurrency, formatDate } from '../../shared/lib/formatters';
import { Printer, ShieldCheck } from 'lucide-react';

interface PrintableCustomerStatementProps {
  customer: User;
  cars: Car[];
  invoices: Invoice[];
  transfers: MoneyTransfer[];
  totalBilled: number;
  totalPaid: number;
  totalRemaining: number;
}

export const PrintableCustomerStatement: React.FC<PrintableCustomerStatementProps> = ({
  customer,
  cars,
  invoices,
  transfers,
  totalBilled,
  totalPaid,
  totalRemaining,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const getCarStageLabel = (status: string) => {
    switch (status) {
      case 'purchased':
        return 'في ساحة المزاد';
      case 'towing':
        return 'نقل داخلي في أمريكا';
      case 'at_port':
        return 'بميناء التحميل';
      case 'shipped':
        return 'في عرض البحر';
      case 'arrived':
        return 'وصلت ميناء الوصول';
      case 'delivered':
        return 'تم التسليم بنجاح';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6 dir-rtl text-right font-sans">
      <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-6 print:p-0 print:border-none print:shadow-none">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#164E33] flex items-center justify-center text-[#84C0A2] font-black text-sm">
                CS
              </div>
              <h2 className="text-xl font-black text-slate-900">CarShip Pro Logistics</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">شركة استيراد وشحن السيارات والخدمات اللوجستية</p>
            <p className="text-xs text-slate-400">العراق - بغداد | هاتف الإدارة: +964 770 000 0000</p>
          </div>

          <div className="text-left">
            <h3 className="text-base font-black text-[#164E33]">كشف حساب مالي تفصيلي</h3>
            <p className="text-xs text-slate-500 mt-1">تاريخ الكشف: {formatDate(new Date().toISOString())}</p>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-md mt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>معتمد من الإدارة المالية</span>
            </div>
          </div>
        </div>

        {/* Customer Profile Summary */}
        <div className="bg-slate-50 p-4 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs border border-slate-100">
          <div>
            <span className="text-slate-400 block text-[11px]">اسم العميل:</span>
            <span className="font-bold text-slate-900 text-sm">{customer.fullName}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">اسم المستخدم:</span>
            <span className="font-mono font-bold text-[#164E33]">{customer.username}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">رقم الهاتف:</span>
            <span className="font-semibold text-slate-700">{customer.phone || '-'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">البريد الإلكتروني:</span>
            <span className="font-semibold text-slate-700">{customer.email || '-'}</span>
          </div>
        </div>

        {/* Financial Summary Box */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-right">
            <span className="text-[11px] text-slate-500 block">إجمالي المطالبات والفواتير</span>
            <span className="text-lg font-black text-slate-900">{formatCurrency(totalBilled)}</span>
          </div>
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 text-right">
            <span className="text-[11px] text-emerald-700 block font-medium">إجمالي الدفعات المسددة</span>
            <span className="text-lg font-black text-emerald-800">{formatCurrency(totalPaid)}</span>
          </div>
          <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 text-right">
            <span className="text-[11px] text-amber-700 block font-medium">المتبقي بذمة العميل</span>
            <span className="text-lg font-black text-amber-900">
              {totalRemaining > 0 ? formatCurrency(totalRemaining) : '$0 (خالص)'}
            </span>
          </div>
        </div>

        {/* 1. Cars Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5">
            1. السيارات المسجلة ومراحل الشحن ({cars.length})
          </h4>
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-[11px]">
                <th className="pb-2">السيارة والموديل</th>
                <th className="pb-2">رقم اللوت</th>
                <th className="pb-2">رقم الشاصي (VIN)</th>
                <th className="pb-2">المزاد</th>
                <th className="pb-2">سعر الشراء</th>
                <th className="pb-2">مرحلة الشحن</th>
                <th className="pb-2">رقم الحاوية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cars.map((c) => (
                <tr key={c.id}>
                  <td className="py-2 font-bold text-slate-800">{c.year} {c.make} {c.model}</td>
                  <td className="py-2 font-mono text-slate-600">{c.lotNumber}</td>
                  <td className="py-2 font-mono text-[11px] text-slate-500">{c.vin}</td>
                  <td className="py-2 text-slate-600">{c.auctionName}</td>
                  <td className="py-2 font-semibold text-slate-800">{formatCurrency(c.purchasePrice)}</td>
                  <td className="py-2 text-slate-700">{getCarStageLabel(c.status)}</td>
                  <td className="py-2 font-mono text-slate-600">{c.containerNumber || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 2. Invoices Table */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5">
            2. فواتير ومطالبات الشحن ({invoices.length})
          </h4>
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-[11px]">
                <th className="pb-2">رقم الفاتورة</th>
                <th className="pb-2">تاريخ الفاتورة</th>
                <th className="pb-2">السيارة / اللوت</th>
                <th className="pb-2">إجمالي الفاتورة</th>
                <th className="pb-2">المسدد</th>
                <th className="pb-2">المتبقي غير المسدد</th>
                <th className="pb-2">حالة السداد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="py-2 font-mono font-bold text-[#164E33]">{inv.invoiceNumber}</td>
                  <td className="py-2 text-slate-600">{formatDate(inv.createdAt)}</td>
                  <td className="py-2 text-slate-700">
                    {cars.find((c) => c.id === inv.carId)?.make || 'سيارة'} (Lot: {cars.find((c) => c.id === inv.carId)?.lotNumber || '-'})
                  </td>
                  <td className="py-2 font-bold text-slate-900">{formatCurrency(inv.netTotal)}</td>
                  <td className="py-2 font-semibold text-emerald-700">{formatCurrency(inv.paidAmount)}</td>
                  <td className="py-2 font-bold text-amber-800">
                    {Number(inv.remainingAmount || 0) > 0 ? formatCurrency(inv.remainingAmount) : '$0'}
                  </td>
                  <td className="py-2">
                    {inv.remainingAmount <= 0 ? (
                      <span className="text-emerald-700 font-bold text-[10px]">مسددة بالكامل</span>
                    ) : inv.paidAmount > 0 ? (
                      <span className="text-blue-700 font-bold text-[10px]">مدفوعة جزئياً</span>
                    ) : (
                      <span className="text-rose-700 font-bold text-[10px]">غير مسددة</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3. Payments Received Table */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1.5">
            3. سجل الحوالات والدفعات المقبوضة من العميل ({transfers.length})
          </h4>
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-[11px]">
                <th className="pb-2">رقم الحوالة</th>
                <th className="pb-2">تاريخ القبض</th>
                <th className="pb-2">مكتب الصرافة</th>
                <th className="pb-2">المبلغ بالدولار</th>
                <th className="pb-2">المبلغ الأصلي والعملة</th>
                <th className="pb-2">اللوت المرتبط</th>
                <th className="pb-2">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transfers.map((t) => (
                <tr key={t.id}>
                  <td className="py-2 font-mono font-bold text-slate-800">{t.transferNumber}</td>
                  <td className="py-2 text-slate-600">{formatDate(t.receivedAt)}</td>
                  <td className="py-2 text-slate-700">{t.exchangeOfficeName || '-'}</td>
                  <td
                    className={`py-2 font-bold ${
                      t.direction === 'outbound' ? 'text-rose-700' : 'text-emerald-700'
                    }`}
                  >
                    {t.direction === 'outbound'
                      ? `-${formatCurrency(t.amountUsd)} (مردود)`
                      : formatCurrency(t.amountUsd)}
                  </td>
                  <td className="py-2 text-slate-500">
                    {t.currency !== 'USD'
                      ? `${t.originalAmount.toLocaleString()} ${t.currency}`
                      : formatCurrency(t.amountUsd)}
                  </td>
                  <td className="py-2 font-mono text-slate-600">{t.carLot || '-'}</td>
                  <td className="py-2 text-slate-400 text-[11px]">{t.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signature & Stamp Section */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs">
          <div className="space-y-12">
            <p className="font-bold text-slate-700">توقيع العميل المستلم:</p>
            <div className="border-b border-dashed border-slate-300 w-48"></div>
          </div>
          <div className="space-y-12 text-left">
            <p className="font-bold text-slate-700">ختم وتوقيع الإدارة المالية:</p>
            <div className="border-b border-dashed border-slate-300 w-48 mr-auto"></div>
          </div>
        </div>
      </div>

      <div className="flex justify-end print:hidden">
        <button
          onClick={handlePrint}
          className="bg-[#164E33] hover:bg-[#1B5E3F] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all shadow-sm flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة كشف الحساب</span>
        </button>
      </div>
    </div>
  );
};
