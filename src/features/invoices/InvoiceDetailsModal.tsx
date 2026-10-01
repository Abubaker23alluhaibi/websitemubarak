import React, { useState } from 'react';
import { Modal } from '../../shared/components/ui/Modal';
import { Button } from '../../shared/components/ui/Button';
import { Input } from '../../shared/components/ui/Input';
import {
  Lock,
  Unlock,
  Plus,
  Trash2,
  Printer,
  Calendar,
  MapPin,
  Anchor,
  Tag,
  Check,
} from 'lucide-react';
import { Invoice, InvoiceCustomField } from '../../types';
import { formatCurrency, formatDate } from '../../shared/lib/formatters';
import { useAuth } from '../../shared/context/AuthContext';
import { useData } from '../../shared/context/DataContext';
import { PrintableInvoice } from './PrintableInvoice';
import { ConfirmDeleteModal } from '../../shared/components/ui/ConfirmDeleteModal';

interface InvoiceDetailsModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onUpdateInvoice: (updated: Invoice) => void;
  onDeleteInvoice?: (id: string) => void;
}

export const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onUpdateInvoice,
  onDeleteInvoice,
}) => {
  const { user } = useAuth();
  const { cars, deleteInvoice, defaultCommissionRate } = useData();
  const isSuperAdmin = user?.role === 'super_admin';

  const [currentInvoice, setCurrentInvoice] = useState<Invoice>(invoice);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldAmount, setNewFieldAmount] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // حالة التحكم بالخصم التفاعلي
  const [isEditingDiscount, setIsEditingDiscount] = useState(false);
  const [discountAmountInput, setDiscountAmountInput] = useState<string>(
    currentInvoice.discount > 0 ? String(currentInvoice.discount) : ''
  );
  const [discountReasonInput, setDiscountReasonInput] = useState<string>(
    currentInvoice.discountReason || ''
  );

  // ربط بيانات السيارة ديناميكياً
  const car = currentInvoice.car || cars.find((c) => c.id === currentInvoice.carId);

  const carPurchasePrice = car?.purchasePrice
    ? Number(car.purchasePrice)
    : Math.max(0, Number(currentInvoice.subtotal) - Number(currentInvoice.shippingCost) - Number(currentInvoice.commissionAmount));

  const isExternal = (currentInvoice.auctionPaymentSource ?? car?.auctionPaymentSource) === 'external';
  const effectiveCarPriceInvoiced = isExternal ? 0 : carPurchasePrice;
  const effectiveCommissionAmount = isExternal ? 0 : Number(currentInvoice.commissionAmount || 0);

  // حساب المجموع الفرعي والصافي ديناميكياً
  const customTotal = currentInvoice.customFields.reduce((sum, f) => sum + Number(f.fieldAmount || 0), 0);
  const calculatedSubtotal = effectiveCarPriceInvoiced + Number(currentInvoice.shippingCost) + effectiveCommissionAmount + customTotal;
  const calculatedNet = Math.max(0, calculatedSubtotal - Number(currentInvoice.discount || 0));
  const remainingAmount = Math.max(0, calculatedNet - Number(currentInvoice.paidAmount || 0));

  const carLocationText = [car?.city, car?.usStateName].filter(Boolean).join(' - ') || 'الولايات المتحدة';

  const handleUpdatePaymentSource = (newSource: 'through_us' | 'external') => {
    if (currentInvoice.isLocked) return;
    const newIsExternal = newSource === 'external';
    const rate = currentInvoice.commissionPercent > 0 ? currentInvoice.commissionPercent : (defaultCommissionRate || 1.5);
    const newCommissionAmount = newIsExternal ? 0 : Math.round(carPurchasePrice * (rate / 100));
    const newCommissionPercent = newIsExternal ? 0 : rate;
    const newCarPriceInvoiced = newIsExternal ? 0 : carPurchasePrice;
    const newSubtotal = newCarPriceInvoiced + Number(currentInvoice.shippingCost) + newCommissionAmount + customTotal;
    const newNet = Math.max(0, newSubtotal - Number(currentInvoice.discount || 0));

    const updated: Invoice = {
      ...currentInvoice,
      auctionPaymentSource: newSource,
      commissionPercent: newCommissionPercent,
      commissionAmount: newCommissionAmount,
      subtotal: newSubtotal,
      netTotal: newNet,
      remainingAmount: Math.max(0, newNet - Number(currentInvoice.paidAmount || 0)),
    };
    setCurrentInvoice(updated);
    onUpdateInvoice(updated);
  };

  const handleAddCustomField = () => {
    if (!newFieldName.trim() || !newFieldAmount) return;
    const addedAmount = Number(newFieldAmount);
    const newField: InvoiceCustomField = {
      id: `field-${Date.now()}`,
      fieldName: newFieldName.trim(),
      fieldAmount: addedAmount,
    };
    const newSubtotal = calculatedSubtotal + addedAmount;
    const newNet = Math.max(0, newSubtotal - Number(currentInvoice.discount || 0));

    const updated: Invoice = {
      ...currentInvoice,
      customFields: [...currentInvoice.customFields, newField],
      subtotal: newSubtotal,
      netTotal: newNet,
      remainingAmount: Math.max(0, newNet - Number(currentInvoice.paidAmount || 0)),
    };
    setCurrentInvoice(updated);
    onUpdateInvoice(updated);
    setNewFieldName('');
    setNewFieldAmount('');
  };

  const handleRemoveField = (id: string) => {
    if (currentInvoice.isLocked) return;
    const filtered = currentInvoice.customFields.filter((f) => f.id !== id);
    const newCustomTotal = filtered.reduce((sum, f) => sum + Number(f.fieldAmount || 0), 0);
    const newSubtotal = effectiveCarPriceInvoiced + Number(currentInvoice.shippingCost) + effectiveCommissionAmount + newCustomTotal;
    const newNet = Math.max(0, newSubtotal - Number(currentInvoice.discount || 0));

    const updated: Invoice = {
      ...currentInvoice,
      customFields: filtered,
      subtotal: newSubtotal,
      netTotal: newNet,
      remainingAmount: Math.max(0, newNet - Number(currentInvoice.paidAmount || 0)),
    };
    setCurrentInvoice(updated);
    onUpdateInvoice(updated);
  };

  // تطبيق أو تحديث الخصم
  const handleSaveDiscount = () => {
    if (currentInvoice.isLocked) return;
    const disc = Math.max(0, Number(discountAmountInput) || 0);
    const reason = discountReasonInput.trim();
    const newNet = Math.max(0, calculatedSubtotal - disc);

    const updated: Invoice = {
      ...currentInvoice,
      discount: disc,
      discountReason: disc > 0 ? reason : undefined,
      netTotal: newNet,
      remainingAmount: Math.max(0, newNet - Number(currentInvoice.paidAmount || 0)),
    };

    setCurrentInvoice(updated);
    onUpdateInvoice(updated);
    setIsEditingDiscount(false);
  };

  // إلغاء الخصم بالكامل
  const handleRemoveDiscount = () => {
    if (currentInvoice.isLocked) return;
    const newNet = calculatedSubtotal;
    const updated: Invoice = {
      ...currentInvoice,
      discount: 0,
      discountReason: undefined,
      netTotal: newNet,
      remainingAmount: Math.max(0, newNet - Number(currentInvoice.paidAmount || 0)),
    };
    setCurrentInvoice(updated);
    onUpdateInvoice(updated);
    setDiscountAmountInput('');
    setDiscountReasonInput('');
    setIsEditingDiscount(false);
  };

  const handleToggleLock = () => {
    if (currentInvoice.isLocked && !isSuperAdmin) {
      alert('فقط السوبر أدمن (Super Admin) يمتلك صلاحية فتح قفل الفواتير المغلقة');
      return;
    }

    const updated: Invoice = {
      ...currentInvoice,
      isLocked: !currentInvoice.isLocked,
      lockedAt: !currentInvoice.isLocked ? new Date().toISOString() : undefined,
    };
    setCurrentInvoice(updated);
    onUpdateInvoice(updated);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`فاتورة: ${currentInvoice.invoiceNumber}`}
      maxWidth="3xl"
    >
      <div className="space-y-5 dir-rtl text-right">
        {/* Lock Status Banner */}
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between border ${
            currentInvoice.isLocked
              ? 'bg-amber-50/80 border-amber-300 text-amber-900'
              : 'bg-emerald-50/80 border-emerald-300 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {currentInvoice.isLocked ? (
              <Lock className="w-5 h-5 text-amber-600 shrink-0" />
            ) : (
              <Unlock className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <div>
              <h4 className="font-bold text-xs">
                {currentInvoice.isLocked ? 'الفاتورة مقفولة مالياً (is_locked = true)' : 'الفاتورة مفتوحة وقابلة للتعديل'}
              </h4>
              <p className="text-[11px] text-slate-500">
                {currentInvoice.isLocked
                  ? 'لا يمكن تعديل البنود أو الخصم إلا بصلاحية السوبر أدمن'
                  : 'يمكنك إدراج الخصم أو تعديل الحقول المخصصة وموجودات الفاتورة'}
              </p>
            </div>
          </div>

          {/* زر القفل / فك القفل */}
          <button
            onClick={handleToggleLock}
            className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 ${
              currentInvoice.isLocked
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-slate-800 hover:bg-slate-900 text-white'
            }`}
          >
            {currentInvoice.isLocked ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>فك القفل (Super Admin)</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>قفل الفاتورة نهائياً</span>
              </>
            )}
          </button>
        </div>

        {/* Vehicle & Logistics Detailed Card */}
        <div className="bg-[#F9FBFA] border border-slate-200/90 rounded-2xl p-4 space-y-3 text-xs">
          <div className="flex justify-between items-start border-b border-slate-200/70 pb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-sm">
                  {car ? `${car.year} ${car.make} ${car.model}` : 'بيانات المركبة'}
                </span>
                <span className="bg-white border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-600">
                  {car?.auctionName || 'Copart'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-500 mt-1 font-mono text-[11px]">
                <span>Lot: {car?.lotNumber || '-'}</span>
                <span>•</span>
                <span>VIN: {car?.vin || '-'}</span>
              </div>
            </div>

            <div className="text-left">
              <span className="text-[11px] text-slate-400 block">العميل المشتري:</span>
              <span className="font-bold text-slate-800 text-xs">{car?.customerName || 'عميل مسجل'}</span>
            </div>
          </div>

          {/* 3 Logistic Attributes requested */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* 1. تاريخ الشراء */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">تاريخ شراء السيارة:</span>
                <span className="font-bold text-slate-800 text-xs">
                  {car?.purchaseDate ? formatDate(car.purchaseDate) : formatDate(currentInvoice.createdAt)}
                </span>
              </div>
            </div>

            {/* 2. مدينة ومنطقة السيارة */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">مدينة ومنطقة السيارة:</span>
                <span className="font-bold text-slate-800 text-xs truncate max-w-[170px] block" title={carLocationText}>
                  {carLocationText}
                </span>
              </div>
            </div>

            {/* 3. ميناء الحمولة (الشحن بأمريكا) */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <Anchor className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">ميناء الحمولة (التحميل):</span>
                <span className="font-bold text-slate-800 text-xs truncate max-w-[170px] block" title={car?.loadingPortName || 'ميناء التحميل'}>
                  {car?.loadingPortName || 'Savannah Port (GA)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* بطاقة مصدر تحويل ثمن السيارة والعمولة */}
        <div
          className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isExternal
              ? 'bg-blue-50/70 border-blue-200 text-blue-950'
              : 'bg-slate-50 border-slate-200/80 text-slate-800'
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold">جهة تسديد ثمن المزاد:</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isExternal ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {isExternal ? 'مسدد من مكتب خارجي / ذاتي' : 'عن طريق شركتنا وصيرفاتنا'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {isExternal
                ? `تم تسديد ثمن السيارة خارجياً${
                    currentInvoice.externalPaymentDetails
                      ? ` (${currentInvoice.externalPaymentDetails})`
                      : ''
                  }، ولا يُطالب العميل بثمن المزاد وعمولة التحويل $0.`
                : `تم تحويل ثمن السيارة عن طريق شركتنا، وتُحتسب عمولة تحويل مالية بنسبة ${
                    currentInvoice.commissionPercent || 1.5
                  }%.`}
            </p>
          </div>

          {!currentInvoice.isLocked && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleUpdatePaymentSource('through_us')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  !isExternal
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                عن طريقنا
              </button>
              <button
                type="button"
                onClick={() => handleUpdatePaymentSource('external')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isExternal
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                مسدد خارجياً
              </button>
            </div>
          )}
        </div>

        {/* Invoice Summary Details & Breakdown */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-700">الموجودات والبنود والحسابات المالية</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-medium">
                  1. سعر شراء السيارة من المزاد ({car?.auctionName || 'Copart'}):
                </span>
                {isExternal && (
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    مسدد خارجياً (لا يُطالب به)
                  </span>
                )}
              </div>
              <div className="text-left">
                <span
                  className={`font-bold ${
                    isExternal ? 'text-slate-400 line-through text-[11px]' : 'text-slate-900'
                  }`}
                >
                  {formatCurrency(carPurchasePrice)}
                </span>
                {isExternal && (
                  <span className="text-blue-700 text-xs font-bold mr-2">($0.00 مطالبة)</span>
                )}
              </div>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-200/60">
              <span className="text-slate-600 font-medium">2. أجور الشحن الإجمالي (النقل الداخلي + الشحن البحري):</span>
              <span className="font-bold text-slate-900">{formatCurrency(currentInvoice.shippingCost)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-medium">
                  3. عمولة الحوالة المالية ({isExternal ? '0' : currentInvoice.commissionPercent}%):
                </span>
                {isExternal && (
                  <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                    معفى (دفع خارجي)
                  </span>
                )}
              </div>
              <span className="font-bold text-slate-900">{formatCurrency(effectiveCommissionAmount)}</span>
            </div>

            {/* Custom Dynamic Fields */}
            {currentInvoice.customFields.map((field, idx) => (
              <div key={field.id} className="flex justify-between items-center py-1.5 border-b border-slate-200/60 text-indigo-950 bg-indigo-50/50 px-2.5 rounded-lg">
                <span className="font-medium text-xs">{idx + 4}. {field.fieldName}:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{formatCurrency(field.fieldAmount)}</span>
                  {!currentInvoice.isLocked && (
                    <button
                      onClick={() => handleRemoveField(field.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="حذف البند"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Discount Display */}
            {currentInvoice.discount > 0 && (
              <div className="flex justify-between items-center py-2 text-emerald-800 font-bold border-b border-slate-200/60 bg-emerald-50/60 px-2.5 rounded-lg">
                <div>
                  <span>الخصم الممنوح:</span>
                  {currentInvoice.discountReason && (
                    <span className="text-[11px] font-normal text-emerald-700 mr-2">
                      ({currentInvoice.discountReason})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">-{formatCurrency(currentInvoice.discount)}</span>
                  {!currentInvoice.isLocked && (
                    <button
                      type="button"
                      onClick={handleRemoveDiscount}
                      className="text-red-500 hover:text-red-700 p-0.5"
                      title="إلغاء الخصم"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Totals Calculation */}
            <div className="flex justify-between py-1 text-slate-500 pt-1">
              <span>المجموع الفرعي (Subtotal):</span>
              <span className="font-bold text-slate-800">{formatCurrency(calculatedSubtotal)}</span>
            </div>
            <div className="flex justify-between py-2 text-sm font-black text-slate-900 border-t-2 border-slate-300">
              <span>المجموع النهائي الصافي (Net Total):</span>
              <span className="text-emerald-700 text-base">{formatCurrency(calculatedNet)}</span>
            </div>
            <div className="flex justify-between py-1 text-xs text-slate-500">
              <span>المبلغ المسدد (Paid):</span>
              <span className="font-bold text-slate-800">{formatCurrency(currentInvoice.paidAmount)}</span>
            </div>
            <div className="flex justify-between py-1.5 text-xs text-amber-800 font-bold bg-amber-50/70 p-2 rounded-xl border border-amber-200/60">
              <span>المتبقي بذمة العميل:</span>
              <span className="text-sm">{formatCurrency(remainingAmount)}</span>
            </div>
          </div>
        </div>

        {/* Interactive Discount Section (إدارة واختيار الخصم مع الموجودات) */}
        {!currentInvoice.isLocked && (
          <div className="bg-[#F9FBFA] border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-emerald-700" />
                <span>إدارة واختيار الخصم (Discount Controller)</span>
              </h4>
              {!isEditingDiscount && (
                <button
                  type="button"
                  onClick={() => {
                    setDiscountAmountInput(currentInvoice.discount > 0 ? String(currentInvoice.discount) : '');
                    setDiscountReasonInput(currentInvoice.discountReason || '');
                    setIsEditingDiscount(true);
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  {currentInvoice.discount > 0 ? 'تعديل قيمة الخصم' : '+ إضافة خصم على الفاتورة'}
                </button>
              )}
            </div>

            {isEditingDiscount && (
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="قيمة الخصم المالي الممنوح ($)"
                    type="number"
                    value={discountAmountInput}
                    onChange={(e) => setDiscountAmountInput(e.target.value)}
                  />
                  <Input
                    label="سبب أو بيان الخصم (اختياري)"
                    value={discountReasonInput}
                    onChange={(e) => setDiscountReasonInput(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsEditingDiscount(false)}
                    className="text-xs font-bold"
                  >
                    إلغاء
                  </Button>
                  {currentInvoice.discount > 0 && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={handleRemoveDiscount}
                      className="text-xs font-bold"
                    >
                      تصفير الخصم
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="emerald"
                    size="sm"
                    onClick={handleSaveDiscount}
                    className="text-xs font-bold gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>حفظ وتطبيق الخصم</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Field Adder */}
        {!currentInvoice.isLocked && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-brand-dark" />
              <span>إدراج حقل / مصروف مخصص إضافي (Dynamic Expense)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Input
                  label="اسم البيان"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                />
              </div>
              <div>
                <Input
                  label="المبلغ ($)"
                  type="number"
                  value={newFieldAmount}
                  onChange={(e) => setNewFieldAmount(e.target.value)}
                />
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddCustomField}
              disabled={!newFieldName.trim() || !newFieldAmount}
              className="text-xs font-bold"
            >
              + إضافة البند للفاتورة
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPrinting(true)}
              className="gap-2 text-xs font-bold"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>معاينة وطباعة الفاتورة (PDF)</span>
            </Button>

            {(!currentInvoice.isLocked || isSuperAdmin) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteOpen(true)}
                className="gap-1 text-xs font-bold text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                title="حذف الفاتورة"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span>حذف الفاتورة</span>
              </Button>
            )}
          </div>

          <Button type="button" variant="primary" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </div>

      {/* Print View Modal */}
      {isPrinting && (
        <Modal
          isOpen={isPrinting}
          onClose={() => setIsPrinting(false)}
          title="معاينة الفاتورة قبل الطباعة"
          maxWidth="3xl"
        >
          <PrintableInvoice invoice={currentInvoice} />
        </Modal>
      )}

      {/* Confirm Delete Invoice Modal */}
      {isDeleteOpen && (
        <ConfirmDeleteModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={() => {
            deleteInvoice(currentInvoice.id);
            if (onDeleteInvoice) onDeleteInvoice(currentInvoice.id);
            setIsDeleteOpen(false);
            onClose();
          }}
          title="تأكيد حذف الفاتورة"
          message={`هل أنت متأكد من حذف الفاتورة رقم ${currentInvoice.invoiceNumber}؟`}
        />
      )}
    </Modal>
  );
};
