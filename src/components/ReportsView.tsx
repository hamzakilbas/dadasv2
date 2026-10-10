import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Calendar,
  Banknote,
  CreditCard,
  TrendingUp,
  Receipt,
  Download,
  BarChart3,
  Search
} from 'lucide-react';
import { OrderSession, Product, AppSettings } from '../types/pos';
import { exportDailyExcel, exportMonthlyExcel } from '../utils/excelExport';
import {
  isSessionOnDate,
  isSessionInMonth,
  formatLocalDate,
  formatLocalTime,
  formatDisplayDate,
  getTodayDateStr,
  getCurrentMonthStr
} from '../utils/dateHelper';

interface ReportsViewProps {
  orderHistory: OrderSession[];
  products: Product[];
  settings: AppSettings;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  orderHistory,
  products,
  settings
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');

  // Dynamic local date & month
  const todayStr = getTodayDateStr();
  const currentMonthStr = getCurrentMonthStr();

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [dailySearchQuery, setDailySearchQuery] = useState<string>('');
  const [dailyPaymentFilter, setDailyPaymentFilter] = useState<'Tümü' | 'Nakit' | 'Kredi Kartı'>('Tümü');

  // Daily Calculations using local calendar comparison
  const rawDaySessions = useMemo(() => {
    return orderHistory.filter(s => isSessionOnDate(s.paymentDate, selectedDate));
  }, [orderHistory, selectedDate]);

  // Filtered day sessions based on local search or payment method
  const daySessions = useMemo(() => {
    const q = dailySearchQuery.toLowerCase().trim();
    return rawDaySessions.filter(s => {
      if (dailyPaymentFilter !== 'Tümü' && s.paymentMethod !== dailyPaymentFilter) {
        return false;
      }
      if (q) {
        const matchTable = s.tableName.toLowerCase().includes(q);
        const matchProduct = s.singleBlockProducts.toLowerCase().includes(q);
        if (!matchTable && !matchProduct) return false;
      }
      return true;
    });
  }, [rawDaySessions, dailyPaymentFilter, dailySearchQuery]);

  const { dailyTotal, dailyCash, dailyCard, cashRatio, cardRatio } = useMemo(() => {
    const total = daySessions.reduce((sum, s) => sum + s.totalAmount, 0);
    const cash = daySessions.filter(s => s.paymentMethod === 'Nakit').reduce((sum, s) => sum + s.totalAmount, 0);
    const card = daySessions.filter(s => s.paymentMethod === 'Kredi Kartı').reduce((sum, s) => sum + s.totalAmount, 0);
    const cRatio = total > 0 ? (cash / total) * 100 : 0;
    const kRatio = total > 0 ? (card / total) * 100 : 0;
    return { dailyTotal: total, dailyCash: cash, dailyCard: card, cashRatio: cRatio, cardRatio: kRatio };
  }, [daySessions]);

  // Monthly Calculations using local calendar comparison
  const monthSessions = useMemo(() => {
    return orderHistory.filter(s => isSessionInMonth(s.paymentDate, selectedMonth));
  }, [orderHistory, selectedMonth]);

  const { monthlyTotal, monthlyCash, monthlyCard, monthlyCashRatio, monthlyCardRatio, avgSessionAmount } = useMemo(() => {
    const total = monthSessions.reduce((sum, s) => sum + s.totalAmount, 0);
    const cash = monthSessions.filter(s => s.paymentMethod === 'Nakit').reduce((sum, s) => sum + s.totalAmount, 0);
    const card = monthSessions.filter(s => s.paymentMethod === 'Kredi Kartı').reduce((sum, s) => sum + s.totalAmount, 0);
    const cRatio = total > 0 ? (cash / total) * 100 : 0;
    const kRatio = total > 0 ? (card / total) * 100 : 0;
    const avg = monthSessions.length > 0 ? total / monthSessions.length : 0;
    return {
      monthlyTotal: total,
      monthlyCash: cash,
      monthlyCard: card,
      monthlyCashRatio: cRatio,
      monthlyCardRatio: kRatio,
      avgSessionAmount: avg
    };
  }, [monthSessions]);

  // Monthly day-by-day map using local calendar date
  const dailyMap = useMemo(() => {
    const map: Record<string, { total: number; cash: number; card: number; count: number }> = {};
    monthSessions.forEach(s => {
      const day = formatLocalDate(s.paymentDate);
      if (!map[day]) {
        map[day] = { total: 0, cash: 0, card: 0, count: 0 };
      }
      map[day].total += s.totalAmount;
      if (s.paymentMethod === 'Nakit') map[day].cash += s.totalAmount;
      if (s.paymentMethod === 'Kredi Kartı') map[day].card += s.totalAmount;
      map[day].count += 1;
    });
    return map;
  }, [monthSessions]);

  // Top selling products in month
  const topProducts = useMemo(() => {
    const productSalesMap: Record<string, { qty: number; totalRevenue: number; category: string }> = {};
    monthSessions.forEach(s => {
      s.items.forEach(item => {
        if (!productSalesMap[item.productName]) {
          productSalesMap[item.productName] = { qty: 0, totalRevenue: 0, category: item.category };
        }
        productSalesMap[item.productName].qty += item.qty;
        productSalesMap[item.productName].totalRevenue += item.totalPrice;
      });
    });
    return Object.entries(productSalesMap)
      .sort((a, b) => b[1].qty - a[1].qty)
      .slice(0, 5);
  }, [monthSessions]);

