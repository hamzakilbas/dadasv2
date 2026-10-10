import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  Plus,
  Minus,
  Trash2,
  Banknote,
  CreditCard,
  AlertCircle,
  Receipt,
  Layers,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Table, Product, OrderItem, PaymentMethod } from '../types/pos';
import { PieceSelectionModal } from './PieceSelectionModal';
import { getProductImgSrc } from '../utils/productHelper';

interface TableOrderViewProps {
  table: Table;
  products: Product[];
  orderItems: OrderItem[];
  onBack: () => void;
  onAddItem: (productId: string, selectedPieces?: number | null, totalPieces?: number | null) => void;
  onUpdateQty: (index: number, delta: number) => void;
  onRemoveItem: (index: number) => void;
  onClearOrder: () => void;
  onProcessPayment: (method: PaymentMethod, note?: string) => void;
}

export const TableOrderView: React.FC<TableOrderViewProps> = ({
  table,
  products,
  orderItems,
  onBack,
  onAddItem,
  onUpdateQty,
  onRemoveItem,
  onClearOrder,
  onProcessPayment
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pieceModalProduct, setPieceModalProduct] = useState<Product | null>(null);
  const [pieceModalTotal, setPieceModalTotal] = useState<number>(4);
  const [confirmMethod, setConfirmMethod] = useState<PaymentMethod | null>(null);
  const [cashierNote, setCashierNote] = useState<string>('');

  // Memoized categories list: Tümü, İçecekler, Tatlılar ve diğerleri
  const categories = useMemo(() => {
    const rawCategories = Array.from(
      new Set(
        products
          .map(p => p.category)
          .filter((c): c is string => Boolean(c && typeof c === 'string' && c.trim().length > 0))
      )
    );
    const standard = ['İçecekler', 'Tatlılar'];
    const merged = Array.from(new Set([...standard, ...rawCategories]));
    return ['Tümü', ...merged];
  }, [products]);

  // Memoized filtered products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter(p => {
      const pCat = (p.category || '').toLowerCase();
      const selCat = selectedCategory.toLowerCase();
      const matchesCat =
        selectedCategory === 'Tümü' ||
        p.category === selectedCategory ||
        (selCat.includes('içecek') && pCat.includes('içecek')) ||
        (selCat.includes('tatlı') && pCat.includes('tatlı'));
      const matchesSearch = !q || p.name.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Memoized bill items and total
  const { detailedBillItems, totalAmount } = useMemo(() => {
    let total = 0;
    const items = orderItems.map((item, idx) => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return null;

      let unitPrice = product.price;
      let labelExtra = '';

      if (item.selectedPieces && item.totalPieces) {
        unitPrice = (product.price / item.totalPieces) * item.selectedPieces;
        labelExtra = ` (${item.selectedPieces}/${item.totalPieces} dilim)`;
      }

      const itemTotal = unitPrice * item.qty;
      total += itemTotal;

      return {
        index: idx,
        product,
        qty: item.qty,
        unitPrice,
        itemTotal,
        labelExtra,
        item
      };
    }).filter(Boolean);

    return { detailedBillItems: items, totalAmount: total };
  }, [orderItems, products]);

  const handleCardClick = (product: Product) => {
    // Check if name contains pieces (e.g. "4 adet", "3 adet", "5 adet")
    const match = product.name.match(/(\d+)\s*adet/i);
    if (match) {
      const totalPieces = parseInt(match[1]);
      setPieceModalProduct(product);
      setPieceModalTotal(totalPieces);
    } else {
      onAddItem(product.id);
    }
  };

  const handleCardContextMenu = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    const match = product.name.match(/(\d+)\s*adet/i);
    if (match) {
      const totalPieces = parseInt(match[1]);
      setPieceModalProduct(product);
      setPieceModalTotal(totalPieces);
    } else {
      onAddItem(product.id);
    }
  };

  const handlePaymentInitiate = (method: PaymentMethod) => {
    if (detailedBillItems.length === 0) {
      alert('Adisyonda ödenecek ürün bulunmuyor!');
      return;
    }
    setConfirmMethod(method);
  };

  const handleConfirmFinalPayment = () => {
    if (!confirmMethod) return;

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {
      // ignore
    }

    onProcessPayment(confirmMethod, cashierNote);
    setConfirmMethod(null);
    setCashierNote('');
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-slate-50">
      {/* LEFT: PRODUCTS LIST & SELECTION */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 border-r border-slate-200 overflow-hidden">
        {/* Top bar with back and table info */}
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1.5 font-semibold text-sm"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Masalar</span>
            </button>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-800">{table.name}</h2>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                  {table.section || 'İç Mekan'}
                </span>
              </div>
              <p className="text-xs text-slate-500">Ürün seçerek adisyona ekleyebilirsiniz</p>
            </div>
          </div>

          {/* Search box */}
          <div className="relative w-48 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Ürün ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="bg-white px-4 py-2.5 border-b border-slate-200 flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Layers className="w-12 h-12 stroke-1 mb-2 opacity-50" />
              <p className="text-sm">Aranan kriterde ürün bulunamadı</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
              {filteredProducts.map(product => {
                const hasPieceOption = product.name.match(/(\d+)\s*adet/i);
                const imgSrc = getProductImgSrc(product.img);

                return (
                  <div
                    key={product.id}
                    onClick={() => handleCardClick(product)}
                    onContextMenu={(e) => handleCardContextMenu(e, product)}
                    className="group bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all active:scale-[0.98] flex flex-col relative select-none"
                  >
                    {/* Piece badge if applicable */}
                    {hasPieceOption && (
                      <div className="absolute top-2 right-2 z-10">
                        <span className="bg-blue-600/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-xs">
                          <Sparkles className="w-2.5 h-2.5" /> Adetli
                        </span>
                      </div>
                    )}

                    {/* Image */}
                    <div className="h-28 bg-slate-100 overflow-hidden relative flex items-center justify-center p-2 border-b border-slate-100">
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={product.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.dataset.triedFallback && product.img) {
                              target.dataset.triedFallback = 'true';
                              // Fallback to raw filename in ./resimler/
                              const cleanName = product.img.replace(/^\.?\/?(resimler\/)?/, '');
                              target.src = `./resimler/${encodeURI(cleanName)}`;
                            } else {
                              target.style.display = 'none';
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Layers className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3 flex-1 flex flex-col justify-between bg-white">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          {product.category}
                        </span>
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm leading-tight line-clamp-2 mt-0.5 capitalize">
                          {product.name}
                        </h4>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between">
                        <span className="text-sm font-extrabold text-blue-600">
                          ₺{product.price.toFixed(2)}
                        </span>
                        <button className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: BILL / ADİSYON & THE 2 PAYMENT BUTTONS */}
      <div className="w-full md:w-96 lg:w-[420px] flex flex-col bg-white border-l border-slate-200 shadow-xl z-10 flex-shrink-0">
        {/* Adisyon Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm tracking-wide">Adisyon Hesabı</h3>
              <p className="text-[11px] text-slate-400">{table.name} • {detailedBillItems.length} Kalem</p>
            </div>
          </div>
          {detailedBillItems.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Adisyondaki tüm ürünleri silmek istediğinize emin misiniz?')) {
                  onClearOrder();
                }
              }}
              title="Adisyonu Temizle"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Bill Items List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-slate-50">
          {detailedBillItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
              <Receipt className="w-12 h-12 stroke-1 mb-2 opacity-40 text-slate-300" />
              <p className="font-semibold text-sm text-slate-500">Adisyonda ürün yok</p>
              <p className="text-xs text-slate-400 mt-1">Soldaki menüden ürün seçerek hesaba ekleyin</p>
            </div>
          ) : (
            detailedBillItems.map((item) => {
              if (!item) return null;
              return (
                <div
                  key={item.index}
                  className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-2 transition-all hover:border-slate-300"
                >
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-slate-800 text-xs truncate">
                      {item.product.name}
                      <span className="text-blue-600 font-semibold">{item.labelExtra}</span>
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      ₺{item.unitPrice.toFixed(2)} x {item.qty}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Qty controller */}
                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                      <button
                        onClick={() => onUpdateQty(item.index, -1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-white rounded-md transition-all active:scale-95"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-xs text-slate-800">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => onUpdateQty(item.index, 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-white rounded-md transition-all active:scale-95"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right min-w-[60px]">
                      <span className="font-extrabold text-slate-900 text-xs">
                        ₺{item.itemTotal.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.index)}
                      className="text-slate-300 hover:text-rose-500 p-1 rounded-md transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Total & Checkout Section */}
        <div className="p-4 bg-white border-t border-slate-200 space-y-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-baseline">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Toplam Hesap Tutarı
            </span>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              ₺{totalAmount.toFixed(2)}
            </span>
          </div>

          {/* THE 2 PAYMENT BUTTONS AS REQUESTED */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
              Ödeme Yöntemi Seçin
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* NAKİT İLE ÖDE BUTONU */}
              <button
                disabled={detailedBillItems.length === 0}
                onClick={() => handlePaymentInitiate('Nakit')}
                className={`py-3.5 px-3 rounded-xl font-black text-sm flex flex-col items-center justify-center gap-1.5 transition-all shadow-md active:scale-[0.98] ${
                  detailedBillItems.length === 0
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 hover:shadow-lg'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Banknote className="w-5 h-5" />
                  <span>Nakit ile Öde</span>
                </div>
                <span className="text-[10px] font-semibold opacity-90">Nakit Tahsilat Yap</span>
              </button>

              {/* KREDİ KARTI İLE ÖDE BUTONU */}
              <button
                disabled={detailedBillItems.length === 0}
                onClick={() => handlePaymentInitiate('Kredi Kartı')}
                className={`py-3.5 px-3 rounded-xl font-black text-sm flex flex-col items-center justify-center gap-1.5 transition-all shadow-md active:scale-[0.98] ${
                  detailedBillItems.length === 0
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 hover:shadow-lg'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-5 h-5" />
                  <span>Kredi Kartı ile Öde</span>
                </div>
                <span className="text-[10px] font-semibold opacity-90">POS Cihazından Çek</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Piece Selection Modal */}
      <PieceSelectionModal
        isOpen={!!pieceModalProduct}
        onClose={() => setPieceModalProduct(null)}
        product={pieceModalProduct}
        totalPieces={pieceModalTotal}
        onSelectPieces={(pieces) => {
          if (pieceModalProduct) {
            onAddItem(pieceModalProduct.id, pieces, pieceModalTotal);
          }
        }}
      />

      {/* Payment Confirmation Modal */}
      {confirmMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className={`p-5 text-white ${confirmMethod === 'Nakit' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {confirmMethod === 'Nakit' ? (
                    <Banknote className="w-6 h-6" />
                  ) : (
                    <CreditCard className="w-6 h-6" />
                  )}
                  <h3 className="font-extrabold text-lg">
                    {confirmMethod} ile Ödeme Onayı
                  </h3>
                </div>
                <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  {table.name}
                </span>
              </div>
              <p className="text-xs text-white/80 mt-1">
                Ödeme kaydedilecek, adisyon geçmişe eklenecek ve masa temizlenecektir.
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Summary box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Masa Numarası:</span>
                  <span className="font-bold text-slate-800">{table.name}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Ödeme Şekli:</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    {confirmMethod === 'Nakit' ? (
                      <span className="text-emerald-700 font-bold">💵 Nakit</span>
                    ) : (
                      <span className="text-blue-700 font-bold">💳 Kredi Kartı</span>
                    )}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-700">Tahsil Edilecek Tutar:</span>
                  <span className="text-2xl font-black text-slate-900">
                    ₺{totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Product Info and Price Detail Preview */}
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Ürün Bilgisi ve Fiyat Detayı:
                </label>
                <div className="p-2.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-700 max-h-24 overflow-y-auto">
                  {detailedBillItems.map(i => `${i?.qty}x ${i?.product.name} (₺${i?.itemTotal.toFixed(2)})`).join(', ')}
                </div>
              </div>

              {/* Cashier note */}
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Kasiyer Notu (Opsiyonel):
                </label>
                <input
                  type="text"
                  placeholder="Örn: 200 TL nakit verildi, 10 TL bahşiş vb."
                  value={cashierNote}
                  onChange={(e) => setCashierNote(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2.5 justify-end">
              <button
                onClick={() => setConfirmMethod(null)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-200 font-semibold text-xs transition-colors"
              >
                Vazgeç
              </button>
              <button
                onClick={handleConfirmFinalPayment}
                className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md ${
                  confirmMethod === 'Nakit'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                Ödemeyi Tamamla ve Masayı Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
