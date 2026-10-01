import React, { useState } from 'react';
import { Modal } from '../../shared/components/ui/Modal';
import { Button } from '../../shared/components/ui/Button';
import { User, AppPageKey } from '../../types';
import { useData } from '../../shared/context/DataContext';
import { formatDate } from '../../shared/lib/formatters';
import {
  UserCheck,
  Shield,
  Activity,
  CheckCircle2,
  XCircle,
  LayoutDashboard,
  Car,
  Container as ContainerIcon,
  FileText,
  Coins,
  MapPin,
  Calculator,
  Users,
  Search,
  Clock,
  Edit3,
  Calendar,
  Phone,
  Mail,
  SlidersHorizontal,
} from 'lucide-react';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onEditUser?: (user: User) => void;
}

const ALL_PAGES: Array<{ key: AppPageKey; label: string; icon: any; desc: string }> = [
  { key: 'dashboard', label: 'لوحة التحكم الرئيسية', icon: LayoutDashboard, desc: 'الإحصائيات العامة والمؤشرات' },
  { key: 'customers', label: 'العملاء وكشوفات الحساب', icon: UserCheck, desc: 'كشوفات الذمم ومطالبات الزبائن' },
  { key: 'cars', label: 'السيارات والشحنات', icon: Car, desc: 'إدارة وتتبع سيارات المزاد' },
  { key: 'containers', label: 'الحاويات والشحن البحري', icon: ContainerIcon, desc: 'تسكين وتتبع الحاويات' },
  { key: 'invoices', label: 'الفواتير والمطالبات', icon: FileText, desc: 'إصدار وتدقيق وقفل الفواتير' },
  { key: 'exchange', label: 'مكاتب الصرافة والحوالات', icon: Coins, desc: 'حركات الحوالات وأرصدة المكاتب' },
  { key: 'logistics', label: 'الموانئ والمسارات', icon: MapPin, desc: 'أسعار النقل والموانئ الأمريكية' },
  { key: 'calculator', label: 'حاسبة التكاليف التقديرية', icon: Calculator, desc: 'حساب كلفة الشحن المباشرة' },
  { key: 'users', label: 'إدارة الموظفين والصلاحيات', icon: Users, desc: 'خاصة بالسوبر أدمن' },
];

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  isOpen,
  onClose,
  user,
  onEditUser,
}) => {
  const { auditLogs } = useData();

  const [activeTab, setActiveTab] = useState<'timeline' | 'pages' | 'permissions'>('timeline');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  if (!user) return null;

  // استخراج سجل النشاطات الخاص بهذا الموظف
  const userLogs = auditLogs.filter(
    (log) => log.userId === user.id || log.userName.toLowerCase() === user.fullName.toLowerCase()
  );

  const filteredLogs = userLogs.filter((log) => {
    const matchesEntity = filterEntity === 'all' || log.entityType === filterEntity;
    const matchesSearch =
      !searchKeyword ||
      log.actionTitle.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchKeyword.toLowerCase()));
    return matchesEntity && matchesSearch;
  });

  const isSuperAdmin = user.role === 'super_admin';
  const allowedPages = user.permissions?.allowedPages;

  const isPagePermitted = (pageKey: AppPageKey) => {
    if (isSuperAdmin) return true;
    if (pageKey === 'users') return false;
    if (!allowedPages || allowedPages.length === 0) {
      // Default roles allowance
      if (user.role === 'admin') return true;
      if (user.role === 'staff') return ['dashboard', 'customers', 'cars', 'containers', 'invoices', 'calculator'].includes(pageKey);
      if (user.role === 'exchange_agent') return ['exchange', 'calculator'].includes(pageKey);
      return false;
    }
    return allowedPages.includes(pageKey);
  };

  const getRoleBadge = (role: User['role']) => {
    switch (role) {
      case 'super_admin':
        return { label: 'سوبر أدمن (Super Admin)', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' };
      case 'admin':
        return { label: 'أدمن تشغيلي (Admin)', color: 'bg-blue-50 text-blue-800 border-blue-300' };
      case 'staff':
        return { label: 'موظف عمليات (Staff)', color: 'bg-slate-100 text-slate-800 border-slate-300' };
      case 'exchange_agent':
        return { label: 'مندوب صيرفة (Exchange)', color: 'bg-amber-50 text-amber-800 border-amber-300' };
      case 'customer':
        return { label: 'عميل (Customer)', color: 'bg-purple-50 text-purple-800 border-purple-300' };
    }
  };

  const roleInfo = getRoleBadge(user.role);

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('ADD')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (action.includes('UPDATE') || action.includes('EDIT')) {
      return 'bg-blue-50 text-blue-800 border-blue-200';
    }
    if (action.includes('DELETE') || action.includes('REMOVE')) {
      return 'bg-rose-50 text-rose-800 border-rose-200';
    }
    if (action.includes('LOCK')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const formatLogTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return `${formatDate(timestamp)} - ${date.toLocaleTimeString('ar-IQ', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } catch {
      return formatDate(timestamp);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`ملف وسجل الموظف: ${user.fullName}`}
      maxWidth="3xl"
    >
      <div className="space-y-4 dir-rtl text-right text-xs">
        {/* User Profile Header Card */}
        <div className="bg-[#F9FBFA] border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#164E33] text-white font-black text-base flex items-center justify-center shadow-xs">
              {user.fullName.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-sm">{user.fullName}</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleInfo.color}`}
                >
                  {roleInfo.label}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    user.isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {user.isActive ? 'حساب نشط' : 'حساب معطل'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px] mt-1">
                {user.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{user.phone}</span>
                  </span>
                )}
                {user.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{user.email}</span>
                  </span>
                )}
                <span className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-3 h-3" />
                  <span>تاريخ الإنشاء: {formatDate(user.createdAt)}</span>
                </span>
              </div>
            </div>
          </div>

          {onEditUser && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onEditUser(user);
              }}
              className="gap-1.5 text-xs font-bold shrink-0 self-end sm:self-center"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#164E33]" />
              <span>تعديل الصلاحيات</span>
            </Button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'bg-[#164E33] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>سجل النشاطات والحركات المنجزة</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'timeline' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {userLogs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pages')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'pages'
                ? 'bg-[#164E33] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>الصفحات المصرح له بها</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'pages' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {ALL_PAGES.filter((p) => isPagePermitted(p.key)).length} / {ALL_PAGES.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('permissions')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'permissions'
                ? 'bg-[#164E33] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>الصلاحيات الإجرائية المحددة</span>
          </button>
        </div>

        {/* 1. TAB: سجل النشاطات (Activity Audit Timeline) */}
        {activeTab === 'timeline' && (
          <div className="space-y-3">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="بحث في سجل العمليات، التعديلات أو أرقام اللوت..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pr-8 pl-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
                <span className="text-slate-400 shrink-0 flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>تصفية:</span>
                </span>
                {[
                  { key: 'all', label: 'الكل' },
                  { key: 'car', label: 'السيارات' },
                  { key: 'invoice', label: 'الفواتير' },
                  { key: 'transfer', label: 'الحوالات' },
                  { key: 'container', label: 'الحاويات' },
                  { key: 'user', label: 'المستخدمين' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFilterEntity(item.key)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 ${
                      filterEntity === item.key
                        ? 'bg-slate-800 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline Stream */}
            {filteredLogs.length > 0 ? (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-white border border-slate-200/80 rounded-2xl hover:border-slate-300 transition-all space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                        <h4 className="font-bold text-slate-800 text-xs">{log.actionTitle}</h4>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{formatLogTimestamp(log.timestamp)}</span>
                      </div>
                    </div>

                    {log.details && (
                      <p className="text-[11px] text-slate-600 bg-slate-50/80 p-2 rounded-xl border border-slate-100 leading-relaxed font-sans">
                        {log.details}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <Activity className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-600 text-xs">لا توجد عمليات مسجلة لهذا الموظف</p>
                <p className="text-[11px] text-slate-400">
                  أي عملية إضافة أو تعديل أو حذف يقوم بها الموظف ستُسجل تلقائياً هنا في سجله.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 2. TAB: الصفحات المصرح بها (Allowed Pages) */}
        {activeTab === 'pages' && (
          <div className="space-y-3">
            <div className="bg-emerald-50/60 border border-emerald-200 p-3 rounded-xl flex items-center justify-between text-xs">
              <span className="text-emerald-950 font-bold">
                الصفحات الظاهرة للموظف في القائمة الجانبية والمسموح بفتحها:
              </span>
              <span className="text-[11px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                {isSuperAdmin
                  ? 'صلاحية كاملة (Super Admin)'
                  : `${ALL_PAGES.filter((p) => isPagePermitted(p.key)).length} صفحات مفعلة`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto">
              {ALL_PAGES.map((page) => {
                const isPermitted = isPagePermitted(page.key);
                const PageIcon = page.icon;

                return (
                  <div
                    key={page.key}
                    className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      isPermitted
                        ? 'bg-white border-emerald-200 shadow-2xs'
                        : 'bg-slate-50/70 border-slate-200/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isPermitted
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        <PageIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <span
                          className={`font-bold text-xs block ${
                            isPermitted ? 'text-slate-800' : 'text-slate-500'
                          }`}
                        >
                          {page.label}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {page.desc}
                        </span>
                      </div>
                    </div>

                    <div>
                      {isPermitted ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>مسموح</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" />
                          <span>محجوب</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. TAB: الصلاحيات الإجرائية (Action Permissions) */}
        {activeTab === 'permissions' && (
          <div className="space-y-3">
            <div className="bg-[#F9FBFA] border border-slate-200 rounded-2xl p-4 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs">الصلاحيات الإجرائية الدقيقة الممنوحة:</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  {
                    title: 'إضافة سيارات جديدة للمزاد',
                    allowed: isSuperAdmin || user.permissions?.canAddCars !== false,
                  },
                  {
                    title: 'تعديل بيانات وحالات شحن السيارات',
                    allowed: isSuperAdmin || user.permissions?.canEditCars !== false,
                  },
                  {
                    title: 'حذف السيارات من النظام',
                    allowed: isSuperAdmin || user.permissions?.canDeleteCars === true,
                  },
                  {
                    title: 'إنشاء وإصدار فواتير مالية جديدة',
                    allowed: isSuperAdmin || user.permissions?.canCreateInvoices !== false,
                  },
                  {
                    title: 'تعديل الفواتير والخصومات والموجودات',
                    allowed: isSuperAdmin || user.permissions?.canEditInvoices !== false,
                  },
                  {
                    title: 'قفل وفك قفل الفواتير المالية',
                    allowed: isSuperAdmin || user.permissions?.canLockUnlockInvoices === true,
                  },
                  {
                    title: 'حذف الفواتير المالية',
                    allowed: isSuperAdmin || user.permissions?.canDeleteInvoices === true,
                  },
                  {
                    title: 'إدارة الحاويات والشحن البحري',
                    allowed: isSuperAdmin || user.permissions?.canManageContainers !== false,
                  },
                  {
                    title: 'تسجيل الحوالات وسندات الصرافة',
                    allowed: isSuperAdmin || user.permissions?.canManageExchange === true,
                  },
                  {
                    title: 'إدارة وتعديل حسابات العملاء',
                    allowed: isSuperAdmin || user.permissions?.canManageCustomers !== false,
                  },
                  {
                    title: 'تعديل الموانئ والولايات والمسارات',
                    allowed: isSuperAdmin || user.permissions?.canManageLogistics === true,
                  },
                  {
                    title: 'إدارة الموظفين وتعديل الصلاحيات',
                    allowed: isSuperAdmin || user.permissions?.canManageStaff === true,
                  },
                ].map((perm, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between"
                  >
                    <span className="font-medium text-slate-700">{perm.title}</span>
                    {perm.allowed ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>متاح</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" />
                        <span>غير متاح</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal Actions Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
          <div className="text-[11px] text-slate-400">
            <span>إجمالي النشاطات المسجلة: </span>
            <span className="font-bold text-slate-700">{userLogs.length} عملية</span>
          </div>

          <Button type="button" variant="primary" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </div>
    </Modal>
  );
};