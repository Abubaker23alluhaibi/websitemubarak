import React, { useState } from 'react';
import { Modal } from '../../shared/components/ui/Modal';
import { Button } from '../../shared/components/ui/Button';
import {
  User as UserIcon,
  Phone,
  Mail,
  Calendar,
  Car as CarIcon,
  FileText,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  ShieldCheck,
  ChevronLeft,
  Edit3,
  Trash2,
  PlusCircle,
} from 'lucide-react';
import { User, Car, Invoice } from '../../types';
import { formatCurrency, formatDate } from '../../shared/lib/formatters';
import { useData } from '../../shared/context/DataContext';
import { PrintableCustomerStatement } from './PrintableCustomerStatement';
import { EditCustomerModal } from './EditCustomerModal';
import { ConfirmDeleteModal } from '../../shared/components/ui/ConfirmDeleteModal';
import { NewTransferModal } from '../exchange/NewTransferModal';

interface CustomerDetailsModalProps {
  customer: User;
  isOpen: boolean;
  onClose: () => void;
  onSelectCar?: (car: Car) => void;
  onSelectInvoice?: (invoice: Invoice) => void;
  onUpdateCustomer?: (updated: User) => void;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  customer: initialCustomer,
  isOpen,
  onClose,
  onSelectCar,
  onSelectInvoice,
  onUpdateCustomer,
}) => {
  const { users, cars, invoices, transfers, deleteUser, addTransfer } = useData();
  const [activeTab, setActiveTab] = useState<'invoices' | 'cars' | 'transfers' | 'statement'>('invoices');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAddTransferOpen, setIsAddTransferOpen] = useState(false);
  const [transferDefaultLot, setTransferDefaultLot] = useState<string | undefined>(undefined);

  const customer = users.find((u) => u.id === initialCustomer.id) || initialCustomer;

  if (!customer) return null;

  // 1. Cars belonging to this customer
  const customerCars = cars.filter(
    (c) =>
      c.customerId === customer.id ||
      (customer.username === 'omar.customer' && (c.customerId === 'user-5' || c.customerName.includes('عمر'))) ||
      c.customerName.toLowerCase() === customer.fullName.toLowerCase()
  );

  const carIds = customerCars.map((c) => c.id);
  const carLots = customerCars.map((c) => c.lotNumber);

  // 2. Invoices belonging to customer cars
  const customerInvoices = invoices.filter((inv) => carIds.includes(inv.carId));

  // 3. Payments/transfers for this customer (inbound and outbound)
  const customerTransfers = transfers.filter(
    (t) =>
      t.customerId === customer.id ||
      (t.carLot && carLots.includes(t.carLot)) ||
      t.customerName?.toLowerCase() === customer.fullName.toLowerCase()
  );

  const inboundTransfers = customerTransfers.filter((t) => t.direction === 'inbound');
  const outboundTransfers = customerTransfers.filter((t) => t.direction === 'outbound');

  // 4. Financial Calculations
  const invoicedCarIds = new Set(customerInvoices.map((inv) => inv.carId));
  const invoicedTotal = customerInvoices.reduce((sum, inv) => sum + Number(inv.netTotal || 0), 0);
  const uninvoicedCars = customerCars.filter((c) => !invoicedCarIds.has(c.id));
  const uninvoicedTotal = uninvoicedCars.reduce((sum, c) => {
    const isExternal = c.auctionPaymentSource === 'external';
    const price = isExternal ? 0 : Number(c.purchasePrice || 0);
    return sum + price + 1850;
  }, 0);

  const totalBilled = invoicedTotal + uninvoicedTotal;

  const transfersPaid = inboundTransfers.reduce((sum, t) => sum + Number(t.amountUsd || 0), 0);
  const invoicePaid = customerInvoices.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);
  const totalPaid = Math.max(transfersPaid, invoicePaid);
  const totalRefunded = outboundTransfers.reduce((sum, t) => sum + Number(t.amountUsd || 0), 0);

  const netPaidEffective = Math.max(0, totalPaid - totalRefunded);
  const totalRemaining = Math.max(0, totalBilled - netPaidEffective);
  const customerSurplus = Math.max(0, netPaidEffective - totalBilled);

  const getShippingStageBadge = (status: string) => {
    switch (status) {
      case 'purchased':
        return { label: 'في ساحة المزاد', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'towing':
        return { label: 'نقل داخلي بأمريكا', color: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'at_port':
        return { label: 'بميناء التحميل', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      case 'shipped':
        return { label: 'في عرض البحر (الحاوية)', color: 'bg-cyan-50 text-cyan-800 border-cyan-200' };
      case 'arrived':
        return { label: 'وصلت ميناء الوصول', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'delivered':
        return { label: 'تم التسليم للزبون', color: 'bg-slate-100 text-slate-700 border-slate-200' };
      default:
        return { label: status, color: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`ملف وكشف حساب العميل: ${customer.fullName}`}
      maxWidth="5xl"
    >
      <div className="space-y-5 dir-rtl text-right text-xs">
        {/* 1. Header Profile Banner */}
        <div className="bg-[#F9FBFA] border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#164E33] text-[#84C0A2] font-black text-base flex items-center justify-center shadow-xs shrink-0">
              {customer.fullName.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{customer.fullName}</h3>
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>حساب نشط</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <UserIcon className="w-3 h-3 text-slate-400" />
                  <span className="font-mono text-slate-700">{customer.username}</span>
                </span>
                {customer.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{customer.phone}</span>
                  </span>
                )}
                {customer.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{customer.email}</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>تاريخ التسجيل: {formatDate(customer.createdAt)}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setTransferDefaultLot(undefined);
                setIsAddTransferOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 bg-[#164E33] hover:bg-[#1B5E3F] text-white shadow-xs"
              title="إضافة معاملة مالية / سند قبض لهذا العميل"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>إضافة معاملة مالية</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-all flex items-center gap-1 shadow-2xs"
              title="تعديل بيانات العميل"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
              <span>تعديل</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDeleteOpen(true)}
              className="px-3 py-1.5 rounded-full text-xs font-bold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-all flex items-center gap-1 shadow-2xs"
              title="حذف العميل"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>حذف</span>
            </button>

            {customerInvoices.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (onSelectInvoice) {
                    onSelectInvoice(customerInvoices[0]);
                  }
                }}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 shadow-2xs"
                title={
                  customerInvoices.length > 1
                    ? `الانتقال لأحدث فاتورة (${customerInvoices[0].invoiceNumber})`
                    : `الانتقال للفاتورة (${customerInvoices[0].invoiceNumber})`
                }
              >
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>
                  {customerInvoices.length === 1
                    ? `الفاتورة (${customerInvoices[0].invoiceNumber})`
                    : `أحدث فاتورة (${customerInvoices[0].invoiceNumber})`}
                </span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('statement')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 shadow-2xs ${
                activeTab === 'statement'
                  ? 'bg-[#164E33] text-white border-[#164E33]'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة كشف الحساب</span>
            </button>
          </div>
        </div>

        {/* 2. Financial KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total Billed */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>إجمالي المطالبات</span>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900">
              {formatCurrency(totalBilled)}
            </div>
            <span className="text-[10px] text-slate-400 block">
              حسب الفواتير وتكاليف الشراء
            </span>
          </div>

          {/* Total Paid */}
          <div className="bg-white border border-emerald-200/80 rounded-2xl p-3.5 space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-700 text-[11px] font-medium">
              <span>إجمالي المسدد</span>
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-800">
              {formatCurrency(totalPaid)}
            </div>
            <span className="text-[10px] text-emerald-600 block">
              {totalRefunded > 0 ? `دفعات مقبوضة (مردود: $${totalRefunded})` : 'دفعات وحوالات مقبوضة'}
            </span>
          </div>

          {/* Remaining Balance or Surplus */}
          <div
            className={`border rounded-2xl p-3.5 space-y-1 shadow-2xs ${
              customerSurplus > 0
                ? 'bg-emerald-50/70 border-emerald-300'
                : totalRemaining > 0
                ? 'bg-amber-50/40 border-amber-200/80'
                : 'bg-emerald-50/40 border-emerald-200/80'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-medium">
              <span className={customerSurplus > 0 ? 'text-emerald-900' : totalRemaining > 0 ? 'text-amber-800' : 'text-emerald-800'}>
                {customerSurplus > 0 ? 'رصيد دائن (فائض للعميل)' : 'المتبقي بذمة العميل'}
              </span>
              {customerSurplus > 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              ) : totalRemaining > 0 ? (
                <AlertCircle className="w-4 h-4 text-amber-600" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              )}
            </div>
            <div
              className={`text-base sm:text-lg font-black ${
                customerSurplus > 0 ? 'text-emerald-900' : totalRemaining > 0 ? 'text-amber-900' : 'text-emerald-900'
              }`}
            >
              {customerSurplus > 0 ? `+${formatCurrency(customerSurplus)}` : totalRemaining > 0 ? formatCurrency(totalRemaining) : '$0 (خالص)'}
            </div>
            <span
              className={`text-[10px] block ${
                customerSurplus > 0 ? 'text-emerald-700' : totalRemaining > 0 ? 'text-amber-700' : 'text-emerald-700'
              }`}
            >
              {customerSurplus > 0 ? 'رصيد إضافي متاح للسيارات القادمة' : totalRemaining > 0 ? 'مبالغ غير مستلمة' : 'تم تسديد كامل الحساب'}
            </span>
          </div>

          {/* Cars Count */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>السيارات المسجلة</span>
              <CarIcon className="w-4 h-4 text-[#164E33]" />
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900">
              {customerCars.length} سيارات
            </div>
            <span className="text-[10px] text-slate-400 block">
              {customerCars.filter((c) => c.status === 'delivered').length} مستلمة | {customerCars.filter((c) => c.status !== 'delivered').length} قيد الشحن
            </span>
          </div>
        </div>

        {/* 3. Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === 'invoices'
                ? 'bg-[#164E33] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
            }`}
          >
            الفواتير والمطالبات ({customerInvoices.length})
          </button>

          <button
            onClick={() => setActiveTab('cars')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === 'cars'
                ? 'bg-[#164E33] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
            }`}
          >
            سيارات العميل ومراحل الشحن ({customerCars.length})
          </button>

          <button
            onClick={() => setActiveTab('transfers')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === 'transfers'
                ? 'bg-[#164E33] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
            }`}
          >
            سجل الحوالات والدفعات المقبوضة ({customerTransfers.length})
          </button>

          <button
            onClick={() => setActiveTab('statement')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === 'statement'
                ? 'bg-[#164E33] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
            }`}
          >
            كشف الحساب الرسمي للطباعة
          </button>
        </div>

        {/* 4. Tab 1: Invoices */}
        {activeTab === 'invoices' && (
          <div className="space-y-3">
            {uninvoicedCars.length > 0 && (
              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-amber-900 text-[11px] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    توجد <strong>{uninvoicedCars.length}</strong> سيارة لم يتم إصدار فاتورة نهائية لها بعد. تم احتساب تكلفتها التقديرية (شراء + شحن) بمبلغ <strong>{formatCurrency(uninvoicedTotal)}</strong>.
                  </span>
                </div>
              </div>
            )}

            <div className="bg-[#F9FBFA] border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200/80 text-slate-500 font-bold text-[11px]">
                    <th className="py-2.5 pr-3">رقم الفاتورة</th>
                    <th className="py-2.5">السيارة واللوت</th>
                    <th className="py-2.5">تاريخ الإصدار</th>
                    <th className="py-2.5">إجمالي المبلغ</th>
                    <th className="py-2.5">المبلغ المسدد</th>
                    <th className="py-2.5">المتبقي غير المسدد</th>
                    <th className="py-2.5">حالة الفاتورة</th>
                    <th className="py-2.5 text-left pl-3">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  {customerInvoices.map((inv) => {
                    const car = customerCars.find((c) => c.id === inv.carId);
                    const paid = Number(inv.paidAmount || 0);
                    const total = Number(inv.netTotal || 0);
                    const remaining = Number(inv.remainingAmount || 0);
                    const isFullyPaid = remaining <= 0;
                    const isPartial = paid > 0 && remaining > 0;

                    return (
                      <tr key={inv.id} className="hover:bg-white transition-colors">
                        <td className="py-3 pr-3 font-mono font-bold text-[#164E33]">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3">
                          <div className="font-bold text-slate-800">
                            {car ? `${car.year} ${car.make} ${car.model}` : 'سيارة مشحونة'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Lot: {car ? car.lotNumber : '-'}
                          </div>
                        </td>
                        <td className="py-3 text-slate-600">{formatDate(inv.createdAt)}</td>
                        <td className="py-3 font-bold text-slate-900">{formatCurrency(total)}</td>
                        <td className="py-3 font-bold text-emerald-700">{formatCurrency(paid)}</td>
                        <td className="py-3 font-black text-amber-900">
                          {remaining > 0 ? formatCurrency(remaining) : '$0'}
                        </td>
                        <td className="py-3">
                          {isFullyPaid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>مسددة بالكامل</span>
                            </span>
                          ) : isPartial ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3 text-blue-600" />
                              <span>مدفوعة جزئياً</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              <span>غير مسددة</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-left pl-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const matchingCar = customerCars.find((c) => c.id === inv.carId);
                                setTransferDefaultLot(matchingCar?.lotNumber);
                                setIsAddTransferOpen(true);
                              }}
                              className="text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-bold inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full transition-all shadow-2xs"
                              title="تسجيل دفعة مسددة لهذه الفاتورة"
                            >
                              <PlusCircle className="w-3 h-3 text-emerald-700" />
                              <span>قبض دفعة</span>
                            </button>
                            {onSelectInvoice && (
                              <button
                                type="button"
                                onClick={() => onSelectInvoice(inv)}
                                className="text-white bg-[#164E33] hover:bg-[#1B5E3F] font-bold inline-flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full shadow-2xs transition-all"
                              >
                                <FileText className="w-3 h-3" />
                                <span>الانتقال للفاتورة</span>
                                <ChevronLeft className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {customerInvoices.length === 0 && uninvoicedCars.length === 0 && (
                <div className="py-12 text-center text-slate-400">
                  لا توجد فواتير مسجلة لهذا العميل حتى الآن.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. Tab 2: Cars */}
        {activeTab === 'cars' && (
          <div className="space-y-3">
            <div className="bg-[#F9FBFA] border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200/80 text-slate-500 font-bold text-[11px]">
                    <th className="py-2.5 pr-3">السيارة</th>
                    <th className="py-2.5">رقم اللوت والشاصي</th>
                    <th className="py-2.5">المزاد</th>
                    <th className="py-2.5">سعر الشراء</th>
                    <th className="py-2.5">المسار اللوجستي</th>
                    <th className="py-2.5">حالة الشحن</th>
                    <th className="py-2.5">رقم الحاوية</th>
                    <th className="py-2.5 text-left pl-3">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  {customerCars.map((car) => {
                    const stageBadge = getShippingStageBadge(car.status);
                    const carInvoice = customerInvoices.find((inv) => inv.carId === car.id);

                    return (
                      <tr key={car.id} className="hover:bg-white transition-colors">
                        <td className="py-3 pr-3 font-bold text-slate-800">
                          <div>{car.year} {car.make} {car.model}</div>
                          {car.messages && car.messages.length > 0 && (
                            <span className="text-[9px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-full font-bold inline-block mt-0.5">
                              {car.messages.length} رسائل
                            </span>
                          )}
                        </td>
                        <td className="py-3 font-mono text-slate-600">
                          <div>Lot: {car.lotNumber}</div>
                          <div className="text-[10px] text-slate-400">{car.vin}</div>
                        </td>
                        <td className="py-3 text-slate-600">{car.auctionName}</td>
                        <td className="py-3 font-bold text-slate-900">
                          <div>{formatCurrency(car.purchasePrice)}</div>
                          {car.auctionPaymentSource === 'external' && (
                            <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded font-medium inline-block mt-0.5">
                              مسدد خارجياً
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-slate-600">
                          {car.usStateName} ← {car.destinationPortName}
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${stageBadge.color}`}
                          >
                            {stageBadge.label}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-slate-700">
                          {car.containerNumber || '-'}
                        </td>
                        <td className="py-3 text-left pl-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setTransferDefaultLot(car.lotNumber);
                                setIsAddTransferOpen(true);
                              }}
                              className="text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-bold inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full transition-all shadow-2xs"
                              title={`تسجيل دفعة للسيارة لوت: ${car.lotNumber}`}
                            >
                              <PlusCircle className="w-3 h-3 text-emerald-700" />
                              <span>تسديد دفعة</span>
                            </button>
                            {carInvoice && onSelectInvoice && (
                              <button
                                type="button"
                                onClick={() => onSelectInvoice(carInvoice)}
                                className="text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 font-bold inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full transition-all"
                                title={`الانتقال للفاتورة ${carInvoice.invoiceNumber}`}
                              >
                                <FileText className="w-3 h-3 text-slate-600" />
                                <span>الفاتورة</span>
                              </button>
                            )}
                            {onSelectCar && (
                              <button
                                type="button"
                                onClick={() => onSelectCar(car)}
                                className="text-[#164E33] hover:underline font-bold inline-flex items-center gap-1 text-[11px]"
                              >
                                <span>تفاصيل</span>
                                <ChevronLeft className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {customerCars.length === 0 && (
                <div className="py-12 text-center text-slate-400">
                  لا توجد سيارات مربوطة بهذا العميل حتى الآن.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. Tab 3: Transfers */}
        {activeTab === 'transfers' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <span className="text-slate-600 font-bold text-xs">
                سجل كافة الحركات والمدفوعات المسجلة بحساب العميل ({customerTransfers.length} قيود)
              </span>
              <button
                type="button"
                onClick={() => {
                  setTransferDefaultLot(undefined);
                  setIsAddTransferOpen(true);
                }}
                className="bg-[#164E33] hover:bg-[#1B5E3F] text-white text-xs font-bold px-3.5 py-1.5 rounded-full transition-all shadow-2xs flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>قيد سند / دفعة جديدة</span>
              </button>
            </div>

            <div className="bg-[#F9FBFA] border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200/80 text-slate-500 font-bold text-[11px]">
                    <th className="py-2.5 pr-3">رقم الحوالة / السند</th>
                    <th className="py-2.5">تاريخ الحركة</th>
                    <th className="py-2.5">النوع</th>
                    <th className="py-2.5">طريقة القبض / الصرافة</th>
                    <th className="py-2.5">المبلغ بالدولار</th>
                    <th className="py-2.5">المبلغ والعملة الأصلية</th>
                    <th className="py-2.5">اللوت المرتبط</th>
                    <th className="py-2.5">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  {customerTransfers.map((t) => {
                    const isInbound = t.direction === 'inbound';
                    return (
                      <tr key={t.id} className="hover:bg-white transition-colors">
                        <td className="py-3 pr-3 font-mono font-bold text-slate-800">{t.transferNumber}</td>
                        <td className="py-3 text-slate-600">{formatDate(t.receivedAt)}</td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isInbound
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {isInbound ? (
                              <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3 text-rose-600" />
                            )}
                            <span>{isInbound ? 'وارد (قبض)' : 'صادر (صرف)'}</span>
                          </span>
                        </td>
                        <td className="py-3 font-semibold text-slate-700">{t.exchangeOfficeName || 'صندوق نقدي'}</td>
                        <td
                          className={`py-3 font-black ${
                            isInbound ? 'text-emerald-800' : 'text-rose-700'
                          }`}
                        >
                          {isInbound ? formatCurrency(t.amountUsd) : `-${formatCurrency(t.amountUsd)}`}
                        </td>
                        <td className="py-3 text-slate-600">
                          {t.currency !== 'USD'
                            ? `${t.originalAmount.toLocaleString()} ${t.currency}`
                            : formatCurrency(t.amountUsd)}
                        </td>
                        <td className="py-3 font-mono text-slate-600">
                          {t.carLot ? (
                            <span className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold text-slate-800">
                              Lot: {t.carLot}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">رصيد عام</span>
                          )}
                        </td>
                        <td className="py-3 text-slate-500 text-[11px]">{t.notes || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {customerTransfers.length === 0 && (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <p>لم يتم قيد أي حوالات أو دفعات مقبوضة لهذا العميل بعد.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setTransferDefaultLot(undefined);
                      setIsAddTransferOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 bg-[#164E33] text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-[#1B5E3F] transition-all shadow-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>إضافة أول دفعة مالية للعميل</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. Tab 4: Printable Statement */}
        {activeTab === 'statement' && (
          <PrintableCustomerStatement
            customer={customer}
            cars={customerCars}
            invoices={customerInvoices}
            transfers={customerTransfers}
            totalBilled={totalBilled}
            totalPaid={totalPaid}
            totalRemaining={totalRemaining}
          />
        )}

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              إجمالي المطالبات: <strong className="text-slate-900">{formatCurrency(totalBilled)}</strong>
            </span>
            <span>
              إجمالي المقبوض: <strong className="text-emerald-700">{formatCurrency(totalPaid)}</strong>
            </span>
            {customerSurplus > 0 ? (
              <span className="text-emerald-700 font-bold">
                فائض رصيد دائن للعميل: <strong>+{formatCurrency(customerSurplus)}</strong>
              </span>
            ) : (
              <span>
                الرصيد المتبقي بذمة العميل: <strong className={totalRemaining > 0 ? 'text-amber-900' : 'text-emerald-800'}>{formatCurrency(totalRemaining)}</strong>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setTransferDefaultLot(undefined);
                setIsAddTransferOpen(true);
              }}
              className="bg-[#164E33] hover:bg-[#1B5E3F] text-white text-xs font-bold px-3.5 py-1.5 rounded-full transition-all shadow-xs flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>إضافة معاملة مالية</span>
            </button>
            <Button variant="secondary" size="sm" onClick={onClose}>
              إغلاق
            </Button>
          </div>
        </div>
      </div>

      {isEditOpen && (
        <EditCustomerModal
          customer={customer}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onUpdateCustomer={(updated) => {
            if (onUpdateCustomer) onUpdateCustomer(updated);
          }}
        />
      )}

      {isDeleteOpen && (
        <ConfirmDeleteModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={() => {
            deleteUser(customer.id);
            setIsDeleteOpen(false);
            onClose();
          }}
          title="حذف العميل وتأكيد الإلغاء"
          message={`هل أنت متأكد من حذف حساب العميل ${customer.fullName}؟`}
        />
      )}

      {isAddTransferOpen && (
        <NewTransferModal
          isOpen={isAddTransferOpen}
          onClose={() => {
            setIsAddTransferOpen(false);
            setTransferDefaultLot(undefined);
          }}
          initialCustomerId={customer.id}
          initialCarLot={transferDefaultLot}
          lockCustomer={true}
          onAddTransfer={(newTr) => {
            addTransfer(newTr);
            setIsAddTransferOpen(false);
            setTransferDefaultLot(undefined);
          }}
        />
      )}
    </Modal>
  );
};
