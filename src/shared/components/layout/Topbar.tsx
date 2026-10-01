import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  ShieldCheck,
  Zap,
  X,
  Car as CarIcon,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { UserRole, Car } from '../../../types';
import { VinInspectorModal } from '../../../features/cars/VinInspectorModal';
import { CarDetailsModal } from '../../../features/cars/CarDetailsModal';

interface TopbarProps {
  onOpenNewCarModal?: () => void;
  onOpenMobileMenu?: () => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenNewCarModal,
  onOpenMobileMenu,
  searchValue = '',
  onSearchChange,
}) => {
  const { user, switchDemoRole } = useAuth();
  const { cars } = useData();

  const [internalSearch, setInternalSearch] = useState(searchValue);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCarForModal, setSelectedCarForModal] = useState<Car | null>(null);
  const [vinToInspect, setVinToInspect] = useState<string>('');
  const [isVinInspectorOpen, setIsVinInspectorOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (val: string) => {
    setInternalSearch(val);
    if (onSearchChange) onSearchChange(val);
    setIsDropdownOpen(val.trim().length > 0);
  };

  const handleClear = () => {
    setInternalSearch('');
    if (onSearchChange) onSearchChange('');
    setIsDropdownOpen(false);
  };

  const query = internalSearch.trim().toLowerCase();

  const matchingCars = query
    ? cars.filter(
        (c) =>
          c.lotNumber.toLowerCase().includes(query) ||
          c.vin.toLowerCase().includes(query) ||
          `${c.make} ${c.model}`.toLowerCase().includes(query) ||
          c.customerName.toLowerCase().includes(query)
      )
    : [];

  const getInitials = (name?: string) => {
    if (!name) return 'CS';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`;
    return name.slice(0, 2).toUpperCase();
  };

  const handleOpenVinInspector = (vinOrLot: string) => {
    setVinToInspect(vinOrLot);
    setIsVinInspectorOpen(true);
    setIsDropdownOpen(false);
  };

  const handleSelectCar = (car: Car) => {
    setSelectedCarForModal(car);
    setIsDropdownOpen(false);
  };

  return (
    <header className="py-3 sm:py-4 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 dir-rtl shrink-0 border-b border-slate-100/80 relative z-40 bg-white">
      {/* Mobile Drawer Trigger & App Branding (visible on mobile only) */}
      <div className="flex items-center gap-1.5 md:hidden shrink-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-1.5 rounded-xl text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors"
          title="القائمة الجانبية"
        >
          <Menu className="w-5 h-5 text-slate-800" />
        </button>
        <div className="flex items-center gap-1 font-bold text-xs sm:text-sm text-[#164E33]">
          <div className="w-6 h-6 rounded-lg bg-[#164E33] text-white flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 fill-white" />
          </div>
          <span className="hidden xs:inline">CarShip</span>
        </div>
      </div>

      {/* 1. Global Universal Search Bar (Supports Lot #, VIN, Make, Model, Customer) */}
      <div ref={searchContainerRef} className="relative flex-1 max-w-[200px] xs:max-w-xs sm:w-80 md:w-96 min-w-0">
        <div className="relative">
          <input
            type="text"
            value={internalSearch}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (internalSearch.trim().length > 0) setIsDropdownOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (matchingCars.length === 1) {
                  handleSelectCar(matchingCars[0]);
                } else if (internalSearch.trim()) {
                  handleOpenVinInspector(internalSearch);
                }
              }
            }}
            placeholder="بحث برقم اللوت، الشاصي، الموديل..."
            className="w-full bg-[#F7F9F8] border border-slate-200/80 rounded-full pr-8 pl-8 sm:pr-9 sm:pl-9 py-1.5 sm:py-2 text-[11px] sm:text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#164E33]/30 shadow-2xs"
          />
          <button
            type="button"
            onClick={() => internalSearch.trim() && handleOpenVinInspector(internalSearch)}
            title="فحص فوري"
            className="absolute right-2.5 top-1.5 sm:top-2 p-0.5 text-slate-400 hover:text-[#164E33] cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          {internalSearch && (
            <button
              onClick={handleClear}
              className="absolute left-2.5 top-2 sm:top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          )}
        </div>

        {/* Real-Time Live Search Results Dropdown */}
        {isDropdownOpen && internalSearch.trim().length > 0 && (
          <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden z-50 text-right dir-rtl animate-in fade-in slide-in-from-top-1 duration-150 max-h-96 overflow-y-auto">
            {/* Header / Query badge */}
            <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">
                البحث عن: <strong className="text-slate-800 font-mono">"{internalSearch}"</strong>
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {matchingCars.length > 0 ? `${matchingCars.length} سيارة بالأسطول` : 'فحص فيدرالي'}
              </span>
            </div>

            {/* Direct VIN / Lot Inspector Action Tile */}
            <div className="p-2 border-b border-slate-100 bg-emerald-50/40">
              <button
                onClick={() => handleOpenVinInspector(internalSearch)}
                className="w-full p-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 flex items-center justify-between text-xs transition-all group cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#164E33] text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800 group-hover:text-[#164E33] block text-[11px]">
                      فحص الشاصي الفيدرالي (NHTSA) المباشر
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      فك تشفير مواصفات: {internalSearch.toUpperCase()}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs">
                  <Zap className="w-3 h-3 fill-slate-900" />
                  <span>فحص الآن ⚡</span>
                </span>
              </button>
            </div>

            {/* Matching Cars List */}
            {matchingCars.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {matchingCars.map((car) => (
                  <div
                    key={car.id}
                    className="p-3 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-2"
                  >
                    <div
                      onClick={() => handleSelectCar(car)}
                      className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/60">
                        <CarIcon className="w-4 h-4 text-[#164E33]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 text-xs truncate">
                          {car.year} {car.make} {car.model}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[10px]">
                          <span className="bg-slate-100 text-slate-700 font-mono px-1.5 py-0.2 rounded-md font-semibold">
                            لوت: {car.lotNumber}
                          </span>
                          <span className="bg-emerald-50 text-emerald-800 font-mono px-1.5 py-0.2 rounded-md font-semibold">
                            VIN: {car.vin.slice(0, 10)}...
                          </span>
                          <span className="text-slate-400">العميل: {car.customerName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenVinInspector(car.vin)}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="فحص مواصفات الشاصي من المرور الأمريكي NHTSA"
                      >
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>فحص NHTSA</span>
                      </button>

                      <button
                        onClick={() => handleSelectCar(car)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer"
                        title="عرض كارت تفاصيل السيارة والشحن"
                      >
                        <span>تفاصيل</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 bg-gradient-to-b from-emerald-50/40 via-white to-slate-50 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center mx-auto shadow-2xs">
                  <ShieldCheck className="w-6 h-6 text-emerald-700" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800">
                    السيارة غير مسجلة في أسطولك المحلي
                  </h4>
                  <p className="text-[11px] text-slate-600 max-w-xs mx-auto leading-relaxed">
                    لم نجدها في قاعدة بيانات سياراتك، ولكن يمكنك فحص هذا الشاصي مباشرة من قاعدة بيانات هيئة المرور الأمريكية الرسمية (NHTSA):
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenVinInspector(internalSearch)}
                  className="w-full bg-[#164E33] hover:bg-[#123E28] text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
                >
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>فحص الشاصي ({internalSearch.toUpperCase()}) من المرور الأمريكي ⚡</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Top Right Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* VIN Inspector Modal Trigger */}
        <button
          type="button"
          onClick={() => {
            setVinToInspect('');
            setIsVinInspectorOpen(true);
          }}
          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/90 text-[10px] sm:text-[11px] font-bold px-2 sm:px-3 py-1.5 rounded-full transition-all flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
          title="فحص وتدقيق رقم الشاصي من المرور الأمريكي NHTSA"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="hidden sm:inline">فاحص الشاصي</span>
          <span className="sm:hidden">NHTSA</span>
        </button>

        {/* Subtle Role Switcher - visible on md+, on mobile available inside drawer */}
        <select
          value={user?.role || 'super_admin'}
          onChange={(e) => switchDemoRole(e.target.value as UserRole)}
          className="hidden md:inline-block bg-[#F7F9F8] border border-slate-200/60 text-[11px] font-medium text-slate-600 rounded-full px-2.5 py-1.5 outline-none cursor-pointer"
        >
          <option value="super_admin">سوبر أدمن</option>
          <option value="admin">أدمن</option>
          <option value="staff">موظف</option>
          <option value="exchange_agent">صرافة</option>
          <option value="customer">عميل</option>
        </select>

        {/* Dark Green Capsule CTA Button (Staff/Admin only) */}
        {onOpenNewCarModal && user?.role !== 'customer' && (
          <button
            onClick={onOpenNewCarModal}
            className="bg-[#164E33] hover:bg-[#1B5E3F] text-white text-[11px] sm:text-xs font-semibold px-2.5 sm:px-4 py-1.5 rounded-full transition-all shadow-xs active:scale-98 cursor-pointer flex items-center gap-1"
          >
            <span>+</span>
            <span className="hidden sm:inline">إضافة سيارة</span>
          </button>
        )}

        {/* Bell Icon */}
        <button className="text-slate-500 hover:text-slate-800 p-1 sm:p-1.5 rounded-full hover:bg-slate-100 transition-colors">
          <Bell className="w-4 h-4" />
        </button>

        {/* User Avatar Circle with Initials */}
        <div
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#164E33] text-white flex items-center justify-center font-bold text-[11px] sm:text-xs shadow-xs shrink-0"
          title={`${user?.fullName} (${user?.role})`}
        >
          {getInitials(user?.fullName)}
        </div>
      </div>

      {/* Vin Inspector Modal */}
      <VinInspectorModal
        isOpen={isVinInspectorOpen}
        onClose={() => {
          setIsVinInspectorOpen(false);
          setVinToInspect('');
        }}
        initialVin={vinToInspect}
        onSelectCarToAdd={() => {
          setIsVinInspectorOpen(false);
          if (onOpenNewCarModal) onOpenNewCarModal();
        }}
      />

      {/* Selected Car Details Modal */}
      {selectedCarForModal && (
        <CarDetailsModal
          car={selectedCarForModal}
          isOpen={!!selectedCarForModal}
          onClose={() => setSelectedCarForModal(null)}
        />
      )}
    </header>
  );
};
