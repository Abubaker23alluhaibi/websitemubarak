import React, { useState } from 'react';
import { Search, Eye, Lock, Unlock, Tag, Trash2 } from 'lucide-react';
import { useData } from '../../shared/context/DataContext';
import { useAuth } from '../../shared/context/AuthContext';
import { Invoice } from '../../types';
import { formatCurrency, formatDate } from '../../shared/lib/formatters';
import { InvoiceDetailsModal } from './InvoiceDetailsModal';
import { ConfirmDeleteModal } from '../../shared/components/ui/ConfirmDeleteModal';

export const InvoicesPage: React.FC = () => {
  const { invoices, cars, updateInvoice, deleteInvoice } = useData();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [lockFilter, setLockFilter] = useState<'all' | 'locked' | 'unlocked'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  const filteredInvoices = invoices.filter((inv) => {
    const car = inv.car || cars.find((c) => c.id === inv.carId);
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (car?.make && car.make.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (car?.model && car.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (car?.lotNumber && car.lotNumber.includes(searchQuery)) ||
      (car?.customerName && car.customerName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesLock =
      lockFilter === 'all' ||
      (lockFilter === 'locked' && inv.isLocked) ||
      (lockFilter === 'unlocked' && !inv.isLocked);
    return matchesSearch && matchesLock;
  });

  const handleUpdateInvoice = (updated: Invoice) => {
    updateInvoice(updated);
    setSelectedInvoice(updated);
  };

  return (
    <div className="space-y-4 dir-rtl text-right text-xs">
      {/* Search & Filter */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم الفاتورة، اللوت، الموديل، العميل..."
              className="w-full bg-[#F7F9F8] border border-slate-200/80 rounded-full pr-8 pl-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
          </div>

          <select
            value={lockFilter}
            onChange={(e) => setLockFilter(e.target.value as any)}
            className="bg-[#F7F9F8] border border-slate-200/80 text-[11px] text-slate-600 rounded-full px-3 py-1.5 outline-none"
          >
            <option value="all">كل الفواتير</option>
            <option value="locked">المقفولة فقط</option>
            <option value="unlocked">المفتوحة فقط</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#F9FBFA] border border-slate-100 rounded-2xl p-4 overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-semibold pb-2.5">
              <th className="pb-2.5 pr-2">رقم الفاتورة</th>
              <th className="pb-2.5">السيارة والعميل</th>
              <th className="pb-2.5">تاريخ الشراء / الإصدار</th>
              <th className="pb-2.5">المجموع الصافي</th>
              <th className="pb-2.5">الخصم</th>
              <th className="pb-2.5">المدفوع / المتبقي</th>
              <th className="pb-2.5">الحالة</th>
              <th className="pb-2.5 text-left pl-2">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            {filteredInvoices.map((inv) => {
              const car = inv.car || cars.find((c) => c.id === inv.carId);

              return (
                <tr key={inv.id} className="hover:bg-white/80 transition-colors">
                  <td className="py-3 pr-2 font-mono font-bold text-slate-800">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3">
                    <div className="font-bold text-slate-800">
                      {car ? `${car.year} ${car.make} ${car.model}` : 'مركبة مشحونة'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Lot: {car?.lotNumber || '-'} | {car?.customerName || 'عميل مسجل'}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="text-slate-800 font-medium">
                      {car?.purchaseDate ? formatDate(car.purchaseDate) : formatDate(inv.createdAt)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {car?.city || car?.usStateName || 'أمريكا'}
                    </div>
                  </td>
                  <td className="py-3 font-bold text-slate-900">{formatCurrency(inv.netTotal)}</td>
                  <td className="py-3">
                    {inv.discount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold" title={inv.discountReason}>
                        <Tag className="w-3 h-3 text-emerald-600" />
                        <span>-{formatCurrency(inv.discount)}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">لا يوجد</span>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="text-slate-700 font-medium">مسدد: {formatCurrency(inv.paidAmount)}</div>
                    <div className="text-[11px] font-bold text-amber-700">
                      متبقي: {formatCurrency(inv.remainingAmount)}
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-white border border-slate-200/60 px-2 py-0.5 rounded-full">
                      {inv.isLocked ? (
                        <>
                          <Lock className="w-3 h-3 text-slate-500" />
                          <span>مقفولة</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3 h-3 text-slate-400" />
                          <span>مفتوحة</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3 text-left pl-2">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="text-slate-600 hover:text-slate-900 text-[11px] font-medium p-1 hover:bg-slate-100 rounded-md transition-colors"
                        title="عرض تفاصيل الفاتورة"
                      >
                        <Eye className="w-3.5 h-3.5 inline ml-0.5 text-slate-400" />
                        عرض
                      </button>

                      {(!inv.isLocked || isSuperAdmin) && (
                        <button
                          onClick={() => setInvoiceToDelete(inv)}
                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-md transition-colors"
                          title="حذف الفاتورة"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedInvoice && (
        <InvoiceDetailsModal
          invoice={selectedInvoice}
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onUpdateInvoice={handleUpdateInvoice}
        />
      )}

      {invoiceToDelete && (
        <ConfirmDeleteModal
          isOpen={!!invoiceToDelete}
          onClose={() => setInvoiceToDelete(null)}
          onConfirm={() => {
            deleteInvoice(invoiceToDelete.id);
            setInvoiceToDelete(null);
          }}
          title="حذف الفاتورة"
          message={`هل أنت متأكد من حذف الفاتورة رقم ${invoiceToDelete.invoiceNumber}؟`}
        />
      )}
    </div>
  );
};
