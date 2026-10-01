import React from 'react';
import { ExternalLink, MapPin, Eye } from 'lucide-react';
import { Car } from '../../types';
import { useData } from '../../shared/context/DataContext';
import { Badge } from '../../shared/components/ui/Badge';

interface RecentCarsWidgetProps {
  onSelectCar?: (car: Car) => void;
}

export const RecentCarsWidget: React.FC<RecentCarsWidgetProps> = ({ onSelectCar }) => {
  const { cars } = useData();
  const displayCars = cars.slice(0, 5);
  const getStatusBadge = (status: Car['status']) => {
    switch (status) {
      case 'purchased':
        return <Badge variant="slate">تم الشراء بالمزاد</Badge>;
      case 'towing':
        return <Badge variant="blue">نقل داخلي أمريكي</Badge>;
      case 'at_port':
        return <Badge variant="purple">بميناء التحميل</Badge>;
      case 'shipped':
        return <Badge variant="emerald">في عرض البحر (حاوية)</Badge>;
      case 'arrived':
        return <Badge variant="amber">وصلت ميناء التفريغ</Badge>;
      case 'delivered':
        return <Badge variant="slate">تم التسليم للزبون</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  return (
    <div className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-base">أحدث السيارات والشحنات المسجلة</h3>
          <p className="text-xs text-slate-400 mt-0.5">متابعة فورية للسيارات، أرقام اللوت، وحالة المزاد</p>
        </div>
        <span className="text-xs text-slate-500 font-medium">عرض آخر 5 سيارات</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold pb-3">
              <th className="pb-3 pr-2">السيارة والموديل</th>
              <th className="pb-3">اللوت والمزاد</th>
              <th className="pb-3">العميل</th>
              <th className="pb-3">ميناء الوصول</th>
              <th className="pb-3">الحالة</th>
              <th className="pb-3 text-left pl-2">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayCars.map((car) => (
              <tr key={car.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="py-3.5 pr-2">
                  <div className="font-bold text-slate-800 text-sm">
                    {car.year} {car.make} {car.model}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">VIN: {car.vin}</div>
                </td>

                <td className="py-3.5">
                  <div className="font-semibold text-slate-700">Lot: {car.lotNumber}</div>
                  <div className="text-[11px] text-emerald-700 font-medium">{car.auctionName}</div>
                </td>

                <td className="py-3.5">
                  <div className="font-semibold text-slate-800">{car.customerName}</div>
                  <div className="text-[11px] text-slate-400">{car.customerPhone}</div>
                </td>

                <td className="py-3.5">
                  <div className="flex items-center gap-1 text-slate-600 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{car.destinationPortName}</span>
                  </div>
                </td>

                <td className="py-3.5">{getStatusBadge(car.status)}</td>

                <td className="py-3.5 text-left pl-2">
                  <div className="flex items-center justify-end gap-2">
                    {/* زر رابط المزاد المباشر */}
                    {car.auctionUrl && (
                      <a
                        href={car.auctionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition-colors"
                        title="فتح صفحة المزاد وصور الفحص"
                      >
                        <span>المزاد</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {onSelectCar && (
                      <button
                        onClick={() => onSelectCar(car)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                        title="عرض التفاصيل"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
