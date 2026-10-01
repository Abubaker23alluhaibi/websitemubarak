import React, { useState, useEffect } from 'react';
import { Modal } from '../../shared/components/ui/Modal';
import { Input } from '../../shared/components/ui/Input';
import { Button } from '../../shared/components/ui/Button';
import { useData } from '../../shared/context/DataContext';
import { User, UserRole, AppPageKey, UserPermissions } from '../../types';
import {
  LayoutDashboard,
  Car,
  Container as ContainerIcon,
  FileText,
  Coins,
  MapPin,
  Calculator,
  UserCheck,
  Shield,
} from 'lucide-react';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const AVAILABLE_PAGES: Array<{ key: AppPageKey; label: string; icon: any }> = [
  { key: 'dashboard', label: 'لوحة التحكم الرئيسية', icon: LayoutDashboard },
  { key: 'customers', label: 'العملاء والحسابات', icon: UserCheck },
  { key: 'cars', label: 'السيارات والشحنات', icon: Car },
  { key: 'containers', label: 'الحاويات والشحن البحري', icon: ContainerIcon },
  { key: 'invoices', label: 'الفواتير والمطالبات', icon: FileText },
  { key: 'exchange', label: 'الصرافة والحوالات', icon: Coins },
  { key: 'logistics', label: 'الموانئ والولايات', icon: MapPin },
  { key: 'calculator', label: 'حاسبة التكاليف', icon: Calculator },
];

