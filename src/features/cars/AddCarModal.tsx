import React, { useState, useEffect } from 'react';
import { Modal } from '../../shared/components/ui/Modal';
import { Input } from '../../shared/components/ui/Input';
import { Button } from '../../shared/components/ui/Button';
import { useData } from '../../shared/context/DataContext';
import { Car, User } from '../../types';
import { UserCheck, UserPlus, Zap, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { decodeVinFromNHTSA } from '../../shared/lib/vinService';

interface AddCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCar?: (car: Partial<Car>, newCustomer?: User) => void;
  initialData?: Partial<Car>;
}

export const AddCarModal: React.FC<AddCarModalProps> = ({ isOpen, onClose, onAddCar, initialData }) => {
  const { users, states, ports } = useData();
  const registeredCustomers = users.filter((u) => u.role === 'customer');

  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    registeredCustomers[0]?.id || 'user-5'
  );

  // New Customer Fields
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerUsername, setNewCustomerUsername] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');

  // Car Details
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    lotNumber: '',
    auctionName: 'Copart' as const,
    auctionUrl: '',
    purchasePrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    auctionPaymentSource: 'through_us' as 'through_us' | 'external',
    externalPaymentDetails: '',
    city: '',
    usStateId: 'st-ga',
    loadingPortId: 'port-1',
    destinationPortId: 'port-10',
    notes: '',
  });

  const loadingPorts = ports.filter((p) => p.type === 'loading');
  const destinationPorts = ports.filter((p) => p.type === 'destination');

  const [isLoading, setIsLoading] = useState(false);
  const [isDecodingVin, setIsDecodingVin] = useState(false);
  const [vinDecodeSuccessMsg, setVinDecodeSuccessMsg] = useState<string | null>(null);
  const [vinDecodeErrorMsg, setVinDecodeErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData((prev) => ({
        ...prev,
        make: initialData.make || prev.make,
        model: initialData.model || prev.model,
        year: initialData.year || prev.year,
        vin: initialData.vin || prev.vin,
        notes: initialData.notes || prev.notes,
      }));
      if (initialData.vin) {
        setVinDecodeSuccessMsg(`تم تعبئة المواصفات المصنعية بنجاح للشاصي (${initialData.vin}) ⚡`);
      }
    }
  }, [initialData, isOpen]);

  // Sync with live DB items when available
  useEffect(() => {
    if (registeredCustomers.length > 0) {
      if (!selectedCustomerId || selectedCustomerId === 'user-5' || !registeredCustomers.some((c) => c.id === selectedCustomerId)) {
        setSelectedCustomerId(registeredCustomers[0].id);
      }
    }
  }, [registeredCustomers, selectedCustomerId]);

  useEffect(() => {
    if (states.length > 0 && (!formData.usStateId || formData.usStateId === 'st-ga' || !states.some((s) => s.id === formData.usStateId))) {
      const firstState = states[0];
      setFormData((prev) => ({
        ...prev,
        usStateId: firstState.id,
        loadingPortId: firstState.defaultLoadingPortId || prev.loadingPortId,
      }));
    }
  }, [states, formData.usStateId]);

  useEffect(() => {
    if (loadingPorts.length > 0 && (!formData.loadingPortId || formData.loadingPortId === 'port-1' || !loadingPorts.some((p) => p.id === formData.loadingPortId))) {
      setFormData((prev) => ({
        ...prev,
        loadingPortId: loadingPorts[0].id,
      }));
    }
    if (destinationPorts.length > 0 && (!formData.destinationPortId || formData.destinationPortId === 'port-10' || !destinationPorts.some((p) => p.id === formData.destinationPortId))) {
      setFormData((prev) => ({
        ...prev,
        destinationPortId: destinationPorts[0].id,
      }));
    }
  }, [loadingPorts, destinationPorts, formData.loadingPortId, formData.destinationPortId]);

  const handleAutoDecodeVin = async () => {
    const vinClean = formData.vin.trim().toUpperCase();
    if (!vinClean || vinClean.length < 11) {
      setVinDecodeErrorMsg('يرجى كتابة رقم شاصي صحيح (من 11 إلى 17 حرفاً ورقم)');
      return;
    }

    setIsDecodingVin(true);
    setVinDecodeErrorMsg(null);
    setVinDecodeSuccessMsg(null);

    try {
      const decoded = await decodeVinFromNHTSA(vinClean);
      if (decoded.make && decoded.model) {
        setFormData((prev) => {
          const nhtsaNote = `[NHTSA]: محرك ${decoded.displacementL || ''}L (${decoded.engineCylinders || ''} سلندر) - هيكل ${decoded.bodyClass || ''} - تجميع ${decoded.plantCountry || ''}`;
          return {
            ...prev,
            vin: vinClean,
            make: decoded.make,
            model: decoded.model,
            year: decoded.year || prev.year,
            notes: prev.notes ? `${prev.notes}\n${nhtsaNote}` : nhtsaNote,
          };
        });
        setVinDecodeSuccessMsg(`تم بنجاح! تم استخراج: ${decoded.make} ${decoded.model} (${decoded.year}) - محرك ${decoded.displacementL || ''}L تلقائياً`);
        setTimeout(() => setVinDecodeSuccessMsg(null), 6000);
      } else {
        setVinDecodeErrorMsg('لم يتم العثور على مواصفات مطابقة للشاصي من خوادم NHTSA');
      }
    } catch (err: any) {
      setVinDecodeErrorMsg(err?.message || 'تعذر فك تشفير رقم الشاصي');
    } finally {
      setIsDecodingVin(false);
    }
  };

  const handleStateChange = (stateId: string) => {
    const st = states.find((s) => s.id === stateId);
    setFormData((prev) => ({
      ...prev,
      usStateId: stateId,
      loadingPortId: st ? st.defaultLoadingPortId : prev.loadingPortId,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      let finalCustomerId = selectedCustomerId;
      let finalCustomerName = '';
      let finalCustomerPhone = '';
      let createdCustomerObj: User | undefined = undefined;

      if (customerMode === 'existing') {
        const found = registeredCustomers.find((c) => c.id === selectedCustomerId);
        finalCustomerId = found?.id || 'user-5';
        finalCustomerName = found?.fullName || 'عميل مسجل';
        finalCustomerPhone = found?.phone || '';
      } else {
        const newCustId = `cust-${Date.now()}`;
        createdCustomerObj = {
          id: newCustId,
          fullName: newCustomerName.trim() || 'عميل جديد',
          username: newCustomerUsername.trim().toLowerCase() || `client.${Date.now()}`,
          email: newCustomerEmail.trim() || `${newCustomerUsername}@customer.carship`,
          phone: newCustomerPhone.trim(),
          role: 'customer',
          isActive: true,
          createdAt: new Date().toISOString().split('T')[0],
        };
        finalCustomerId = newCustId;
        finalCustomerName = createdCustomerObj.fullName;
        finalCustomerPhone = createdCustomerObj.phone || '';
      }

      if (onAddCar) {
        const stateObj = states.find((s) => s.id === formData.usStateId);
        const destPortObj = ports.find((p) => p.id === formData.destinationPortId);
        const loadingPortObj = ports.find((p) => p.id === formData.loadingPortId);

        onAddCar(
          {
            ...formData,
            customerId: finalCustomerId,
            customerName: finalCustomerName,
            customerPhone: finalCustomerPhone,
            purchasePrice: Number(formData.purchasePrice) || 0,
            purchaseDate: formData.purchaseDate || new Date().toISOString().split('T')[0],
            city: formData.city.trim() || undefined,
            usStateName: stateObj?.name || '',
            loadingPortName: loadingPortObj?.name || '',
            destinationPortName: destPortObj?.name || '',
            status: 'purchased',
          },
          createdCustomerObj
        );
      }
      setIsLoading(false);
      onClose();
    }, 400);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="تسجيل وإضافة سيارة جديدة"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 dir-rtl text-right text-xs">
        {/* قسم ربط العميل الإلزامي */}
        <div className="bg-[#F9FBFA] p-4 rounded-2xl border border-slate-100 space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-800 text-xs">بيانات العميل / المشتري:</span>
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
                onClick={() => setCustomerMode('new')}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1 ${
                  customerMode === 'new'
                    ? 'bg-[#164E33] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-3 h-3" />
                <span>كتابة الاسم يدوياً</span>
              </button>
            </div>
          </div>

          {customerMode === 'existing' ? (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                اختر العميل المشتري من القائمة
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
              >
                {registeredCustomers.map((cust) => (
                  <option key={cust.id} value={cust.id}>
                    {cust.fullName} ({cust.username}) - هاتف: {cust.phone || 'بدون هاتف'}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-3 pt-1 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="اسم العميل (كتابة يدوية)"
                  required
                  value={newCustomerName}
                  onChange={(e) => {
                    setNewCustomerName(e.target.value);
                    if (!newCustomerUsername) {
                      setNewCustomerUsername(`client.${Date.now().toString().slice(-4)}`);
                    }
                  }}
                />

                <Input
                  label="رقم هاتف العميل (اختياري)"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="اسم المستخدم للدخول (اختياري)"
                  value={newCustomerUsername}
                  onChange={(e) => setNewCustomerUsername(e.target.value)}
                />

                <Input
                  label="البريد الإلكتروني (اختياري)"
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* 1. قسم فاحص وتدقيق الشاصي الفيدرالي المباشر (VIN Decoder) - في أعلى بيانات السيارة */}
        <div className="bg-gradient-to-l from-[#123E28] via-[#164E33] to-[#1E6B47] text-white p-3.5 sm:p-4 rounded-2xl shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                <Zap className="w-4 h-4 fill-slate-950" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs sm:text-sm text-white">
                  فاحص وتدقيق الشاصي الفيدرالي المباشر (VIN Decoder)
                </h4>
                <p className="text-[10px] text-emerald-200">
                  أدخل رقم الشاصي لجلب الموديل وسنة الصنع تلقائياً من نظام المرور الأمريكي (NHTSA)
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex bg-white/15 text-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/20 items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-300" />
              <span>فحص فيدرالي NHTSA ⚡</span>
            </span>
          </div>

          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <input
                type="text"
                required
                maxLength={25}
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 200)}
                placeholder="اكتب أو الصق رقم الشاصي (VIN - 17 خانة)..."
                className="w-full bg-white text-slate-900 border-0 font-mono text-xs font-bold rounded-xl pr-3.5 pl-3 py-2.5 outline-none focus:ring-2 focus:ring-amber-400 uppercase shadow-xs placeholder-slate-400"
              />
            </div>

            <button
              type="button"
              onClick={handleAutoDecodeVin}
              disabled={isDecodingVin || formData.vin.trim().length < 11}
              className="bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0 active:scale-95"
            >
              {isDecodingVin ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">جاري الفحص...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-slate-950" />
                  <span>فحص وتعبئة ⚡</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* تنبيه نجاح أو خطأ فك الشاصي */}
        {vinDecodeSuccessMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl flex items-center gap-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{vinDecodeSuccessMsg}</span>
          </div>
        )}
        {vinDecodeErrorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl flex items-center gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{vinDecodeErrorMsg}</span>
          </div>
        )}

        {/* بيانات السيارة والمزاد */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="الشركة المصنعة (Make)"
            required
            value={formData.make}
            onChange={(e) => setFormData({ ...formData, make: e.target.value })}
          />
          <Input
            label="الموديل (Model)"
            required
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          />
          <Input
            label="سنة الصنع"
            type="number"
            required
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
          <Input
            label="رقم اللوت (Lot #)"
            required
            value={formData.lotNumber}
            onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
          />

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">المزاد المصدر</label>
            <select
              value={formData.auctionName}
              onChange={(e) => setFormData({ ...formData, auctionName: e.target.value as any })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-1 focus:ring-[#164E33] focus:outline-none"
            >
              <option value="Copart">Copart</option>
              <option value="IAAI">IAAI</option>
              <option value="Manheim">Manheim</option>
              <option value="Other">آخر</option>
            </select>
          </div>
        </div>

        {/* رابط المزاد المباشر */}
        <Input
          label="رابط صفحة المزاد الأصلية (auction_url) - Copart / IAAI"
          value={formData.auctionUrl}
          onChange={(e) => setFormData({ ...formData, auctionUrl: e.target.value })}
        />

        {/* اللوجستيات والموانئ وموقع السيارة */}
        <div className="bg-[#F9FBFA] p-3.5 rounded-2xl border border-slate-100 space-y-3">
          <span className="font-bold text-slate-800 text-[11px] block">الموقع والمسار اللوجستي للسيارة:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">ولاية المزاد (US State)</label>
              <select
                value={formData.usStateId}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900"
              >
                {states.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.code}) - ${st.inlandCost}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="مدينة السيارة / ساحة المزاد (City / Yard)"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">ميناء التحميل (USA Loading Port)</label>
              <select
                value={formData.loadingPortId}
                onChange={(e) => setFormData({ ...formData, loadingPortId: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900"
              >
                {loadingPorts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">ميناء الوصول الدولي (Destination)</label>
              <select
                value={formData.destinationPortId}
                onChange={(e) => setFormData({ ...formData, destinationPortId: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900"
              >
                {destinationPorts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* سعر الشراء، تاريخ الشراء ومصدر التحويل */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="سعر شراء السيارة من المزاد ($)"
            type="number"
            required
            value={formData.purchasePrice}
            onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
          />
          <Input
            label="تاريخ شراء السيارة من المزاد"
            type="date"
            required
            value={formData.purchaseDate}
            onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
          />
        </div>

        {/* جهة تسديد ثمن المزاد وعمولة التحويل */}
        <div className="bg-[#F9FBFA] p-3.5 rounded-2xl border border-slate-200/90 space-y-2.5">
          <label className="block font-bold text-slate-800 text-[11px]">
            جهة تسديد ثمن السيارة بالمزاد (مصدر تحويل الأموال):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, auctionPaymentSource: 'through_us' })}
              className={`p-2.5 rounded-xl border text-right transition-all flex items-start gap-2.5 ${
                formData.auctionPaymentSource === 'through_us'
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-bold shadow-2xs ring-1 ring-emerald-300'
                  : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="paymentSource"
                checked={formData.auctionPaymentSource === 'through_us'}
                onChange={() => {}}
                className="mt-0.5 text-[#164E33] focus:ring-[#164E33]"
              />
              <div>
                <span className="block text-xs font-bold">عن طريق شركتنا وصيرفاتنا</span>
                <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                  تُستقطع عمولة تحويل مالي ويُطالب العميل بثمن المزاد
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, auctionPaymentSource: 'external' })}
              className={`p-2.5 rounded-xl border text-right transition-all flex items-start gap-2.5 ${
                formData.auctionPaymentSource === 'external'
                  ? 'bg-blue-50/70 border-blue-300 text-blue-950 font-bold shadow-2xs ring-1 ring-blue-300'
                  : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="paymentSource"
                checked={formData.auctionPaymentSource === 'external'}
                onChange={() => {}}
                className="mt-0.5 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="block text-xs font-bold">مسدد من مكتب خارجي / ذاتي</span>
                <span className="block text-[10px] text-blue-600 font-normal mt-0.5">
                  عمولة التحويل $0 ولا يُطالب العميل بثمن المزاد
                </span>
              </div>
            </button>
          </div>

          {formData.auctionPaymentSource === 'external' && (
            <div className="pt-2 border-t border-blue-100">
              <Input
                label="اسم المكتب الخارجي أو رقم الإشعار (اختياري)"
                value={formData.externalPaymentDetails}
                onChange={(e) => setFormData({ ...formData, externalPaymentDetails: e.target.value })}
              />
            </div>
          )}
        </div>

        <Input
          label="ملاحظات إضافية"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />

        <div className="pt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
            حفظ وتسجيل السيارة
          </Button>
        </div>
      </form>
    </Modal>
  );
};
