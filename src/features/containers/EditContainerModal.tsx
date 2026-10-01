import React, { useState, useEffect } from 'react';
import { Modal } from '../../shared/components/ui/Modal';
import { Input } from '../../shared/components/ui/Input';
import { Button } from '../../shared/components/ui/Button';
import { useData } from '../../shared/context/DataContext';
import { Container } from '../../types';

interface EditContainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  container: Container | null;
}

export const EditContainerModal: React.FC<EditContainerModalProps> = ({
  isOpen,
  onClose,
  container,
}) => {
  const { ports, cars, updateContainer } = useData();

  const [formData, setFormData] = useState({
    containerNumber: '',
    shippingLine: '',
    status: 'loading' as Container['status'],
    loadingPort: '',
    destinationPort: '',
    capacity: 4,
    trackingUrl: '',
    carIds: [] as string[],
  });

  useEffect(() => {
    if (container) {
      setFormData({
        containerNumber: container.containerNumber || '',
        shippingLine: container.shippingLine || '',
        status: container.status || 'loading',
        loadingPort: container.loadingPort || '',
        destinationPort: container.destinationPort || '',
        capacity: container.capacity || 4,
        trackingUrl: container.trackingUrl || '',
        carIds: container.carIds || [],
      });
    }
  }, [container]);

  if (!container) return null;

  const loadingPorts = ports.filter((p) => p.type === 'loading');
  const destinationPorts = ports.filter((p) => p.type === 'destination');

  const toggleCarSelection = (carId: string) => {
    setFormData((prev) => {
      const exists = prev.carIds.includes(carId);
      if (exists) {
        return { ...prev, carIds: prev.carIds.filter((id) => id !== carId) };
      } else {
        if (prev.carIds.length >= prev.capacity) {
          alert(`الحاوية وصلت للحد الأقصى من السعة (${prev.capacity} سيارات)`);
          return prev;
        }
        return { ...prev, carIds: [...prev.carIds, carId] };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.containerNumber.trim()) return;

    const updated: Container = {
      ...container,
      containerNumber: formData.containerNumber.trim().toUpperCase(),
      shippingLine: formData.shippingLine.trim(),
      status: formData.status,
      loadingPort: formData.loadingPort,
      destinationPort: formData.destinationPort,
      capacity: Number(formData.capacity) || 4,
      trackingUrl: formData.trackingUrl.trim() || undefined,
      carIds: formData.carIds,
    };

    updateContainer(updated);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`تعديل الحاوية: ${container.containerNumber}`}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 dir-rtl text-right text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="رقم الحاوية (Container No.)"
            required
            value={formData.containerNumber}
            onChange={(e) => setFormData({ ...formData, containerNumber: e.target.value })}
          />
          <Input
            label="خط الملاحة / الشركة الناقلة"
            required
            value={formData.shippingLine}
            onChange={(e) => setFormData({ ...formData, shippingLine: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              حالة الحاوية
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as Container['status'] })
              }
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
            >
              <option value="loading">تحميل بالميناء (Loading)</option>
              <option value="on_sea">مبحرة في البحر (On Sea)</option>
              <option value="arrived">وصلت ميناء التفريغ (Arrived)</option>
              <option value="cleared">تم التخليص الجمركي (Cleared)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              ميناء التحميل
            </label>
            <select
              value={formData.loadingPort}
              onChange={(e) => setFormData({ ...formData, loadingPort: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
            >
              <option value="">اختر الميناء</option>
              {loadingPorts.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              ميناء الوصول
            </label>
            <select
              value={formData.destinationPort}
              onChange={(e) => setFormData({ ...formData, destinationPort: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
            >
              <option value="">اختر الميناء</option>
              {destinationPorts.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="السعة الاستيعابية القصوى (عدد السيارات)"
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
          />
          <Input
            label="رابط التتبع الملاحي (Tracking URL)"
            value={formData.trackingUrl}
            onChange={(e) => setFormData({ ...formData, trackingUrl: e.target.value })}
          />
        </div>

        {/* Pick Cars inside container */}
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-800 text-xs">
              تحديد السيارات المحملة في الحاوية ({formData.carIds.length} / {formData.capacity}):
            </span>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1.5 pt-1">
            {cars.map((car) => {
              const isSelected = formData.carIds.includes(car.id);
              const isAssignedToOther = car.containerId && car.containerId !== container.id;

              return (
                <label
                  key={car.id}
                  className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-bold'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCarSelection(car.id)}
                      className="rounded text-[#164E33] focus:ring-[#164E33]"
                    />
                    <span>
                      {car.year} {car.make} {car.model}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Lot: {car.lotNumber}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {car.customerName} {isAssignedToOther && '(بحاوية أخرى)'}
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary">
            حفظ التعديلات
          </Button>
        </div>
      </form>
    </Modal>
  );
};
