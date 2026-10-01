import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../shared/context/DataContext';
import { MoneyTransfer, ExchangeOffice } from '../../types';
import { formatCurrency } from '../../shared/lib/formatters';
import { NewTransferModal } from './NewTransferModal';
import { AddExchangeOfficeModal } from './AddExchangeOfficeModal';
import { EditExchangeOfficeModal } from './EditExchangeOfficeModal';
import { ConfirmDeleteModal } from '../../shared/components/ui/ConfirmDeleteModal';
import {
  Plus,
  Building2,
  Eye,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Scale,
  TrendingUp,
  Wallet,
  Coins,
  Percent,
  Edit3,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { CommissionAnalyticsModal } from './CommissionAnalyticsModal';

export const ExchangePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    exchangeOffices: offices,
    transfers,
    addTransfer,
    addExchangeOffice,
    deleteExchangeOffice,
    defaultCommissionRate,
    updateDefaultCommissionRate,
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'positive' | 'negative'>('all');

  const [isEditingRate, setIsEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState(String(defaultCommissionRate ?? 1.5));

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAddOfficeModalOpen, setIsAddOfficeModalOpen] = useState(false);
  const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);
  const [selectedOfficeForCommission, setSelectedOfficeForCommission] = useState<ExchangeOffice | undefined>(undefined);
  const [officeToEdit, setOfficeToEdit] = useState<ExchangeOffice | null>(null);
  const [officeToDelete, setOfficeToDelete] = useState<ExchangeOffice | null>(null);

  const handleSaveCommissionRate = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(rateInput);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      updateDefaultCommissionRate(parsed);
      setIsEditingRate(false);
    }
  };

  // احتساب التحليل المالي العام الشامل لكافة الصيرفات
  let totalReceivables = 0; // مبالغ لنا (بذمتهم)
  let totalPayables = 0;    // مبالغ علينا (مستحقة لهم)

  offices.forEach((office) => {
    const officeTrans = transfers.filter((t) => t.exchangeOfficeId === office.id);
    const inb = officeTrans
      .filter((t) => t.direction === 'inbound')
      .reduce((s, t) => s + Number(t.netOfficeAmountUsd ?? t.amountUsd ?? 0), 0);
    const outb = officeTrans
      .filter((t) => t.direction === 'outbound')
      .reduce((s, t) => s + Number(t.netOfficeAmountUsd ?? t.amountUsd ?? 0), 0);
    const liveBal = office.balanceUsd + inb - outb;

    if (liveBal >= 0) {
      totalReceivables += liveBal;
    } else {
      totalPayables += Math.abs(liveBal);
    }
  });

  const totalAllInbound = transfers
    .filter((t) => t.direction === 'inbound')
    .reduce((s, t) => s + Number(t.amountUsd || 0), 0);

  const totalAllOutbound = transfers
    .filter((t) => t.direction === 'outbound')
    .reduce((s, t) => s + Number(t.amountUsd || 0), 0);

  // احتساب إحصائيات العمولات العامة
  const totalCommissionTransfers = transfers.filter(
    (t) => t.hasCommission && Number(t.commissionAmountUsd || 0) > 0
  );
  const totalCommissionsVolume = totalCommissionTransfers.reduce(
    (sum, t) => sum + Number(t.commissionAmountUsd || 0),
    0
  );
  const totalCommissionsForUs = totalCommissionTransfers
    .filter((t) => t.commissionType === 'for_us')
    .reduce((sum, t) => sum + Number(t.commissionAmountUsd || 0), 0);
  const totalCommissionsOnUs = totalCommissionTransfers
    .filter((t) => t.commissionType === 'on_us')
    .reduce((sum, t) => sum + Number(t.commissionAmountUsd || 0), 0);

  const netOverallBalance = totalReceivables - totalPayables;

  const handleAddOffice = (newOffice: ExchangeOffice) => {
    addExchangeOffice(newOffice);
  };

  const handleAddTransfer = (newTransfer: Partial<MoneyTransfer>) => {
    addTransfer(newTransfer);
  };

  const filteredOffices = offices.filter((office) => {
    const matchesSearch =
      office.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      office.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      office.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      office.phone.includes(searchQuery);

    const officeTrans = transfers.filter((t) => t.exchangeOfficeId === office.id);
    const inb = officeTrans
      .filter((t) => t.direction === 'inbound')
      .reduce((s, t) => s + Number(t.netOfficeAmountUsd ?? t.amountUsd ?? 0), 0);
    const outb = officeTrans
      .filter((t) => t.direction === 'outbound')
      .reduce((s, t) => s + Number(t.netOfficeAmountUsd ?? t.amountUsd ?? 0), 0);
    const liveBal = office.balanceUsd + inb - outb;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'positive' && liveBal >= 0) ||
      (statusFilter === 'negative' && liveBal < 0);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5 dir-rtl text-right text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="font-bold text-slate-800 text-sm sm:text-base">
            حسابات ومكاتب الصرافة والتحويل المالي
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setSelectedOfficeForCommission(undefined);
              setIsCommissionModalOpen(true);
            }}
            className="bg-white hover:bg-emerald-50/60 border border-slate-200 text-slate-800 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all shadow-xs flex items-center gap-1.5"
            title="تحليل وسجل العمولات لكافة الصيرفات"
          >
            <Percent className="w-3.5 h-3.5 text-[#164E33]" />
            <span>سجل وتحليل العمولات</span>
            {totalCommissionTransfers.length > 0 && (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full mr-0.5">
                {totalCommissionTransfers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsAddOfficeModalOpen(true)}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ إضافة صيرفة جديدة</span>
          </button>

          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="bg-[#164E33] hover:bg-[#1B5E3F] text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-all shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ قيد حوالة / حركة مالية</span>
          </button>
        </div>
      </div>

      {/* 0. SECTION: بطاقة عمولة التحويل العامة المعتمدة */}
      <div className="bg-gradient-to-l from-emerald-900 to-[#164E33] text-white rounded-3xl p-4 sm:p-5 shadow-sm border border-emerald-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-800/80 border border-emerald-700/60 flex items-center justify-center text-emerald-300">
              <Percent className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold">نسبة عمولة التحويل العامة المعتمدة:</h3>
            <span className="bg-emerald-800/90 text-emerald-200 border border-emerald-600/50 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold">
              {defaultCommissionRate}%
            </span>
          </div>
          <p className="text-[11px] text-emerald-100/80 leading-relaxed pr-10">
            تُعتمد هذه النسبة تلقائياً كـ (عمولة تحويل) على سعر سيارة المزاد عندما يكون مصدر التحويل عن طريق شركتنا وصيرفاتنا. في حال كان السداد من مكتب خارجي تُحسب العمولة 0$ تلقائياً.
          </p>
        </div>

        <div className="shrink-0 w-full sm:w-auto">
          {isEditingRate ? (
            <form
              onSubmit={handleSaveCommissionRate}
              className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20"
            >
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  className="w-24 bg-white text-slate-900 font-bold text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-center"
                  autoFocus
                />
                <span className="absolute left-2.5 top-1.5 text-slate-500 font-bold text-xs pointer-events-none">
                  %
                </span>
              </div>
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-white p-1.5 rounded-xl transition-all shadow-xs"
                title="حفظ النسبة"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setRateInput(String(defaultCommissionRate));
                  setIsEditingRate(false);
                }}
                className="bg-white/20 hover:bg-white/30 text-white p-1.5 rounded-xl transition-all"
                title="إلغاء"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                setRateInput(String(defaultCommissionRate));
                setIsEditingRate(true);
              }}
              className="w-full sm:w-auto bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-300" />
              <span>تعديل عمولة التحويل</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. SECTION: التحليل المالي العام الشامل لكافة الصيرفات (General Analytics Overview) */}
      <div>
        <div className="flex justify-between items-center mb-2.5">
          <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-[#164E33]" />
            <span>التحليل المالي العام لجميع الصيرفات:</span>
          </span>
          <span className="text-[10px] text-slate-400">
            تحديث فوري بناءً على العمليات المسجلة
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Card 1: المبالغ لنا (بذمتهم) */}
          <div className="bg-[#F9FBFA] border border-emerald-100 rounded-2xl p-3.5 space-y-1 relative overflow-hidden">
            <div className="flex justify-between items-center text-slate-500 text-[11px]">
              <span className="font-bold text-emerald-800">المبالغ لنا (بذمتهم)</span>
              <div className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ArrowDownLeft className="w-3 h-3" />
              </div>
            </div>
            <div className="text-lg font-black text-emerald-700">
              {formatCurrency(totalReceivables)}
            </div>
            <span className="text-[10px] text-slate-400 block">
              أرصدة إيجابية لصالحنا
            </span>
          </div>

          {/* Card 2: المبالغ علينا (مستحقة لهم) */}
          <div className="bg-[#F9FBFA] border border-red-100 rounded-2xl p-3.5 space-y-1 relative overflow-hidden">
            <div className="flex justify-between items-center text-slate-500 text-[11px]">
              <span className="font-bold text-red-800">المبالغ علينا (مستحقة لهم)</span>
              <div className="w-5 h-5 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                <ArrowUpRight className="w-3 h-3" />
              </div>
            </div>
            <div className="text-lg font-black text-red-600">
              {formatCurrency(totalPayables)}
            </div>
            <span className="text-[10px] text-slate-400 block">
              مطالبات والتزامات واجبة السداد
            </span>
          </div>

          {/* Card 3: صافي الرصيد العام */}
          <div className="bg-[#F9FBFA] border border-slate-200/80 rounded-2xl p-3.5 space-y-1 relative overflow-hidden">
            <div className="flex justify-between items-center text-slate-500 text-[11px]">
              <span className="font-bold text-slate-700">الصافي المالي العام</span>
              <div className="w-5 h-5 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
                <Coins className="w-3 h-3" />
              </div>
            </div>
            <div
              className={`text-lg font-black ${
                netOverallBalance >= 0 ? 'text-[#164E33]' : 'text-red-600'
              }`}
            >
              {formatCurrency(Math.abs(netOverallBalance))}
            </div>
            <span className="text-[10px] text-slate-400 block">
              {netOverallBalance >= 0 ? 'صافي الموقف الإجمالي لصالحنا' : 'صافي الموقف بذمتنا للصيرفات'}
            </span>
          </div>

          {/* Card 4: الحوالات والمبالغ المستلمة */}
          <div className="bg-[#F9FBFA] border border-slate-100 rounded-2xl p-3.5 space-y-1">
            <div className="flex justify-between items-center text-slate-400 text-[11px]">
              <span>إجمالي المستلم / الإيداعات</span>
              <TrendingUp className="w-3 h-3 text-slate-400" />
            </div>
            <div className="text-lg font-bold text-slate-800">
              {formatCurrency(totalAllInbound)}
            </div>
            <span className="text-[10px] text-slate-400 block">
              مجموع المقبوضات
            </span>
          </div>

          {/* Card 5: الحوالات والمبالغ المسحوبة والمصروفة */}
          <div className="bg-[#F9FBFA] border border-slate-100 rounded-2xl p-3.5 space-y-1">
            <div className="flex justify-between items-center text-slate-400 text-[11px]">
              <span>إجمالي المسحوبات</span>
              <Wallet className="w-3 h-3 text-slate-400" />
            </div>
            <div className="text-lg font-bold text-slate-800">
              {formatCurrency(totalAllOutbound)}
            </div>
            <span className="text-[10px] text-slate-400 block">
              مجموع السحوبات الخارجية
            </span>
          </div>

          {/* Card 6: إجمالي العمولات وسجلها */}
          <div
            onClick={() => {
              setSelectedOfficeForCommission(undefined);
              setIsCommissionModalOpen(true);
            }}
            className="bg-[#F9FBFA] hover:bg-emerald-50/40 border border-slate-100 hover:border-emerald-200/80 rounded-2xl p-3.5 space-y-1 cursor-pointer transition-all group"
            title="انقر لفتح سجل وتحليل العمولات العام"
          >
            <div className="flex justify-between items-center text-slate-500 text-[11px]">
              <span className="font-bold text-slate-700 group-hover:text-emerald-900 transition-colors">إجمالي العمولات</span>
              <div className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Percent className="w-3 h-3" />
              </div>
            </div>
            <div className="text-lg font-black text-emerald-800">
              {formatCurrency(totalCommissionsVolume)}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>لنا: {formatCurrency(totalCommissionsForUs)}</span>
              <span>علينا: {formatCurrency(totalCommissionsOnUs)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SECTION: قائمة مكاتب الصرافة المعتمدة فقط */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-xs">مكاتب وشركات الصرافة المعتمدة:</span>
            <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredOffices.length} صيرفة
            </span>
          </div>

          {/* Filter & Search */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-56">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم الصيرفة، المدينة، الهاتف..."
                className="w-full bg-[#F7F9F8] border border-slate-200/80 rounded-full pr-8 pl-3 py-1 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2" />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-[#F7F9F8] border border-slate-200/80 text-[11px] text-slate-700 rounded-full px-3 py-1 outline-none"
            >
              <option value="all">كل الأرصدة</option>
              <option value="positive">بذمتهم لنا فقط</option>
              <option value="negative">مستحق لهم فقط</option>
            </select>
          </div>
        </div>

        {/* Offices Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOffices.map((office) => {
            const officeTrans = transfers.filter((t) => t.exchangeOfficeId === office.id);
            const inb = officeTrans
              .filter((t) => t.direction === 'inbound')
              .reduce((s, t) => s + Number(t.netOfficeAmountUsd ?? t.amountUsd ?? 0), 0);
            const outb = officeTrans
              .filter((t) => t.direction === 'outbound')
              .reduce((s, t) => s + Number(t.netOfficeAmountUsd ?? t.amountUsd ?? 0), 0);
            const liveBalance = office.balanceUsd + inb - outb;
            const isPositive = liveBalance >= 0;
            const officeCommissionsCount = officeTrans.filter(
              (t) => t.hasCommission && Number(t.commissionAmountUsd || 0) > 0
            ).length;

            return (
              <div
                key={office.id}
                onClick={() => navigate(`/exchange/${office.id}`)}
                className="bg-[#F9FBFA] hover:bg-white border border-slate-100 hover:border-slate-300/80 rounded-2xl p-4 space-y-3 cursor-pointer transition-all shadow-xs group"
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-white border border-slate-200/60 flex items-center justify-center text-slate-600 group-hover:text-[#164E33] group-hover:border-[#164E33]/30 transition-colors shadow-2xs">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-xs leading-tight group-hover:text-[#164E33] transition-colors">
                        {office.name}
                      </h3>
                      <span className="text-[10px] text-slate-400">{office.city}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isPositive
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {isPositive ? 'بذمتهم لنا' : 'مستحق لهم'}
                  </span>
                </div>

                {/* Contact info */}
                <div className="text-[10px] text-slate-600 bg-white/80 p-2.5 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="text-[9px] text-slate-400 block">المسؤول:</span>
                    <span className="font-semibold text-slate-800">{office.contactPerson}</span>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-[9px] text-slate-400 block">الهاتف:</span>
                    <span>{office.phone}</span>
                  </div>
                </div>

                {/* Quick Movement Metrics */}
                <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50/70 p-2 rounded-xl text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[9px]">المستلم:</span>
                    <span className="font-bold text-emerald-700">{formatCurrency(inb)}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-slate-400 block text-[9px]">المسحوب:</span>
                    <span className="font-bold text-red-600">{formatCurrency(outb)}</span>
                  </div>
                </div>

                {/* Balance display */}
                <div className="border-t border-slate-100/80 pt-2 flex justify-between items-baseline">
                  <span className="text-[10px] text-slate-400">الرصيد الجاري الصافي:</span>
                  <div
                    className={`text-base font-black ${
                      isPositive ? 'text-[#164E33]' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(Math.abs(liveBalance))}
                  </div>
                </div>

                {/* Actions: Commission Button, Edit, Delete & Statement */}
                <div className="pt-2 border-t border-slate-100/70 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOfficeForCommission(office);
                        setIsCommissionModalOpen(true);
                      }}
                      className="bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#164E33] border border-slate-200/80 hover:border-emerald-300 rounded-full px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
                      title="سجل وتحليل عمولات هذه الصيرفة"
                    >
                      <Percent className="w-3 h-3 text-[#164E33]" />
                      <span>العمولات</span>
                      {officeCommissionsCount > 0 && (
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1 rounded-full">
                          {officeCommissionsCount}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOfficeToEdit(office);
                      }}
                      className="p-1 hover:bg-emerald-50 text-emerald-700 hover:text-emerald-900 rounded-lg transition-colors"
                      title="تعديل بيانات الصيرفة"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOfficeToDelete(office);
                      }}
                      className="p-1 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition-colors"
                      title="حذف الصيرفة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="text-[11px] font-bold text-[#164E33] inline-flex items-center gap-1 group-hover:translate-x-[-3px] transition-transform"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>كشف الحساب ←</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredOffices.length === 0 && (
          <div className="bg-[#F9FBFA] border border-slate-100 rounded-2xl p-8 text-center text-slate-400 space-y-1">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-xs">لا توجد مكاتب صرافة مطابقة للبحث</h3>
            <p className="text-[11px]">يمكنك إضافة مكتب صرافة جديد من الزر في الأعلى</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddExchangeOfficeModal
        isOpen={isAddOfficeModalOpen}
        onClose={() => setIsAddOfficeModalOpen(false)}
        onAddOffice={handleAddOffice}
      />

      {officeToEdit && (
        <EditExchangeOfficeModal
          office={officeToEdit}
          isOpen={!!officeToEdit}
          onClose={() => setOfficeToEdit(null)}
        />
      )}

      {officeToDelete && (
        <ConfirmDeleteModal
          isOpen={!!officeToDelete}
          onClose={() => setOfficeToDelete(null)}
          onConfirm={() => {
            deleteExchangeOffice(officeToDelete.id);
            setOfficeToDelete(null);
          }}
          title="حذف مكتب الصرافة"
          message={`هل أنت متأكد من حذف مكتب الصرافة "${officeToDelete.name}"؟`}
        />
      )}

      <NewTransferModal
        isOpen={isTransferModalOpen}
        offices={offices}
        onClose={() => setIsTransferModalOpen(false)}
        onAddTransfer={handleAddTransfer}
      />

      {/* Modal for Commission Ledger & Analytics */}
      <CommissionAnalyticsModal
        isOpen={isCommissionModalOpen}
        onClose={() => setIsCommissionModalOpen(false)}
        office={selectedOfficeForCommission}
        transfers={transfers}
      />
    </div>
  );
};
