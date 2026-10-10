import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Download,
  Upload,
  RotateCcw,
  Layers,
  Mail,
  CheckCircle,
  Image as ImageIcon,
  HelpCircle,
  X,
  Sparkles
} from 'lucide-react';
import { Table, Product, AppSettings } from '../types/pos';
import { getProductImgSrc, compressImageFile, PRESET_IMAGES } from '../utils/productHelper';

interface ManagementViewProps {
  tables: Table[];
  products: Product[];
  settings: AppSettings;
  onSaveTable: (table: Partial<Table> & { id?: string }) => void;
  onDeleteTable: (tableId: string) => void;
  onSaveProduct: (product: Partial<Product> & { id?: string }) => void;
  onDeleteProduct: (productId: string) => void;
  onMoveProduct: (index: number, direction: 'up' | 'down') => void;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onExportJsonBackup: () => void;
  onImportJsonBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetToDemo: () => void;
}

export const ManagementView: React.FC<ManagementViewProps> = ({
  tables,
  products,
  settings,
  onSaveTable,
  onDeleteTable,
  onSaveProduct,
  onDeleteProduct,
  onMoveProduct,
  onUpdateSettings,
  onExportJsonBackup,
  onImportJsonBackup,
  onResetToDemo
}) => {
  const [activeTab, setActiveTab] = useState<'tables' | 'products' | 'settings'>('tables');

  // Table Modal State
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableNameInput, setTableNameInput] = useState('');
  const [tableSectionInput, setTableSectionInput] = useState('İç Mekan');
  const [tableSeqInput, setTableSeqInput] = useState(1);

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productNameInput, setProductNameInput] = useState('');
  const [productCatInput, setProductCatInput] = useState('İçecekler');
  const [productPriceInput, setProductPriceInput] = useState<number>(0);
  const [productImgInput, setProductImgInput] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressing(true);
      const compressed = await compressImageFile(file);
      setProductImgInput(compressed);
    } catch (err) {
      console.error('Fotoğraf yükleme hatası:', err);
      alert('Fotoğraf işlenirken bir hata oluştu.');
    } finally {
      setIsCompressing(false);
    }
  };

  // Settings Form State
  const [restaurantNameInput, setRestaurantNameInput] = useState(settings.restaurantName);
  const [emailInput, setEmailInput] = useState(settings.targetEmail);
  const [phoneInput, setPhoneInput] = useState(settings.phone || '');
  const [addressInput, setAddressInput] = useState(settings.address || '');
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);

  // Open Table Modal
  const handleOpenTableModal = (t?: Table) => {
    if (t) {
      setEditingTable(t);
      setTableNameInput(t.name);
      setTableSectionInput(t.section || 'İç Mekan');
      setTableSeqInput(t.seq);
    } else {
      setEditingTable(null);
      const nextSeq = tables.length > 0 ? Math.max(...tables.map(x => x.seq)) + 1 : 1;
      setTableNameInput(`Masa ${nextSeq}`);
      setTableSectionInput('İç Mekan');
      setTableSeqInput(nextSeq);
    }
    setIsTableModalOpen(true);
  };

  const handleSaveTableForm = () => {
    if (!tableNameInput.trim()) {
      alert('Lütfen masa adını giriniz.');
      return;
    }
    onSaveTable({
      id: editingTable?.id,
      name: tableNameInput.trim(),
      section: tableSectionInput,
      seq: Number(tableSeqInput)
    });
    setIsTableModalOpen(false);
  };

  // Open Product Modal
  const handleOpenProductModal = (p?: Product) => {
    if (p) {
      setEditingProduct(p);
      setProductNameInput(p.name);
      setProductCatInput(p.category);
      setProductPriceInput(p.price);
      setProductImgInput(p.img || '');
    } else {
      setEditingProduct(null);
      setProductNameInput('');
      setProductCatInput('İçecekler');
      setProductPriceInput(0);
      setProductImgInput('');
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProductForm = () => {
    if (!productNameInput.trim()) {
      alert('Lütfen ürün adını giriniz.');
      return;
    }
    if (productPriceInput < 0) {
      alert('Fiyat 0 veya daha büyük olmalıdır.');
      return;
    }

    onSaveProduct({
      id: editingProduct?.id,
      name: productNameInput.trim(),
      category: productCatInput,
      price: Number(productPriceInput),
      img: productImgInput.trim()
    });
    setIsProductModalOpen(false);
  };

  const handleSaveSettings = () => {
    onUpdateSettings({
      ...settings,
      restaurantName: restaurantNameInput.trim(),
      targetEmail: emailInput.trim(),
      phone: phoneInput.trim(),
      address: addressInput.trim()
    });
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Header with Sub-tabs and Backup/Restore buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <SettingsIcon className="w-6 h-6 text-slate-700" />
              <span>Yönetim Paneli & Ayarlar</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Masa, ürün, stok, e-posta ayarları ve sistem yedekleme
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onExportJsonBackup}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Tüm veriyi (Masalar, Ürünler, Stoklar, Siparişler) JSON olarak indir"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Yedek İndir</span>
            </button>

            <label
              className="bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Önceden indirilmiş yedeği yükle"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Yedek Yükle</span>
              <input type="file" accept=".json" className="hidden" onChange={onImportJsonBackup} />
            </label>

            <button
              onClick={() => {
                if (confirm('Tüm sistemi başlangıç demo verilerine sıfırlamak istediğinize emin misiniz?')) {
                  onResetToDemo();
                }
              }}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Verileri sıfırla"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Sıfırla</span>
            </button>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs max-w-md">
          <button
            onClick={() => setActiveTab('tables')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'tables' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🍽️ Masalar ({tables.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'products' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            ☕ Ürünler ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'settings' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            ⚙️ Sistem & E-posta
          </button>
        </div>

        {/* ===================== TAB 1: MASALAR ===================== */}
        {activeTab === 'tables' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden animate-in fade-in duration-150">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">Masa Listesi</h3>
                <p className="text-xs text-slate-500">Masaların adını, sırasını ve konumunu yönetin</p>
              </div>
              <button
                onClick={() => handleOpenTableModal()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Masa Ekle</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <th className="p-3.5 w-16">Sıra</th>
                    <th className="p-3.5">Masa Adı</th>
                    <th className="p-3.5">Bölüm / Konum</th>
                    <th className="p-3.5 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tables.map((table) => (
                    <tr key={table.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-slate-400">{table.seq}</td>
                      <td className="p-3.5 font-bold text-slate-800">{table.name}</td>
                      <td className="p-3.5 text-slate-500">
                        <span className="bg-slate-100 px-2.5 py-1 rounded-md">
                          {table.section || 'İç Mekan'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenTableModal(table)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg mr-1.5 transition-colors"
                          title="Düzenle"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`"${table.name}" masasını silmek istediğinize emin misiniz?`)) {
                              onDeleteTable(table.id);
                            }
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: ÜRÜNLER ===================== */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden animate-in fade-in duration-150">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">Menü ve Ürünler</h3>
                <p className="text-xs text-slate-500">Fiyatları, fotoğrafları ve stok bilgilerini düzenleyin</p>
              </div>
              <button
                onClick={() => handleOpenProductModal()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Ürün Ekle</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <th className="p-3.5 w-14">Görsel</th>
                    <th className="p-3.5">Ürün Adı</th>
                    <th className="p-3.5">Kategori</th>
                    <th className="p-3.5">Birim Fiyat</th>
                    <th className="p-3.5 text-right">Sıra & İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product, idx) => {
                    const imgSrc = getProductImgSrc(product.img);

                    return (
                      <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center p-1">
                            {imgSrc ? (
                              <img
                                src={imgSrc}
                                alt={product.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  if (!target.dataset.triedFallback && product.img) {
                                    target.dataset.triedFallback = 'true';
                                    const cleanName = product.img.replace(/^\.?\/?(resimler\/)?/, '');
                                    target.src = `./resimler/${encodeURI(cleanName)}`;
                                  } else {
                                    target.style.display = 'none';
                                  }
                                }}
                              />
                            ) : (
                              <Layers className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 font-bold text-slate-800 capitalize">{product.name}</td>
                        <td className="p-3.5 text-slate-500">{product.category}</td>
                        <td className="p-3.5 font-black text-slate-900">₺{product.price.toFixed(2)}</td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <button
                            disabled={idx === 0}
                            onClick={() => onMoveProduct(idx, 'up')}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 mr-1 cursor-pointer"
                            title="Yukarı Taşı"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={idx === products.length - 1}
                            onClick={() => onMoveProduct(idx, 'down')}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 mr-2 cursor-pointer"
                            title="Aşağı Taşı"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenProductModal(product)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg mr-1.5 transition-colors cursor-pointer"
                            title="Düzenle"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`"${product.name}" ürününü silmek istediğinize emin misiniz?`)) {
                                onDeleteProduct(product.id);
                              }
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: AYARLAR & E-POSTA ===================== */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 animate-in fade-in duration-150">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Restoran & Raporlama Ayarları</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Gün sonu ve aylık raporların otomatik gönderileceği e-posta adresini belirleyin
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  İşletme / Restoran Adı
                </label>
                <input
                  type="text"
                  value={restaurantNameInput}
                  onChange={(e) => setRestaurantNameInput(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:border-blue-500 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Rapor Gönderilecek E-Posta Adresi
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="guneyrecep2003@gmail.com"
                    className="w-full text-xs pl-9 pr-3 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:border-blue-500 focus:bg-white outline-none"
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Gün sonu ve aylık özet mailleri doğrudan bu adrese hazırlanır.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Telefon Numarası (Fiş İçin)
                </label>
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:border-blue-500 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Adres (Fiş İçin)
                </label>
                <input
                  type="text"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:border-blue-500 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              {settingsSavedToast ? (
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                  <CheckCircle className="w-4 h-4" /> Ayarlar başarıyla kaydedildi!
                </div>
              ) : <div></div>}

              <button
                onClick={handleSaveSettings}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-blue-200 transition-all cursor-pointer"
              >
                Ayarları Kaydet
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TABLE MODAL */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
            <div className="p-5 bg-slate-900 text-white">
              <h3 className="font-extrabold text-base">
                {editingTable ? 'Masayı Düzenle' : 'Yeni Masa Ekle'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Masa Adı</label>
                <input
                  type="text"
                  value={tableNameInput}
                  onChange={(e) => setTableNameInput(e.target.value)}
                  placeholder="Örn: Masa 16 veya Bahçe 4"
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Bölüm / Konum</label>
                <select
                  value={tableSectionInput}
                  onChange={(e) => setTableSectionInput(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:border-blue-500 outline-none"
                >
                  <option value="İç Mekan">İç Mekan</option>
                  <option value="Bahçe">Bahçe</option>
                  <option value="Teras">Teras</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Sıra Numarası</label>
                <input
                  type="number"
                  value={tableSeqInput}
                  onChange={(e) => setTableSeqInput(parseInt(e.target.value) || 1)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:border-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setIsTableModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-semibold text-xs transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSaveTableForm}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-5 bg-slate-900 text-white">
              <h3 className="font-extrabold text-base">
                {editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
              </h3>
            </div>
            <div className="p-6 space-y-3.5 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Kategori</label>
                <select
                  value={productCatInput}
                  onChange={(e) => setProductCatInput(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:border-blue-500 outline-none"
                >
                  <option value="İçecekler">İçecekler</option>
                  <option value="Tatlılar">Tatlılar</option>
                  <option value="Yiyecekler">Yiyecekler</option>
                  <option value="Kahvaltı">Kahvaltı</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Ürün Adı</label>
                <input
                  type="text"
                  value={productNameInput}
                  onChange={(e) => setProductNameInput(e.target.value)}
                  placeholder="Örn: Fıstıklı Baklava (4 adet)"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:border-blue-500 outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  İpucu: İsme &quot;(4 adet)&quot; yazarsanız siparişte adet/porsiyon seçimi otomatik etkinleşir.
                </span>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Fiyat (₺)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={productPriceInput}
                  onChange={(e) => setProductPriceInput(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:border-blue-500 outline-none"
                />
              </div>
              {/* FOTOĞRAF ALANI */}
              <div className="space-y-2 pt-1 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ürün Fotoğrafı</span>
                  </label>
                  {productImgInput && (
                    <button
                      type="button"
                      onClick={() => setProductImgInput('')}
                      className="text-[11px] text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <X className="w-3 h-3" />
                      <span>Fotoğrafı Kaldır</span>
                    </button>
                  )}
                </div>

                {/* ÖNİZLEME ALANI */}
                <div className="flex items-center gap-3 p-2.5 bg-slate-100 rounded-xl border border-slate-200">
                  <div className="w-16 h-16 rounded-lg bg-white border border-slate-300 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    {productImgInput ? (
                      <img
                        src={getProductImgSrc(productImgInput)}
                        alt="Önizleme"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                        }}
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-600 flex-1 min-w-0">
                    {productImgInput ? (
                      <div className="space-y-0.5">
                        <span className="font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                          Fotoğraf Seçildi
                        </span>
                        <p className="truncate text-slate-500 font-mono text-[10px]">
                          {productImgInput.startsWith('data:')
                            ? 'Bilgisayardan yüklendi (Özel Resim)'
                            : productImgInput}
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-400">
                        Fotoğraf eklemek için aşağıdaki 3 seçenekten birini kullanabilirsiniz.
                      </span>
                    )}
                  </div>
                </div>

                {/* 1. SEÇENEK: BİLGİSAYARDAN DOSYA SEÇ */}
                <div>
                  <label className="w-full flex items-center justify-center gap-2 p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl cursor-pointer text-xs font-bold transition-all shadow-xs">
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>{isCompressing ? 'Yükleniyor...' : '📁 Bilgisayardan Fotoğraf Seç (En Kolayı)'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      disabled={isCompressing}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Masaüstünüzden veya bilgisayarınızdan herhangi bir resmi seçebilirsiniz. Dosya yolu aramanıza gerek kalmaz.
                  </span>
                </div>

                {/* 2. SEÇENEK: HAZIR KÜTÜPHANEDEN SEÇ */}
                <div className="pt-1">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Veya Hazır Menü Resimlerinden Seçin:
                  </label>
                  <select
                    value={
                      PRESET_IMAGES.some(p => p.file === productImgInput)
                        ? productImgInput
                        : ''
                    }
                    onChange={(e) => {
                      if (e.target.value) {
                        setProductImgInput(e.target.value);
                      }
                    }}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl focus:border-blue-500 outline-none text-slate-700"
                  >
                    <option value="">-- Hazır Resim Seçin --</option>
                    {PRESET_IMAGES.map((preset) => (
                      <option key={preset.file} value={preset.file}>
                        {preset.name} ({preset.file})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. SEÇENEK: MANUEL DOSYA ADI VEYA WEB URL */}
                <div className="pt-1">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Veya Manuel Dosya Adı / Web Linki (URL):
                  </label>
                  <input
                    type="text"
                    value={productImgInput.startsWith('data:') ? '' : productImgInput}
                    onChange={(e) => setProductImgInput(e.target.value)}
                    placeholder="Örn: cay.jpg veya https://example.com/resim.jpg"
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl focus:border-blue-500 outline-none font-mono"
                  />
                  <div className="mt-1 text-[10px] text-slate-500 space-y-0.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <p className="font-semibold text-slate-700">📌 Resimlerin Kaynağı ve Yolu Nerede?</p>
                    <p>• <b>Hazır Resimler:</b> Programın içindeki <code>resimler/</code> klasöründedir. Yalnızca dosya adını (örn: <code>cay.jpg</code>) yazmanız yeterlidir.</p>
                    <p>• <b>Yeni Resim Ekleme:</b> En kolayı yukarıdaki <b>&quot;Bilgisayardan Fotoğraf Seç&quot;</b> butonuna basmaktır; otomatik olarak programa gömer.</p>
                    <p>• <b>İnternet:</b> <code>https://...</code> şeklinde internet linki de yapıştırabilirsiniz.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-semibold text-xs transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleSaveProductForm}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors"
              >
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
