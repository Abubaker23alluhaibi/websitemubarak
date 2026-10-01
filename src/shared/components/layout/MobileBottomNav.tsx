import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  FileText,
  Coins,
  Menu,
  Calculator,
  CarTaxiFront,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileBottomNavProps {
  onOpenMenu: () => void;
  onOpenNewCarModal?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenMenu,
}) => {
  const { user } = useAuth();
  const role = user?.role;

  // Primary bottom tabs based on role
  const getNavItems = () => {
    if (role === 'customer') {
      return [
        { to: '/my-cars', label: 'كراجي', icon: CarTaxiFront },
        { to: '/calculator', label: 'الحاسبة', icon: Calculator },
      ];
    }
    if (role === 'exchange_agent') {
      return [
        { to: '/exchange', label: 'الصرافة', icon: Coins },
        { to: '/calculator', label: 'الحاسبة', icon: Calculator },
      ];
    }
    // Default for Admin, Super Admin, Staff
    return [
      { to: '/dashboard', label: 'الرئيسية', icon: LayoutDashboard },
      { to: '/cars', label: 'السيارات', icon: Car },
      { to: '/invoices', label: 'الفواتير', icon: FileText },
      { to: '/exchange', label: 'الصرافة', icon: Coins },
    ];
  };

  const navItems = getNavItems();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around dir-rtl select-none">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-150 relative min-w-[56px] ${
              isActive
                ? 'text-[#164E33] font-bold'
                : 'text-slate-400 hover:text-slate-700 font-medium'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-[#EBF3EE] text-[#164E33]' : 'text-slate-500'
                }`}
              >
                <item.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 leading-none">{item.label}</span>
              {isActive && (
                <span className="w-1 h-1 bg-[#164E33] rounded-full absolute -bottom-0.5" />
              )}
            </>
          )}
        </NavLink>
      ))}

      {/* "المزيد" / More Drawer Toggle Button */}
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-150 text-slate-400 hover:text-slate-700 font-medium min-w-[56px] cursor-pointer"
        title="فتح القائمة الكاملة"
      >
        <div className="p-1.5 rounded-xl text-slate-500">
          <Menu className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5 leading-none">المزيد</span>
      </button>
    </nav>
  );
};
