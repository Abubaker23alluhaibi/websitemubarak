import React from 'react';
import { Coins, ArrowUpRight, ArrowDownLeft, Building2 } from 'lucide-react';
import { useData } from '../../shared/context/DataContext';
import { formatCurrency } from '../../shared/lib/formatters';

interface ExchangeLedgerWidgetProps {
  onOpenTransferModal?: () => void;
}

export const ExchangeLedgerWidget: React.FC<ExchangeLedgerWidgetProps> = ({ onOpenTransferModal }) => {
  const { exchangeOffices } = useData();
  return (
    <div className="bg-white border border-slate-200/70 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-2xl">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">أرصدة الصرافة (Exchange Ledger)</h3>
            <p className="text-xs text-slate-400 mt-0.5">الحسابات الجارية لمكاتب التحويل المالي</p>
          </div>
        </div>
        {onOpenTransferModal && (
          <button
            onClick={onOpenTransferModal}
            className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-colors"
          >
            + قيد حوالة
          </button>
        )}
      </div>

      {/* List of Exchange Offices */}
      <div className="space-y-3">
        {exchangeOffices.map((office) => {
          const isPositive = office.balanceUsd >= 0;
          return (
            <div
              key={office.id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100/80 hover:bg-slate-100/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-2xs">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 leading-tight">{office.name}</h4>
                  <span className="text-[11px] text-slate-400">{office.city}</span>
                </div>
              </div>

              <div className="text-left">
                <div
                  className={`text-sm font-extrabold flex items-center gap-1 justify-end ${
                    isPositive ? 'text-emerald-700' : 'text-red-600'
                  }`}
                >
                  {isPositive ? (
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  )}
                  <span>{formatCurrency(Math.abs(office.balanceUsd))}</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {isPositive ? 'بذمة الصيرفة لنا' : 'مستحق للصيرفة'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
