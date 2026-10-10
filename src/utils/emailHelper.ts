import { OrderSession, Product } from '../types/pos';

export interface EmailData {
  to: string;
  subject: string;
  body: string;
  gmailUrl: string;
  mailtoUrl: string;
  fileName: string;
}

export function buildDailyEmailData(
  sessions: OrderSession[],
  dateStr: string,
  targetEmail: string,
  restaurantName: string
): EmailData {
  const daySessions = sessions.filter(s => s.paymentDate.startsWith(dateStr));
  const totalAmount = daySessions.reduce((acc, s) => acc + s.totalAmount, 0);
  const cashAmount = daySessions.filter(s => s.paymentMethod === 'Nakit').reduce((acc, s) => acc + s.totalAmount, 0);
  const cardAmount = daySessions.filter(s => s.paymentMethod === 'Kredi Kartı').reduce((acc, s) => acc + s.totalAmount, 0);

  const subject = `[${restaurantName}] Gün Sonu Raporu - ${dateStr}`;

  let body = `Sayın Yetkili,\n\n`;
  body += `${restaurantName} bünyesinde ${dateStr} tarihli Gün Sonu Kapanış ve POS Tahsilat Raporu aşağıda bilgilerinize sunulmuştur.\n\n`;
  body += `=========================================\n`;
  body += `📊 GÜN SONU FİNANSAL ÖZETİ (${dateStr})\n`;
  body += `=========================================\n`;
  body += `• Toplam Kapanan Masa / Oturum: ${daySessions.length} adet\n`;
  body += `• Nakit Tahsilat: ${cashAmount.toFixed(2)} ₺\n`;
  body += `• Kredi Kartı Tahsilat: ${cardAmount.toFixed(2)} ₺\n`;
  body += `• GÜN SONU TOPLAM CİRO: ${totalAmount.toFixed(2)} ₺\n\n`;
  body += `=========================================\n`;
  body += `🍽️ MASA BAZLI TEK BLOK OTURUM LİSTESİ\n`;
  body += `=========================================\n`;

  if (daySessions.length === 0) {
    body += `(Bu tarihte henüz kapatılmış sipariş bulunmamaktadır.)\n\n`;
  } else {
    daySessions.forEach((s, idx) => {
      const time = s.paymentDate.includes('T') ? s.paymentDate.split('T')[1].substring(0, 5) : '';
      body += `${idx + 1}. ${s.tableName} (${time}) [${s.paymentMethod}]\n`;
      body += `   Ürünler (Tek Blok): ${s.singleBlockProducts}\n`;
      body += `   Detay: ${s.detailedProductInfo}\n`;
      body += `   Toplam Ödenen: ${s.totalAmount.toFixed(2)} ₺\n\n`;
    });
  }

  body += `* Not: Detaylı Excel tablosu "Gun_Sonu_Raporu_${dateStr}.xlsx" adıyla bilgisayarınıza indirilmiştir. Lütfen bu e-postaya ekleyiniz.\n\n`;
  body += `İyi çalışmalar dileriz,\n${restaurantName} POS Sistemi`;

  const fileName = `Gun_Sonu_Raporu_${dateStr}.xlsx`;
  const mailtoUrl = `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(targetEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return {
    to: targetEmail,
    subject,
    body,
    gmailUrl,
    mailtoUrl,
    fileName
  };
}

export function buildMonthlyEmailData(
  sessions: OrderSession[],
  products: Product[],
  yearMonthStr: string,
  targetEmail: string,
  restaurantName: string
): EmailData {
  const monthSessions = sessions.filter(s => s.paymentDate.startsWith(yearMonthStr));
  const totalAmount = monthSessions.reduce((acc, s) => acc + s.totalAmount, 0);
  const cashAmount = monthSessions.filter(s => s.paymentMethod === 'Nakit').reduce((acc, s) => acc + s.totalAmount, 0);
  const cardAmount = monthSessions.filter(s => s.paymentMethod === 'Kredi Kartı').reduce((acc, s) => acc + s.totalAmount, 0);

  // Best selling products
  const productSalesMap: Record<string, { qty: number; totalRevenue: number }> = {};
  monthSessions.forEach(s => {
    s.items.forEach(item => {
      if (!productSalesMap[item.productName]) {
        productSalesMap[item.productName] = { qty: 0, totalRevenue: 0 };
      }
      productSalesMap[item.productName].qty += item.qty;
      productSalesMap[item.productName].totalRevenue += item.totalPrice;
    });
  });

  const topProducts = Object.entries(productSalesMap)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 5);

  const subject = `[${restaurantName}] Aylık Özet Raporu - ${yearMonthStr}`;

  let body = `Sayın Yetkili,\n\n`;
  body += `${restaurantName} işletmesinin ${yearMonthStr} dönemine ait Aylık Özet Faaliyet Raporu hazırlanmıştır.\n\n`;
  body += `=========================================\n`;
  body += `📈 AYLIK GENEL PERFORMANS (${yearMonthStr})\n`;
  body += `=========================================\n`;
  body += `• Toplam Masa Oturumu: ${monthSessions.length} adet\n`;
  body += `• Nakit Tahsilat: ${cashAmount.toFixed(2)} ₺ (%${totalAmount > 0 ? ((cashAmount / totalAmount) * 100).toFixed(1) : '0'})\n`;
  body += `• Kredi Kartı Tahsilat: ${cardAmount.toFixed(2)} ₺ (%${totalAmount > 0 ? ((cardAmount / totalAmount) * 100).toFixed(1) : '0'})\n`;
  body += `• AYLIK TOPLAM CİRO: ${totalAmount.toFixed(2)} ₺\n`;
  body += `• Ortalama Masa Tutarı: ${monthSessions.length > 0 ? (totalAmount / monthSessions.length).toFixed(2) : '0.00'} ₺\n\n`;

  body += `=========================================\n`;
  body += `🏆 EN ÇOK SATAN İLK 5 ÜRÜN\n`;
  body += `=========================================\n`;
  if (topProducts.length === 0) {
    body += `(Kayıtlı ürün satışı bulunmuyor)\n`;
  } else {
    topProducts.forEach(([name, data], idx) => {
      body += `${idx + 1}. ${name}: ${data.qty} adet (${data.totalRevenue.toFixed(2)} ₺)\n`;
    });
  }
  body += `\n`;

  body += `* Detaylı 3 sayfalı Excel raporu "Aylik_Ozet_Raporu_${yearMonthStr}.xlsx" adıyla cihazınıza indirilmiştir.\n\n`;
  body += `İyi çalışmalar dileriz,\n${restaurantName} POS Sistemi`;

  const fileName = `Aylik_Ozet_Raporu_${yearMonthStr}.xlsx`;
  const mailtoUrl = `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(targetEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return {
    to: targetEmail,
    subject,
    body,
    gmailUrl,
    mailtoUrl,
    fileName
  };
}