  // Handlers for Actions
  const handleDownloadDailyExcel = () => {
    exportDailyExcel(orderHistory, selectedDate, settings.restaurantName || 'Dadaş Tatlıcı');
  };

  const handleDownloadMonthlyExcel = () => {
    exportMonthlyExcel(orderHistory, products, selectedMonth, settings.restaurantName || 'Dadaş Tatlıcı');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {/* Top Header & Tab switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
              <span>Finansal Raporlama & Excel Çıktıları</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Gün sonu kapanışları, ürün bilgisi ve fiyat detayları ile aylık özet Excel raporları
            </p>
          </div>

          {/* Report Tab switcher */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'daily'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📅 Gün Sonu Raporu
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📊 Aylık Özet Raporu
            </button>
          </div>
        </div>

        {/* ===================== TAB 1: GÜN SONU RAPORU ===================== */}
        {activeTab === 'daily' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Control Bar: Date selection & Action Buttons */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Rapor Tarihi:
                </span>
                <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
                  />
                </div>
                {selectedDate === todayStr && (
                  <span className="bg-blue-50 text-blue-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-blue-200">
                    Bugün
                  </span>
                )}
              </div>

              {/* Action Buttons: Direct Excel Download */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleDownloadDailyExcel}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-emerald-200 hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                  title="Gun_Sonu_Raporu_YYYY-MM-DD.xlsx dosyasını indir"
                >
                  <Download className="w-4 h-4" />
                  <span>Gün Sonu Excel Raporunu İndir</span>
                </button>
              </div>
            </div>

            {/* Daily KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Kapanan Masa Sayısı
                </span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {daySessions.length} <span className="text-xs font-semibold text-slate-500">oturum</span>
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
                  ₺{dailyCash.toFixed(2)}
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
                  %{cashRatio.toFixed(1)} pay
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
                  ₺{dailyCard.toFixed(2)}
                </span>
                <span className="text-[11px] text-blue-600 font-semibold mt-0.5 block">
                  %{cardRatio.toFixed(1)} pay
                </span>
              </div>

              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-md">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Gün Sonu Toplam Ciro
                </span>
                <span className="text-2xl font-black text-emerald-400 mt-1 block">
                  ₺{dailyTotal.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-300 font-semibold mt-0.5 block">
                  {daySessions.length} işlem toplamı
                </span>
              </div>
            </div>

            {/* Payment Distribution Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <Banknote className="w-4 h-4" /> Nakit: ₺{dailyCash.toFixed(2)} (%{cashRatio.toFixed(1)})
                </span>
                <span className="flex items-center gap-1.5 text-blue-700">
                  <CreditCard className="w-4 h-4" /> Kredi Kartı: ₺{dailyCard.toFixed(2)} (%{cardRatio.toFixed(1)})
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${cashRatio}%` }}
                  className="bg-emerald-500 h-full transition-all duration-500"
                />
                <div
                  style={{ width: `${cardRatio}%` }}
                  className="bg-blue-500 h-full transition-all duration-500"
                />
              </div>
            </div>

            {/* In-table filters for daily view */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Günün tablosunda ara (masa veya ürün adı)..."
                  value={dailySearchQuery}
                  onChange={(e) => setDailySearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                {(['Tümü', 'Nakit', 'Kredi Kartı'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setDailyPaymentFilter(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      dailyPaymentFilter === m
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* TABLE FORMAT: 6 COLUMNS WITH ACCURATE LOCAL TIME */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-slate-500" />
                  <h3 className="font-bold text-sm text-slate-800">
                    Gün Sonu Excel Tablo Önizlemesi ({formatDisplayDate(selectedDate)})
                  </h3>
                </div>
                <span className="text-xs text-slate-500">
                  Excel Dosya Adı: <strong className="text-slate-800">Gun_Sonu_Raporu_{selectedDate}.xlsx</strong>
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 text-slate-600 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                      <th className="p-3.5 w-12">Sıra</th>
                      <th className="p-3.5">Masa Numarası</th>
                      <th className="p-3.5">Saat</th>
                      <th className="p-3.5">Ödeme Yöntemi</th>
                      <th className="p-3.5 min-w-[360px]">Ürün Bilgisi ve Fiyat Detayı</th>
                      <th className="p-3.5 text-right">Toplam Ödenen Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {daySessions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          Bu tarihte henüz tamamlanmış bir masa satışı bulunmamaktadır.
                        </td>
                      </tr>
                    ) : (
                      daySessions.map((session, idx) => {
                        const time = formatLocalTime(session.paymentDate);

                        return (
                          <tr key={session.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3.5 font-bold text-slate-400">{idx + 1}</td>
                            <td className="p-3.5 font-bold text-slate-800 whitespace-nowrap">
                              <span className="bg-slate-100 px-2.5 py-1 rounded-lg">
                                {session.tableName}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-500 font-medium whitespace-nowrap">{time}</td>
                            <td className="p-3.5 whitespace-nowrap">
                              {session.paymentMethod === 'Nakit' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Banknote className="w-3 h-3" /> Nakit
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  <CreditCard className="w-3 h-3" /> Kredi Kartı
                                </span>
                              )}
                            </td>

                            {/* ÜRÜN BİLGİSİ VE FİYAT DETAYI */}
                            <td className="p-3.5">
                              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 font-medium text-slate-800 leading-relaxed text-xs">
                                {session.singleBlockProducts}
                              </div>
                            </td>

                            <td className="p-3.5 text-right font-black text-slate-900 whitespace-nowrap text-sm">
                              ₺{session.totalAmount.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {daySessions.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300">
                        <td colSpan={4} className="p-3.5 text-right font-black uppercase text-xs">
                          GÜN SONU TOPLAM:
                        </td>
                        <td className="p-3.5 text-xs text-slate-600 font-bold">
                          {daySessions.length} Oturum (Nakit: ₺{dailyCash.toFixed(2)} | Kart: ₺{dailyCard.toFixed(2)})
                        </td>
                        <td className="p-3.5 text-right font-black text-base text-emerald-700">
                          ₺{dailyTotal.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: AYLIK ÖZET RAPORU ===================== */}
        {activeTab === 'monthly' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Monthly Control Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Rapor Dönemi (Ay/Yıl):
                </span>
                <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Action button */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleDownloadMonthlyExcel}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-emerald-200 hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                  title="Aylik_Ozet_Raporu_YYYY-MM.xlsx dosyasını indir"
                >
                  <Download className="w-4 h-4" />
                  <span>Aylık Excel Raporu İndir</span>
                </button>
              </div>
            </div>

            {/* Monthly KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Toplam Masa Oturumu
                </span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {monthSessions.length} <span className="text-xs font-semibold text-slate-500">oturum</span>
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Ortalama: ₺{avgSessionAmount.toFixed(2)} / masa
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                    Aylık Nakit Tahsilat
                  </span>
                  <Banknote className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="text-2xl font-black text-emerald-700 mt-1 block">
                  ₺{monthlyCash.toFixed(2)}
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
                  %{monthlyCashRatio.toFixed(1)} pay
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                    Aylık Kredi Kartı
                  </span>
                  <CreditCard className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-2xl font-black text-blue-700 mt-1 block">
                  ₺{monthlyCard.toFixed(2)}
                </span>
                <span className="text-[11px] text-blue-600 font-semibold mt-0.5 block">
                  %{monthlyCardRatio.toFixed(1)} pay
                </span>
              </div>

              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-4 rounded-2xl shadow-md">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Aylık Toplam Ciro
                </span>
                <span className="text-2xl font-black text-emerald-400 mt-1 block">
                  ₺{monthlyTotal.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-300 font-semibold mt-0.5 block">
                  {selectedMonth} Dönemi
                </span>
              </div>
            </div>

            {/* Split row: Top Products & Day-by-Day Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="font-extrabold text-sm text-slate-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>Bu Ayın En Çok Satan İlk 5 Ürünü</span>
                </h3>

                {topProducts.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">Bu ay satış kaydı bulunmuyor.</p>
                ) : (
                  <div className="space-y-3">
                    {topProducts.map(([name, data], idx) => {
                      const maxQty = topProducts[0][1].qty;
                      const percent = (data.qty / maxQty) * 100;

                      return (
                        <div key={name} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-800">
                              <span className="text-slate-400 mr-2">#{idx + 1}</span>
                              {name}
                            </span>
                            <span className="font-extrabold text-slate-900">
                              {data.qty} adet • ₺{data.totalRevenue.toFixed(2)}
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${percent}%` }}
                              className="h-full bg-blue-600 rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Day-by-Day Table */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
                <h3 className="font-extrabold text-sm text-slate-800 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span>Gün Gün Ciro ve İşlem Dağılımı</span>
                </h3>

                <div className="overflow-y-auto max-h-72 flex-1">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase">
                        <th className="pb-2">Tarih</th>
                        <th className="pb-2">Oturum</th>
                        <th className="pb-2">Nakit</th>
                        <th className="pb-2">K. Kartı</th>
                        <th className="pb-2 text-right">Toplam Ciro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.keys(dailyMap).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">
                            Kayıt bulunamadı.
                          </td>
                        </tr>
                      ) : (
                        Object.keys(dailyMap).sort().reverse().map(day => {
                          const d = dailyMap[day];
                          return (
                            <tr key={day} className="hover:bg-slate-50">
                              <td className="py-2.5 font-bold text-slate-800">{formatDisplayDate(day)}</td>
                              <td className="py-2.5 text-slate-500">{d.count}</td>
                              <td className="py-2.5 text-emerald-700 font-semibold">₺{d.cash.toFixed(2)}</td>
                              <td className="py-2.5 text-blue-700 font-semibold">₺{d.card.toFixed(2)}</td>
                              <td className="py-2.5 text-right font-black text-slate-900">₺{d.total.toFixed(2)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
