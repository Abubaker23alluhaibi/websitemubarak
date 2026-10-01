import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  X,
  Plus,
  Shield,
} from 'lucide-react';
import { AppPageKey, UserRole } from '../../../types';
import { useAuth } from '../../context/AuthContext';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewCarModal?: () => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
  onOpenNewCarModal,
}) => {
  const { user, logout, switchDemoRole } = useAuth();
  const location = useLocation();
  const role = user?.role;

  // Auto-close drawer whenever route changes
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location.pathname]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const navItems: Array<{
    to: string;
    label: string;
    icon: any;
    pageKey?: AppPageKey;
    roles: string[];
    badge?: string;
  }> = [
    { to: '/dashboard', label: 'الرئيسية', icon: LayoutDashboard, pageKey: 'dashboard', roles: ['super_admin', 'admin', 'staff'] },
    { to: '/cars', label: 'السيارات والشحنات', icon: Car, pageKey: 'cars', roles: ['super_admin', 'admin', 'staff'] },
    { to: '/customers', label: 'العملاء والحسابات', icon: UserCheck, pageKey: 'customers', roles: ['super_admin', 'admin', 'staff'] },
    { to: '/invoices', label: 'الفواتير والمطالبات', icon: FileText, pageKey: 'invoices', roles: ['super_admin', 'admin', 'staff'] },
    { to: '/exchange', label: 'الصرافة والحوالات', icon: Coins, pageKey: 'exchange', roles: ['super_admin', 'admin', 'exchange_agent'] },
    { to: '/containers', label: 'الحاويات اللوجستية', icon: ContainerIcon, pageKey: 'containers', roles: ['super_admin', 'admin', 'staff'] },
    { to: '/logistics', label: 'الموانئ والولايات', icon: MapPin, pageKey: 'logistics', roles: ['super_admin', 'admin'] },
    { to: '/calculator', label: 'حاسبة التكاليف', icon: Calculator, pageKey: 'calculator', roles: ['super_admin', 'admin', 'staff', 'exchange_agent', 'customer'] },
    { to: '/my-cars', label: 'كراجي ومشترياتي', icon: CarTaxiFront, roles: ['customer'] },
    { to: '/users', label: 'إدارة المستخدمين', icon: Users, pageKey: 'users', roles: ['super_admin', 'admin'] },
  ];

  const allowedNavItems = navItems.filter((item) => {
    if (item.roles && (!role || !item.roles.includes(role))) {
      return false;
    }
    if (role === 'super_admin') {
      return true;
    }
    if (item.pageKey && user?.permissions?.allowedPages && user.permissions.allowedPages.length > 0) {
      return user.permissions.allowedPages.includes(item.pageKey);
    }
    return true;
  });

  const getRoleLabel = (r?: UserRole) => {
    switch (r) {
      case 'super_admin':
        return 'المدير العام (Super Admin)';
      case 'admin':
        return 'مدير النظام (Admin)';
      case 'staff':
        return 'موظف عمليات (Staff)';
      case 'exchange_agent':
        return 'وكيل صرافة (Agent)';
      case 'customer':
        return 'عميل مشترٍ (Customer)';
      default:
        return 'مستخدم';
    }
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden dir-rtl">
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-[#123E28] text-white flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-right duration-200">
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Header with Brand & Close Button */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white shadow-xs">
                <Zap className="w-4 h-4 fill-white" />
              </div>
              <div>
                <h3 className="font-black text-sm tracking-wide text-white">CarShip Pro</h3>
                <span className="text-[10px] text-emerald-300/80">نظام إدارة الشحن والمحاسبة</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              title="إغلاق القائمة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card */}
          <div className="bg-white/10 border border-white/15 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                {user?.fullName?.slice(0, 2) || 'CS'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-white truncate">{user?.fullName || 'المستخدم'}</div>
                <div className="text-[10px] text-emerald-300 font-mono mt-0.5 truncate">
                  @{user?.username}
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
              <span className="text-white/60">الدور الحالي:</span>
              <span className="font-bold text-emerald-300 bg-white/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-300" />
                <span>{getRoleLabel(user?.role)}</span>
              </span>
            </div>
          </div>

          {/* Quick Action Button for Admin/Staff */}
          {onOpenNewCarModal && user?.role !== 'customer' && (
            <button
              onClick={() => {
                onClose();
                onOpenNewCarModal();
              }}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>إضافة سيارة جديدة</span>
            </button>
          )}

          {/* Navigation Items */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-white/50 px-2 uppercase tracking-wider block mb-1">
              أقسام النظام
            </span>
            <nav className="space-y-1">
              {allowedNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-xs font-semibold ${
                      isActive
                        ? 'bg-white/20 text-white font-bold shadow-xs'
                        : 'text-white/75 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 shrink-0 text-emerald-300" />
                        <span>{item.label}</span>
                      </div>
                      {isActive && (
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-xs" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Quick Demo Role Switcher */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-1.5">
            <span className="text-[10px] font-bold text-white/60 block">تبديل دور المستخدم (تجريبي):</span>
            <select
              value={user?.role || 'super_admin'}
              onChange={(e) => switchDemoRole(e.target.value as UserRole)}
              className="w-full bg-[#164E33] border border-white/20 text-xs text-white rounded-xl px-2.5 py-1.5 outline-none cursor-pointer"
            >
              <option value="super_admin">سوبر أدمن (Super Admin)</option>
              <option value="admin">مدير النظام (Admin)</option>
              <option value="staff">موظف عمليات (Staff)</option>
              <option value="exchange_agent">وكيل صرافة (Agent)</option>
              <option value="customer">عميل مشترٍ (Customer)</option>
            </select>
          </div>
        </div>

        {/* Footer Logout Button */}
        <div className="p-4 border-t border-white/10 bg-[#0E3220]">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full bg-white/10 hover:bg-red-500/20 text-white border border-white/20 hover:border-red-400/50 rounded-xl py-2.5 px-4 text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-red-300" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </div>
  );
};
