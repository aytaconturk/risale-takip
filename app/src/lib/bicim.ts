import { AsYouType, isValidPhoneNumber } from 'libphonenumber-js';

// Görüntüleme biçimleri. Tarih/gün hesabı yapılmaz; değerler SQL'den gelir.

const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
export const KISA_GUNLER = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

// 'YYYY-MM-DD' → yerel saat sorunu olmadan parçalar
function parca(iso: string) {
  const [y, a, g] = iso.slice(0, 10).split('-').map(Number);
  return { y, a, g, haftaGunu: new Date(Date.UTC(y, a - 1, g)).getUTCDay() };
}

export function uzunTarih(iso: string): string {
  const { y, a, g } = parca(iso);
  return `${g} ${AYLAR[a - 1]} ${y}`;
}

// "20 Ekim"
export function gunAy(iso: string): string {
  const { a, g } = parca(iso);
  return `${g} ${AYLAR[a - 1]}`;
}

// "2 Ekim 2026 Cuma"
export function tamTarih(iso: string): string {
  return `${uzunTarih(iso)} ${gunAdi(iso)}`;
}

export function kisaTarih(iso: string): string {
  const { a, g } = parca(iso);
  return `${g} ${AYLAR[a - 1].slice(0, 3)}`;
}

// "12 Oca 2027"
export function kisaTarihYil(iso: string): string {
  return `${kisaTarih(iso)} ${parca(iso).y}`;
}

export function gunAdi(iso: string): string {
  return GUNLER[parca(iso).haftaGunu];
}

export function ayBasligi(iso: string): string {
  const { y, a } = parca(iso);
  return `${AYLAR[a - 1]} ${y}`;
}

export function gunNumarasi(iso: string): number {
  return parca(iso).g;
}

// Takvim ızgarası için ayın ilk/son günü ve önceki/sonraki ay (ISO)
export function ayAraligi(iso: string, kaydir = 0) {
  const { y, a } = parca(iso);
  const ilk = new Date(Date.UTC(y, a - 1 + kaydir, 1));
  const son = new Date(Date.UTC(ilk.getUTCFullYear(), ilk.getUTCMonth() + 1, 0));
  const s = (d: Date) => d.toISOString().slice(0, 10);
  return { bas: s(ilk), son: s(son), bosluk: (ilk.getUTCDay() + 6) % 7 };
}

export type Aralik = { kitap_ad: string; bas_sayfa: number; son_sayfa: number };

// [{Sözler 861–862}, {Tarihçe-i Hayat 1–18}] → "Sözler 861–862 + Tarihçe-i Hayat 1–18"
export function aralikMetni(satirlar: Aralik[]): string {
  return satirlar.map((s) => `${s.kitap_ad} ${s.bas_sayfa}–${s.son_sayfa}`).join(' + ');
}

// Günün n. sayfasının (0'dan) kitap sayfa numarası; gün iki kitaba taşıyorsa ikinciye geçer
export function sayfaNo(satirlar: Aralik[], n: number): number {
  let kalan = n;
  for (const s of satirlar) {
    const uzunluk = s.son_sayfa - s.bas_sayfa + 1;
    if (kalan < uzunluk) return s.bas_sayfa + kalan;
    kalan -= uzunluk;
  }
  const son = satirlar[satirlar.length - 1];
  return son ? son.son_sayfa : 0;
}

// "0555 555 55 54", "555 555 5554", "+90 555..." → "+905555555554"
export function telefonNormalize(girdi: string): string {
  const r = girdi.replace(/[^\d+]/g, '');
  if (r.startsWith('+')) return r;
  if (r.startsWith('00')) return '+' + r.slice(2);
  if (r.startsWith('0')) return '+90' + r.slice(1);
  if (r.length === 10) return '+90' + r;
  return '+' + r;
}

// Yazarken biçimler: "05555555555" → "0555 555 55 55", "+4915112345678" → "+49 1511 2345678"
export function telefonBicimle(girdi: string): string {
  return new AsYouType('TR').input(girdi);
}

// Ülke kodu yoksa Türkiye numarası sayılır
export function telefonGecerli(girdi: string): boolean {
  return isValidPhoneNumber(girdi, 'TR');
}

// Binlik ayırıcı nokta: 5.999
export function sayi(n: number): string {
  return n.toLocaleString('tr-TR');
}

// "00:00" biçiminde süre
export function sure(saniye: number): string {
  const d = Math.floor(saniye / 60);
  return `${String(d).padStart(2, '0')}:${String(saniye % 60).padStart(2, '0')}`;
}

export function yuzde(deger: number | null | undefined): string {
  return `%${(deger ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
}

export function basHarfler(ad: string, soyad?: string | null): string {
  return ((ad[0] ?? '') + (soyad?.[0] ?? ad.split(' ')[1]?.[0] ?? '')).toLocaleUpperCase('tr-TR');
}

// grup.ders_gunu → görünen ad
export const DERS_GUNU: Record<string, string> = {
  pazartesi: 'Pazartesi', sali: 'Salı', carsamba: 'Çarşamba', persembe: 'Perşembe', cuma: 'Cuma', cumartesi: 'Cumartesi', pazar: 'Pazar',
};