export const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user }) => {
  const { updateUser } = useData();

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    role: 'staff' as UserRole,
    isActive: true,
  });

  const [newPassword, setNewPassword] = useState('');

  const [allowedPages, setAllowedPages] = useState<AppPageKey[]>([
    'dashboard',
    'customers',
    'cars',
    'containers',
    'invoices',
    'calculator',
  ]);

  const [actions, setActions] = useState({
    canAddCars: true,
    canEditCars: true,
    canDeleteCars: false,
    canCreateInvoices: true,
    canEditInvoices: true,
    canLockUnlockInvoices: false,
    canDeleteInvoices: false,
    canManageContainers: true,
    canManageExchange: false,
    canManageCustomers: true,
    canManageLogistics: false,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'staff',
        isActive: user.isActive ?? true,
      });

      setNewPassword('');

      if (user.permissions?.allowedPages) {
        setAllowedPages(user.permissions.allowedPages);
      } else {
        // Default based on role
        if (user.role === 'admin') {
          setAllowedPages(['dashboard', 'customers', 'cars', 'containers', 'invoices', 'exchange', 'calculator']);
        } else if (user.role === 'exchange_agent') {
          setAllowedPages(['exchange', 'calculator']);
        } else {
          setAllowedPages(['dashboard', 'customers', 'cars', 'containers', 'invoices', 'calculator']);
        }
      }

      if (user.permissions) {
        setActions({
          canAddCars: user.permissions.canAddCars ?? true,
          canEditCars: user.permissions.canEditCars ?? true,
          canDeleteCars: user.permissions.canDeleteCars ?? false,
          canCreateInvoices: user.permissions.canCreateInvoices ?? true,
          canEditInvoices: user.permissions.canEditInvoices ?? true,
          canLockUnlockInvoices: user.permissions.canLockUnlockInvoices ?? false,
          canDeleteInvoices: user.permissions.canDeleteInvoices ?? false,
          canManageContainers: user.permissions.canManageContainers ?? true,
          canManageExchange: user.permissions.canManageExchange ?? (user.role === 'exchange_agent' || user.role === 'admin'),
          canManageCustomers: user.permissions.canManageCustomers ?? true,
          canManageLogistics: user.permissions.canManageLogistics ?? (user.role === 'admin'),
        });
      }
    }
  }, [user]);

  if (!user) return null;

  const togglePage = (key: AppPageKey) => {
    setAllowedPages((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const selectAllPages = () => {
    setAllowedPages(AVAILABLE_PAGES.map((p) => p.key));
  };

  const deselectAllPages = () => {
    setAllowedPages([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.username.trim()) return;

    const newPermissions: UserPermissions = {
      allowedPages,
      ...actions,
    };

    const updated: any = {
      ...user,
      fullName: formData.fullName.trim(),
      username: formData.username.trim().toLowerCase(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      role: formData.role,
      isActive: formData.isActive,
      permissions: newPermissions,
    };

    if (newPassword.trim()) {
      updated.password = newPassword.trim();
    }

    updateUser(updated);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`تعديل حساب وصلاحيات: ${user.fullName}`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 dir-rtl text-right text-xs">
        {/* Basic User Information */}
        <div className="bg-[#F9FBFA] p-3.5 rounded-2xl border border-slate-200/90 space-y-3">
          <Input
            label="الاسم الكامل للموظف / المستخدم"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="اسم المستخدم (Username)"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                الدور الأساسي في النظام
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#164E33]"
              >
                <option value="super_admin">سوبر أدمن (Super Admin - صلاحية مطلقة)</option>
                <option value="admin">أدمن تشغيلي (Admin)</option>
                <option value="staff">موظف عمليات ومتابعة (Staff)</option>
                <option value="exchange_agent">مندوب صيرفة (Exchange Agent)</option>
                <option value="customer">عميل (Customer)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="رقم الهاتف"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            <Input
              label="البريد الإلكتروني"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
            <input
              type="checkbox"
              id="user-active-toggle"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded text-[#164E33] focus:ring-[#164E33]"
            />
            <label htmlFor="user-active-toggle" className="font-bold text-slate-700 cursor-pointer text-xs">
              حساب الموظف نشط ومفعل لتسجيل الدخول
            </label>
          </div>

          <div className="pt-2 border-t border-slate-200/60">
            <Input
              label="تعيين كلمة مرور جديدة للموظف (اتركه فارغاً للإبقاء على الحالية)"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
        </div>

        {/* 1. Page-Level Access Control (الصفحات المسموحة) */}
        {formData.role !== 'super_admin' && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <LayoutDashboard className="w-4 h-4 text-[#164E33]" />
                  <span>الصفحات المسموح للموظف برؤيتها والدخول عليها:</span>
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllPages}
                  className="text-[10px] text-emerald-800 font-bold hover:underline"
                >
                  تحديد الكل
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={deselectAllPages}
                  className="text-[10px] text-slate-500 font-bold hover:underline"
                >
                  إلغاء التحديد
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {AVAILABLE_PAGES.map((page) => {
                const isSelected = allowedPages.includes(page.key);
                const PageIcon = page.icon;

                return (
                  <button
                    key={page.key}
                    type="button"
                    onClick={() => togglePage(page.key)}
                    className={`p-2.5 rounded-xl border text-right transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-bold shadow-2xs ring-1 ring-emerald-300'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <PageIcon
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-[#164E33]' : 'text-slate-400'
                      }`}
                    />
                    <span className="text-[11px] truncate">{page.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. Granular Action Permissions (الصلاحيات الإجرائية الدقيقة) */}
        {formData.role !== 'super_admin' && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#164E33]" />
              <span>الصلاحيات الإجرائية المحددة للموظف:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { key: 'canAddCars', label: 'إضافة وتثبيت سيارات جديدة' },
                { key: 'canEditCars', label: 'تعديل بيانات وحالات الشحن للسيارات' },
                { key: 'canDeleteCars', label: 'حذف السيارات من النظام (خطر)' },
                { key: 'canCreateInvoices', label: 'إنشاء وإصدار فواتير مالية' },
                { key: 'canEditInvoices', label: 'تعديل الفواتير وإدراج الخصومات' },
                { key: 'canLockUnlockInvoices', label: 'قفل وفك قفل الفواتير المالية' },
                { key: 'canDeleteInvoices', label: 'حذف الفواتير المالية' },
                { key: 'canManageContainers', label: 'إضافة وتعديل وحزم الحاويات' },
                { key: 'canManageExchange', label: 'تسجيل وتعديل الحوالات وسندات الصرافة' },
                { key: 'canManageCustomers', label: 'إضافة وتعديل بيانات العملاء' },
                { key: 'canManageLogistics', label: 'تعديل الموانئ والولايات والمسارات' },
              ].map((act) => {
                const isChecked = (actions as any)[act.key];
                return (
                  <label
                    key={act.key}
                    className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-emerald-50/50 border-emerald-200 text-slate-800 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) =>
                        setActions({ ...actions, [act.key]: e.target.checked })
                      }
                      className="w-3.5 h-3.5 rounded text-[#164E33] focus:ring-[#164E33]"
                    />
                    <span className="text-[11px]">{act.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary">
            حفظ التعديلات والصلاحيات
          </Button>
        </div>
      </form>
    </Modal>
  );
};

