import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../../shared/components/ui/Modal';
import { Button } from '../../shared/components/ui/Button';
import { Send, MessageSquare, Clock, User, ShieldCheck } from 'lucide-react';
import { useData } from '../../shared/context/DataContext';
import { useAuth } from '../../shared/context/AuthContext';

interface CarMessagesModalProps {
  carId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CarMessagesModal: React.FC<CarMessagesModalProps> = ({
  carId,
  isOpen,
  onClose,
}) => {
  const { cars, sendCarMessage } = useData();
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const car = cars.find((c) => c.id === carId);

  const messages = car?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, messages.length]);

  if (!car) return null;

  const isCustomer = user?.role === 'customer';

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !user) return;

    sendCarMessage(car.id, inputText.trim(), {
      id: user.id,
      fullName: user.fullName,
      role: user.role,
    });

    setInputText('');
  };

  const quickPrompts = isCustomer
    ? [
        'يرجى التأكد من وصول مفاتيح السيارة',
        'متى الموعد المتوقع لتحميل الحاوية أو إبحارها؟',
        'هل تم استلام سند الملكية الأصلي (Title)؟',
        'أرجو تزويدي بصور إضافية عند وصولها للميناء',
      ]
    : [
        'تم استلام استفساركم وجاري المتابعة مع ساحة المزاد والناقل',
        'السيارة تم تحميلها بنجاح وسيتم تزويدكم بالتفاصيل قريباً',
        'يرجى العلم بأن سند الملكية متوفر وبحالة جيدة',
      ];

  const formatMessageTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return `${d.toLocaleDateString('ar-IQ')} ${d.toLocaleTimeString('ar-IQ', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } catch {
      return isoString;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`محادثة وملاحظات: ${car.year} ${car.make} ${car.model}`}
      maxWidth="2xl"
    >
      <div className="space-y-4 dir-rtl text-right text-xs">
        {/* Car Summary Banner */}
        <div className="bg-[#F9FBFA] border border-slate-100 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#164E33] flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-800 text-xs">
                {car.year} {car.make} {car.model}
              </div>
              <div className="text-[10px] text-slate-400">
                المالك: <span className="font-semibold text-slate-700">{car.customerName}</span> | اللوت: {car.lotNumber}
              </div>
            </div>
          </div>

          <div className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {car.status}
          </div>
        </div>

        {/* Message Thread Box */}
        <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-3 sm:p-4 min-h-[260px] max-h-[380px] overflow-y-auto space-y-3">
          {messages.length === 0 ? (
            <div className="h-full py-12 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <p className="font-bold text-slate-600 text-xs">لا توجد رسائل سابقة لهذه السيارة بعد</p>
              <p className="text-[11px] max-w-xs text-slate-400 leading-relaxed">
                {isCustomer
                  ? 'يمكنك كتابة أي ملاحظة أو استفسار لفريق إدارة الشحن حول هذه السيارة هنا، وسيتم الرد عليك مباشرة.'
                  : 'يمكنك إرسال تحديثات أو ملاحظات خاصة بالسيارة للعميل مباشرة.'}
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user?.id;
              const isSenderCustomer = msg.senderRole === 'customer';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    {isSenderCustomer ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        <User className="w-3 h-3" />
                        <span>{msg.senderName} (العميل)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-[#164E33]" />
                        <span>{msg.senderName} (إدارة الشحن)</span>
                      </span>
                    )}

                    <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{formatMessageTime(msg.createdAt)}</span>
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed break-words shadow-2xs ${
                      isMe
                        ? 'bg-[#164E33] text-white rounded-tr-xs'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div>
          <span className="text-[10px] font-medium text-slate-400 block mb-1">
            عبارات واستفسارات سريعة مقترحة:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInputText(prompt)}
                className="text-[10px] bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-full transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSendMessage} className="space-y-2 pt-1">
          <div className="relative">
            <textarea
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isCustomer
                  ? 'اكتب رسالتك أو استفسارك لإدارة الشحن حول هذه السيارة...'
                  : 'اكتب رداً أو تحديثاً للعميل حول حالة السيارة...'
              }
              className="w-full bg-white border border-slate-200/90 rounded-2xl p-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#164E33]/30 focus:border-[#164E33] transition-all resize-none shadow-2xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400">
              اضغط Enter للإرسال السريع
            </span>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" type="button" onClick={onClose}>
                إغلاق
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={!inputText.trim()}
                className="flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>إرسال الرسالة</span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};
