import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemTitle?: string;
  isLoading?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemTitle,
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="space-y-4 dir-rtl text-right text-xs">
        <div className="flex items-start gap-3 bg-red-50/80 border border-red-200/80 p-3.5 rounded-2xl">
          <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-red-900 text-xs">تحذير: هذا الإجراء لا يمكن التراجع عنه!</h4>
            <p className="text-[11px] text-red-700 leading-relaxed">{message}</p>
            {itemTitle && (
              <div className="bg-white/80 border border-red-200 px-2.5 py-1 rounded-lg font-bold text-slate-900 mt-1 inline-block">
                {itemTitle}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isLoading}>
            إلغاء التراجع
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white font-bold"
          >
            نعم، تأكيد الحذف نهائياً
          </Button>
        </div>
      </div>
    </Modal>
  );
};
