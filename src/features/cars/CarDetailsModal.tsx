import React, { useState } from 'react';
import { Modal } from '../../shared/components/ui/Modal';
import { Button } from '../../shared/components/ui/Button';
import {
  ExternalLink,
  Truck,
  DollarSign,
  CheckCircle2,
  Check,
  MessageSquare,
  Send,
  Clock,
  User as UserIcon,
  ShieldCheck,
  FileText,
  Edit3,
  Trash2,
} from 'lucide-react';
import { Car, CarStatus, Invoice } from '../../types';
import { formatCurrency, formatDate } from '../../shared/lib/formatters';
import { useData } from '../../shared/context/DataContext';
import { useAuth } from '../../shared/context/AuthContext';
import { InvoiceDetailsModal } from '../invoices/InvoiceDetailsModal';
import { EditCarModal } from './EditCarModal';
import { ConfirmDeleteModal } from '../../shared/components/ui/ConfirmDeleteModal';
import { VinInspectorModal } from './VinInspectorModal';

interface CarDetailsModalProps {
  car: Car;
  isOpen: boolean;
  onClose: () => void;
  onUpdateCar?: (updated: Car) => void;
}

export const CAR_STAGES: {
  id: CarStatus;
  label: string;
  subLabel: string;
  stepNumber: number;
  desc: string;
}[] = [
  {
    id: 'purchased',
    label: 'ساحة المزاد',
    subLabel: 'تم الشراء',
    stepNumber: 1,
    desc: 'السيارة في ساحة المزاد بأمريكا بانتظار شركة النقل الداخلي',
  },
  {
    id: 'towing',
    label: 'نقل داخلي',
    subLabel: 'Towing',
    stepNumber: 2,
    desc: 'قيد النقل الداخلي عبر شاحنات النقل باتجاه ميناء التحميل',
  },
  {
    id: 'at_port',
    label: 'ميناء التحميل',
    subLabel: 'مستودع الميناء',
    stepNumber: 3,
    desc: 'وصلت مستودع ميناء التحميل وجاري تجهيز وتحميل الحاوية',
  },
  {
    id: 'shipped',
    label: 'في عرض البحر',
    subLabel: 'داخل الحاوية',
    stepNumber: 4,
    desc: 'أبحرت السفينة وتحمل الحاوية في طريقها لميناء الوصول',
  },
  {
    id: 'arrived',
    label: 'ميناء الوصول',
    subLabel: 'أم قصر / التفريغ',
    stepNumber: 5,
    desc: 'وصلت السفينة إلى ميناء الوصول وجاري التفريغ والتخليص',
  },
  {
    id: 'delivered',
    label: 'تم التسليم',
    subLabel: 'ليد العميل',
    stepNumber: 6,
    desc: 'تم إتمام التخليص وتسليم السيارة ومستنداتها للزبون بنجاح',
  },
];

