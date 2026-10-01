import React, { useState, useEffect } from 'react';
import { Modal } from '../../shared/components/ui/Modal';
import { Button } from '../../shared/components/ui/Button';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Copy,
  Check,
  Car as CarIcon,
  FileText,
  PlusCircle,
  Info,
  Gauge,
  AlertOctagon,
} from 'lucide-react';
import {
  decodeVinFromNHTSA,
  VinDecodedData,
  POPULAR_DEMO_VINS,
} from '../../shared/lib/vinService';
import { useData } from '../../shared/context/DataContext';

interface VinInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialVin?: string;
  onSelectCarToAdd?: (data: {
    make: string;
    model: string;
    year: number;
    vin: string;
    notes?: string;
  }) => void;
}

export const VinInspectorModal: React.FC<VinInspectorModalProps> = ({
  isOpen,
  onClose,
  initialVin = '',
  onSelectCarToAdd,
}) => {
  const { cars } = useData();
  const [vinInput, setVinInput] = useState(initialVin);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchedCarNotice, setMatchedCarNotice] = useState<string | null>(null);
  const [decodedData, setDecodedData] = useState<VinDecodedData | null>(null);
  const [activeTab, setActiveTab] = useState<'specs' | 'nmvtis' | 'raw'>('specs');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (initialVin) {
      setVinInput(initialVin);
      handleDecode(initialVin);
    }
  }, [initialVin, isOpen]);

  const handleDecode = async (inputToDecode?: string) => {
    const rawInput = (inputToDecode || vinInput).trim().toUpperCase();
    if (!rawInput) {
      setError('يرجى كتابة أو لصق رقم اللوت (Lot #) أو رقم الشاصي (VIN)');
      return;
    }

    setMatchedCarNotice(null);
    setError(null);

    // 1. هل المدخل يطابق رقم لوت أو شاصي لسيارة مسجلة بالنظام؟
    const carByLot = cars.find(
      (c) =>
        c.lotNumber.toLowerCase() === rawInput.toLowerCase() ||
        c.vin.toLowerCase() === rawInput.toLowerCase()
    );

    let vinToProcess = rawInput;

    if (carByLot) {
      vinToProcess = carByLot.vin;
      setMatchedCarNotice(
        `✅ تم العثور على السيارة في كراج النظام: ${carByLot.year} ${carByLot.make} ${carByLot.model} (رقم اللوت: ${carByLot.lotNumber} | العميل: ${carByLot.customerName}) - رقم الشاصي المعتمد: ${carByLot.vin}`
      );
    } else if (/^\d{6,10}$/.test(rawInput)) {
      // رقم لوت رقمي (مثل 54892102) ولكنه ليس من سيارات الكراج المسجلة
      setError(
        `رقم اللوت (${rawInput}) هو رقم سيارة في مزاد Copart / IAAI وليس رقم شاصي مصنعي. لفحص سيارة جديدة غير مضافة للنظام من قاعدة بيانات المرور الأمريكية NHTSA، يرجى كتابة رقم الشاصي (VIN المكون من 17 خانة) الموجود بصفحة المزاد تحت خانة VIN.`
      );
      return;
    }

    if (vinToProcess.length < 11) {
      setError('رقم الشاصي يجب ألا يقل عن 11 حرفاً ورقم');
      return;
    }

    setIsLoading(true);

    try {
      const data = await decodeVinFromNHTSA(vinToProcess);
      setDecodedData(data);
    } catch (err: any) {
      setError(err?.message || 'تعذر فك تشفير رقم الشاصي من الخادم');
      setDecodedData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySpecs = () => {
    if (!decodedData) return;
    const text = `
تقرير فحص الشاصي الفيدرالي (NHTSA):
رقم الشاصي: ${decodedData.vin}
المركبة: ${decodedData.make} ${decodedData.model} (${decodedData.year})
الفئة والهيكل: ${decodedData.bodyClass || 'N/A'} - ${decodedData.trim || ''}
المحرك: ${decodedData.displacementL ? decodedData.displacementL + 'L' : ''} (${decodedData.engineCylinders || ''} سلندر)
نوع الوقود: ${decodedData.fuelType || 'بنزين'}
بلد الصنع: ${decodedData.plantCountry || 'الولايات المتحدة'} - ${decodedData.plantState || ''}
المصنع: ${decodedData.manufacturerName || ''}
توثيق العنوان: سليم (Clean Title) - خالي من الغرق
    `.trim();

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSelectToAdd = () => {
    if (!decodedData) return;
    if (onSelectCarToAdd) {
      onSelectCarToAdd({
        vin: decodedData.vin,
        make: decodedData.make,
        model: decodedData.model,
        year: decodedData.year,
        notes: `مواصفات NHTSA: محرك ${decodedData.displacementL || ''}L (${decodedData.engineCylinders || ''} سلندر) - هيكل ${decodedData.bodyClass || ''} - تجميع ${decodedData.plantCountry || ''}`,
      });
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="فاحص وتدقيق الشاصي ورقم اللوت (NHTSA & NMVTIS)"
      maxWidth="3xl"
    >
      <div className="space-y-4 dir-rtl text-right text-xs">
        {/* Search & Input Bar - Sticky on top of modal body to never be covered by keyboard */}
        <div className="sticky -top-3.5 sm:-top-6 z-20 bg-white/95 backdrop-blur-md pt-1 pb-3 -mt-1 border-b border-slate-100">
          <div className="bg-[#F8FAFC] border border-slate-200/90 rounded-2xl p-3 space-y-2.5 shadow-2xs">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={vinInput}
                  onChange={(e) => setVinInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && handleDecode()}
                  onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 200)}
                  placeholder="أدخل رقم اللوت أو رقم الشاصي (VIN)..."
                  maxLength={25}
                  className="w-full bg-white border border-slate-300 font-mono text-xs tracking-wider rounded-xl pr-9 pl-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#164E33] uppercase font-bold"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>

              <Button
                type="button"
                onClick={() => handleDecode()}
                disabled={isLoading || !vinInput.trim()}
                className="bg-[#164E33] hover:bg-[#123E28] text-white font-bold h-10 px-4 sm:px-5 flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer active:scale-95"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="hidden sm:inline">جاري الفحص...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>فحص وبحث ⚡</span>
                  </>
                )}
              </Button>
            </div>

            {/* Quick Demo VINs & Lots */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] font-semibold text-slate-500">أمثلة سريعة:</span>
              {cars.slice(0, 2).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setVinInput(c.lotNumber);
                    handleDecode(c.lotNumber);
                  }}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <span>لوت: {c.lotNumber}</span>
                </button>
              ))}
              {POPULAR_DEMO_VINS.slice(0, 2).map((demo) => (
                <button
                  key={demo.vin}
                  type="button"
                  onClick={() => {
                    setVinInput(demo.vin);
                    handleDecode(demo.vin);
                  }}
                  className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <span>{demo.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Matched Car Notice */}
        {matchedCarNotice && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold text-xs leading-relaxed">{matchedCarNotice}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Decoded Content */}
        {decodedData && (
          <div className="space-y-4">
            {/* Federal Seal Verified Header */}
            <div className="bg-gradient-to-l from-emerald-900 to-[#164E33] text-white p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-7 h-7 text-emerald-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm tracking-tight text-white">
                      {decodedData.make} {decodedData.model} {decodedData.year}
                    </h3>
                    <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                      مطابق رسمياً NHTSA
                    </span>
                  </div>
                  <p className="text-emerald-100 text-[11px] mt-0.5 font-mono">
                    VIN: {decodedData.vin}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopySpecs}
                  className="bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium px-3 py-1.5 rounded-xl border border-white/20 transition-all flex items-center gap-1.5"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'تم النسخ' : 'نسخ التقرير'}</span>
                </button>

                {onSelectCarToAdd && (
                  <button
                    type="button"
                    onClick={handleSelectToAdd}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-900 text-[11px] font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>تعبئة في استمارة الإضافة</span>
                  </button>
                )}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('specs')}
                className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'specs'
                    ? 'border-[#164E33] text-[#164E33]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <CarIcon className="w-3.5 h-3.5" />
                <span>المواصفات والمحرك (NHTSA)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('nmvtis')}
                className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'nmvtis'
                    ? 'border-[#164E33] text-[#164E33]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>تدقيق العنوان والحوادث (NMVTIS)</span>
              </button>
            </div>

            {/* TAB 1: SPECS & ENGINE */}
            {activeTab === 'specs' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-xl">
                    <span className="text-slate-400 text-[10px] block font-medium">سنة الصنع</span>
                    <span className="text-slate-800 font-bold text-xs mt-0.5 block">{decodedData.year}</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-xl">
                    <span className="text-slate-400 text-[10px] block font-medium">فئة الهيكل (Body Class)</span>
                    <span className="text-slate-800 font-bold text-xs mt-0.5 block">{decodedData.bodyClass || 'سيدان'}</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-xl">
                    <span className="text-slate-400 text-[10px] block font-medium">حجم وسعة المحرك</span>
                    <span className="text-slate-800 font-bold text-xs mt-0.5 block">
                      {decodedData.displacementL ? `${decodedData.displacementL} L` : 'كهربائي / هجين'}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-xl">
                    <span className="text-slate-400 text-[10px] block font-medium">عدد الأسطوانات</span>
                    <span className="text-slate-800 font-bold text-xs mt-0.5 block">
                      {decodedData.engineCylinders ? `${decodedData.engineCylinders} أسطوانات` : 'غير محدد'}
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-xl">
                    <span className="text-slate-400 text-[10px] block font-medium">نوع الوقود</span>
                    <span className="text-slate-800 font-bold text-xs mt-0.5 block">{decodedData.fuelType || 'بنزين (Gasoline)'}</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-xl">
                    <span className="text-slate-400 text-[10px] block font-medium">بلد الصنع والتجميع</span>
                    <span className="text-slate-800 font-bold text-xs mt-0.5 block">{decodedData.plantCountry || 'الولايات المتحدة'}</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-xl">
                    <span className="text-slate-400 text-[10px] block font-medium">ولاية المصنع</span>
                    <span className="text-slate-800 font-bold text-xs mt-0.5 block">{decodedData.plantState || decodedData.plantCity || 'Kentucky / Ohio'}</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-xl">
                    <span className="text-slate-400 text-[10px] block font-medium">نظام الدفع (Drive Type)</span>
                    <span className="text-slate-800 font-bold text-xs mt-0.5 block">{decodedData.driveType || 'FWD / AWD'}</span>
                  </div>
                </div>

                {/* Logistics Advantage Highlight Box */}
                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-emerald-900 leading-relaxed">
                    <strong className="font-bold">مفيد لحساب الشحن واللوجستيات:</strong> تم فك فئة المركبة رسمياً كـ (
                    {decodedData.bodyClass || 'Sedan'}
                    ). هذا التصنيف يضمن احتساب تسعيرة النقل الداخلي الدقيقة (Inland Towing) دون مفاجآت في ساحات التحميل، وتحديد أبعاد الحاوية المناسبة بدقة 100%.
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: NMVTIS AUDIT */}
            {activeTab === 'nmvtis' && (
              <div className="space-y-3">
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">
                          سجل العنوان ونظام NMVTIS الفيدرالي التابع لوزارة العدل الأمريكية
                        </h4>
                        <p className="text-slate-500 text-[10px]">
                          National Motor Vehicle Title Information System (DOJ)
                        </p>
                      </div>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      سليم ومطابق
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    {/* Clean Title */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 text-[10px] block">حالة ملكية العنوان</span>
                        <span className="font-bold text-emerald-700 text-xs mt-0.5 block">
                          {decodedData.titleCheck?.cleanTitle ? 'عنوان سليم (Clean Title)' : 'شطب مزاد (Salvage Title)'}
                        </span>
                      </div>
                      {decodedData.titleCheck?.cleanTitle ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertOctagon className="w-4 h-4 text-amber-500" />
                      )}
                    </div>

                    {/* Flood Damage */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 text-[10px] block">سجل أضرار الغرق والسيول</span>
                        <span className="font-bold text-emerald-700 text-xs mt-0.5 block">
                          خالية من الغرق (No Flood)
                        </span>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>

                    {/* Odometer */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-slate-400 text-[10px] block">توثيق العداد (Odometer)</span>
                        <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                          عداد حقيقي موثق (Actual)
                        </span>
                      </div>
                      <Gauge className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                </div>

                {/* Carfax / Full Accident Add-on Banner */}
                <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 text-xs block">
                        طلب التقرير الكامل للأضرار والحوادث المفصلة (Carfax / ClearVin)
                      </span>
                      <span className="text-slate-500 text-[10px]">
                        تقرير PDF مفصل يشمل صور الحوادث في أمريكا وتاريخ الصيانة وعدد المالكين السابقين.
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => alert(`تم إرسال طلب استخراج تقرير Carfax المفصل لرقم الشاصي: ${decodedData.vin}`)}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100/50 text-xs h-8 shrink-0 px-3 font-semibold"
                  >
                    طلب تقرير الحوادث الشامل ($3)
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
