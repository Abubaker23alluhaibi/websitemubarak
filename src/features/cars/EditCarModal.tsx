import React, { useState, useEffect } from 'react';
import { Modal } from '../../shared/components/ui/Modal';
import { Input } from '../../shared/components/ui/Input';
import { Button } from '../../shared/components/ui/Button';
import { useData } from '../../shared/context/DataContext';
import { Car } from '../../types';

interface EditCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car | null;
  onUpdateCar?: (updated: Car) => void;
}

export const EditCarModal: React.FC<EditCarModalProps> = ({
  isOpen,
  onClose,
  car,
  onUpdateCar,
}) => {
  const { users, states, ports, updateCar } = useData();
  const registeredCustomers = users.filter((u) => u.role === 'customer');

  const [customerId, setCustomerId] = useState('');
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    lotNumber: '',
    auctionName: 'Copart' as any,
    auctionUrl: '',
    purchasePrice: 0,
    purchaseDate: '',
    city: '',
    usStateId: 'st-ga',
    loadingPortName: '',
    destinationPortName: '',
    status: 'purchased' as any,
    notes: '',
    auctionPaymentSource: 'through_us' as 'through_us' | 'external',
    externalPaymentDetails: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (car) {
      setCustomerId(car.customerId);
      setFormData({
        make: car.make || '',
        model: car.model || '',
        year: car.year || new Date().getFullYear(),
        vin: car.vin || '',
        lotNumber: car.lotNumber || '',
        auctionName: car.auctionName || 'Copart',
        auctionUrl: car.auctionUrl || '',
        purchasePrice: car.purchasePrice || 0,
        purchaseDate: car.purchaseDate || new Date().toISOString().split('T')[0],
        city: car.city || '',
        usStateId: (car.usStateId && states.some((s) => s.id === car.usStateId)) ? car.usStateId : (states[0]?.id || 'st-ga'),
        loadingPortName: car.loadingPortName || '',
        destinationPortName: car.destinationPortName || 'ميناء أم قصر (العراق)',
        status: car.status || 'purchased',
        notes: car.notes || '',
        auctionPaymentSource: car.auctionPaymentSource || 'through_us',
        externalPaymentDetails: car.externalPaymentDetails || '',
      });
    }
  }, [car]);

  if (!car) return null;

  const loadingPorts = ports.filter((p) => p.type === 'loading');
  const destinationPorts = ports.filter((p) => p.type === 'destination');

  const handleStateChange = (stateId: string) => {
    const st = states.find((s) => s.id === stateId);
    const defaultPort = st ? ports.find((p) => p.id === st.defaultLoadingPortId) : undefined;
    setFormData((prev) => ({
      ...prev,
      usStateId: stateId,
      loadingPortName: defaultPort ? defaultPort.name : prev.loadingPortName,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const selectedCust = registeredCustomers.find((c) => c.id === customerId);
    const selectedState = states.find((s) => s.id === formData.usStateId);

    const updatedCar: Car = {
      ...car,
      customerId: selectedCust ? selectedCust.id : car.customerId,
      customerName: selectedCust ? selectedCust.fullName : car.customerName,
      customerPhone: selectedCust?.phone || car.customerPhone,
      make: formData.make.trim(),
      model: formData.model.trim(),
      year: Number(formData.year),
      vin: formData.vin.trim().toUpperCase(),
      lotNumber: formData.lotNumber.trim(),
      auctionName: formData.auctionName,
      auctionUrl: formData.auctionUrl.trim() || undefined,
      purchasePrice: Number(formData.purchasePrice) || 0,
      purchaseDate: formData.purchaseDate,
      city: formData.city.trim() || undefined,
      usStateId: formData.usStateId,
      usStateName: selectedState ? selectedState.name : car.usStateName,
      loadingPortName: formData.loadingPortName,
      destinationPortName: formData.destinationPortName,
      status: formData.status,
      notes: formData.notes.trim() || undefined,
      auctionPaymentSource: formData.auctionPaymentSource,
      externalPaymentDetails:
        formData.auctionPaymentSource === 'external'
          ? formData.externalPaymentDetails.trim() || undefined
          : undefined,
    };

    updateCar(updatedCar);
    if (onUpdateCar) {
      onUpdateCar(updatedCar);
    }

    setIsLoading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`تعديل بيانات السيارة: ${car.make} ${car.model}`} maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4 dir-rtl text-right text-xs">
        {/* Customer Selection */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            العميل المالك للسيارة
          </label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
          >
            {registeredCustomers.map((cust) => (
              <option key={cust.id} value={cust.id}>
                {cust.fullName} ({cust.username}) - هاتف: {cust.phone || 'بدون هاتف'}
              </option>
            ))}
          </select>
        </div>

        {/* Basic Car Info */}
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="رقم الهيكل (VIN)"
            required
            value={formData.vin}
            onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
          />
          <Input
            label="رقم اللوت (Lot Number)"
            required
            value={formData.lotNumber}
            onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
          />
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              اسم المزاد
            </label>
            <select
              value={formData.auctionName}
              onChange={(e) =>
                setFormData({ ...formData, auctionName: e.target.value as any })
              }
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
            >
              <option value="Copart">Copart</option>
              <option value="IAAI">IAAI</option>
              <option value="Manheim">Manheim</option>
              <option value="Other">مزاد أو جهة أخرى</option>
            </select>
          </div>
        </div>

        {/* Auction URL & Pricing */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Input
              label="رابط فحص المزاد / المعاينة (اختياري)"
              value={formData.auctionUrl}
              onChange={(e) => setFormData({ ...formData, auctionUrl: e.target.value })}
            />
          </div>
          <Input
            label="سعر الشراء من المزاد ($)"
            type="number"
            value={formData.purchasePrice || ''}
            onChange={(e) =>
              setFormData({ ...formData, purchasePrice: Number(e.target.value) })
            }
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
                name="editPaymentSource"
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
                name="editPaymentSource"
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
                onChange={(e) =>
                  setFormData({ ...formData, externalPaymentDetails: e.target.value })
                }
              />
            </div>
          )}
        </div>

        {/* Location & Shipping info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="تاريخ الشراء"
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
          />
          <Input
            label="المدينة الأمريكية (City)"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              الولاية الأمريكية (US State)
            </label>
            <select
              value={formData.usStateId}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
            >
              {states.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              ميناء التحميل (Loading Port)
            </label>
            <select
              value={formData.loadingPortName}
              onChange={(e) =>
                setFormData({ ...formData, loadingPortName: e.target.value })
              }
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
            >
              <option value="">اختر ميناء التحميل</option>
              {loadingPorts.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              ميناء الوصول (Destination Port)
            </label>
            <select
              value={formData.destinationPortName}
              onChange={(e) =>
                setFormData({ ...formData, destinationPortName: e.target.value })
              }
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
            >
              {destinationPorts.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              حالة الشحن الحالية
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as any })
              }
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
            >
              <option value="purchased">تم الشراء (بانتظار النقل)</option>
              <option value="towing">جاري النقل الداخلي (Towing)</option>
              <option value="at_port">وصلت ميناء التحميل (At Port)</option>
              <option value="shipped">تم الشحن بحرياً (Shipped)</option>
              <option value="arrived">وصلت ميناء الوجهة (Arrived)</option>
              <option value="delivered">تم التسليم للعميل (Delivered)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            ملاحظات إضافية
          </label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            حفظ التعديلات
          </Button>
        </div>
      </form>
    </Modal>
  );
};
