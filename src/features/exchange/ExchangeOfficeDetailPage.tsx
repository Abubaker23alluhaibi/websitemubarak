import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../shared/context/DataContext';
import { MoneyTransfer } from '../../types';
import { formatCurrency, formatDate } from '../../shared/lib/formatters';
import {
  Building2,
  ArrowRight,
  Phone,
  MapPin,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Minus,
  Search,
  Printer,
  Percent,
  Edit3,
  Trash2,
} from 'lucide-react';
import { NewTransferModal } from './NewTransferModal';
import { EditTransferModal } from './EditTransferModal';
import { EditExchangeOfficeModal } from './EditExchangeOfficeModal';
import { CommissionAnalyticsModal } from './CommissionAnalyticsModal';
import { ConfirmDeleteModal } from '../../shared/components/ui/ConfirmDeleteModal';

export const ExchangeOfficeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    exchangeOffices: offices,
    transfers,
    addTransfer,
    deleteTransfer,
    deleteExchangeOffice,
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'inbound' | 'outbound'>('all');
  const [purposeFilter, setPurposeFilter] = useState<string>('all');

  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);
  const [isEditOfficeOpen, setIsEditOfficeOpen] = useState(false);
  const [isDeleteOfficeOpen, setIsDeleteOfficeOpen] = useState(false);
  const [transferToEdit, setTransferToEdit] = useState<MoneyTransfer | null>(null);
  const [transferToDelete, setTransferToDelete] = useState<MoneyTransfer | null>(null);

  // العثور على الصيرفة الحالية
  const office = offices.find((o) => o.id === id) || offices[0];

  if (!office) {
    return (
      <div className="p-8 text-center space-y-3 dir-rtl text-right">
        <h2 className="text-sm font-bold text-slate-700">مكتب الصرافة غير موجود</h2>
        <button
          onClick={() => navigate('/exchange')}
          className="text-xs text-[#164E33] underline font-bold"
        >
          العودة إلى مكاتب الصرافة
        </button>
      </div>
    );
  }

  // حركات هذه الصيرفة فقط
  const officeTransfers = transfers.filter((t) => t.exchangeOfficeId === office.id);

  // احتساب الإحصائيات مع الأخذ بالاعتبار الصافي بعد العمولة
  const totalInbound = officeTransfers
    .filter((t) => t.direction === 'inbound')
    .reduce((sum, t) => sum + Number(t.netOfficeAmountUsd ?? t.amountUsd ?? 0), 0);

  const totalOutbound = officeTransfers
    .filter((t) => t.direction === 'outbound')
    .reduce((sum, t) => sum + Number(t.netOfficeAmountUsd ?? t.amountUsd ?? 0), 0);

  // إجمالي العمولات الخاصة بالصيرفة (علينا) والشركة (لنا)
  const totalCommissionsOnUs = officeTransfers
    .filter((t) => t.hasCommission && t.commissionType === 'on_us')
    .reduce((sum, t) => sum + Number(t.commissionAmountUsd || 0), 0);

  const totalCommissionsForUs = officeTransfers
    .filter((t) => t.hasCommission && t.commissionType === 'for_us')
    .reduce((sum, t) => sum + Number(t.commissionAmountUsd || 0), 0);

  const officeCommissionTransfersCount = officeTransfers.filter(
    (t) => t.hasCommission && Number(t.commissionAmountUsd || 0) > 0
  ).length;

  const currentBalance = office.balanceUsd + totalInbound - totalOutbound;
  const isPositive = currentBalance >= 0;

  // الفلترة
  const filteredTransfers = officeTransfers.filter((tr) => {
    const matchesSearch =
      tr.transferNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tr.customerName && tr.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tr.carLot && tr.carLot.includes(searchQuery)) ||
      (tr.notes && tr.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDirection = directionFilter === 'all' || tr.direction === directionFilter;
    const matchesPurpose = purposeFilter === 'all' || tr.purpose === purposeFilter;

    return matchesSearch && matchesDirection && matchesPurpose;
  });

  const handleAddTransfer = (newTransfer: Partial<MoneyTransfer>) => {
    addTransfer({
      ...newTransfer,
      exchangeOfficeId: office.id,
      exchangeOfficeName: office.name,
      location: newTransfer.location || office.city,
    });
  };

  const getPurposeText = (tr: MoneyTransfer) => {
    if (tr.customPurpose) return tr.customPurpose;
    switch (tr.purpose) {
      case 'car_purchase':
        return 'ثمن سيارة';
      case 'shipping_cost':
        return 'أجور شحن';
      case 'combined':
        return 'شراء + شحن';
      case 'customs_clearance':
        return 'تخليص جمركي';
      case 'other':
        return tr.customPurpose || 'غرض مخصص';
      default:
        return tr.purpose;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 dir-rtl text-right text-xs">
      {/* 1. Header & Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/exchange')}
            className="w-8 h-8 rounded-full bg-[#F7F9F8] hover:bg-slate-200/70 border border-slate-200/80 flex items-center justify-center text-slate-600 transition-colors"
            title="العودة إلى قائمة الصيرفات"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-800 text-sm sm:text-base">{office.name}</h2>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  isPositive
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                {isPositive ? 'بذمتهم لصالحنا' : 'مستحق لهم بذمتنا'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span>كشف الحساب وسجل السندات والتحويلات المالية</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {office.city}
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsEditOfficeOpen(true)}
            className="bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-semibold px-3 py-1.5 rounded-full transition-all shadow-xs flex items-center gap-1.5"
            title="تعديل بيانات الصيرفة"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>تعديل الصيرفة</span>
          </button>

          <button
            onClick={() => setIsDeleteOfficeOpen(true)}
            className="bg-white hover:bg-red-50 text-red-700 border border-red-200 text-xs font-semibold px-3 py-1.5 rounded-full transition-all shadow-xs flex items-center gap-1.5"
            title="حذف الصيرفة"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>حذف</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full transition-all shadow-xs flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>طباعة الكشف</span>
          </button>

          <button
            onClick={() => setIsCommissionModalOpen(true)}
            className="bg-white hover:bg-emerald-50/60 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full transition-all shadow-xs flex items-center gap-1.5"
            title="سجل وتحليل العمولات"
          >
            <Percent className="w-3.5 h-3.5 text-[#164E33]" />
            <span>تحليل وسجل العمولات</span>
            {officeCommissionTransfersCount > 0 && (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full mr-0.5">
                {officeCommissionTransfersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsDepositOpen(true)}
            className="bg-[#164E33] hover:bg-[#1B5E3F] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ قيد إيداع / قبض</span>
          </button>

          <button
            onClick={() => setIsWithdrawOpen(true)}
            className="bg-white hover:bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all shadow-xs flex items-center gap-1.5"
          >
            <Minus className="w-3.5 h-3.5 text-red-600" />
            <span>- قيد سحب / صرف</span>
          </button>
        </div>
      </div>

      {/* 2. Office Information & Financial KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Live Balance */}
        <div className="bg-[#F9FBFA] border border-slate-100 rounded-2xl p-4 space-y-1.5">
          <div className="flex justify-between items-center text-slate-400 text-[11px]">
            <span>الرصيد الصافي الجاري</span>
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div
            className={`text-xl font-black ${
              isPositive ? 'text-[#164E33]' : 'text-red-600'
            }`}
          >
            {formatCurrency(Math.abs(currentBalance))}
          </div>
          <span className="text-[10px] text-slate-400 block">
            {isPositive ? 'مبلغ متوفر بذمة الصيرفة لنا' : 'مبالغ مستحقة للصيرفة بذمتنا'}
          </span>
        </div>

        {/* Card 2: Total Received */}
        <div className="bg-[#F9FBFA] border border-slate-100 rounded-2xl p-4 space-y-1.5">
          <div className="flex justify-between items-center text-slate-400 text-[11px]">
            <span>إجمالي الإيداعات والمقبوضات</span>
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700">{formatCurrency(totalInbound)}</div>
          <span className="text-[10px] text-slate-400 block">
            إجمالي الحوالات المودعة من الزبائن (بعد العمولات)
          </span>
        </div>

        {/* Card 3: Total Withdrawn */}
        <div className="bg-[#F9FBFA] border border-slate-100 rounded-2xl p-4 space-y-1.5">
          <div className="flex justify-between items-center text-slate-400 text-[11px]">
            <span>إجمالي المسحوبات والمصروفات</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-red-600" />
          </div>
          <div className="text-xl font-bold text-red-600">{formatCurrency(totalOutbound)}</div>
          <span className="text-[10px] text-slate-400 block">
            المسحوبات متضمنة عمولات الصيرفة المستقطعة
          </span>
        </div>

        {/* Card 4: Office Details */}
        <div className="bg-[#F9FBFA] border border-slate-100 rounded-2xl p-4 space-y-1.5">
          <div className="flex justify-between items-center text-slate-400 text-[11px]">
            <span>بيانات الاتصال بالفرع</span>
            <Phone className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="font-bold text-slate-800 text-xs truncate">{office.contactPerson}</div>
          <div className="text-[11px] font-mono text-slate-500">{office.phone}</div>
        </div>
      </div>

      {/* Commission Summary Bar */}
      {(totalCommissionsOnUs > 0 || totalCommissionsForUs > 0) && (
        <div className="space-y-2 bg-[#F9FBFA] p-3.5 rounded-2xl border border-slate-200/80 text-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-[#164E33]" />
              <span>ملخص العمولات للصيرفة ({office.name}):</span>
            </span>
            <button
              onClick={() => setIsCommissionModalOpen(true)}
              className="text-[11px] font-bold text-[#164E33] hover:underline flex items-center gap-1"
            >
              <span>فتح سجل وتحليل العمولات كاملة ←</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 border border-amber-200/70">
              <div>
                <span className="text-amber-800 font-bold block text-xs">عمولات الصيرفة (علينا كلفة):</span>
                <span className="text-[10px] text-slate-500">أجور اقتطعتها الصيرفة على حركات السحب والإيداع</span>
              </div>
              <span className="font-black text-amber-900 text-sm">{formatCurrency(totalCommissionsOnUs)}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/70">
              <div>
                <span className="text-emerald-800 font-bold block text-xs">عمولات الشركة (لنا أرباح):</span>
                <span className="text-[10px] text-slate-500">عائدات وعمولات خدمة مقيدة لصالح حساب شركتنا</span>
              </div>
              <span className="font-black text-emerald-900 text-sm">{formatCurrency(totalCommissionsForUs)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Filter Bar & Search */}
      <div className="bg-[#F9FBFA] border border-slate-100 rounded-2xl p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم الحوالة، اسم العميل، اللوت..."
              className="w-full bg-white border border-slate-200/80 rounded-full pr-8 pl-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
          </div>

          {/* Direction Filter */}
          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value as any)}
            className="bg-white border border-slate-200/80 text-[11px] text-slate-700 rounded-full px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#164E33]"
          >
            <option value="all">كل أنواع الحركات</option>
            <option value="inbound">إيداعات وقبوضات فقط (Inbound)</option>
            <option value="outbound">سحوبات ومصروفات فقط (Outbound)</option>
          </select>

          {/* Purpose Filter */}
          <select
            value={purposeFilter}
            onChange={(e) => setPurposeFilter(e.target.value)}
            className="bg-white border border-slate-200/80 text-[11px] text-slate-700 rounded-full px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#164E33]"
          >
            <option value="all">كل الأغراض</option>
            <option value="car_purchase">ثمن سيارة</option>
            <option value="shipping_cost">أجور شحن</option>
            <option value="combined">شراء + شحن</option>
            <option value="customs_clearance">تخليص جمركي</option>
          </select>
        </div>

        <span className="text-[11px] text-slate-400 shrink-0">
          إجمالي النتائج: {filteredTransfers.length} حركة
        </span>
      </div>

      {/* 4. Detailed Ledger Statement Table */}
      <div className="bg-[#F9FBFA] border border-slate-100 rounded-2xl p-4 overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-semibold pb-2.5">
              <th className="pb-2.5 pr-2">رقم الحوالة / السند</th>
              <th className="pb-2.5">التاريخ</th>
              <th className="pb-2.5">نوع الحركة</th>
              <th className="pb-2.5">العميل / السيارة</th>
              <th className="pb-2.5">المبلغ الأصلي</th>
              <th className="pb-2.5">سعر الصرف</th>
              <th className="pb-2.5">المبلغ والعمولة ($)</th>
              <th className="pb-2.5">الغرض والبيان</th>
              <th className="pb-2.5">ملاحظات</th>
              <th className="pb-2.5 pl-2 text-left">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            {filteredTransfers.map((tr) => (
              <tr key={tr.id} className="hover:bg-white/80 transition-colors">
                <td className="py-3 pr-2 font-mono font-bold text-slate-800">
                  {tr.transferNumber}
                </td>
                <td className="py-3 text-slate-500">{formatDate(tr.receivedAt)}</td>
                <td className="py-3">
                  {tr.direction === 'inbound' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                      <span>إيداع / استلام</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                      <ArrowUpRight className="w-3 h-3 text-red-600" />
                      <span>سحب / صرف</span>
                    </span>
                  )}
                </td>
                <td className="py-3">
                  <div className="font-bold text-slate-800">{tr.customerName || 'عميل مسجل'}</div>
                  {tr.carLot && (
                    <div className="text-[10px] font-mono text-slate-400">Lot: {tr.carLot}</div>
                  )}
                </td>
                <td className="py-3 font-semibold text-slate-700">
                  {formatCurrency(tr.originalAmount, tr.currency)}
                </td>
                <td className="py-3 font-mono text-slate-500">
                  {tr.currency === 'USD' ? '-' : tr.exchangeRate}
                </td>
                <td className="py-3 font-black text-slate-800">
                  <div className={tr.direction === 'inbound' ? 'text-emerald-700' : 'text-red-600'}>
                    {tr.direction === 'inbound' ? '+' : '-'} {formatCurrency(tr.amountUsd)}
                  </div>
                  {tr.hasCommission && tr.commissionAmountUsd && tr.commissionAmountUsd > 0 && (
                    <div className="mt-1 flex flex-col gap-0.5">
                      <span
                        className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                          tr.commissionType === 'on_us'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        عمولة: {formatCurrency(tr.commissionAmountUsd)} ({tr.commissionType === 'on_us' ? 'علينا للصيرفة' : 'لنا لشركتنا'})
                      </span>
                      {tr.netOfficeAmountUsd !== undefined && (
                        <span className="text-[9px] text-slate-500 font-mono font-normal">
                          صافي القيد: {formatCurrency(tr.netOfficeAmountUsd)}
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="py-3">
                  <span className="text-[11px] text-slate-700 bg-white border border-slate-200/60 px-2 py-0.5 rounded-md">
                    {getPurposeText(tr)}
                  </span>
                </td>
                <td className="py-3 text-slate-400 text-[11px] max-w-xs truncate">
                  {tr.notes || '-'}
                </td>
                <td className="py-3 text-left pl-2">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setTransferToEdit(tr)}
                      className="p-1 hover:bg-emerald-50 text-emerald-700 hover:text-emerald-900 rounded-md transition-colors"
                      title="تعديل السند"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransferToDelete(tr)}
                      className="p-1 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-md transition-colors"
                      title="حذف السند"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredTransfers.length === 0 && (
          <div className="p-8 text-center text-slate-400 space-y-1">
            <p className="font-bold text-slate-600 text-xs">لا توجد حركات مطابقة لخيارات البحث</p>
            <p className="text-[11px]">يمكنك قيد حركة جديدة باستخدام أزرار الإيداع والسحب أعلاه</p>
          </div>
        )}
      </div>

      {/* Modal for Deposit / Inbound */}
      <NewTransferModal
        isOpen={isDepositOpen}
        offices={[office]}
        initialDirection="inbound"
        onClose={() => setIsDepositOpen(false)}
        onAddTransfer={(t) => handleAddTransfer({ ...t, direction: 'inbound' })}
      />

      {/* Modal for Withdraw / Outbound */}
      <NewTransferModal
        isOpen={isWithdrawOpen}
        offices={[office]}
        initialDirection="outbound"
        onClose={() => setIsWithdrawOpen(false)}
        onAddTransfer={(t) => handleAddTransfer({ ...t, direction: 'outbound' })}
      />

      {/* Modal for Commission Ledger & Analytics */}
      <CommissionAnalyticsModal
        isOpen={isCommissionModalOpen}
        onClose={() => setIsCommissionModalOpen(false)}
        office={office}
        transfers={transfers}
      />

      {/* Edit Office Modal */}
      {isEditOfficeOpen && (
        <EditExchangeOfficeModal
          office={office}
          isOpen={isEditOfficeOpen}
          onClose={() => setIsEditOfficeOpen(false)}
        />
      )}

      {/* Delete Office Modal */}
      {isDeleteOfficeOpen && (
        <ConfirmDeleteModal
          isOpen={isDeleteOfficeOpen}
          onClose={() => setIsDeleteOfficeOpen(false)}
          onConfirm={() => {
            deleteExchangeOffice(office.id);
            setIsDeleteOfficeOpen(false);
            navigate('/exchange');
          }}
          title="حذف مكتب الصرافة"
          message={`هل أنت متأكد من حذف مكتب الصرافة "${office.name}"؟`}
        />
      )}

      {/* Edit Transfer Modal */}
      {transferToEdit && (
        <EditTransferModal
          transfer={transferToEdit}
          isOpen={!!transferToEdit}
          onClose={() => setTransferToEdit(null)}
        />
      )}

      {/* Delete Transfer Modal */}
      {transferToDelete && (
        <ConfirmDeleteModal
          isOpen={!!transferToDelete}
          onClose={() => setTransferToDelete(null)}
          onConfirm={() => {
            deleteTransfer(transferToDelete.id);
            setTransferToDelete(null);
          }}
          title="حذف السند المالي"
          message={`هل أنت متأكد من حذف السند رقم ${transferToDelete.transferNumber} بمبلغ ${formatCurrency(transferToDelete.amountUsd)}؟`}
        />
      )}
    </div>
  );
};
