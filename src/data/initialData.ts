import { Table, Product, OrderSession, AppSettings } from '../types/pos';

export const initialTables: Table[] = [
  { id: 'gpgg4zcj2', seq: 1, name: 'Masa 1', section: 'İç Mekan' },
  { id: 'rz0d76j4d', seq: 2, name: 'Masa 2', section: 'İç Mekan' },
  { id: 'zhzgljwve', seq: 3, name: 'Masa 3', section: 'İç Mekan' },
  { id: 'chjc62103', seq: 4, name: 'Masa 4', section: 'İç Mekan' },
  { id: 'rowpzfjh0', seq: 5, name: 'Masa 5', section: 'İç Mekan' },
  { id: 'm78t9ke4n', seq: 6, name: 'Masa 6', section: 'İç Mekan' },
  { id: 'q4t2l30tz', seq: 7, name: 'Masa 7', section: 'İç Mekan' },
  { id: 'ocvkszhff', seq: 8, name: 'Masa 8', section: 'İç Mekan' },
  { id: 'lr09t7x1f', seq: 9, name: 'Masa 9', section: 'İç Mekan' },
  { id: '6iin3c06b', seq: 10, name: 'Masa 10', section: 'İç Mekan' },
  { id: 'wv64ymmnm', seq: 11, name: 'Masa 11', section: 'İç Mekan' },
  { id: 'a52ymjxl1', seq: 12, name: 'Masa 12', section: 'İç Mekan' },
  { id: 'xh56vl5lo', seq: 13, name: 'Masa 13', section: 'İç Mekan' },
  { id: 'ird7u8zzd', seq: 14, name: 'Masa 14', section: 'İç Mekan' },
  { id: '8k0ea3lfs', seq: 15, name: 'Masa 15', section: 'İç Mekan' }
];

export const initialProducts: Product[] = [
  {
    id: 'boryjds47',
    category: 'İçecekler',
    name: 'çay',
    price: 50,
    img: 'cay.jpg'
  },
  {
    id: '1u58exfbh',
    category: 'İçecekler',
    name: 'Türk kahvesi',
    price: 120,
    img: 'turk-kahvesi.jpg'
  },
  {
    id: 'ml1524l1z',
    category: 'İçecekler',
    name: 'su',
    price: 50,
    img: 'erikli-su.jpg'
  },
  {
    id: '6ntw6rqjv',
    category: 'İçecekler',
    name: 'soda',
    price: 90,
    img: 'soda.jpg'
  },
  {
    id: 'zuhx42f7l',
    category: 'Tatlılar',
    name: 'soğuk baklava',
    price: 280,
    img: 'soguk-baklava-cikolatali.jpg'
  },
  {
    id: 'mzf07apa9',
    category: 'Tatlılar',
    name: 'çilekli magnolya',
    price: 200,
    img: 'cilekli-magnolya.jpeg'
  },
  {
    id: 'v8ip18gg2',
    category: 'Tatlılar',
    name: 'fırın sütlaç',
    price: 200,
    img: 'firin-sutlac.jpeg'
  },
  {
    id: '0aemi08wl',
    category: 'Tatlılar',
    name: 'fıstık özel 5 adet',
    price: 300,
    img: 'fistik-ozel.jpeg'
  },
  {
    id: 'll9f2z3e5',
    category: 'Tatlılar',
    name: 'fıstıklı magnolya',
    price: 200,
    img: 'fistikli-magnolya.jpeg'
  },
  {
    id: '3kg8cm7d5',
    category: 'Tatlılar',
    name: 'havuç dilimi adet',
    price: 350,
    img: 'havuc-dilimi.jpeg'
  },
  {
    id: 'b4vdoo22u',
    category: 'Tatlılar',
    name: 'kaymaklı kadayıf',
    price: 280,
    img: 'kaymakli-kadayif.jpeg'
  },
  {
    id: '4ohvumcl0',
    category: 'Tatlılar',
    name: 'kazandibi',
    price: 200,
    img: 'kazandibi.jpeg'
  },
  {
    id: 'y7y7n5as7',
    category: 'Tatlılar',
    name: 'keşkül',
    price: 200,
    img: 'keskul.jpeg'
  },
  {
    id: '3tle2yyi6',
    category: 'Tatlılar',
    name: 'profiterol',
    price: 200,
    img: 'profiterol.jpeg'
  },
  {
    id: 'ahd07xllr',
    category: 'Tatlılar',
    name: 'bol fıstıklı soğuk baklava 4 adet',
    price: 400,
    img: 'soguk-baklava.jpeg'
  },
  {
    id: 'ek8c2ovla',
    category: 'Tatlılar',
    name: 'supangle',
    price: 200,
    img: 'supangle.jpeg'
  },
  {
    id: 'y3j8lpi36',
    category: 'İçecekler',
    name: 'türk kahvesi',
    price: 120,
    img: 'turk-kahvesi.jpg'
  },
  {
    id: 'gq23wzjk7',
    category: 'Tatlılar',
    name: 'kuru baklava 3 adet',
    price: 350,
    img: 'kuru-baklava.jpeg'
  },
  {
    id: 'x83fwc64t',
    category: 'Tatlılar',
    name: 'yeşil midye 3 adet',
    price: 350,
    img: 'yesil-midye.jpeg'
  },
  {
    id: '2qidkdboe',
    category: 'Tatlılar',
    name: 'şöbiyet 3 adet',
    price: 350,
    img: 'sobiyet.jpeg'
  },
  {
    id: 't9ivsgw7k',
    category: 'Tatlılar',
    name: 'fıstık sarma 3 adet',
    price: 350,
    img: 'fistik-sarma.jpeg'
  },
  {
    id: '9djl7uz5m',
    category: 'Tatlılar',
    name: 'burma kadayıf 3 adet',
    price: 300,
    img: 'burma-kadayif.jpeg'
  },
  {
    id: 'bdxsu2zi9',
    category: 'Tatlılar',
    name: 'fıstıklı baklava 4 adet',
    price: 300,
    img: 'fistikli-baklava.jpeg'
  },
  {
    id: '7duaylwa9',
    category: 'Tatlılar',
    name: 'cevizli kaymaklı kadayıf',
    price: 250,
    img: 'kaymakli-kadayif.jpeg'
  }
];

export const initialSettings: AppSettings = {
  restaurantName: 'Dadaş Tatlıcı',
  targetEmail: 'guneyrecep2003@gmail.com',
  currency: '₺',
  phone: '+90 507 584 17 84',
  address: 'İzmir'
};

// Initial order sessions: starts completely empty as requested
export function generateInitialHistory(): OrderSession[] {
  return [];
}
