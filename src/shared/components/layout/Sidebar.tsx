import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Car,
  Container as ContainerIcon,
  FileText,
  Coins,
  MapPin,
  Calculator,
  Users,
  UserCheck,
  LogOut,
  CarTaxiFront,
  Zap,
} from 'lucide-react';
import { AppPageKey } from '../../../types';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const role = user?.role;

  const navItems: Array<{
    to: string;
    label: string;
    icon: any;
    pageKey?: AppPageKey;
    roles: string[];
  }> = [
    { to: '/dashboard', label: 'الرئيسية', icon: LayoutDashboard, pageKey: 'dashboard', roles: ['super_admin', 'admin', 'staff'] },
    { to: '/customers', label: 'العملاء والحسابات', icon: UserCheck, pageKey: 'customers', roles: ['super_admin', 'admin', 'staff'] },
    { to: '/cars', label: 'السيارات', icon: Car, pageKey: 'cars', roles: ['super_admin', 'admin', 'staff'] },
    { to: '/containers', label: 'الحاويات', icon: ContainerIcon, pageKey: 'containers', roles: ['super_admin', 'admin', 'staff'] },
    { to: '/invoices', label: 'الفواتير', icon: FileText, pageKey: 'invoices', roles: ['super_admin', 'admin', 'staff'] },
    { to: '/exchange', label: 'الصرافة', icon: Coins, pageKey: 'exchange', roles: ['super_admin', 'admin', 'exchange_agent'] },
    { to: '/logistics', label: 'الموانئ والولايات', icon: MapPin, pageKey: 'logistics', roles: ['super_admin', 'admin'] },
    { to: '/calculator', label: 'الحاسبة', icon: Calculator, pageKey: 'calculator', roles: ['super_admin', 'admin', 'staff', 'exchange_agent', 'customer'] },
    { to: '/my-cars', label: 'كراجي', icon: CarTaxiFront, roles: ['customer'] },
    { to: '/users', label: 'الموظفين', icon: Users, pageKey: 'users', roles: ['super_admin', 'admin'] },
  ];

  const allowedNavItems = navItems.filter((item) => {
    // 1. Role verification
    if (item.roles && (!role || !item.roles.includes(role))) {
      return false;
    }
    // 2. Super Admin always gets access to all matching roles
    if (role === 'super_admin') {
      return true;
    }
    // 3. Check granular page access if configured
    if (item.pageKey && user?.permissions?.allowedPages && user.permissions.allowedPages.length > 0) {
      return user.permissions.allowedPages.includes(item.pageKey);
    }
    return true;
  });

  return (
    <aside className="hidden md:flex w-56 bg-[#164E33] text-white p-6 flex-col justify-between shrink-0 select-none dir-rtl">
      <div>
        {/* Brand Logo Header */}
        <div className="flex items-center gap-2.5 px-2 mb-10">
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-white">
            <Zap className="w-4 h-4 fill-white" />
          </div>
          <span className="font-bold text-base tracking-wide text-white">CarShip</span>
        </div>

        {/* Minimal Navigation List */}
        <nav className="space-y-4 text-xs font-medium">
          {allowedNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'text-white font-bold opacity-100'
                    : 'text-white/70 hover:text-white hover:opacity-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 opacity-90" />
                    <span>{item.label}</span>
                  </div>
                  {/* Active Indicator Dot */}
                  {isActive && (
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Clean White Capsule Logout Button */}
      <div className="pt-6">
        <button
          onClick={logout}
          className="w-full bg-white hover:bg-slate-100 text-slate-800 rounded-full py-2 px-4 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-700" />
          <span>خروج</span>
        </button>
      </div>
    </aside>
  );
};
