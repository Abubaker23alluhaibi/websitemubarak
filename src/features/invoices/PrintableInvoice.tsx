import React from 'react';
import { Invoice } from '../../types';
import { formatCurrency, formatDate } from '../../shared/lib/formatters';
import { ShieldCheck, Printer, Calendar, MapPin, Anchor, Navigation } from 'lucide-react';
import { Button } from '../../shared/components/ui/Button';
import { useData } from '../../shared/context/DataContext';

interface PrintableInvoiceProps {
  invoice: Invoice;
}

export const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({ invoice }) => {
  const { cars } = useData();

  const handlePrint = () => {
    window.print();
  };

  // ربط بيانات السيارة ديناميكياً
  const car = invoice.car || cars.find((c) => c.id === invoice.carId);

  const carPurchasePrice = car?.purchasePrice
    ? Number(car.purchasePrice)
    : Math.max(0, Number(invoice.subtotal) - Number(invoice.shippingCost) - Number(invoice.commissionAmount));

  const isExternal = (invoice.auctionPaymentSource ?? car?.auctionPaymentSource) === 'external';
  const effectiveCarPriceInvoiced = isExternal ? 0 : carPurchasePrice;
  const effectiveCommissionAmount = isExternal ? 0 : Number(invoice.commissionAmount || 0);

  const customTotal = invoice.customFields.reduce((sum, f) => sum + Number(f.fieldAmount || 0), 0);
  const calculatedSubtotal = effectiveCarPriceInvoiced + Number(invoice.shippingCost) + effectiveCommissionAmount + customTotal;
  const calculatedNet = Math.max(0, calculatedSubtotal - Number(invoice.discount || 0));
  const remainingAmount = Math.max(0, calculatedNet - Number(invoice.paidAmount || 0));

  // تنسيق مدينة ومنطقة السيارة
  const carLocationText = [car?.city, car?.usStateName].filter(Boolean).join(' - ') || 'الولايات المتحدة الأمريكية';

  return (
    <div className="space-y-6 dir-rtl text-right">
      <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-6 font-sans print:p-0 print:border-none print:shadow-none">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-dark flex items-center justify-center text-brand-accent font-bold text-sm">
                CS
              </div>
              <h2 className="text-xl font-black text-slate-900">CarShip Pro Logistics</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">شركة استيراد وشحن السيارات والخدمات اللوجستية</p>
            <p className="text-xs text-slate-400">بغداد - العراق | هاتف: +964 770 000 0000</p>
          </div>

          <div className="text-left">
            <h3 className="text-lg font-black text-brand-dark font-mono">{invoice.invoiceNumber}</h3>
            <p className="text-xs text-slate-500 mt-1">تاريخ الإصدار: {formatDate(invoice.createdAt)}</p>
            {invoice.isLocked && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-md mt-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                فاتورة معتمدة ومقفلة
              </span>
            )}
          </div>
        </div>

        {/* Customer, Car & Logistics Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl text-xs border border-slate-100">
          {/* 1. Customer Info */}
          <div className="space-y-1.5 border-b sm:border-b-0 sm:border-l border-slate-200/80 pb-3 sm:pb-0 sm:pl-3">
            <h4 className="font-bold text-slate-700 flex items-center gap-1">
              <span>بيانات العميل:</span>
            </h4>
            <p className="font-bold text-slate-900 text-sm">{car?.customerName || 'عميل مسجل'}</p>
            <p className="text-slate-500">الهاتف: {car?.customerPhone || 'غير مسجل'}</p>
            <p className="text-slate-600 font-medium">الوجهة: {car?.destinationPortName || 'ميناء أم قصر (العراق)'}</p>
          </div>

          {/* 2. Car Specs & Purchase Date */}
          <div className="space-y-1.5 border-b sm:border-b-0 sm:border-l border-slate-200/80 pb-3 sm:pb-0 sm:pl-3">
            <h4 className="font-bold text-slate-700 flex items-center gap-1">
              <span>بيانات السيارة والمزاد:</span>
            </h4>
            <p className="font-bold text-slate-900">
              {car ? `${car.year} ${car.make} ${car.model}` : 'بيانات المركبة'}
            </p>
            <p className="text-slate-500 font-mono">Lot #: {car?.lotNumber || '-'}</p>
            <p className="text-slate-500 font-mono text-[11px]">VIN: {car?.vin || '-'}</p>
            <div className="flex items-center gap-1 text-slate-700 font-medium pt-0.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>تاريخ الشراء: </span>
              <span className="font-bold">{car?.purchaseDate ? formatDate(car.purchaseDate) : '-'}</span>
            </div>
            <div className="pt-0.5">
              <span className="text-[10px] text-slate-400 block">تسديد ثمن المزاد:</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded inline-block ${
                  isExternal
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {isExternal
                  ? `مسدد خارجياً${invoice.externalPaymentDetails ? ` (${invoice.externalPaymentDetails})` : ''}`
                  : 'عن طريق شركتنا'}
              </span>
            </div>
          </div>

          {/* 3. Logistics Location & Loading Port */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-700 flex items-center gap-1">
              <span>الموقع ومسار الشحن:</span>
            </h4>
            <div className="flex items-start gap-1 text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 text-[11px] block">مدينة ومنطقة السيارة:</span>
                <span className="font-bold text-slate-800">{carLocationText}</span>
              </div>
            </div>

            <div className="flex items-start gap-1 text-slate-700 pt-0.5">
              <Anchor className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-500 text-[11px] block">ميناء الحمولة (الشحن بأمريكا):</span>
                <span className="font-bold text-slate-800">{car?.loadingPortName || 'ميناء سافانا (GA)'}</span>
              </div>
            </div>

            {car?.containerNumber && (
              <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                <Navigation className="w-3 h-3 text-slate-400" />
                <span>رقم الحاوية: </span>
                <span className="font-mono font-bold text-slate-700">{car.containerNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-xs text-right">
          <thead>
            <tr className="border-b-2 border-slate-200 text-slate-600 font-bold">
              <th className="py-2.5">#</th>
              <th className="py-2.5">البيان والتفاصيل</th>
              <th className="py-2.5 text-left">المبلغ ($)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="py-2.5 text-slate-400">1</td>
              <td className="py-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">
                    سعر شراء السيارة من المزاد ({car?.auctionName || 'Copart'})
                  </span>
                  {isExternal && (
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                      مسدد خارجياً (للتوثيق فقط - غير مطالب به)
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  تاريخ الشراء: {car?.purchaseDate ? formatDate(car.purchaseDate) : '-'} | الموقع: {carLocationText}
                  {isExternal && invoice.externalPaymentDetails && (
                    <span className="text-blue-600 block mt-0.5">
                      تفاصيل السداد الخارجي: {invoice.externalPaymentDetails}
                    </span>
                  )}
                </div>
              </td>
              <td className="py-2.5 text-left font-bold text-slate-800">
                {isExternal ? (
                  <div>
                    <span className="text-slate-400 line-through text-[11px] block">
                      {formatCurrency(carPurchasePrice)}
                    </span>
                    <span className="text-blue-700 text-xs font-bold">$0.00 مطالبة</span>
                  </div>
                ) : (
                  formatCurrency(carPurchasePrice)
                )}
              </td>
            </tr>
            <tr>
              <td className="py-2.5 text-slate-400">2</td>
              <td className="py-2.5">
                <div className="font-medium text-slate-800">أجور الشحن (النقل الداخلي + الشحن البحري)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  عبر ميناء التحميل: {car?.loadingPortName || 'USA Port'} إلى {car?.destinationPortName || 'ميناء الوصول'}
                </div>
              </td>
              <td className="py-2.5 text-left font-bold text-slate-800">{formatCurrency(invoice.shippingCost)}</td>
            </tr>
            {!isExternal && invoice.commissionAmount > 0 ? (
              <tr>
                <td className="py-2.5 text-slate-400">3</td>
                <td className="py-2.5 font-medium text-slate-800">
                  عمولة الحوالة المالية ({invoice.commissionPercent}%)
                </td>
                <td className="py-2.5 text-left font-bold text-slate-800">
                  {formatCurrency(invoice.commissionAmount)}
                </td>
              </tr>
            ) : isExternal ? (
              <tr>
                <td className="py-2.5 text-slate-400">3</td>
                <td className="py-2.5 font-medium text-slate-800">
                  <span>عمولة الحوالة المالية (0%)</span>
                  <span className="text-[10px] text-blue-600 mr-2 bg-blue-50 px-1.5 py-0.5 rounded">
                    معفى - تسديد خارجي
                  </span>
                </td>
                <td className="py-2.5 text-left font-bold text-slate-800">$0.00</td>
              </tr>
            ) : null}

            {/* Custom fields - Auto-hiding empty/zero values */}
            {invoice.customFields
              .filter((f) => f.fieldAmount > 0)
              .map((field, idx) => (
                <tr key={field.id}>
                  <td className="py-2.5 text-slate-400">{idx + 4}</td>
                  <td className="py-2.5 font-medium text-slate-800">{field.fieldName}</td>
                  <td className="py-2.5 text-left font-bold text-slate-800">{formatCurrency(field.fieldAmount)}</td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* Calculation Box */}
        <div className="border-t-2 border-slate-200 pt-4 flex justify-end">
          <div className="w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>المجموع الفرعي (Subtotal):</span>
              <span className="font-bold text-slate-800">{formatCurrency(calculatedSubtotal)}</span>
            </div>

            {invoice.discount > 0 && (
              <div className="p-2 bg-emerald-50/80 rounded-xl border border-emerald-200/80 space-y-1">
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>الخصم الممنوح:</span>
                  <span>-{formatCurrency(invoice.discount)}</span>
                </div>
                {invoice.discountReason && (
                  <div className="text-[10px] text-emerald-700">
                    سبب الخصم: {invoice.discountReason}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-2">
              <span>المجموع النهائي الصافي (Net Total):</span>
              <span className="text-emerald-700 text-base">{formatCurrency(calculatedNet)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>المبلغ المدفوع (Paid):</span>
              <span className="font-bold text-slate-800">{formatCurrency(invoice.paidAmount)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-200/70">
              <span>المتبقي بذمة العميل:</span>
              <span className="text-amber-700 font-black">{formatCurrency(remainingAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 print:hidden">
        <Button onClick={handlePrint} variant="emerald" className="gap-2 text-xs font-bold">
          <Printer className="w-4 h-4" />
          <span>طباعة الفاتورة الآن</span>
        </Button>
      </div>
    </div>
  );
};