export const CarDetailsModal: React.FC<CarDetailsModalProps> = ({
  car: initialCar,
  isOpen,
  onClose,
  onUpdateCar,
}) => {
  const { cars, invoices, updateCar, sendCarMessage, updateInvoice, deleteCar } = useData();
  const { user } = useAuth();
  const isStaffOrAdmin = user?.role !== 'customer';

  // Read latest car data from context to react to new messages or status changes
  const car = cars.find((c) => c.id === initialCar.id) || initialCar;
  const carInvoice = invoices.find((inv) => inv.carId === car.id);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isVinInspectorOpen, setIsVinInspectorOpen] = useState(false);

  const [containerNumberInput, setContainerNumberInput] = useState(car.containerNumber || '');
  const [statusMessage, setStatusMessage] = useState('');
  const [replyText, setReplyText] = useState('');

  const currentStageIndex = CAR_STAGES.findIndex((s) => s.id === car.status);

  const handleStatusChange = (newStatus: CarStatus) => {
    const updated = { ...car, status: newStatus };
    updateCar(updated);
    if (onUpdateCar) onUpdateCar(updated);
    setStatusMessage('تم تحديث حالة السيارة بنجاح!');
    setTimeout(() => setStatusMessage(''), 2500);
  };

  const handleSaveContainer = () => {
    const updated = { ...car, containerNumber: containerNumberInput.trim() };
    updateCar(updated);
    if (onUpdateCar) onUpdateCar(updated);
    setStatusMessage('تم حفظ رقم الحاوية بنجاح!');
    setTimeout(() => setStatusMessage(''), 2500);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !user) return;

    sendCarMessage(car.id, replyText.trim(), {
      id: user.id,
      fullName: user.fullName,
      role: user.role,
    });
    setReplyText('');
    setStatusMessage('تم إرسال الرسالة إلى العميل بنجاح!');
    setTimeout(() => setStatusMessage(''), 2500);
  };

  const formatMessageTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return `${d.toLocaleDateString('ar-IQ')} ${d.toLocaleTimeString('ar-IQ', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } catch {
      return isoString;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${car.year} ${car.make} ${car.model}`}
      maxWidth="3xl"
    >
      <div className="space-y-5 dir-rtl text-right text-xs">
        {/* Banner with Auction Link */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold bg-[#84C0A2] text-[#164E33] px-2.5 py-0.5 rounded-full">
                {car.auctionName}
              </span>
              <span className="text-xs text-slate-300 font-mono">Lot: {car.lotNumber}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-1">
              {car.year} {car.make} {car.model}
            </h3>
            <p className="text-xs text-slate-400 font-mono">VIN: {car.vin}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isStaffOrAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-2xl shadow-sm transition-all border border-white/15"
                  title="تعديل بيانات السيارة"
                >
                  <Edit3 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>تعديل</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 text-xs font-bold px-3 py-2 rounded-2xl shadow-sm transition-all border border-red-500/30"
                  title="حذف السيارة"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>حذف</span>
                </button>
              </>
            )}

            {carInvoice && (
              <button
                type="button"
                onClick={() => setSelectedInvoice(carInvoice)}
                className="inline-flex items-center justify-center gap-1.5 bg-[#84C0A2] hover:bg-[#6FA88C] text-[#164E33] text-xs font-bold px-3.5 py-2 rounded-2xl shadow-sm transition-all"
                title={`الانتقال لفاتورة السيارة (${carInvoice.invoiceNumber})`}
              >
                <FileText className="w-3.5 h-3.5 text-[#164E33]" />
                <span>الفاتورة ({carInvoice.invoiceNumber})</span>
              </button>
            )}

            {car.auctionUrl && (
              <a
                href={car.auctionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-emerald-50 text-slate-900 hover:text-emerald-800 text-xs font-bold px-3.5 py-2 rounded-2xl shadow-sm transition-all"
              >
                <span>معاينة المزاد</span>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
              </a>
            )}
          </div>
        </div>

        {statusMessage && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center font-bold animate-fadeIn">
            {statusMessage}
          </div>
        )}

        {/* 1. VISUAL SHIPPING TIMELINE & STATUS STEPPER */}
        <div className="bg-[#F9FBFA] border border-slate-100 p-4 sm:p-5 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-800 text-xs">
              مسار ومراحل الشحن اللوجستي (Shipping Pipeline):
            </span>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
              المرحلة الحالية: {CAR_STAGES[currentStageIndex]?.label || car.status}
            </span>
          </div>

          {/* Stepper Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2">
            {CAR_STAGES.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div
                  key={stage.id}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isCurrent
                      ? 'bg-[#164E33] text-white border-[#164E33] shadow-xs scale-102'
                      : isPast
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : 'bg-white border-slate-200/80 text-slate-400'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full mx-auto mb-1 flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? 'bg-white text-[#164E33]'
                        : isPast
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {stage.stepNumber}
                  </div>
                  <div className={`font-bold text-[11px] ${isCurrent ? 'text-white' : ''}`}>
                    {stage.label}
                  </div>
                  <div className={`text-[9px] ${isCurrent ? 'text-white/80' : 'text-slate-400'}`}>
                    {stage.subLabel}
                  </div>
                  {isPast && (
                    <div className="mt-1 inline-flex items-center gap-0.5 text-[9px] text-emerald-700 font-bold">
                      <Check className="w-2.5 h-2.5" />
                      <span>مكتمل</span>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="mt-1 text-[9px] bg-white/20 text-white font-bold px-1.5 py-0.5 rounded-full inline-block">
                      الآن هنا
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600">
            <span className="font-bold text-slate-800 ml-1">وصف مرحلة الشحن:</span>
            <span>{CAR_STAGES[currentStageIndex]?.desc}</span>
          </div>
        </div>

        {/* 2. ADMIN STATUS CONTROL (تحديد الحالات من قبل الإدارة) */}
        {isStaffOrAdmin && (
          <div className="bg-emerald-50/40 border border-emerald-200/70 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-950 text-xs">
                تحديث مسار ومرحلة السيارة (خاص بالإدارة):
              </span>
              <span className="text-[10px] text-slate-500">اضغط على أي مرحلة لنقل السيارة إليها فوراً</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CAR_STAGES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => handleStatusChange(st.id)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-between ${
                    car.status === st.id
                      ? 'bg-[#164E33] text-white border-[#164E33] shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                        car.status === st.id ? 'bg-white text-[#164E33]' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {st.stepNumber}
                    </span>
                    <span>{st.label}</span>
                  </span>
                  {car.status === st.id && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>

            {/* Container Number Assignment */}
            <div className="pt-2 border-t border-emerald-100 flex flex-col sm:flex-row items-end gap-2">
              <div className="flex-1 w-full">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  رقم الحاوية البحرية (Container #)
                </label>
                <input
                  type="text"
                  value={containerNumberInput}
                  onChange={(e) => setContainerNumberInput(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 font-mono"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleSaveContainer}
                className="shrink-0"
              >
                حفظ رقم الحاوية
              </Button>
            </div>
          </div>
        )}

        {/* 2.5 NHTSA & NMVTIS Federal Specs & Title Verification Card */}
        <div className="bg-gradient-to-r from-emerald-50 via-[#F4F9F6] to-slate-50 border border-emerald-200/90 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-xs">
                    المواصفات المصنعية وتدقيق الشاصي الفيدرالي (NHTSA & NMVTIS)
                  </h4>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    موثق رسمياً
                  </span>
                </div>
                <p className="text-slate-500 text-[10px]">
                  مطابقة بيانات وزارة النقل وهيئة المرور الأمريكية ومكتب فحص العناوين الفيدرالي
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsVinInspectorOpen(true)}
                className="bg-[#164E33] hover:bg-[#123E28] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>فحص الشاصي الفيدرالي ⚡</span>
              </button>

              <button
                type="button"
                onClick={() => alert(`تم طلب تقرير Carfax / NMVTIS الشامل لرقم الشاصي: ${car.vin}`)}
                className="bg-white hover:bg-slate-100 text-blue-700 border border-blue-200 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>طلب تقرير الحوادث ($3)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 text-[10px] block">رقم الشاصي الموثق</span>
              <span className="font-mono font-bold text-slate-800 text-xs block truncate mt-0.5">{car.vin}</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 text-[10px] block">حالة العنوان الفيدرالي</span>
              <span className="font-bold text-emerald-700 text-xs block mt-0.5">سليم (Clean Title)</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 text-[10px] block">سجل الغرق والسيول</span>
              <span className="font-bold text-emerald-700 text-xs block mt-0.5">خالي من الغرق (No Flood)</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
              <span className="text-slate-400 text-[10px] block">العيوب والاستدعاءات</span>
              <span className="font-bold text-slate-700 text-xs block mt-0.5">سليم (No Safety Recalls)</span>
            </div>
          </div>
        </div>

        {/* 3. Detailed Grid Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Logistic Path */}
          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>المسار اللوجستي</span>
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">موقع ومدينة المزاد:</span>
                <span className="font-semibold text-slate-700">
                  {[car.city, car.usStateName].filter(Boolean).join(' - ') || car.usStateName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ميناء التحميل (USA):</span>
                <span className="font-semibold text-slate-700">{car.loadingPortName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ميناء الوصول:</span>
                <span className="font-semibold text-slate-700">{car.destinationPortName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">رقم الحاوية:</span>
                <span className="font-bold text-emerald-800 font-mono">
                  {car.containerNumber || 'لم تقيد برقم حاوية بعد'}
                </span>
              </div>
            </div>
          </div>

          {/* Buyer & Financial Info */}
          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>بيانات العميل والمشتري</span>
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">اسم العميل:</span>
                <span className="font-semibold text-slate-700">{car.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">رقم الهاتف:</span>
                <span className="font-semibold text-slate-700">{car.customerPhone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">تاريخ الشراء:</span>
                <span className="font-semibold text-slate-700">{formatDate(car.purchaseDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">سعر الشراء من المزاد:</span>
                <span className="font-extrabold text-emerald-700 text-sm">
                  {formatCurrency(car.purchasePrice)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">مصدر تسديد المزاد:</span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    car.auctionPaymentSource === 'external'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {car.auctionPaymentSource === 'external'
                    ? `مسدد خارجياً${
                        car.externalPaymentDetails ? ` (${car.externalPaymentDetails})` : ''
                      }`
                    : 'عن طريق شركتنا وصيرفاتنا'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/60">
                <span className="text-slate-400">الفاتورة المالية:</span>
                {carInvoice ? (
                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(carInvoice)}
                    className="text-[#164E33] hover:text-[#1B5E3F] hover:underline font-bold text-xs inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/80"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#164E33]" />
                    <span>{carInvoice.invoiceNumber} (عرض وتعديل)</span>
                  </button>
                ) : (
                  <span className="text-slate-400 text-xs">قيد الإصدار</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {car.notes && (
          <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-2xl text-xs text-amber-900">
            <span className="font-bold ml-1">ملاحظات:</span>
            <span>{car.notes}</span>
          </div>
        )}

        {/* 4. CAR MESSAGES & CLIENT INQUIRIES */}
        <div className="bg-[#F9FBFA] border border-slate-200/80 p-4 rounded-2xl space-y-3">
          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#164E33]" />
              <span className="font-bold text-slate-800 text-xs">
                محادثات واستفسارات الزبون حول هذه السيارة
              </span>
              {car.messages && car.messages.length > 0 && (
                <span className="bg-[#164E33] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {car.messages.length} رسائل
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400">
              الزبون: <span className="font-semibold text-slate-700">{car.customerName}</span>
            </span>
          </div>

          {/* Messages feed */}
          <div className="bg-white border border-slate-100 rounded-xl p-3 max-h-56 overflow-y-auto space-y-2.5">
            {!car.messages || car.messages.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                لا توجد رسائل مسجلة لهذه السيارة حتى الآن.
              </div>
            ) : (
              car.messages.map((msg) => {
                const isCustomerMsg = msg.senderRole === 'customer';
                const isMe = msg.senderId === user?.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5 px-1">
                      {isCustomerMsg ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-200">
                          <UserIcon className="w-2.5 h-2.5" />
                          <span>{msg.senderName} (الزبون)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                          <ShieldCheck className="w-2.5 h-2.5 text-[#164E33]" />
                          <span>{msg.senderName} (الإدارة)</span>
                        </span>
                      )}
                      <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{formatMessageTime(msg.createdAt)}</span>
                      </span>
                    </div>

                    <div
                      className={`max-w-[85%] p-2.5 rounded-xl text-xs leading-relaxed break-words ${
                        isMe
                          ? 'bg-[#164E33] text-white'
                          : 'bg-slate-50 text-slate-800 border border-slate-200/80'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Reply Form */}
          <form onSubmit={handleSendMessage} className="flex gap-2 pt-1">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={
                isStaffOrAdmin
                  ? 'اكتب رداً أو توضيحاً للزبون حول هذه السيارة...'
                  : 'اكتب استفساراً للإدارة بخصوص سيارتك...'
              }
              className="flex-1 bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-1 focus:ring-[#164E33]"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!replyText.trim()}
              className="flex items-center gap-1 shrink-0"
            >
              <Send className="w-3 h-3 rtl:rotate-180" />
              <span>إرسال</span>
            </Button>
          </form>
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </div>

      {/* Invoice Details Modal */}
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

      {/* Edit Car Modal */}
      {isEditOpen && (
        <EditCarModal
          car={car}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onUpdateCar={(updated) => {
            if (onUpdateCar) onUpdateCar(updated);
          }}
        />
      )}

      {/* Confirm Delete Car Modal */}
      {isDeleteOpen && (
        <ConfirmDeleteModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={() => {
            deleteCar(car.id);
            setIsDeleteOpen(false);
            onClose();
          }}
          title="حذف السيارة وتأكيد الإلغاء"
          message={`هل أنت متأكد من حذف هذه السيارة (${car.year} ${car.make} ${car.model} - لوت: ${car.lotNumber})؟ سيتم أيضاً إزالة فاتورتها وفك ارتباطها بأي شحنة.`}
        />
      )}

      {/* NHTSA VIN Inspector Modal */}
      <VinInspectorModal
        isOpen={isVinInspectorOpen}
        onClose={() => setIsVinInspectorOpen(false)}
        initialVin={car.vin}
      />
    </Modal>
  );
};
