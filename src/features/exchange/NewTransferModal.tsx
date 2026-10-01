import React, { useState, useEffect } from 'react';
import { Modal } from '../../shared/components/ui/Modal';
import { Input } from '../../shared/components/ui/Input';
import { Button } from '../../shared/components/ui/Button';
import { useData } from '../../shared/context/DataContext';
import { MoneyTransfer, TransferDirection, TransferPurpose, ExchangeOffice, CommissionType } from '../../types';
import { UserCheck, Edit3, ArrowDownLeft, ArrowUpRight, User as UserIcon, Percent } from 'lucide-react';

interface NewTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  offices?: ExchangeOffice[];
  initialDirection?: TransferDirection;
  initialCustomerId?: string;
  initialCarLot?: string;
  lockCustomer?: boolean;
  onAddTransfer?: (transfer: Partial<MoneyTransfer>) => void;
}

export const NewTransferModal: React.FC<NewTransferModalProps> = ({
  isOpen,
  onClose,
  offices: propOffices,
  initialDirection = 'inbound',
  initialCustomerId,
  initialCarLot,
  lockCustomer = false,
  onAddTransfer,
}) => {
  const { users, cars, exchangeOffices } = useData();
  const offices = propOffices && propOffices.length > 0 ? propOffices : exchangeOffices;
  const registeredCustomers = users.filter((u) => u.role === 'customer');

  // اتجاه الحركة: وارد (قبض من عميل) أو صادر (سحب أموال من الصرافة)
  const [direction, setDirection] = useState<TransferDirection>(initialDirection);

  // تحديث الاتجاه والعميل عند فتح النافذة
  useEffect(() => {
    if (isOpen) {
      setDirection(initialDirection);
      if (initialCustomerId) {
        setCustomerId(initialCustomerId);
        setCustomerMode('existing');
      }
      if (initialCarLot !== undefined) {
        setCarLot(initialCarLot);
      }
    }
  }, [isOpen, initialDirection, initialCustomerId, initialCarLot]);

  // وضع اختيار العميل في حالة الإيداع: مسجل مسبقاً أو كتابة يدوية
  const [customerMode, setCustomerMode] = useState<'existing' | 'manual'>('existing');

  // بيانات العميل المسجل (للإيداع فقط)
  const [customerId, setCustomerId] = useState(
    initialCustomerId || registeredCustomers[0]?.id || 'user-5'
  );

  // بيانات العميل اليدوي (للإيداع فقط)
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [manualCustomerPhone, setManualCustomerPhone] = useState('');
  const [carLot, setCarLot] = useState(initialCarLot || '');

  // بيانات سحب الأموال (خاص بالسحب فقط ماله علاقة بالعميل)
  const [receiverName, setReceiverName] = useState('');

  // تفاصيل الحوالة المشتركة
  const [exchangeOfficeId, setExchangeOfficeId] = useState(offices[0]?.id || 'direct_cash');
  const [purpose, setPurpose] = useState<TransferPurpose>('car_purchase');
  const [customPurposeText, setCustomPurposeText] = useState('');
  const [originalAmount, setOriginalAmount] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'IQD' | 'EUR'>('USD');
  const [exchangeRate, setExchangeRate] = useState('1530');
  const [location, setLocation] = useState('بغداد');
  const [notes, setNotes] = useState('');

  // عمولة اختيارية (لنا أو علينا للصيرفة)
  const [hasCommission, setHasCommission] = useState(false);
  const [commissionType, setCommissionType] = useState<CommissionType>('on_us');
  const [commissionAmount, setCommissionAmount] = useState('');
  const [commissionCurrency, setCommissionCurrency] = useState<'USD' | 'IQD'>('USD');
  const [commissionRate, setCommissionRate] = useState('1530');

  const [isLoading, setIsLoading] = useState(false);

  // كائن العميل المختار
  const selectedCustomerObj = registeredCustomers.find((c) => c.id === customerId);

  // تصفية سيارات العميل المحدد في حال كان مسجلاً (للإيداع)
  const customerCars = cars.filter(
    (c) =>
      c.customerId === customerId ||
      (selectedCustomerObj &&
        c.customerName?.trim().toLowerCase() === selectedCustomerObj.fullName?.trim().toLowerCase()) ||
      (selectedCustomerObj?.username === 'omar.customer' &&
        (c.customerId === 'user-5' || c.customerName?.includes('عمر')))
  );

  useEffect(() => {
    if (
      !initialCustomerId &&
      registeredCustomers.length > 0 &&
      (!customerId ||
        customerId === 'user-5' ||
        !registeredCustomers.some((c) => c.id === customerId))
    ) {
      setCustomerId(registeredCustomers[0].id);
    }
  }, [registeredCustomers, customerId, initialCustomerId]);

  useEffect(() => {
    if (initialCarLot) {
      setCarLot(initialCarLot);
    } else if (direction === 'inbound' && customerCars.length > 0 && !carLot && !lockCustomer) {
      setCarLot(customerCars[0].lotNumber);
    }
  }, [customerId, direction, customerCars, carLot, initialCarLot, lockCustomer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      const origAmount = Number(originalAmount) || 0;
      let calculatedUsd = origAmount;

      if (currency === 'IQD') {
        const rate = Number(exchangeRate) || 1530;
        calculatedUsd = Math.round(origAmount / rate);
      } else if (currency === 'EUR') {
        calculatedUsd = Math.round(origAmount * 1.08);
      }

      // حسابات العمولة الاختيارية
      const rawComm = Number(commissionAmount) || 0;
      let calculatedCommissionUsd = rawComm;
      if (commissionCurrency === 'IQD') {
        const commRate = Number(commissionRate) || 1530;
        calculatedCommissionUsd = Math.round(rawComm / commRate);
      }

      let netOfficeAmount = calculatedUsd;
      if (hasCommission && rawComm > 0) {
        if (direction === 'inbound') {
          netOfficeAmount =
            commissionType === 'on_us'
              ? Math.max(0, calculatedUsd - calculatedCommissionUsd)
              : calculatedUsd;
        } else {
          netOfficeAmount =
            commissionType === 'on_us'
              ? calculatedUsd + calculatedCommissionUsd
              : Math.max(0, calculatedUsd - calculatedCommissionUsd);
        }
      }

      const isDirectCash = exchangeOfficeId === 'direct_cash';
      const office = !isDirectCash ? offices.find((o) => o.id === exchangeOfficeId) : null;
      const finalOfficeId = isDirectCash ? undefined : exchangeOfficeId;
      const finalOfficeName = isDirectCash
        ? 'صندوق الشركة الرئيسي (نقدي مباشر)'
        : office?.name || 'مكتب صرافة';

      const finalPurpose =
        purpose === 'other' ? customPurposeText.trim() || 'غرض مخصص' : purpose;

      const commissionPayload =
        !isDirectCash && hasCommission && rawComm > 0
          ? {
              hasCommission: true,
              commissionType,
              commissionAmount: rawComm,
              commissionCurrency,
              commissionRate: commissionCurrency === 'IQD' ? Number(commissionRate) || 1530 : undefined,
              commissionAmountUsd: calculatedCommissionUsd,
              netOfficeAmountUsd: netOfficeAmount,
            }
          : {
              hasCommission: false,
              netOfficeAmountUsd: calculatedUsd,
            };

      if (onAddTransfer) {
        if (direction === 'outbound') {
          // سحب أموال من المصرف / الصرافة أو رد مالي للعميل
          onAddTransfer({
            transferNumber: `WD-${Math.floor(1000 + Math.random() * 9000)}`,
            customerId: lockCustomer ? customerId : undefined,
            customerName: lockCustomer ? (selectedCustomerObj?.fullName || 'عميل مسجل') : (receiverName.trim() || 'مستلم نقدي'),
            exchangeOfficeId: finalOfficeId,
            exchangeOfficeName: finalOfficeName,
            carLot: undefined,
            purpose: finalPurpose,
            customPurpose: purpose === 'other' ? customPurposeText.trim() : undefined,
            direction: 'outbound',
            originalAmount: origAmount,
            currency,
            exchangeRate: Number(exchangeRate) || 1,
            amountUsd: calculatedUsd,
            location,
            receivedAt: new Date().toISOString().split('T')[0],
            notes: notes.trim()
              ? `المستلم: ${lockCustomer ? selectedCustomerObj?.fullName : receiverName.trim()} | ${notes.trim()}`
              : `المستلم: ${lockCustomer ? selectedCustomerObj?.fullName : receiverName.trim()}`,
            isAiAction: false,
            ...commissionPayload,
          });
        } else {
          // قبض / إيداع من العميل
          let finalCustomerId = 'cust-manual';
          let finalCustomerName = manualCustomerName.trim() || 'عميل نقدي مباشر';

          if (lockCustomer) {
            finalCustomerId = customerId;
            finalCustomerName = selectedCustomerObj?.fullName || 'عميل مسجل';
          } else if (customerMode === 'existing') {
            finalCustomerId = customerId;
            finalCustomerName = selectedCustomerObj?.fullName || 'عميل مسجل';
          }

          onAddTransfer({
            transferNumber: `TRF-${Math.floor(1000 + Math.random() * 9000)}`,
            customerId: finalCustomerId,
            customerName: finalCustomerName,
            exchangeOfficeId: finalOfficeId,
            exchangeOfficeName: finalOfficeName,
            carLot: carLot.trim(),
            purpose: finalPurpose,
            customPurpose: purpose === 'other' ? customPurposeText.trim() : undefined,
            direction: 'inbound',
            originalAmount: origAmount,
            currency,
            exchangeRate: Number(exchangeRate) || 1,
            amountUsd: calculatedUsd,
            location,
            receivedAt: new Date().toISOString().split('T')[0],
            notes: manualCustomerPhone
              ? `${notes} (هاتف العميل: ${manualCustomerPhone})`
              : notes,
            isAiAction: false,
            ...commissionPayload,
          });
        }
      }
      setIsLoading(false);
      onClose();
    }, 400);
  };

  const isWithdrawal = direction === 'outbound';

  // Live calculation for preview
  const currentOrigAmount = Number(originalAmount) || 0;
  let liveCalculatedUsd = currentOrigAmount;
  if (currency === 'IQD') {
    const rate = Number(exchangeRate) || 1530;
    liveCalculatedUsd = Math.round(currentOrigAmount / rate);
  } else if (currency === 'EUR') {
    liveCalculatedUsd = Math.round(currentOrigAmount * 1.08);
  }

  const currentCommAmount = Number(commissionAmount) || 0;
  let liveCommissionUsd = currentCommAmount;
  if (commissionCurrency === 'IQD') {
    const commRate = Number(commissionRate) || 1530;
    liveCommissionUsd = Math.round(currentCommAmount / commRate);
  }

  let liveNetOfficeAmount = liveCalculatedUsd;
  if (hasCommission && currentCommAmount > 0) {
    if (direction === 'inbound') {
      liveNetOfficeAmount =
        commissionType === 'on_us'
          ? Math.max(0, liveCalculatedUsd - liveCommissionUsd)
          : liveCalculatedUsd;
    } else {
      liveNetOfficeAmount =
        commissionType === 'on_us'
          ? liveCalculatedUsd + liveCommissionUsd
          : Math.max(0, liveCalculatedUsd - liveCommissionUsd);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        lockCustomer
          ? isWithdrawal
            ? `سند صرف / رد مالي للعميل: ${selectedCustomerObj?.fullName || ''}`
            : `قيد سند قبض مالي للعميل: ${selectedCustomerObj?.fullName || ''}`
          : isWithdrawal
          ? 'سحب أموال من مكتب الصرافة / المصرف'
          : 'قيد سند قبض مالي (إيداع عميل)'
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 dir-rtl text-right text-xs">
        {/* Toggle Direction: إيداع / سحب */}
        <div className="flex bg-[#F0F4F2] p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setDirection('inbound')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              !isWithdrawal
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-700" />
            <span>قبض وإيداع من عميل (وارد)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDirection('outbound');
              setPurpose('other');
              setCustomPurposeText(lockCustomer ? 'رد مالي / تسوية رصيد للعميل' : 'سحب نقدي من الصيرفة');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              isWithdrawal
                ? 'bg-[#164E33] text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-300" />
            <span>{lockCustomer ? 'سند صرف / رد مالي للعميل (صادر)' : 'سحب أموال من الصيرفة (صادر)'}</span>
          </button>
        </div>

        {/* 1. حالة السحب (في حال عدم وجود عميل محدد) */}
        {isWithdrawal && !lockCustomer ? (
          <div className="bg-amber-50/50 border border-amber-200/80 p-4 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs pb-1 border-b border-amber-200/60">
              <UserIcon className="w-4 h-4 text-amber-700" />
              <span>بيانات مستلم الأموال المسحوبة:</span>
            </div>

            <Input
              label="اسم المستلم (الموظف / السائق / الشخص المستلم)"
              required
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
            />
          </div>
        ) : lockCustomer ? (
          /* حالة العميل المقفل (مفتوح مباشرة من ملف العميل) */
          <div className="bg-[#F0F5F2] p-3.5 rounded-2xl border border-[#CBE2D6] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#164E33] text-[#84C0A2] font-black text-sm flex items-center justify-center shadow-xs">
                  {selectedCustomerObj?.fullName?.slice(0, 2) || 'ع'}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    {selectedCustomerObj?.fullName || 'عميل مسجل'}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[#164E33] font-bold">
                      @{selectedCustomerObj?.username}
                    </span>
                    {selectedCustomerObj?.phone && <span>• {selectedCustomerObj.phone}</span>}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-white border border-emerald-300 px-3 py-1 rounded-full shadow-2xs">
                حساب العميل المالي
              </span>
            </div>

            {/* السيارة المخصصة للدفعة في ملف العميل */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                السيارة / اللوت المخصص للدفعة (اختياري)
              </label>
              <select
                value={carLot}
                onChange={(e) => setCarLot(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
              >
                <option value="">بدون تخصيص لوت (رصيد عام بحساب العميل)</option>
                {customerCars.map((c) => (
                  <option key={c.id} value={c.lotNumber}>
                    Lot: {c.lotNumber} - {c.year} {c.make} {c.model}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {carLot
                  ? 'سيتم قيد الدفعة مباشرة لصالح فاتورة هذه السيارة وتقليل المبلغ المتبقي عليها.'
                  : 'سيتم قيد الدفعة كرصيد عام مسدد بحساب العميل وكشف حسابه الإجمالي.'}
              </span>
            </div>
          </div>
        ) : (
          /* 2. حالة الإيداع العادية من صفحة الصيرافات */
          <div className="bg-[#F9FBFA] p-3.5 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <span className="font-bold text-slate-800 text-xs">بيانات العميل المودع:</span>
              <div className="flex gap-1.5 bg-white p-0.5 rounded-full border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setCustomerMode('existing')}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1 ${
                    customerMode === 'existing'
                      ? 'bg-[#164E33] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserCheck className="w-3 h-3" />
                  <span>اختيار عميل مسجل</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCustomerMode('manual')}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1 ${
                    customerMode === 'manual'
                      ? 'bg-[#164E33] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>كتابة الاسم يدوياً</span>
                </button>
              </div>
            </div>

            {/* الحقول بناءً على الوضع المختار */}
            {customerMode === 'existing' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    اختر العميل من المسجلين
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => {
                      setCustomerId(e.target.value);
                      const firstCar = cars.find((c) => c.customerId === e.target.value);
                      if (firstCar) setCarLot(firstCar.lotNumber);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
                  >
                    {registeredCustomers.map((cust) => (
                      <option key={cust.id} value={cust.id}>
                        {cust.fullName} ({cust.username})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    السيارة / اللوت المخصص
                  </label>
                  <select
                    value={carLot}
                    onChange={(e) => setCarLot(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
                  >
                    <option value="">بدون تخصيص لوت (رصيد عام بحساب العميل)</option>
                    {customerCars.map((c) => (
                      <option key={c.id} value={c.lotNumber}>
                        Lot: {c.lotNumber} - {c.make} {c.model}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="اسم العميل (كتابة يدوية)"
                    required
                    value={manualCustomerName}
                    onChange={(e) => setManualCustomerName(e.target.value)}
                  />

                  <Input
                    label="رقم هاتف العميل (اختياري)"
                    value={manualCustomerPhone}
                    onChange={(e) => setManualCustomerPhone(e.target.value)}
                  />
                </div>

                <Input
                  label="رقم اللوت أو بيان السيارة المخصصة (اختياري)"
                  value={carLot}
                  onChange={(e) => setCarLot(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        {/* مكتب الصرافة أو صندوق الشركة والغرض */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              طريقة القبض / مكتب الصرافة
            </label>
            <select
              value={exchangeOfficeId}
              onChange={(e) => setExchangeOfficeId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
            >
              <option value="direct_cash">صندوق الشركة الرئيسي (قبض نقدي مباشر)</option>
              {offices.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  مكتب صرافة: {ex.name} ({ex.city})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">غرض الحركة</label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as any)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
            >
              {isWithdrawal ? (
                <>
                  <option value="other">سحب نقدي / مصاريف تشغيل</option>
                  <option value="shipping_cost">تسديد أجور شحن لملاحة</option>
                  <option value="customs_clearance">أجور تخليص وجمارك</option>
                  <option value="car_purchase">تحويل لمزاد خارجي</option>
                </>
              ) : (
                <>
                  <option value="car_purchase">ثمن شراء سيارة</option>
                  <option value="shipping_cost">أجور شحن</option>
                  <option value="combined">شراء + شحن</option>
                  <option value="customs_clearance">تخليص جمركي</option>
                  <option value="other">أخرى (تحديد وكتابة يدوية)</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* حقل الغرض المخصص في حال اختيار "أخرى" */}
        {purpose === 'other' && (
          <div className="bg-amber-50/70 border border-amber-200/80 p-3 rounded-xl">
            <Input
              label="تفاصيل غرض الحركة المخصصة:"
              required
              value={customPurposeText}
              onChange={(e) => setCustomPurposeText(e.target.value)}
            />
          </div>
        )}

        {/* المبالغ والعملة */}
        <div className="bg-[#F9FBFA] p-3 rounded-2xl border border-slate-100 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                label={isWithdrawal ? "المبلغ المسحوب" : "المبلغ المقبوض"}
                type="number"
                required
                value={originalAmount}
                onChange={(e) => setOriginalAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">العملة</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-1 focus:ring-[#164E33]"
              >
                <option value="USD">دولار (USD)</option>
                <option value="IQD">دينار (IQD)</option>
                <option value="EUR">يورو (EUR)</option>
              </select>
            </div>
          </div>

          {currency === 'IQD' && (
            <Input
              label="سعر الصرف (100$ = دينار)"
              type="number"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
            />
          )}
        </div>

        {/* قسم العمولة الاختيارية (لنا أو علينا للصيرفة) */}
        <div className="bg-[#F9FBFA] p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasCommission}
                onChange={(e) => setHasCommission(e.target.checked)}
                className="w-4 h-4 rounded text-[#164E33] focus:ring-[#164E33] cursor-pointer"
              />
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-[#164E33]" />
                <span>تسجيل عمولة على العملية (اختياري)</span>
              </span>
            </label>
            <span className="text-[10px] text-slate-400">
              تحديد استحقاق العمولة (لنا أو علينا للصيرفة)
            </span>
          </div>

          {hasCommission && (
            <div className="space-y-3 pt-2 border-t border-slate-200/70">
              {/* جهة استحقاق العمولة: علينا (للصيرفة) أو لنا (لشركتنا) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  جهة استحقاق العمولة:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCommissionType('on_us')}
                    className={`p-2.5 rounded-xl border text-right transition-all ${
                      commissionType === 'on_us'
                        ? 'bg-[#164E33] text-white border-[#164E33] shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-xs">علينا (تأخذها الصيرفة)</div>
                    <div className={`text-[10px] mt-0.5 ${commissionType === 'on_us' ? 'text-white/80' : 'text-slate-400'}`}>
                      تقتطعها شركة الصيرفة كأجور خدمة أو سحب
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCommissionType('for_us')}
                    className={`p-2.5 rounded-xl border text-right transition-all ${
                      commissionType === 'for_us'
                        ? 'bg-[#164E33] text-white border-[#164E33] shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-xs">لنا (لحساب شركتنا)</div>
                    <div className={`text-[10px] mt-0.5 ${commissionType === 'for_us' ? 'text-white/80' : 'text-slate-400'}`}>
                      عمولة ربح أو أجور وساطة لصالح شركتنا
                    </div>
                  </button>
                </div>
              </div>

              {/* مبالغ العمولة والعملة */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <Input
                    label="مبلغ العمولة"
                    type="number"
                    required={hasCommission}
                    value={commissionAmount}
                    onChange={(e) => setCommissionAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">عملة العمولة</label>
                  <select
                    value={commissionCurrency}
                    onChange={(e) => setCommissionCurrency(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-1 focus:ring-[#164E33]"
                  >
                    <option value="USD">دولار (USD)</option>
                    <option value="IQD">دينار (IQD)</option>
                  </select>
                </div>
              </div>

              {commissionCurrency === 'IQD' && (
                <Input
                  label="سعر صرف عمولة الدينار (100$ = دينار)"
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                />
              )}

              {/* معاينة التأثير المالي للعمولة (Live Financial Preview) */}
              <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-500">
                  <span>المبلغ الأصلي بالدولار:</span>
                  <span className="font-bold text-slate-800">${liveCalculatedUsd.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>مبلغ العمولة:</span>
                  <span className="font-bold text-slate-800">
                    ${liveCommissionUsd.toLocaleString()} ({commissionType === 'on_us' ? 'علينا لشركة الصيرفة' : 'لنا لحساب شركتنا'})
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100 font-bold">
                  <span className="text-slate-700">الصافي المؤثر في رصيد الصيرفة:</span>
                  <span className="text-[#164E33] font-black">${liveNetOfficeAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="موقع التنفيذ"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <Input
            label="الملاحظات والتفاصيل"
            required={isWithdrawal}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            {isWithdrawal ? 'تأكيد وقيد سحب الأموال' : 'قيد وتوثيق سند القبض'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
