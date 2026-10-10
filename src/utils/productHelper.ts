import { Product } from '../types/pos';
import { initialProducts } from '../data/initialData';

export const FILENAME_MAP: Record<string, string> = {
  "burma kadayıf.jpeg": "burma-kadayif.jpeg",
  "burma kadayif.jpeg": "burma-kadayif.jpeg",
  "burma-kadayif.jpeg": "burma-kadayif.jpeg",
  "çay.jpg": "cay.jpg",
  "cay.jpg": "cay.jpg",
  "çilekli magnolya.jpeg": "cilekli-magnolya.jpeg",
  "cilekli magnolya.jpeg": "cilekli-magnolya.jpeg",
  "cilekli-magnolya.jpeg": "cilekli-magnolya.jpeg",
  "erikli su.jpg": "erikli-su.jpg",
  "erikli-su.jpg": "erikli-su.jpg",
  "fırın sütlaç.jpeg": "firin-sutlac.jpeg",
  "firin sutlac.jpeg": "firin-sutlac.jpeg",
  "firin-sutlac.jpeg": "firin-sutlac.jpeg",
  "fıstıklı baklava.jpeg": "fistikli-baklava.jpeg",
  "fistikli baklava.jpeg": "fistikli-baklava.jpeg",
  "fistikli-baklava.jpeg": "fistikli-baklava.jpeg",
  "fıstıklı magnolya.jpeg": "fistikli-magnolya.jpeg",
  "fistikli magnolya.jpeg": "fistikli-magnolya.jpeg",
  "fistikli-magnolya.jpeg": "fistikli-magnolya.jpeg",
  "fıstık özel.jpeg": "fistik-ozel.jpeg",
  "fistik ozel.jpeg": "fistik-ozel.jpeg",
  "fistik-ozel.jpeg": "fistik-ozel.jpeg",
  "fıstık sarma.jpeg": "fistik-sarma.jpeg",
  "fistik sarma.jpeg": "fistik-sarma.jpeg",
  "fistik-sarma.jpeg": "fistik-sarma.jpeg",
  "havuç dilimi.jpeg": "havuc-dilimi.jpeg",
  "havuc dilimi.jpeg": "havuc-dilimi.jpeg",
  "havuc-dilimi.jpeg": "havuc-dilimi.jpeg",
  "kaymaklı kadayıf.jpeg": "kaymakli-kadayif.jpeg",
  "kaymakli kadayif.jpeg": "kaymakli-kadayif.jpeg",
  "kaymakli-kadayif.jpeg": "kaymakli-kadayif.jpeg",
  "kazandibi.jpeg": "kazandibi.jpeg",
  "keşkül.jpeg": "keskul.jpeg",
  "keskul.jpeg": "keskul.jpeg",
  "kuru baklava.jpeg": "kuru-baklava.jpeg",
  "kuru-baklava.jpeg": "kuru-baklava.jpeg",
  "profiterol.jpeg": "profiterol.jpeg",
  "şöbiyet.jpeg": "sobiyet.jpeg",
  "sobiyet.jpeg": "sobiyet.jpeg",
  "soda.jpg": "soda.jpg",
  "soğuk bakalava çikolatalı.jpg": "soguk-baklava-cikolatali.jpg",
  "soguk bakalava cikolatali.jpg": "soguk-baklava-cikolatali.jpg",
  "soguk-baklava-cikolatali.jpg": "soguk-baklava-cikolatali.jpg",
  "soğuk baklava.jpeg": "soguk-baklava.jpeg",
  "soguk baklava.jpeg": "soguk-baklava.jpeg",
  "soguk-baklava.jpeg": "soguk-baklava.jpeg",
  "supangle.jpeg": "supangle.jpeg",
  "türk kahvesi.jpg": "turk-kahvesi.jpg",
  "turk kahvesi.jpg": "turk-kahvesi.jpg",
  "turk-kahvesi.jpg": "turk-kahvesi.jpg",
  "yeşil midye.jpeg": "yesil-midye.jpeg",
  "yesil midye.jpeg": "yesil-midye.jpeg",
  "yesil-midye.jpeg": "yesil-midye.jpeg"
};

/**
 * Otomatik kategori belirleyici (İçecekler veya Tatlılar)
 */
export function inferCategory(productName: string = ''): string {
  const name = (productName || '').toLowerCase();
  const drinkKeywords = [
    'çay', 'cay', 'kahve', 'su', 'soda', 'kola', 'fanta', 'gazoz',
    'ayran', 'limonata', 'meyve', 'içecek', 'icecek'
  ];
  if (drinkKeywords.some(k => name.includes(k))) {
    return 'İçecekler';
  }
  return 'Tatlılar';
}

