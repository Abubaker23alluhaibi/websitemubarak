import React, { useState, useEffect } from 'react';
import { Modal } from '../../shared/components/ui/Modal';
import { Input } from '../../shared/components/ui/Input';
import { Button } from '../../shared/components/ui/Button';
import { useData } from '../../shared/context/DataContext';
import { User } from '../../types';

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: User | null;
  onUpdateCustomer?: (updated: User) => void;
}

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  isOpen,
  onClose,
  customer,
  onUpdateCustomer,
}) => {
  const { updateUser } = useData();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customer) {
      setFullName(customer.fullName || '');
      setUsername(customer.username || '');
      setPhone(customer.phone || '');
      setEmail(customer.email || '');
      setNewPassword('');
      setIsActive(customer.isActive ?? true);
      setError('');
    }
  }, [customer]);

  if (!customer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('يرجى إدخال اسم العميل الرباعي');
      return;
    }

    if (newPassword.trim() && newPassword.trim().length < 6) {
      setError('كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف أو أرقام');
      return;
    }

    setIsLoading(true);

    const updated: User = {
      ...customer,
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      password: newPassword.trim() || undefined,
      isActive,
    };

    updateUser(updated);
    if (onUpdateCustomer) onUpdateCustomer(updated);

    setIsLoading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`تعديل بيانات العميل: ${customer.fullName}`}>
      <form onSubmit={handleSubmit} className="space-y-4 dir-rtl text-right text-xs">
        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold">
            {error}
          </div>
        )}

        <Input
          label="الاسم الكامل للعميل"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="اسم المستخدم (Username)"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <Input
            label="رقم الهاتف"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <Input
          label="البريد الإلكتروني (اختياري)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          label="إعادة تعيين كلمة المرور (اختياري)"
          placeholder="اتركها فارغة إذا لم ترغب بتغيير كلمة المرور..."
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="cust-active-status"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded text-[#164E33] focus:ring-[#164E33] border-slate-300"
          />
          <label htmlFor="cust-active-status" className="text-xs font-bold text-slate-700 cursor-pointer">
            حساب العميل نشط (Active)
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            حفظ التعديلات
          </Button>
        </div>
      </form>
    </Modal>
  );
};
