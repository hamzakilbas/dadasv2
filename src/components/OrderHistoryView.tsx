import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CreditCard,
  Banknote,
  Receipt,
  UtensilsCrossed,
  TrendingUp,
  Search,
  X,
  Layers
} from 'lucide-react';
import { OrderSession, PaymentMethod, Product, Table } from '../types/pos';
import {
  isSessionOnDate,
  isSessionInMonth,
  formatDisplayDate,
  formatLocalTime,
  getTodayDateStr,
  getYesterdayDateStr,
  getCurrentMonthStr
} from '../utils/dateHelper';

interface OrderHistoryViewProps {
  orderHistory: OrderSession[];
  products: Product[];
  tables: Table[];
  restaurantName?: string;
  onViewReceipt: (session: OrderSession) => void;
}

export const OrderHistoryView: React.FC<OrderHistoryViewProps> = ({
  orderHistory,
  tables,
  onViewReceipt
}) => {
  // Mode selection: 'daily' (Gün Bazlı) or 'monthly' (Ay Bazlı)
  const [viewPeriod, setViewPeriod] = useState<'daily' | 'monthly'>('daily');

  // Dynamic local date & month
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStr());
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthStr());

  // Filters within the selected period
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>('Tümü');
  const [selectedTableFilter, setSelectedTableFilter] = useState<string>('Tümü');
  const [paymentFilter, setPaymentFilter] = useState<'Tümü' | PaymentMethod>('Tümü');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const todayStr = getTodayDateStr();
  const currentMonthStr = getCurrentMonthStr();

  // 1. Filter sessions strictly by the chosen Period using local calendar date comparison
  const periodSessions = useMemo(() => {
    if (viewPeriod === 'daily') {
      return orderHistory.filter(s => isSessionOnDate(s.paymentDate, selectedDate));
    } else {
      return orderHistory.filter(s => isSessionInMonth(s.paymentDate, selectedMonth));
    }
  }, [orderHistory, viewPeriod, selectedDate, selectedMonth]);

  // 2. PRODUCT SALES STATS for the chosen Period:
  // Sorted from MOST SOLD to LEAST SOLD
  const productRanking = useMemo(() => {
    const statsMap: Record<string, { qty: number; revenue: number; orderCount: number; category: string }> = {};

    periodSessions.forEach(session => {
      const countedInOrder = new Set<string>();

      session.items.forEach(item => {
        const name = item.productName;
        if (!statsMap[name]) {
          statsMap[name] = {
            qty: 0,
            revenue: 0,
            orderCount: 0,
            category: item.category || 'Genel'
          };
        }
        statsMap[name].qty += item.qty;
        statsMap[name].revenue += item.totalPrice;

        if (!countedInOrder.has(name)) {
          statsMap[name].orderCount += 1;
          countedInOrder.add(name);
        }
      });
    });

    // Convert to array and sort descending: most sold qty to least sold qty
    return Object.entries(statsMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => {
        if (b.qty !== a.qty) return b.qty - a.qty;
        return b.revenue - a.revenue;
      });
  }, [periodSessions]);

  // Total qty sold in period across all products
  const totalQuantitySoldInPeriod = useMemo(() => {
    return productRanking.reduce((sum, p) => sum + p.qty, 0);
  }, [productRanking]);

  // Max sold quantity for percentage bars
  const maxSoldQty = productRanking.length > 0 ? productRanking[0].qty : 1;

  // 3. Filtered sessions applying product, table, payment and search filters
  const filteredSessions = useMemo(() => {
    return periodSessions.filter(session => {
      // Payment filter
      if (paymentFilter !== 'Tümü' && session.paymentMethod !== paymentFilter) {
        return false;
      }

      // Table filter
      if (selectedTableFilter !== 'Tümü' && session.tableName !== selectedTableFilter) {
        return false;
      }

      // Product filter
      if (selectedProductFilter !== 'Tümü') {
        const hasProduct = session.items.some(
          item => item.productName.toLowerCase() === selectedProductFilter.toLowerCase()
        );
        if (!hasProduct) return false;
      }

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTable = session.tableName.toLowerCase().includes(q);
        const matchProducts = session.singleBlockProducts.toLowerCase().includes(q);
        const matchNotes = session.notes?.toLowerCase().includes(q) || false;
        if (!matchTable && !matchProducts && !matchNotes) return false;
      }

      return true;
    });
  }, [periodSessions, paymentFilter, selectedTableFilter, selectedProductFilter, searchQuery]);

  // Financial KPIs for the period
  const totalCount = filteredSessions.length;
  const totalRevenue = filteredSessions.reduce((sum, s) => sum + s.totalAmount, 0);
  const cashAmount = filteredSessions
    .filter(s => s.paymentMethod === 'Nakit')
    .reduce((sum, s) => sum + s.totalAmount, 0);
  const cardAmount = filteredSessions
    .filter(s => s.paymentMethod === 'Kredi Kartı')
    .reduce((sum, s) => sum + s.totalAmount, 0);

  // Helper date shortcuts
  const handleSetToday = () => setSelectedDate(getTodayDateStr());
  const handleSetYesterday = () => setSelectedDate(getYesterdayDateStr());
  const handleSetCurrentMonth = () => setSelectedMonth(getCurrentMonthStr());

  // Unique table names
  const allTableNames = useMemo(() => {
    const set = new Set<string>();
    tables.forEach(t => set.add(t.name));
    orderHistory.forEach(s => set.add(s.tableName));
    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
  }, [tables, orderHistory]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Top Header: Period Switcher (Gün Bazlı vs Ay Bazlı) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Calendar className="w-6 h-6 text-blue-600" />
              <span>Sipariş ve Ürün Satış Geçmişi</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Gün ve ay bazında tüm ürünlerin çok satılandan az satılana detaylı satış analizi
            </p>
          </div>

          {/* Mode Tabs: Gün Bazlı / Ay Bazlı */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start md:self-auto">
            <button
              onClick={() => {
                setViewPeriod('daily');
                setSelectedProductFilter('Tümü');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewPeriod === 'daily'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📅 Gün Bazlı Geçmiş
            </button>
            <button
              onClick={() => {
                setViewPeriod('monthly');
                setSelectedProductFilter('Tümü');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewPeriod === 'monthly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📊 Ay Bazlı Geçmiş
            </button>
          </div>
        </div>

        {/* Period Selector Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {viewPeriod === 'daily' ? 'Seçili Gün:' : 'Seçili Ay:'}
            </span>

            {viewPeriod === 'daily' ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedProductFilter('Tümü');
                    }}
                    className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
                  />
                </div>
                <button
                  onClick={handleSetToday}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedDate === todayStr
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Bugün
                </button>
                <button
                  onClick={handleSetYesterday}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Dün
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => {
                      setSelectedMonth(e.target.value);
                      setSelectedProductFilter('Tümü');
                    }}
                    className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
                  />
                </div>
                <button
                  onClick={handleSetCurrentMonth}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedMonth === currentMonthStr
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Bu Ay
                </button>
              </div>
            )}
          </div>

          {/* Quick period summary label */}
          <div className="text-xs text-slate-500 font-medium">
            Toplam <strong className="text-slate-900">{periodSessions.length}</strong> masa oturumu •{' '}
            <strong className="text-slate-900">{totalQuantitySoldInPeriod}</strong> adet ürün satışı
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {viewPeriod === 'daily' ? 'Günün Oturum Sayısı' : 'Aylık Masa Oturumu'}
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {totalCount} <span className="text-xs font-semibold text-slate-500">oturum</span>
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                Nakit Tahsilat
              </span>
              <Banknote className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">
              ₺{cashAmount.toFixed(2)}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                Kredi Kartı
              </span>
              <CreditCard className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-2xl font-black text-blue-700 mt-1 block">
              ₺{cardAmount.toFixed(2)}
            </span>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-md">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              {viewPeriod === 'daily' ? 'Günün Toplam Cirosu' : 'Aylık Toplam Ciro'}
            </span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">
              ₺{totalRevenue.toFixed(2)}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PRODUCT SALES RANKING: EN ÇOK SATILANDAN EN AZ SATILANA DOĞRU SIRALAMA    */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <span>
                    {viewPeriod === 'daily'
                      ? `Günün Ürün Satış Sıralaması (${formatDisplayDate(selectedDate)})`
                      : `Aylık Ürün Satış Sıralaması (${selectedMonth})`}
                  </span>
                  <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {productRanking.length} Ürün
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  En çok satılandan en az satılana doğru sıralanmıştır. Bir ürüne tıklayarak masa siparişlerini filtreleyebilirsiniz.
                </p>
              </div>
            </div>

            {selectedProductFilter !== 'Tümü' && (
              <button
                onClick={() => setSelectedProductFilter('Tümü')}
                className="self-start sm:self-auto text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Ürün Filtresini Kaldır ({selectedProductFilter})</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <th className="p-3.5 w-14 text-center">Sıra</th>
                  <th className="p-3.5">Ürün Adı</th>
                  <th className="p-3.5">Kategori</th>
                  <th className="p-3.5 min-w-[200px]">Satış Dağılımı</th>
                  <th className="p-3.5 text-right font-black">Satılan Miktar</th>
                  <th className="p-3.5 text-right font-black">Toplam Tutar</th>
                  <th className="p-3.5 text-center">Sipariş</th>
                  <th className="p-3.5 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productRanking.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-400">
                      <Layers className="w-10 h-10 mx-auto stroke-1 mb-2 opacity-40" />
                      <p className="font-bold text-sm text-slate-600">
                        Bu dönemde ({viewPeriod === 'daily' ? formatDisplayDate(selectedDate) : selectedMonth}) kayıtlı ürün satışı bulunmuyor.
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Masalardan sipariş alınıp hesap kapatıldığında burada en çok satanlar listelenecektir.
                      </p>
                    </td>
                  </tr>
                ) : (
                  productRanking.map((prod, index) => {
                    const isSelected = selectedProductFilter.toLowerCase() === prod.name.toLowerCase();
                    const percent = maxSoldQty > 0 ? (prod.qty / maxSoldQty) * 100 : 0;

                    return (
                      <tr
                        key={prod.name}
                        onClick={() => setSelectedProductFilter(isSelected ? 'Tümü' : prod.name)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/80 hover:bg-blue-100/70 border-l-4 border-blue-600'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Rank Badge */}
                        <td className="p-3.5 text-center whitespace-nowrap">
                          {index === 0 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs shadow-xs">
                              1
                            </span>
                          ) : index === 1 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-400 text-white font-black text-xs shadow-xs">
                              2
                            </span>
                          ) : index === 2 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs shadow-xs">
                              3
                            </span>
                          ) : (
                            <span className="font-bold text-slate-400">#{index + 1}</span>
                          )}
                        </td>

                        {/* Product Name */}
                        <td className="p-3.5 font-bold text-slate-800 capitalize whitespace-nowrap">
                          <span className={isSelected ? 'text-blue-700 font-black' : ''}>
                            {prod.name}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="p-3.5 text-slate-500 whitespace-nowrap">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                            {prod.category}
                          </span>
                        </td>

                        {/* Visual Percentage Bar */}
                        <td className="p-3.5">
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div
                              style={{ width: `${Math.max(percent, 4)}%` }}
                              className={`h-full rounded-full transition-all duration-300 ${
                                index === 0
                                  ? 'bg-amber-500'
                                  : index === 1
                                  ? 'bg-blue-500'
                                  : index === 2
                                  ? 'bg-emerald-500'
                                  : 'bg-indigo-500'
                              }`}
                            />
                          </div>
                        </td>

                        {/* SATILAN MİKTAR (ADET) */}
                        <td className="p-3.5 text-right font-black text-blue-700 text-sm whitespace-nowrap">
                          {prod.qty} <span className="text-xs font-semibold text-slate-500">adet</span>
                        </td>

                        {/* TOPLAM TUTAR (HASILAT) */}
                        <td className="p-3.5 text-right font-black text-emerald-700 text-sm whitespace-nowrap">
                          ₺{prod.revenue.toFixed(2)}
                        </td>

                        {/* Order Sessions Count */}
                        <td className="p-3.5 text-center text-slate-600 whitespace-nowrap">
                          {prod.orderCount} masada
                        </td>

                        {/* Action button */}
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProductFilter(isSelected ? 'Tümü' : prod.name);
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700'
                            }`}
                          >
                            {isSelected ? 'Seçili' : 'Filtrele'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MASA SİPARİŞ GEÇMİŞİ LİSTESİ (SEÇİLİ GÜN/AY İÇİN)                         */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Controls Bar for Orders Table */}
          <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  {viewPeriod === 'daily'
                    ? `Günün Kapanan Masa Siparişleri (${formatDisplayDate(selectedDate)})`
                    : `Ayın Kapanan Masa Siparişleri (${selectedMonth})`}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedProductFilter !== 'Tümü' ? (
                    <span className="text-blue-700 font-bold">
                      Yalnızca &quot;{selectedProductFilter}&quot; içeren siparişler gösteriliyor ({filteredSessions.length} oturum)
                    </span>
                  ) : (
                    <span>Tüm masa oturumları ve ürün bilgisi/fiyat detayları</span>
                  )}
                </p>
              </div>

              {selectedProductFilter !== 'Tümü' && (
                <button
                  onClick={() => setSelectedProductFilter('Tümü')}
                  className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-colors self-start cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Tüm Siparişleri Göster</span>
                </button>
              )}
            </div>

            {/* In-table filters: Search + Table Filter + Payment Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Masa adı veya ürün adı ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 outline-none transition-all"
                />
              </div>

              {/* Table Filter */}
              <div className="relative">
                <select
                  value={selectedTableFilter}
                  onChange={(e) => setSelectedTableFilter(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="Tümü">Tüm Masalar ({allTableNames.length})</option>
                  {allTableNames.map(name => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Method Filter */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl">
                {(['Tümü', 'Nakit', 'Kredi Kartı'] as const).map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentFilter(method)}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      paymentFilter === method
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 text-slate-600 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-3.5 w-12">Sıra</th>
                  <th className="p-3.5">Tarih / Saat</th>
                  <th className="p-3.5">Masa</th>
                  <th className="p-3.5">Ödeme Yöntemi</th>
                  {/* SÜTUN ADI: Ürün Bilgisi ve Fiyat Detayı */}
                  <th className="p-3.5 min-w-[340px]">Ürün Bilgisi ve Fiyat Detayı</th>
                  <th className="p-3.5 text-right">Toplam Tutar</th>
                  <th className="p-3.5 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-400">
                      <UtensilsCrossed className="w-10 h-10 mx-auto stroke-1 mb-2 opacity-40" />
                      <p className="font-bold text-sm text-slate-600">
                        Seçilen kriterlerde sipariş kaydı bulunmuyor.
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Tarih veya filtreleri değiştirerek tekrar kontrol edebilirsiniz.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((session, idx) => {
                    const formattedDate = formatDisplayDate(session.paymentDate);
                    const formattedTime = formatLocalTime(session.paymentDate);

                    return (
                      <tr key={session.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 text-slate-400 font-bold">{idx + 1}</td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-bold text-slate-800">{formattedDate}</div>
                          <div className="text-[11px] text-slate-400">{formattedTime}</div>
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <span className="font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                            {session.tableName}
                          </span>
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          {session.paymentMethod === 'Nakit' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Banknote className="w-3.5 h-3.5" /> Nakit
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <CreditCard className="w-3.5 h-3.5" /> Kredi Kartı
                            </span>
                          )}
                        </td>

                        {/* ÜRÜN BİLGİSİ VE FİYAT DETAYI SÜTUNU */}
                        <td className="p-3.5">
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 font-medium text-slate-800 leading-relaxed text-xs">
                            {session.singleBlockProducts}
                          </div>
                          {session.notes && (
                            <div className="text-[11px] text-amber-700 mt-1 italic">
                              Not: {session.notes}
                            </div>
                          )}
                        </td>

                        <td className="p-3.5 text-right whitespace-nowrap">
                          <span className="text-base font-black text-slate-900">
                            ₺{session.totalAmount.toFixed(2)}
                          </span>
                        </td>

                        <td className="p-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => onViewReceipt(session)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Fiş Detayı ve Yazdır"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Fiş</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {filteredSessions.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300 text-xs">
                    <td colSpan={4} className="p-3.5 text-right font-black uppercase">
                      TOPLAM ({filteredSessions.length} Oturum):
                    </td>
                    <td className="p-3.5 text-slate-600">
                      Nakit: ₺{cashAmount.toFixed(2)} | Kredi Kartı: ₺{cardAmount.toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right font-black text-base text-emerald-700">
                      ₺{totalRevenue.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