/**
 * Ürün objesini normalize eder (Kategori ve resim yolunu eksiksiz garanti altına alır)
 */
export function normalizeProduct(p: any): Product {
  const initialMatch = initialProducts.find(
    ip => ip.id === p.id || ip.name.toLowerCase().trim() === (p.name || '').toLowerCase().trim()
  );

  let category = (p.category && String(p.category).trim())
    ? String(p.category).trim()
    : (initialMatch?.category || inferCategory(p.name));

  // Kategori tekil/çoğul eşitlemesi ('İçecek' -> 'İçecekler', 'Tatlı' -> 'Tatlılar')
  const lowerCat = category.toLowerCase();
  if (lowerCat === 'içecek' || lowerCat === 'icecek' || lowerCat === 'i̇çecek') {
    category = 'İçecekler';
  } else if (lowerCat === 'tatlı' || lowerCat === 'tatli') {
    category = 'Tatlılar';
  }

  let img = p.img || initialMatch?.img || '';
  if (img) {
    const clean = img.replace(/^\.?\/?(resimler\/)?/, '');
    const mapped = FILENAME_MAP[clean] || FILENAME_MAP[decodeURIComponent(clean)];
    if (mapped) img = mapped;
  }

  return {
    ...p,
    id: p.id || `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: p.name || 'Yeni Ürün',
    category,
    price: typeof p.price === 'number' ? p.price : Number(p.price) || 0,
    img
  };
}

/**
 * Hem web ortamında hem de Electron .exe (file:///) ortamında resimlerin
 * %100 sorunsuz yüklenmesini sağlayan bağıl yol üretici.
 * Asla başa tek slash (/) koymaz, doğrudan klasör içinden okur.
 */
export function getProductImgSrc(img?: string): string {
  if (!img) return '';
  if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:')) return img;

  // Başındaki olası ./ veya / veya resimler/ öneklerini temizle
  const clean = img.replace(/^\.?\/?(resimler\/)?/, '');
  if (!clean) return '';

  const mapped = FILENAME_MAP[clean] || FILENAME_MAP[decodeURIComponent(clean)] || clean;
  return `./resimler/${encodeURI(mapped)}`;
}

/**
 * Kullanıcının bilgisayarından seçtiği resim dosyasını hafif bir base64 data-url'e sıkıştırır (~30KB).
 * Bu sayede resim dosya yoluyla uğraşmadan EXE ve Web'de doğrudan saklanır ve çalışır.
 */
export function compressImageFile(file: File, maxDim = 400, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Uygulama içerisindeki hazır resimler listesi
 */
export const PRESET_IMAGES = [
  { name: 'Çay', file: 'cay.jpg' },
  { name: 'Türk Kahvesi', file: 'turk-kahvesi.jpg' },
  { name: 'Erikli Su', file: 'erikli-su.jpg' },
  { name: 'Soda', file: 'soda.jpg' },
  { name: 'Fırın Sütlaç', file: 'firin-sutlac.jpeg' },
  { name: 'Kazandibi', file: 'kazandibi.jpeg' },
  { name: 'Fıstıklı Baklava', file: 'fistikli-baklava.jpeg' },
  { name: 'Kuru Baklava', file: 'kuru-baklava.jpeg' },
  { name: 'Havuç Dilimi', file: 'havuc-dilimi.jpeg' },
  { name: 'Şöbiyet', file: 'sobiyet.jpeg' },
  { name: 'Burma Kadayıf', file: 'burma-kadayif.jpeg' },
  { name: 'Kaymaklı Kadayıf', file: 'kaymakli-kadayif.jpeg' },
  { name: 'Fıstık Sarma', file: 'fistik-sarma.jpeg' },
  { name: 'Yeşil Midye', file: 'yesil-midye.jpeg' },
  { name: 'Fıstık Özel', file: 'fistik-ozel.jpeg' },
  { name: 'Soğuk Baklava', file: 'soguk-baklava.jpeg' },
  { name: 'Soğuk Baklava Çikolatalı', file: 'soguk-baklava-cikolatali.jpg' },
  { name: 'Profiterol', file: 'profiterol.jpeg' },
  { name: 'Supangle', file: 'supangle.jpeg' },
  { name: 'Keşkül', file: 'keskul.jpeg' },
  { name: 'Çilekli Magnolia', file: 'cilekli-magnolya.jpeg' },
  { name: 'Fıstıklı Magnolia', file: 'fistikli-magnolya.jpeg' }
];

