import React, { useState } from 'react';
import { ExternalLink, Plus, Edit3, Trash2 } from 'lucide-react';
import { useData } from '../../shared/context/DataContext';
import { Container } from '../../types';
import { AddContainerModal } from './AddContainerModal';
import { EditContainerModal } from './EditContainerModal';
import { ConfirmDeleteModal } from '../../shared/components/ui/ConfirmDeleteModal';

export const ContainersPage: React.FC = () => {
  const { containers, cars, deleteContainer } = useData();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [containerToEdit, setContainerToEdit] = useState<Container | null>(null);
  const [containerToDelete, setContainerToDelete] = useState<Container | null>(null);

  const getStatusText = (status: Container['status']) => {
    switch (status) {
      case 'loading':
        return 'تحميل بالميناء';
      case 'on_sea':
        return 'مبحر في البحر';
      case 'arrived':
        return 'وصل ميناء التفريغ';
      case 'cleared':
        return 'تم التخليص';
    }
  };

  return (
    <div className="space-y-4 dir-rtl text-right text-xs">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="font-bold text-slate-800 text-sm">الحاويات والتتبع البحري</h2>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="bg-[#164E33] hover:bg-[#1B5E3F] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ إضافة حاوية جديدة</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {containers.map((cont) => {
          const loadedCars = cars.filter((c) => cont.carIds.includes(c.id));

          return (
            <div
              key={cont.id}
              className="bg-[#F9FBFA] border border-slate-100 rounded-2xl p-4 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-mono font-bold text-slate-800 text-sm">{cont.containerNumber}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{cont.shippingLine}</div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-600 bg-white border border-slate-200/60 px-2 py-0.5 rounded-full">
                    {getStatusText(cont.status)}
                  </span>
                  {cont.trackingUrl && (
                    <a
                      href={cont.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-[#164E33] p-1"
                      title="تتبع الشحنة"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => setContainerToEdit(cont)}
                    className="p-1 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="تعديل الحاوية"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setContainerToDelete(cont)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="حذف الحاوية"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white/70 p-2.5 rounded-xl">
                <div>
                  <span className="text-slate-400 text-[10px] block">ميناء التحميل:</span>
                  <span className="font-medium">{cont.loadingPort}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">ميناء الوصول:</span>
                  <span className="font-medium">{cont.destinationPort}</span>
                </div>
              </div>

              {/* Slots */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>السيارات المحملة:</span>
                  <span className="font-bold text-slate-700">{loadedCars.length} / {cont.capacity}</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {Array.from({ length: cont.capacity }).map((_, idx) => {
                    const car = loadedCars[idx];
                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded-xl text-center text-[10px] ${
                          car
                            ? 'bg-white border border-slate-200/80 font-bold text-slate-800 shadow-2xs'
                            : 'bg-transparent border border-dashed border-slate-200 text-slate-300'
                        }`}
                      >
                        {car ? `${car.make} ${car.model}` : 'شاغر'}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <AddContainerModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />

      {containerToEdit && (
        <EditContainerModal
          container={containerToEdit}
          isOpen={!!containerToEdit}
          onClose={() => setContainerToEdit(null)}
        />
      )}

      {containerToDelete && (
        <ConfirmDeleteModal
          isOpen={!!containerToDelete}
          onClose={() => setContainerToDelete(null)}
          onConfirm={() => {
            deleteContainer(containerToDelete.id);
            setContainerToDelete(null);
          }}
          title="حذف الحاوية"
          message={`هل أنت متأكد من حذف الحاوية ${containerToDelete.containerNumber}؟ سيتم فك ارتباط السيارات المحملة بها تلقائياً.`}
        />
      )}
    </div>
  );
};
