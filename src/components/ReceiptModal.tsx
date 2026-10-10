import React from 'react';
import { Printer, X, CreditCard, Banknote, CheckCircle } from 'lucide-react';
import { OrderSession, AppSettings } from '../types/pos';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: OrderSession | null;
  settings: AppSettings;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  session,
  settings
}) => {
  if (!isOpen || !session) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(session.paymentDate).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 flex flex-col">
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-slate-800 text-white flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-sm">Tahsilat Fişi</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-6 bg-amber-50/40 text-slate-800 font-mono text-xs space-y-4 border-b border-dashed border-slate-300">
          <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
            <h2 className="font-black text-base tracking-wider uppercase font-sans text-slate-900">
              {settings.restaurantName}
            </h2>
            {settings.address && <p className="text-[11px] text-slate-500 font-sans">{settings.address}</p>}
            {settings.phone && <p className="text-[11px] text-slate-500 font-sans">Tel: {settings.phone}</p>}
          </div>

          <div className="flex justify-between text-[11px] text-slate-600">
            <div>
              <p><span className="font-bold">Masa:</span> {session.tableName}</p>
              <p><span className="font-bold">Fiş ID:</span> #{session.id.slice(-6).toUpperCase()}</p>
            </div>
            <div className="text-right">
              <p><span className="font-bold">Tarih:</span> {formattedDate}</p>
              <p className="flex items-center gap-1 justify-end">
                <span className="font-bold">Ödeme:</span>
                {session.paymentMethod === 'Nakit' ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                    <Banknote className="w-3 h-3" /> Nakit
                  </span>
                ) : (
                  <span className="text-blue-700 font-bold flex items-center gap-0.5">
                    <CreditCard className="w-3 h-3" /> K. Kartı
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Items */}
          <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1.5">
            <div className="flex justify-between font-bold text-slate-700 border-b border-slate-200 pb-1">
              <span>Ürün</span>
              <span className="text-right">Tutar</span>
            </div>
            {session.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-[11px]">
                <div className="flex-1 pr-2">
                  <div className="font-bold text-slate-900">
                    {item.qty}x {item.productName}
                    {item.selectedPieces ? ` (${item.selectedPieces} parça)` : ''}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    @{item.unitPrice.toFixed(2)} ₺
                  </div>
                </div>
                <div className="font-bold text-slate-900 text-right whitespace-nowrap">
                  {item.totalPrice.toFixed(2)} ₺
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-sm font-bold text-slate-900">
              <span>TOPLAM TUTAR:</span>
              <span className="text-base font-black text-emerald-700">
                {session.totalAmount.toFixed(2)} {settings.currency}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Tahsilat Şekli:</span>
              <span className="font-bold text-slate-800">{session.paymentMethod}</span>
            </div>
          </div>

          {/* Footer message */}
          <div className="text-center pt-2 text-[10px] text-slate-400 border-t border-dashed border-slate-300">
            <p>Bizi tercih ettiğiniz için teşekkür ederiz!</p>
            <p>Mali değeri yoktur - Bilgi Fişidir</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="p-4 bg-slate-50 flex gap-2 justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-medium text-xs transition-colors"
          >
            Kapat
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Yazdır
          </button>
        </div>
      </div>
    </div>
  );
};
