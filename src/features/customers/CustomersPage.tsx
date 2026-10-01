import React, { useState } from 'react';
import { useData } from '../../shared/context/DataContext';
import { User, Car, Invoice } from '../../types';
import { formatCurrency } from '../../shared/lib/formatters';
import { AddCustomerModal } from './AddCustomerModal';
import { EditCustomerModal } from './EditCustomerModal';
import { CustomerDetailsModal } from './CustomerDetailsModal';
import { ConfirmDeleteModal } from '../../shared/components/ui/ConfirmDeleteModal';
import { CarDetailsModal } from '../cars/CarDetailsModal';
import { InvoiceDetailsModal } from '../invoices/InvoiceDetailsModal';
import { NewTransferModal } from '../exchange/NewTransferModal';
import {
  Search,
  Plus,
  FileText,
  Car as CarIcon,
  ArrowDownLeft,
  AlertCircle,
  CheckCircle2,
  Users,
  Edit3,
  Trash2,
  PlusCircle,
} from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const { users, cars, invoices, transfers, addUser, deleteUser, updateInvoice, addTransfer } = useData();
  const customers = users.filter((u) => u.role === 'customer');

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [customerToEdit, setCustomerToEdit] = useState<User | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<User | null>(null);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [customerForTransfer, setCustomerForTransfer] = useState<User | null>(null);
  const [isDirectTransferOpen, setIsDirectTransferOpen] = useState(false);

  const handleAddCustomer = (newCustomer: User) => {
    addUser(newCustomer);
  };

  const getCustomerMetrics = (customer: User) => {
    const custCars = cars.filter(
      (c) =>
        c.customerId === customer.id ||
        (customer.username === 'omar.customer' && (c.customerId === 'user-5' || c.customerName.includes('عمر'))) ||
        c.customerName.toLowerCase() === customer.fullName.toLowerCase()
    );
    const carIds = custCars.map((c) => c.id);
    const carLots = custCars.map((c) => c.lotNumber);
    const custInvoices = invoices.filter((inv) => carIds.includes(inv.carId));

    const invoicedCarIds = new Set(custInvoices.map((inv) => inv.carId));
    const invoicedTotal = custInvoices.reduce((sum, inv) => sum + Number(inv.netTotal || 0), 0);
    const unInvoicedCarsTotal = custCars
      .filter((c) => !invoicedCarIds.has(c.id))
      .reduce((sum, c) => {
        const isExternal = c.auctionPaymentSource === 'external';
        const price = isExternal ? 0 : Number(c.purchasePrice || 0);
        return sum + price + 1850;
      }, 0);
    const totalBilled = invoicedTotal + unInvoicedCarsTotal;

    const custTransfers = transfers.filter(
      (t) =>
        t.customerId === customer.id ||
        (t.carLot && carLots.includes(t.carLot)) ||
        t.customerName?.toLowerCase() === customer.fullName.toLowerCase()
    );
    const inboundTransfers = custTransfers.filter((t) => t.direction === 'inbound');
    const outboundTransfers = custTransfers.filter((t) => t.direction === 'outbound');
    const transferPaid = inboundTransfers.reduce((sum, t) => sum + Number(t.amountUsd || 0), 0);
    const invoicePaid = custInvoices.reduce((sum, inv) => sum + Number(inv.paidAmount || 0), 0);
    const totalPaid = Math.max(transferPaid, invoicePaid);
    const totalRefunded = outboundTransfers.reduce((sum, t) => sum + Number(t.amountUsd || 0), 0);
    const netPaidEffective = Math.max(0, totalPaid - totalRefunded);

    const remaining = Math.max(0, totalBilled - netPaidEffective);
    const surplus = Math.max(0, netPaidEffective - totalBilled);

    return {
      carsCount: custCars.length,
      totalBilled,
      totalPaid,
      remaining,
      surplus,
      cars: custCars,
      invoicesCount: custInvoices.length,
      transfersCount: custTransfers.length,
    };
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery))
  );

  // Overall Financial Totals
  const overallBilled = customers.reduce((sum, c) => sum + getCustomerMetrics(c).totalBilled, 0);
  const overallPaid = customers.reduce((sum, c) => sum + getCustomerMetrics(c).totalPaid, 0);
  const overallRemaining = Math.max(0, overallBilled - overallPaid);

  return (
    <div className="space-y-5 dir-rtl text-right text-xs">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="font-bold text-slate-900 text-base">إدارة وحسابات العملاء</h2>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="bg-[#164E33] hover:bg-[#1B5E3F] text-white text-xs font-semibold px-4 py-2 rounded-full transition-all shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>تسجيل عميل جديد</span>
        </button>
      </div>

      {/* 2. Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>إجمالي العملاء</span>
            <Users className="w-4 h-4 text-[#164E33]" />
          </div>
          <div className="text-lg font-black text-slate-900">{customers.length} عميل</div>
          <span className="text-[10px] text-slate-400 block">مشترين مسجلين بالنظام</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>إجمالي المطالبات</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg font-black text-slate-900">{formatCurrency(overallBilled)}</div>
          <span className="text-[10px] text-slate-400 block">فواتير وتكاليف شحن</span>
        </div>

        <div className="bg-white border border-emerald-200/80 rounded-2xl p-3.5 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 text-[11px] font-medium">
            <span>إجمالي المسدد</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-emerald-800">{formatCurrency(overallPaid)}</div>
          <span className="text-[10px] text-emerald-600 block">حوالات مقبوضة فعلياً</span>
        </div>

        <div className="bg-white border border-amber-200/80 rounded-2xl p-3.5 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700 text-[11px] font-medium">
            <span>المتبقي بذمة العملاء</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg font-black text-amber-900">{formatCurrency(overallRemaining)}</div>
          <span className="text-[10px] text-amber-600 block">ديون ومبالغ قيد التحصيل</span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200/70 pb-3">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، اسم المستخدم، أو الهاتف..."
            className="w-full bg-[#F9FBFA] border border-slate-200/90 rounded-full pr-9 pl-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          عرض {filteredCustomers.length} من أصل {customers.length} عميل
        </span>
      </div>

      {/* 4. Customers Table */}
      <div className="bg-[#F9FBFA] border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200/80 text-slate-500 font-bold text-[11px]">
              <th className="py-3 pr-3">اسم العميل والاتصال</th>
              <th className="py-3">اسم الدخول (Username)</th>
              <th className="py-3">السيارات المملوكة</th>
              <th className="py-3">إجمالي المطالبات</th>
              <th className="py-3">المبلغ المسدد</th>
              <th className="py-3">المتبقي بذمته</th>
              <th className="py-3 text-left pl-3">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60">
            {filteredCustomers.map((cust) => {
              const metrics = getCustomerMetrics(cust);

              return (
                <tr
                  key={cust.id}
                  className="hover:bg-white transition-colors cursor-pointer"
                  onClick={() => setSelectedCustomer(cust)}
                >
                  <td className="py-3 pr-3">
                    <div className="font-bold text-slate-900">{cust.fullName}</div>
                    <div className="text-[10px] text-slate-400">
                      {cust.phone ? cust.phone : cust.email ? cust.email : 'لا يوجد هاتف مسجل'}
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="font-mono font-bold text-[#164E33] bg-emerald-50/60 border border-emerald-200/70 px-2 py-0.5 rounded-md">
                      {cust.username}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="font-bold text-slate-800 bg-white border border-slate-200/80 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <CarIcon className="w-3 h-3 text-slate-500" />
                      <span>{metrics.carsCount} سيارات</span>
                    </span>
                  </td>
                  <td className="py-3 font-bold text-slate-900">{formatCurrency(metrics.totalBilled)}</td>
                  <td className="py-3 font-bold text-emerald-700">{formatCurrency(metrics.totalPaid)}</td>
                  <td className="py-3">
                    {metrics.surplus > 0 ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>+{formatCurrency(metrics.surplus)} (فائض)</span>
                      </span>
                    ) : metrics.remaining > 0 ? (
                      <span className="inline-flex items-center gap-1 font-black text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full text-[11px]">
                        <AlertCircle className="w-3 h-3 text-amber-700" />
                        <span>{formatCurrency(metrics.remaining)}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>$0 (مسدد بالكامل)</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-left pl-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomerForTransfer(cust);
                          setIsDirectTransferOpen(true);
                        }}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2.5 py-1.5 rounded-full transition-all text-[11px] inline-flex items-center gap-1 shadow-2xs"
                        title="تسجيل دفعة أو قيد مالي لهذا العميل"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-emerald-700" />
                        <span>إضافة دفعة</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(cust)}
                        className="bg-white hover:bg-[#164E33] hover:text-white border border-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-full transition-all text-[11px] inline-flex items-center gap-1 shadow-2xs"
                      >
                        <FileText className="w-3 h-3" />
                        <span>كشف الحساب</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCustomerToEdit(cust)}
                        className="p-1.5 hover:bg-emerald-50 text-emerald-700 hover:text-emerald-900 rounded-lg transition-all"
                        title="تعديل بيانات العميل"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setCustomerToDelete(cust)}
                        className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition-all"
                        title="حذف العميل"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredCustomers.length === 0 && (
          <div className="py-12 text-center text-slate-400">
            لا يوجد عملاء يطابقون معايير البحث.
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAddCustomer={handleAddCustomer}
      />

      {/* Edit Customer Modal */}
      {customerToEdit && (
        <EditCustomerModal
          customer={customerToEdit}
          isOpen={!!customerToEdit}
          onClose={() => setCustomerToEdit(null)}
          onUpdateCustomer={(updated) => {
            if (selectedCustomer?.id === updated.id) setSelectedCustomer(updated);
          }}
        />
      )}

      {/* Confirm Delete Customer Modal */}
      {customerToDelete && (
        <ConfirmDeleteModal
          isOpen={!!customerToDelete}
          onClose={() => setCustomerToDelete(null)}
          onConfirm={() => {
            deleteUser(customerToDelete.id);
            setCustomerToDelete(null);
            if (selectedCustomer?.id === customerToDelete.id) setSelectedCustomer(null);
          }}
          title="حذف العميل وتأكيد الإلغاء"
          message={`هل أنت متأكد من حذف حساب العميل ${customerToDelete.fullName}؟`}
        />
      )}

      {/* Comprehensive Customer Details & Financial Statement Modal */}
      {selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onSelectCar={(car) => setSelectedCar(car)}
          onSelectInvoice={(inv) => setSelectedInvoice(inv)}
        />
      )}

      {/* Car Details Modal if opened from customer details */}
      {selectedCar && (
        <CarDetailsModal
          car={selectedCar}
          isOpen={!!selectedCar}
          onClose={() => setSelectedCar(null)}
        />
      )}

      {/* Full Invoice Details Modal if opened from customer invoices or cars */}
      {selectedInvoice && (
        <InvoiceDetailsModal
          invoice={selectedInvoice}
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onUpdateInvoice={(updated) => {
            updateInvoice(updated);
            setSelectedInvoice(updated);
          }}
        />
      )}

      {/* Quick New Transfer Modal for selected customer */}
      {isDirectTransferOpen && customerForTransfer && (
        <NewTransferModal
          isOpen={isDirectTransferOpen}
          onClose={() => {
            setIsDirectTransferOpen(false);
            setCustomerForTransfer(null);
          }}
          initialCustomerId={customerForTransfer.id}
          lockCustomer={true}
          onAddTransfer={(newTr) => {
            addTransfer(newTr);
            setIsDirectTransferOpen(false);
            setCustomerForTransfer(null);
          }}
        />
      )}
    </div>
  );
};
