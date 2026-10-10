import * as XLSX from 'xlsx';
import { OrderSession, Product } from '../types/pos';
import {
  isSessionOnDate,
  isSessionInMonth,
  formatLocalDate,
  formatLocalTime,
  formatDisplayDate
} from './dateHelper';

/**
 * Gün Sonu Excel Raporu (Gun_Sonu_Raporu_YYYY-MM-DD.xlsx)
 * Kolonlar:
 * Sıra | Masa Numarası | Saat | Ödeme Yöntemi | Ürün Bilgisi ve Fiyat Detayı | Toplam Ödenen Tutar (₺)
 */
export function exportDailyExcel(
  sessions: OrderSession[],
  dateStr: string,
  restaurantName: string = 'Dadaş Tatlıcı'
): string {
  const fileName = `Gun_Sonu_Raporu_${dateStr}.xlsx`;

  // Seçili yerel takvim gününe ait oturumlar
  const daySessions = sessions.filter(s => isSessionOnDate(s.paymentDate, dateStr));

  // Toplamlar
  const totalAmount = daySessions.reduce((acc, s) => acc + s.totalAmount, 0);
  const cashAmount = daySessions.filter(s => s.paymentMethod === 'Nakit').reduce((acc, s) => acc + s.totalAmount, 0);
  const cardAmount = daySessions.filter(s => s.paymentMethod === 'Kredi Kartı').reduce((acc, s) => acc + s.totalAmount, 0);

  const rows: Record<string, string | number>[] = [];

  daySessions.forEach((session, index) => {
    const timeStr = formatLocalTime(session.paymentDate);

    rows.push({
      'Sıra': index + 1,
      'Masa Numarası': session.tableName,
      'Saat': timeStr,
      'Ödeme Yöntemi': session.paymentMethod,
      'Ürün Bilgisi ve Fiyat Detayı': session.singleBlockProducts,
      'Toplam Ödenen Tutar (₺)': Number(session.totalAmount.toFixed(2))
    });
  });

  // Ayırıcı boş satır
  rows.push({
    'Sıra': '',
    'Masa Numarası': '',
    'Saat': '',
    'Ödeme Yöntemi': '',
    'Ürün Bilgisi ve Fiyat Detayı': '',
    'Toplam Ödenen Tutar (₺)': ''
  });

  // Özet Toplam Satırı
  rows.push({
    'Sıra': 'ÖZET',
    'Masa Numarası': `Toplam Oturum: ${daySessions.length}`,
    'Saat': '',
    'Ödeme Yöntemi': `Nakit: ${cashAmount.toFixed(2)} ₺ | Kredi Kartı: ${cardAmount.toFixed(2)} ₺`,
    'Ürün Bilgisi ve Fiyat Detayı': `${restaurantName} GÜN SONU TOPLAM CİRO:`,
    'Toplam Ödenen Tutar (₺)': Number(totalAmount.toFixed(2))
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet['!cols'] = [
    { wch: 6 },   // Sıra
    { wch: 15 },  // Masa Numarası
    { wch: 10 },  // Saat
    { wch: 16 },  // Ödeme Yöntemi
    { wch: 65 },  // Ürün Bilgisi ve Fiyat Detayı
    { wch: 22 }   // Toplam Ödenen Tutar
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Gün Sonu - ${dateStr}`);

  XLSX.writeFile(workbook, fileName);
  return fileName;
}

/**
 * Aylık Özet Excel Raporu (Aylik_Ozet_Raporu_YYYY-MM.xlsx)
 * Sayfa 1: Aylık Genel Özet & Gün Gün Dağılım
 * Sayfa 2: Tüm Oturumlar
 * Sayfa 3: Ürün Satış Hacimleri ve Ciroları
 */
export function exportMonthlyExcel(
  sessions: OrderSession[],
  products: Product[],
  yearMonthStr: string,
  restaurantName: string = 'Dadaş Tatlıcı'
): string {
  const fileName = `Aylik_Ozet_Raporu_${yearMonthStr}.xlsx`;

  // Seçili yerel takvim ayına ait oturumlar
  const monthSessions = sessions.filter(s => isSessionInMonth(s.paymentDate, yearMonthStr));

  const totalAmount = monthSessions.reduce((acc, s) => acc + s.totalAmount, 0);
  const cashAmount = monthSessions.filter(s => s.paymentMethod === 'Nakit').reduce((acc, s) => acc + s.totalAmount, 0);
  const cardAmount = monthSessions.filter(s => s.paymentMethod === 'Kredi Kartı').reduce((acc, s) => acc + s.totalAmount, 0);

  const workbook = XLSX.utils.book_new();

  // 1. Sayfa: Aylık Genel Özet (Gün gün yerel takvime göre)
  const dailyMap: Record<string, { total: number; cash: number; card: number; count: number }> = {};
  monthSessions.forEach(s => {
    const day = formatLocalDate(s.paymentDate);
    if (!dailyMap[day]) {
      dailyMap[day] = { total: 0, cash: 0, card: 0, count: 0 };
    }
    dailyMap[day].total += s.totalAmount;
    if (s.paymentMethod === 'Nakit') dailyMap[day].cash += s.totalAmount;
    if (s.paymentMethod === 'Kredi Kartı') dailyMap[day].card += s.totalAmount;
    dailyMap[day].count += 1;
  });

  const summaryRows: Record<string, string | number>[] = [
    { 'Metrik': 'Rapor Dönemi', 'Değer': yearMonthStr },
    { 'Metrik': 'İşletme Adı', 'Değer': restaurantName },
    { 'Metrik': 'Toplam Kapanan Masa / Oturum', 'Değer': monthSessions.length },
    { 'Metrik': 'Toplam Nakit Tahsilat', 'Değer': `${cashAmount.toFixed(2)} ₺` },
    { 'Metrik': 'Toplam Kredi Kartı Tahsilat', 'Değer': `${cardAmount.toFixed(2)} ₺` },
    { 'Metrik': 'Aylık Toplam Ciro', 'Değer': `${totalAmount.toFixed(2)} ₺` },
    { 'Metrik': '', 'Değer': '' },
    { 'Metrik': 'GÜN GÜN SATIŞ DAĞILIMI', 'Değer': '' }
  ];

  const sortedDays = Object.keys(dailyMap).sort();
  sortedDays.forEach(day => {
    const data = dailyMap[day];
    summaryRows.push({
      'Metrik': day,
      'Değer': `Oturum: ${data.count} | Nakit: ${data.cash.toFixed(2)} ₺ | Kredi Kartı: ${data.card.toFixed(2)} ₺ | Toplam: ${data.total.toFixed(2)} ₺`
    });
  });

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 25 }, { wch: 75 }];
  XLSX.utils.book_append_sheet(workbook, wsSummary, 'Aylık Genel Özet');

  // 2. Sayfa: Tüm Oturumlar
  const sessionsRows: Record<string, string | number>[] = [];
  monthSessions.forEach((session, idx) => {
    sessionsRows.push({
      'Sıra': idx + 1,
      'Tarih': formatDisplayDate(session.paymentDate),
      'Saat': formatLocalTime(session.paymentDate),
      'Masa Numarası': session.tableName,
      'Ödeme Yöntemi': session.paymentMethod,
      'Ürün Bilgisi ve Fiyat Detayı': session.singleBlockProducts,
      'Toplam Tutar (₺)': Number(session.totalAmount.toFixed(2))
    });
  });
  const wsSessions = XLSX.utils.json_to_sheet(sessionsRows);
  wsSessions['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 8 },
    { wch: 15 },
    { wch: 15 },
    { wch: 65 },
    { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(workbook, wsSessions, 'Tüm Oturumlar');

  // 3. Sayfa: Ürün Satış Hacimleri
  const productSalesMap: Record<string, { qty: number; totalRevenue: number; category: string }> = {};
  monthSessions.forEach(s => {
    s.items.forEach(item => {
      const pName = item.productName;
      if (!productSalesMap[pName]) {
        productSalesMap[pName] = { qty: 0, totalRevenue: 0, category: item.category };
      }
      productSalesMap[pName].qty += item.qty;
      productSalesMap[pName].totalRevenue += item.totalPrice;
    });
  });

  const productRows: Record<string, string | number>[] = [];
  const sortedProductList = [...products].sort((a, b) => {
    const qtyA = productSalesMap[a.name]?.qty || 0;
    const qtyB = productSalesMap[b.name]?.qty || 0;
    return qtyB - qtyA;
  });

  sortedProductList.forEach((p, idx) => {
    const sale = productSalesMap[p.name] || { qty: 0, totalRevenue: 0, category: p.category };
    productRows.push({
      'Sıra': idx + 1,
      'Ürün Adı': p.name,
      'Kategori': p.category,
      'Birim Fiyat (₺)': p.price,
      'Bu Ay Satılan Adet': sale.qty,
      'Elde Edilen Ciro (₺)': Number(sale.totalRevenue.toFixed(2))
    });
  });

  const wsProducts = XLSX.utils.json_to_sheet(productRows);
  wsProducts['!cols'] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 15 },
    { wch: 14 },
    { wch: 18 },
    { wch: 20 }
  ];
  XLSX.utils.book_append_sheet(workbook, wsProducts, 'Ürün Satış Sıralaması');

  XLSX.writeFile(workbook, fileName);
  return fileName;
}
