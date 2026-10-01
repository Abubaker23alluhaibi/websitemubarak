import React, { useState } from 'react';
import { useData } from '../../shared/context/DataContext';
import { useAuth } from '../../shared/context/AuthContext';
import { User } from '../../types';
import { formatDate } from '../../shared/lib/formatters';
import { CreateUserModal } from './CreateUserModal';
import { EditUserModal } from './EditUserModal';
import { UserDetailsModal } from './UserDetailsModal';
import { ConfirmDeleteModal } from '../../shared/components/ui/ConfirmDeleteModal';
import {
  Edit3,
  Trash2,
  Activity,
  Shield,
  Users as UsersIcon,
  ExternalLink,
  Plus,
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { users, addUser, deleteUser, auditLogs, refreshFromBackend } = useData();
  const { user: currentUser } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<'staff_only' | 'agents' | 'customers' | 'all'>('staff_only');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleAddUser = (newUser: Partial<User>) => {
    addUser(newUser as User);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshFromBackend();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getRoleText = (role: User['role']) => {
    switch (role) {
      case 'super_admin':
        return 'سوبر أدمن';
      case 'admin':
        return 'أدمن تشغيلي';
      case 'staff':
        return 'موظف متابعة';
      case 'exchange_agent':
        return 'مندوب صيرفة';
      case 'customer':
        return 'عميل';
    }
  };

  const getRoleBadgeStyle = (role: User['role']) => {
    switch (role) {
      case 'super_admin':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'admin':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'staff':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'exchange_agent':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'customer':
        return 'bg-purple-50 text-purple-800 border-purple-200';
    }
  };

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    if (roleFilter === 'staff_only') return ['super_admin', 'admin', 'staff'].includes(u.role);
    if (roleFilter === 'agents') return u.role === 'exchange_agent';
    if (roleFilter === 'customers') return u.role === 'customer';
    return true;
  });

  // KPIs
  const totalStaff = users.filter((u) => u.role !== 'customer').length;
  const activeStaff = users.filter((u) => u.role !== 'customer' && u.isActive).length;
  const totalLogsCount = auditLogs.length;

  return (
    <div className="space-y-4 dir-rtl text-right text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="font-bold text-slate-800 text-sm sm:text-base">
            إدارة الموظفين، الصلاحيات وسجل التدقيق
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="تحديث قائمة الموظفين من السيرفر"
          >
            <Activity className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
            <span className="text-[11px] font-semibold">تحديث</span>
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#164E33] hover:bg-[#1B5E3F] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ إضافة موظف جديد</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#F9FBFA] border border-slate-200/80 rounded-2xl p-3.5 space-y-1">
          <div className="flex justify-between items-center text-slate-500 text-[11px]">
            <span>إجمالي فريق العمل والموظفين</span>
            <UsersIcon className="w-4 h-4 text-[#164E33]" />
          </div>
          <div className="text-xl font-black text-slate-900">{totalStaff} حسابات</div>
          <span className="text-[10px] text-emerald-700 block font-medium">
            {activeStaff} حساب نشط ومفعل
          </span>
        </div>

        <div className="bg-[#F9FBFA] border border-slate-200/80 rounded-2xl p-3.5 space-y-1">
          <div className="flex justify-between items-center text-slate-500 text-[11px]">
            <span>إجمالي النشاطات والعمليات المسجلة</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700">{totalLogsCount} عملية</div>
          <span className="text-[10px] text-slate-400 block">
            سجل تدقيق تلقائي غير قابل للتلاعب
          </span>
        </div>

        <div className="bg-[#F9FBFA] border border-slate-200/80 rounded-2xl p-3.5 space-y-1">
          <div className="flex justify-between items-center text-slate-500 text-[11px]">
            <span>نظام الصلاحيات والصفحات</span>
            <Shield className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-slate-800">تحكم فردي</div>
          <span className="text-[10px] text-blue-700 block font-medium">
            تحديد الصفحات لكل موظف على حدة
          </span>
        </div>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/70 pb-2">
        {[
          { key: 'staff_only', label: `فريق العمل والموظفين (${users.filter((u) => ['super_admin', 'admin', 'staff'].includes(u.role)).length})` },
          { key: 'agents', label: `وكلاء الصرافة (${users.filter((u) => u.role === 'exchange_agent').length})` },
          { key: 'customers', label: `العملاء والزبائن (${users.filter((u) => u.role === 'customer').length})` },
          { key: 'all', label: `كافة الحسابات (${users.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setRoleFilter(tab.key as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              roleFilter === tab.key
                ? 'bg-[#164E33] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-[#F9FBFA] border border-slate-200/90 rounded-2xl p-4 overflow-x-auto shadow-2xs">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-bold pb-2.5">
              <th className="pb-2.5 pr-2">الموظف / المستخدم</th>
              <th className="pb-2.5">الدور</th>
              <th className="pb-2.5">الصفحات المصرح بها</th>
              <th className="pb-2.5">سجل النشاطات</th>
              <th className="pb-2.5">الحالة</th>
              <th className="pb-2.5">تاريخ الإنشاء</th>
              <th className="pb-2.5 text-left pl-2">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/90">
            {filteredUsers.map((u) => {
              const userLogsCount = auditLogs.filter(
                (l) => l.userId === u.id || l.userName.toLowerCase() === u.fullName.toLowerCase()
              ).length;
              const allowedPagesCount = u.permissions?.allowedPages?.length;

              return (
                <tr key={u.id} className="hover:bg-white/90 transition-colors">
                  <td className="py-3 pr-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 font-bold flex items-center justify-center shrink-0 text-xs">
                        {u.fullName.slice(0, 2)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{u.fullName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">@{u.username}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getRoleBadgeStyle(
                        u.role
                      )}`}
                    >
                      {getRoleText(u.role)}
                    </span>
                  </td>

                  <td className="py-3">
                    {u.role === 'super_admin' ? (
                      <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                        كافة الصفحات (Super Admin)
                      </span>
                    ) : allowedPagesCount !== undefined ? (
                      <span className="text-[10px] text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md font-bold">
                        {allowedPagesCount} صفحات مصرح بها
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">افتراضي حسب الدور</span>
                    )}
                  </td>

                  <td className="py-3">
                    <button
                      type="button"
                      onClick={() => setSelectedUserForDetails(u)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 px-2.5 py-1 rounded-xl transition-all"
                      title="عرض سجل نشاطات وعمليات هذا الموظف"
                    >
                      <Activity className="w-3 h-3 text-emerald-600" />
                      <span>{userLogsCount} عملية</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </button>
                  </td>

                  <td className="py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        u.isActive
                          ? 'text-emerald-700 bg-emerald-50'
                          : 'text-rose-700 bg-rose-50'
                      }`}
                    >
                      {u.isActive ? 'نشط' : 'معطل'}
                    </span>
                  </td>

                  <td className="py-3 text-slate-400 font-mono text-[11px]">
                    {formatDate(u.createdAt)}
                  </td>

                  <td className="py-3 text-left pl-2">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedUserForDetails(u)}
                        className="px-2.5 py-1 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold transition-colors"
                        title="ملف وسجل الموظف"
                      >
                        تفاصيل وسجل
                      </button>

                      {(currentUser?.role === 'super_admin' || u.role !== 'super_admin') && (
                        <button
                          onClick={() => setUserToEdit(u)}
                          className="p-1 hover:bg-emerald-50 text-emerald-700 hover:text-emerald-900 rounded-md transition-colors"
                          title="تعديل الصلاحيات والحساب"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {currentUser?.role === 'super_admin' && u.id !== currentUser?.id && u.role !== 'super_admin' && (
                        <button
                          onClick={() => setUserToDelete(u)}
                          className="p-1 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-md transition-colors"
                          title="حذف الحساب"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onAddUser={handleAddUser}
      />

      {userToEdit && (
        <EditUserModal
          user={userToEdit}
          isOpen={!!userToEdit}
          onClose={() => setUserToEdit(null)}
        />
      )}

      {selectedUserForDetails && (
        <UserDetailsModal
          user={selectedUserForDetails}
          isOpen={!!selectedUserForDetails}
          onClose={() => setSelectedUserForDetails(null)}
          onEditUser={(u) => setUserToEdit(u)}
        />
      )}

      {userToDelete && (
        <ConfirmDeleteModal
          isOpen={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          onConfirm={() => {
            deleteUser(userToDelete.id);
            setUserToDelete(null);
          }}
          title="حذف حساب المستخدم"
          message={`هل أنت متأكد من حذف حساب ${userToDelete.fullName} (${userToDelete.username})؟`}
        />
      )}
    </div>
  );
};

