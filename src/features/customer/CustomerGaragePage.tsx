import React, { useState } from 'react';
import { ExternalLink, Car as CarIcon, FileText, Calculator, Check, MessageSquare, ShieldCheck } from 'lucide-react';
import { useData } from '../../shared/context/DataContext';
import { useAuth } from '../../shared/context/AuthContext';
import { formatCurrency, formatDate } from '../../shared/lib/formatters';
import { PrintableInvoice } from '../invoices/PrintableInvoice';
import { Invoice } from '../../types';
import { Link } from 'react-router-dom';
import { CAR_STAGES } from '../cars/CarDetailsModal';
import { CarMessagesModal } from '../cars/CarMessagesModal';
import { VinInspectorModal } from '../cars/VinInspectorModal';

export const CustomerGaragePage: React.FC = () => {
  const { user } = useAuth();
  const { cars, invoices, transfers } = useData();

  const [activeTab, setActiveTab] = useState<'cars' | 'transfers'>('cars');
  const [selectedInvoiceToPrint, setSelectedInvoiceToPrint] = useState<Invoice | null>(null);
  const [messagingCarId, setMessagingCarId] = useState<string | null>(null);
  const [inspectingVin, setInspectingVin] = useState<string | null>(null);

  // السيارات الخاصة بهذا العميل
  const myCars = cars.filter(
    (c) =>
      c.customerId === user?.id ||
      (user?.username === 'omar.customer' && (c.customerId === 'user-5' || c.customerName.includes('عمر'))) ||
      c.customerName.toLowerCase() === user?.fullName.toLowerCase()
  );

  const myCarIds = myCars.map((c) => c.id);
  const myCarLots = myCars.map((c) => c.lotNumber);

  // الفواتير الخاصة بسيارات العميل
  const myInvoices = invoices.filter((inv) => myCarIds.includes(inv.carId));

  // الحوالات والمدفوعات الخاصة بالعميل
  const myTransfers = transfers.filter(
    (t) =>
      t.customerId === user?.id ||
      myCarLots.includes(t.carLot || '') ||
      t.customerName?.toLowerCase() === user?.fullName.toLowerCase()
  );

  // الحسابات المالية الكلية
  const totalBilled = myInvoices.reduce(
    (sum, inv) => sum + Number(inv.netTotal || 0),
    0
  ) || myCars.reduce((sum, c) => sum + Number(c.purchasePrice || 0) + 1850, 0);

  const totalPaid = myTransfers
    .filter((t) => t.direction === 'inbound')
    .reduce((sum, t) => sum + Number(t.amountUsd || 0), 0) ||
    myInvoices.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);

  const remainingBalance = Math.max(0, totalBilled - totalPaid);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'purchased':
        return { text: 'تم الشراء من المزاد', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'towing':
        return { text: 'نقل داخلي في أمريكا', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'at_port':
        return { text: 'بميناء التحميل الأمريكي', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'shipped':
        return { text: 'في عرض البحر (الحاوية)', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
      case 'arrived':
        return { text: 'وصلت ميناء الوصول', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'delivered':
        return { text: 'تم التسليم بنجاح', color: 'bg-slate-100 text-slate-700 border-slate-200' };
      default:
        return { text: status, color: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
  };

  return (
    <div className="space-y-5 dir-rtl text-right text-xs">
      {/* 1. Header & Welcome */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <span>كراج وحساب:</span>
            <span className="text-[#164E33]">{user?.fullName}</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/calculator"
            className="bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <Calculator className="w-3.5 h-3.5 text-[#164E33]" />
            <span>حاسبة شحن تقديرية</span>
          </Link>
        </div>
      </div>

      {/* 2. Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-[#F9FBFA] border border-slate-100 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] text-slate-400 block font-medium">إجمالي التكلفة والفواتير</span>
          <div className="text-lg font-bold text-slate-800">{formatCurrency(totalBilled)}</div>
          <span className="text-[10px] text-slate-500 block">ثمن السيارات + أجور الشحن</span>
        </div>

        <div className="bg-[#F9FBFA] border border-slate-100 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] text-slate-400 block font-medium">إجمالي المدفوعات المسددة</span>
          <div className="text-lg font-bold text-emerald-700">{formatCurrency(totalPaid)}</div>
          <span className="text-[10px] text-emerald-600 block">سندات قبض وحوالات موثقة</span>
        </div>

        <div className="bg-[#F9FBFA] border border-slate-100 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] text-slate-400 block font-medium">المتبقي بذمتك</span>
          <div className={`text-lg font-bold ${remainingBalance > 0 ? 'text-red-600' : 'text-slate-800'}`}>
            {formatCurrency(remainingBalance)}
          </div>
          <span className="text-[10px] text-slate-500 block">
            {remainingBalance > 0 ? 'مستحق عند استلام الحاوية/السيارة' : 'الحساب خالص ومسدد بالكامل'}
          </span>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex border-b border-slate-200/80 gap-6">
        <button
          onClick={() => setActiveTab('cars')}
          className={`pb-2.5 text-xs font-bold transition-all relative ${
            activeTab === 'cars'
              ? 'text-[#164E33] border-b-2 border-[#164E33]'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          سياراتي ومراحل الشحن ({myCars.length})
        </button>

        <button
          onClick={() => setActiveTab('transfers')}
          className={`pb-2.5 text-xs font-bold transition-all relative ${
            activeTab === 'transfers'
              ? 'text-[#164E33] border-b-2 border-[#164E33]'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          سجل الحوالات والمدفوعات ({myTransfers.length})
        </button>
      </div>

      {/* 4. TAB CONTENT */}
      {activeTab === 'cars' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myCars.map((car) => {
              const statusInfo = getStatusBadge(car.status);
              const carInvoice = invoices.find((inv) => inv.carId === car.id);

              return (
                <div
                  key={car.id}
                  className="bg-[#F9FBFA] border border-slate-100 rounded-2xl p-4 space-y-3 shadow-2xs"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400">{car.auctionName} (Lot: {car.lotNumber})</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.color}`}
                        >
                          {statusInfo.text}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm mt-1">
                        {car.year} {car.make} {car.model}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">VIN: {car.vin}</p>
                    </div>

                    {car.auctionUrl && (
                      <a
                        href={car.auctionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-white border border-slate-200/80 text-slate-700 hover:text-[#164E33] text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors shadow-2xs"
                      >
                        <span>صور المزاد</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/80 p-3 rounded-xl text-slate-600 border border-slate-100/80">
                    <div>
                      <span className="text-[10px] text-slate-400 block">المسار اللوجستي:</span>
                      <span className="font-semibold text-slate-800">
                        {car.usStateName} ← {car.destinationPortName}
                      </span>
                    </div>

                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 block">سعر الشراء:</span>
                      <span className="font-bold text-slate-800">{formatCurrency(car.purchasePrice)}</span>
                    </div>
                  </div>

                  {/* Visual Shipping Stepper for Customer */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-slate-700">تتبع مراحل الشحن:</span>
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {CAR_STAGES.find((s) => s.id === car.status)?.label || car.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-6 gap-1 text-center">
                      {CAR_STAGES.map((st, i) => {
                        const currentIdx = CAR_STAGES.findIndex((s) => s.id === car.status);
                        const isPast = i < currentIdx;
                        const isCurrent = i === currentIdx;

                        return (
                          <div
                            key={st.id}
                            className={`p-1.5 rounded-lg border text-center transition-all ${
                              isCurrent
                                ? 'bg-[#164E33] text-white border-[#164E33] shadow-xs'
                                : isPast
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                : 'bg-slate-50 text-slate-400 border-slate-200/60'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full mx-auto flex items-center justify-center text-[9px] font-bold ${
                                isCurrent
                                  ? 'bg-white text-[#164E33]'
                                  : isPast
                                  ? 'bg-emerald-200 text-emerald-900'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {st.stepNumber}
                            </div>
                            <div className={`text-[9px] font-bold truncate mt-0.5 ${isCurrent ? 'text-white' : ''}`}>
                              {st.label}
                            </div>
                            {isPast && <Check className="w-2.5 h-2.5 mx-auto text-emerald-600 mt-0.5" />}
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-[10px] text-slate-600 bg-[#F9FBFA] p-2 rounded-lg leading-relaxed flex items-start gap-1.5 border border-slate-100">
                      <span className="font-bold text-slate-800 shrink-0">أين سيارتك الآن:</span>
                      <span>{CAR_STAGES.find((s) => s.id === car.status)?.desc}</span>
                    </div>

                    {car.containerNumber && (
                      <div className="text-[10px] bg-cyan-50 text-cyan-900 border border-cyan-200 p-2 rounded-lg flex items-center justify-between">
                        <span>رقم الحاوية البحرية:</span>
                        <span className="font-mono font-bold text-cyan-950">{car.containerNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Car Invoice & Payment Status & Messaging */}
                  <div className="flex flex-wrap justify-between items-center pt-2 border-t border-slate-100 text-[11px] gap-2">
                    <div className="flex items-center gap-1 text-slate-500">
                      <span>الفاتورة:</span>
                      <span className="font-mono font-bold text-slate-700">
                        {carInvoice ? carInvoice.invoiceNumber : 'بانتظار الإصدار'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setInspectingVin(car.vin)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border-emerald-200/90 shadow-2xs cursor-pointer"
                        title="فحص مواصفات الشاصي الرسمية وتدقيق الحوادث"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>فحص الشاصي (NHTSA)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMessagingCarId(car.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all bg-white hover:bg-emerald-50 text-[#164E33] border-emerald-200/90 shadow-2xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#164E33]" />
                        <span>محادثة واستفسار</span>
                        {car.messages && car.messages.length > 0 && (
                          <span className="bg-[#164E33] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                            {car.messages.length}
                          </span>
                        )}
                      </button>

                      {carInvoice && (
                        <button
                          onClick={() => setSelectedInvoiceToPrint(carInvoice)}
                          className="text-[#164E33] hover:underline font-bold inline-flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          <span>عرض الفاتورة</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {myCars.length === 0 && (
            <div className="bg-[#F9FBFA] border border-slate-100 rounded-2xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#164E33] flex items-center justify-center mx-auto">
                <CarIcon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">أهلاً بك يا {user?.fullName}!</h3>
              <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
                تم تفعيل حسابك بنجاح. لم تقم الإدارة بربط سيارات مشحونة باسمك حتى الآن. بمجرد شرائك سيارة من المزاد وتزويد الإدارة برقم اللوت أو الشاصي، ستظهر تفاصيلها وصورها ومسار شحنها هنا فوراً.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <Link
                  to="/calculator"
                  className="bg-[#164E33] text-white text-xs font-bold px-4 py-2 rounded-full shadow-xs hover:bg-[#1B5E3F] transition-all"
                >
                  احسب تكلفة شحن سيارة
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'transfers' && (
        <div className="bg-[#F9FBFA] border border-slate-100 rounded-2xl p-4 overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold pb-2.5">
                <th className="pb-2.5 pr-2">رقم الحوالة</th>
                <th className="pb-2.5">التاريخ</th>
                <th className="pb-2.5">المبلغ المقبوض</th>
                <th className="pb-2.5">المبلغ الأصلي</th>
                <th className="pb-2.5">مكتب الصرافة</th>
                <th className="pb-2.5">اللوت / السيارة</th>
                <th className="pb-2.5">الغرض</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {myTransfers.map((tr) => (
                <tr key={tr.id} className="hover:bg-white/80 transition-colors">
                  <td className="py-3 pr-2 font-mono font-bold text-slate-800">{tr.transferNumber}</td>
                  <td className="py-3 text-slate-500">{formatDate(tr.receivedAt)}</td>
                  <td className="py-3 font-bold text-emerald-700 font-mono">
                    +{formatCurrency(tr.amountUsd)}
                  </td>
                  <td className="py-3 text-slate-600 font-mono text-[11px]">
                    {tr.originalAmount.toLocaleString()} {tr.currency}
                  </td>
                  <td className="py-3 text-slate-700 font-medium">{tr.exchangeOfficeName || '-'}</td>
                  <td className="py-3 font-mono text-slate-600">{tr.carLot || '-'}</td>
                  <td className="py-3 text-slate-600 text-[11px]">
                    {tr.customPurpose || tr.purpose === 'car_purchase'
                      ? 'دفعة شراء سيارة'
                      : tr.purpose === 'shipping_cost'
                      ? 'أجور شحن'
                      : tr.purpose}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {myTransfers.length === 0 && (
            <div className="p-8 text-center text-slate-400 space-y-1">
              <p className="font-bold text-slate-700 text-xs">لا توجد دفعات أو حوالات مسجلة باسمك بعد</p>
              <p className="text-[11px]">ستظهر هنا سندات القبض المالي فور استلامها عبر مكاتب الصرافة</p>
            </div>
          )}
        </div>
      )}

      {/* Printable Invoice Modal */}
      {selectedInvoiceToPrint && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">معاينة الفاتورة للطباعة</h3>
              <button
                onClick={() => setSelectedInvoiceToPrint(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                إغلاق ✕
              </button>
            </div>

            <PrintableInvoice invoice={selectedInvoiceToPrint} />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="bg-[#164E33] hover:bg-[#1B5E3F] text-white text-xs font-bold px-4 py-2 rounded-full shadow-xs"
              >
                طباعة الفاتورة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Car Messages Modal for Customer */}
      {messagingCarId && (
        <CarMessagesModal
          carId={messagingCarId}
          isOpen={!!messagingCarId}
          onClose={() => setMessagingCarId(null)}
        />
      )}

      {/* NHTSA VIN Inspector Modal */}
      {inspectingVin && (
        <VinInspectorModal
          isOpen={!!inspectingVin}
          onClose={() => setInspectingVin(null)}
          initialVin={inspectingVin}
        />
      )}
    </div>
  );
};
