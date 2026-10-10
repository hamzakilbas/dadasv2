import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { Product } from '../types/pos';

interface PieceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  totalPieces: number;
  onSelectPieces: (pieces: number) => void;
}

export const PieceSelectionModal: React.FC<PieceSelectionModalProps> = ({
  isOpen,
  onClose,
  product,
  totalPieces,
  onSelectPieces
}) => {
  if (!isOpen || !product) return null;

  const unitPiecePrice = product.price / totalPieces;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 text-center animate-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Porsiyon / Adet Seçimi</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <h3 className="font-extrabold text-lg text-slate-900 mb-1">{product.name}</h3>
          <p className="text-xs text-slate-500 mb-6">
            Standart porsiyon {totalPieces} adet (₺{product.price.toFixed(2)}). Kaç adet eklemek istiyorsunuz?
          </p>

          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: totalPieces }, (_, i) => i + 1).map(pieces => {
              const price = unitPiecePrice * pieces;
              return (
                <button
                  key={pieces}
                  onClick={() => {
                    onSelectPieces(pieces);
                    onClose();
                  }}
                  className="p-3.5 bg-blue-50/70 hover:bg-blue-600 text-blue-900 hover:text-white rounded-xl border border-blue-200 hover:border-blue-600 font-bold transition-all flex flex-col items-center justify-center shadow-sm hover:shadow-md group active:scale-95"
                >
                  <span className="text-xl font-extrabold group-hover:scale-110 transition-transform">
                    {pieces} Adet
                  </span>
                  <span className="text-xs text-blue-700 group-hover:text-blue-100 mt-1">
                    ₺{price.toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2 text-slate-600 font-semibold text-xs hover:bg-slate-200 rounded-lg transition-colors"
          >
            İptal
          </button>
        </div>
      </div>
    </div>
  );
};
