import React, { useState } from 'react';
import { Modal } from '../../shared/components/ui/Modal';
import { Input } from '../../shared/components/ui/Input';
import { Button } from '../../shared/components/ui/Button';
import { User } from '../../types';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCustomer: (customer: User) => void;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  onAddCustomer,
}) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim() || !username.trim()) {
      setError('يرجى إدخال اسم العميل الكامل واسم المستخدم');
      return;
    }

    if (password.trim().length < 6) {
      setError('كلمة المرور يجب ألا تقل عن 6 خانات/أحرف أو أرقام');
      return;
    }

    const newCust: User = {
      id: `cust-${Date.now()}`,
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim() || `${username.trim().toLowerCase()}@customer.carship`,
      phone: phone.trim() || '+964 770 000 0000',
      password: password.trim(),
      role: 'customer',
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onAddCustomer(newCust);
    setFullName('');
    setUsername('');
    setEmail('');
    setPhone('');
    setPassword('123456');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="تسجيل عميل جديد وتوليد حساب الدخول"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 dir-rtl text-right text-xs">
        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold">
            {error}
          </div>
        )}
        <Input
          label="اسم العميل الكامل"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="اسم المستخدم للدخول (Username)"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <Input
            label="كلمة المرور"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="رقم الهاتف"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Input
            label="البريد الإلكتروني (اختياري)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" variant="primary" size="sm">
            حفظ وإنشاء حساب العميل
          </Button>
        </div>
      </form>
    </Modal>
  );
};
