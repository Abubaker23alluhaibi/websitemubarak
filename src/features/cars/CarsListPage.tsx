import React, { useState } from 'react';
import { Search, ExternalLink, Eye, MessageSquare, Edit3, Trash2, ShieldCheck, Zap } from 'lucide-react';
import { useData } from '../../shared/context/DataContext';
import { Car, User } from '../../types';
import { AddCarModal } from './AddCarModal';
import { EditCarModal } from './EditCarModal';
import { CarDetailsModal } from './CarDetailsModal';
import { VinInspectorModal } from './VinInspectorModal';
import { ConfirmDeleteModal } from '../../shared/components/ui/ConfirmDeleteModal';
import { formatCurrency } from '../../shared/lib/formatters';

export const CarsListPage: React.FC = () => {
  const { cars, addCar, updateCar, deleteCar } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [auctionFilter, setAuctionFilter] = useState<string>('all');

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [carToEdit, setCarToEdit] = useState<Car | null>(null);
  const [carToDelete, setCarToDelete] = useState<Car | null>(null);
  const [inspectingVin, setInspectingVin] = useState<string | null>(null);
  const [prefillCarData, setPrefillCarData] = useState<Partial<Car> | undefined>(undefined);

  const filteredCars = cars.filter((car) => {
    const matchesSearch =
      car.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.vin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      car.lotNumber.includes(searchQuery) ||
      car.customerName.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || car.status === statusFilter;
    const matchesAuction = auctionFilter === 'all' || car.auctionName === auctionFilter;

    return matchesSearch && matchesStatus && matchesAuction;
  });

  const handleAddCar = (newCarData: Partial<Car>, newCustomer?: User) => {
    addCar(newCarData, newCustomer);
  };

  const handleStatusChange = (car: Car, newStatus: any) => {
    const updated = { ...car, status: newStatus };
    updateCar(updated);
  };

  return (
    <div className="space-y-4 dir-rtl text-right text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="font-bold text-slate-800 text-sm">إدارة السيارات والشحنات</h2>
        </div>

        <button
          onClick={() => {
            setPrefillCarData(undefined);
            setIsAddOpen(true);
          }}
          className="bg-[#164E33] hover:bg-[#1B5E3F] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all shadow-xs"
        >
          + إضافة سيارة جديدة
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  setInspectingVin(searchQuery.trim());
                }
              }}
              placeholder="بحث برقم اللوت، الشاصي، الموديل..."
              className="w-full bg-[#F7F9F8] border border-slate-200/80 rounded-full pr-8 pl-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
            />
            <button
              type="button"
              onClick={() => searchQuery.trim() && setInspectingVin(searchQuery.trim())}
              title="بحث وفحص الشاصي في NHTSA"
              className="w-4 h-4 text-slate-400 hover:text-[#164E33] absolute right-2.5 top-2 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>

          {searchQuery.trim() && (
            <button
              type="button"
              onClick={() => setInspectingVin(searchQuery.trim())}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-2xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>فحص في NHTSA ⚡</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F7F9F8] border border-slate-200/80 text-[11px] rounded-full px-3 py-1 text-slate-600 outline-none"
          >
            <option value="all">كل الحالات</option>
            <option value="purchased">في ساحة المزاد</option>
            <option value="towing">نقل داخلي</option>
            <option value="at_port">بميناء التحميل</option>
            <option value="shipped">في عرض البحر</option>
            <option value="arrived">وصلت الميناء</option>
            <option value="delivered">تم التسليم</option>
          </select>

          <select
            value={auctionFilter}
            onChange={(e) => setAuctionFilter(e.target.value)}
            className="bg-[#F7F9F8] border border-slate-200/80 text-[11px] rounded-full px-3 py-1 text-slate-600 outline-none"
          >
            <option value="all">كل المزادات</option>
            <option value="Copart">Copart</option>
            <option value="IAAI">IAAI</option>
            <option value="Manheim">Manheim</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#F9FBFA] border border-slate-100 rounded-2xl p-4 overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-semibold pb-2.5">
              <th className="pb-2.5 pr-2">السيارة والموديل</th>
              <th className="pb-2.5">رقم اللوت والمزاد</th>
              <th className="pb-2.5">العميل</th>
              <th className="pb-2.5">ميناء الوصول</th>
              <th className="pb-2.5">سعر الشراء</th>
              <th className="pb-2.5">حالة الشحن</th>
              <th className="pb-2.5 text-left pl-2">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            {filteredCars.map((car) => (
              <tr key={car.id} className="hover:bg-white/80 transition-colors">
                <td className="py-3 pr-2">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span>{car.year} {car.make} {car.model}</span>
                    {car.messages && car.messages.length > 0 && (
                      <span
                        onClick={() => setSelectedCar(car)}
                        className="cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full"
                        title="توجد استفسارات ومحادثات حول هذه السيارة"
                      >
                        <MessageSquare className="w-2.5 h-2.5" />
                        <span>{car.messages.length}</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">VIN: {car.vin}</div>
                </td>
                <td className="py-3">
                  <div className="font-semibold text-slate-700">{car.lotNumber}</div>
                  <div className="text-[10px] text-slate-400">{car.auctionName}</div>
                </td>
                <td className="py-3 font-medium text-slate-700">{car.customerName}</td>
                <td className="py-3 text-slate-500">{car.destinationPortName}</td>
                <td className="py-3 font-semibold text-slate-800">{formatCurrency(car.purchasePrice)}</td>
                <td className="py-3">
                  <select
                    value={car.status}
                    onChange={(e) => handleStatusChange(car, e.target.value as any)}
                    className="bg-white border border-slate-200/90 text-[11px] font-bold rounded-full px-2.5 py-1 text-slate-800 outline-none cursor-pointer focus:ring-1 focus:ring-[#164E33] transition-colors"
                  >
                    <option value="purchased">المرحلة 1: ساحة المزاد</option>
                    <option value="towing">المرحلة 2: نقل داخلي</option>
                    <option value="at_port">المرحلة 3: ميناء التحميل</option>
                    <option value="shipped">المرحلة 4: في عرض البحر</option>
                    <option value="arrived">المرحلة 5: وصلت الميناء</option>
                    <option value="delivered">المرحلة 6: تم التسليم</option>
                  </select>
                </td>
                <td className="py-3 text-left pl-2">
                  <div className="flex items-center justify-end gap-1.5">
                    {car.auctionUrl && (
                      <a
                        href={car.auctionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-[#164E33] p-1 transition-colors"
                        title="معاينة المزاد"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => setInspectingVin(car.vin)}
                      className="text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 text-[10px] font-bold px-2 py-1 rounded-lg transition-all inline-flex items-center gap-1 border border-emerald-200/80 cursor-pointer shadow-2xs"
                      title="فحص الشاصي الفيدرالي ومواصفات NHTSA الرسمية"
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>NHTSA</span>
                    </button>

                    <button
                      onClick={() => setSelectedCar(car)}
                      className="text-slate-500 hover:text-slate-900 text-[11px] font-medium p-1 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                      title="عرض التفاصيل"
                    >
                      <Eye className="w-3.5 h-3.5 inline ml-0.5 text-slate-400" />
                      تفاصيل
                    </button>
                    <button
                      onClick={() => setCarToEdit(car)}
                      className="text-emerald-700 hover:text-emerald-900 text-[11px] font-medium p-1 hover:bg-emerald-50 rounded-lg transition-all"
                      title="تعديل بيانات السيارة"
                    >
                      <Edit3 className="w-3.5 h-3.5 inline ml-0.5 text-emerald-600" />
                      تعديل
                    </button>
                    <button
                      onClick={() => setCarToDelete(car)}
                      className="text-red-500 hover:text-red-700 text-[11px] font-medium p-1 hover:bg-red-50 rounded-lg transition-all"
                      title="حذف السيارة"
                    >
                      <Trash2 className="w-3.5 h-3.5 inline text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredCars.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 px-4 text-center">
                  <div className="max-w-lg mx-auto bg-white border border-emerald-100 rounded-3xl p-6 shadow-xs space-y-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200/70 shadow-2xs">
                      <ShieldCheck className="w-7 h-7 text-emerald-700" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-extrabold text-slate-800 text-sm">
                        {searchQuery.trim()
                          ? 'المركبة غير مسجلة في أسطولك المحلي'
                          : 'لا توجد سيارات مطابقة لبحثك'}
                      </h3>
                      {searchQuery.trim() ? (
                        <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                          رقم الشاصي أو البحث <strong className="font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded">"{searchQuery.trim()}"</strong> غير موجود ضمن سيارات كراجك، ولكن يمكنك فك تشفير مواصفاته المصنعية وفحصه رسمياً وتدقيق الحوادث والغرق عبر قاعدة بيانات المرور الأمريكي الحكومية (NHTSA):
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400">
                          جرب تغيير كلمات البحث، أو إزالة تصفية الحالات، أو إضافة سيارة جديدة للأسطول.
                        </p>
                      )}
                    </div>

                    {searchQuery.trim() && (
                      <button
                        type="button"
                        onClick={() => setInspectingVin(searchQuery.trim())}
                        className="w-full bg-[#164E33] hover:bg-[#123E28] active:scale-98 text-white font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                      >
                        <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span>فحص الشاصي ({searchQuery.trim().toUpperCase()}) عبر المرور الأمريكي الفيدرالي (NHTSA) ⚡</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <AddCarModal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setPrefillCarData(undefined);
        }}
        onAddCar={handleAddCar}
        initialData={prefillCarData}
      />
      
      {carToEdit && (
        <EditCarModal
          car={carToEdit}
          isOpen={!!carToEdit}
          onClose={() => setCarToEdit(null)}
          onUpdateCar={(updated) => {
            updateCar(updated);
            if (selectedCar?.id === updated.id) setSelectedCar(updated);
          }}
        />
      )}

      {selectedCar && (
        <CarDetailsModal
          car={selectedCar}
          isOpen={!!selectedCar}
          onClose={() => setSelectedCar(null)}
          onUpdateCar={(updated) => {
            updateCar(updated);
            setSelectedCar(updated);
          }}
        />
      )}

      {carToDelete && (
        <ConfirmDeleteModal
          isOpen={!!carToDelete}
          onClose={() => setCarToDelete(null)}
          onConfirm={() => {
            deleteCar(carToDelete.id);
            setCarToDelete(null);
            if (selectedCar?.id === carToDelete.id) setSelectedCar(null);
          }}
          title="حذف السيارة وتأكيد الإلغاء"
          message={`هل أنت متأكد من حذف السيارة ${carToDelete.year} ${carToDelete.make} ${carToDelete.model} (لوت: ${carToDelete.lotNumber})؟ سيتم أيضاً حذف فاتورتها المرتبطة وفك ارتباطها بأي حاوية.`}
        />
      )}

      {/* NHTSA VIN Inspector Modal */}
      {inspectingVin && (
        <VinInspectorModal
          isOpen={!!inspectingVin}
          onClose={() => setInspectingVin(null)}
          initialVin={inspectingVin}
          onSelectCarToAdd={(carData) => {
            setPrefillCarData(carData);
            setInspectingVin(null);
            setIsAddOpen(true);
          }}
        />
      )}
    </div>
  );
};
