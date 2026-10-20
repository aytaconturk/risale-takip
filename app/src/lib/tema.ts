import { Platform } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import { useDuzen } from '@/src/lib/duzen';

// İki görsel dil: modernist (mobil, köşesiz, tek kırmızı vurgu) ve klasik (geniş ekran, iOS renkleri).
export type Dil = 'modernist' | 'klasik';

type Sekil = {
  font: { normal: string; yari: string; kalin: string };
  baslikAgirlik: '700' | '800';
  rKart: number; rButon: number; rHucre: number | 'daire'; rHucreKare: number; rKucuk: number; rHap: number; rSayfa: number;
  cizgi: number;
  butonHiza: 'flex-start' | 'center';
  kartGolge: string;
  vurguGolge: string;
  ikonKenar: number;
  statAralik: number;
};

type Renk = {
  zemin: string; yuzey: string; metin: string; soluk: string; kenar: string; iz: string;
  vurgu: string; vurgu600: string; vurgu700: string;
  vurguZemin: string;
  vurguButonYazi: string;
  okundu: string; okunduYazi: string; telafi: string; kismi: string; kacirildi: string;
  perde: string; bildirimZemin: string; bildirimYazi: string; anahtarAcik: string;
};

export type Renkler = Renk & Sekil & { dil: Dil; koyu: boolean };

const modernistSekil: Sekil = {
  font: { normal: 'Archivo_400Regular', yari: 'Archivo_600SemiBold', kalin: 'Archivo_800ExtraBold' },
  baslikAgirlik: '800',
  rKart: 0, rButon: 0, rHucre: 0, rHucreKare: 0, rKucuk: 0, rHap: 0, rSayfa: 0,
  cizgi: 2, butonHiza: 'flex-start', kartGolge: 'none', vurguGolge: 'none', ikonKenar: 1, statAralik: 0,
};

const klasikSekil: Sekil = {
  font: { normal: 'System', yari: 'System', kalin: 'System' },
  baslikAgirlik: '700',
  rKart: 20, rButon: 12, rHucre: 'daire', rHucreKare: 12, rKucuk: 4, rHap: 999, rSayfa: 20,
  cizgi: 0, butonHiza: 'center', kartGolge: '0 1px 3px rgba(0,0,0,0.06)', vurguGolge: '0 10px 24px rgba(37,99,235,0.28)', ikonKenar: 0, statAralik: 12,
};

const modAcik: Renk = {
  zemin: '#f3f2f2', yuzey: '#eae9e9', metin: '#201e1d', soluk: 'rgba(32,30,29,0.58)', kenar: 'rgba(32,30,29,0.40)', iz: '#d7d3d3',
  vurgu: '#ec3013', vurgu600: '#dd2b0f', vurgu700: '#ae1800', vurguZemin: '#ec3013', vurguButonYazi: '#201e1d',
  okundu: '#201e1d', okunduYazi: '#f3f2f2', telafi: '#7d7979', kismi: '#201e1d', kacirildi: '#ae1800',
  perde: 'rgba(45,43,43,0.5)', bildirimZemin: '#201e1d', bildirimYazi: '#f3f2f2', anahtarAcik: '#ec3013',
};

const modKoyu: Renk = {
  zemin: '#201e1d', yuzey: '#2d2b2b', metin: '#f3f2f2', soluk: 'rgba(243,242,242,0.58)', kenar: 'rgba(243,242,242,0.38)', iz: '#444141',
  vurgu: '#ff563c', vurgu600: '#ff9783', vurgu700: '#ffc4b8', vurguZemin: '#dd2b0f', vurguButonYazi: '#201e1d',
  okundu: '#f3f2f2', okunduYazi: '#201e1d', telafi: '#9b9797', kismi: '#f3f2f2', kacirildi: '#ff9783',
  perde: 'rgba(0,0,0,0.6)', bildirimZemin: '#f3f2f2', bildirimYazi: '#201e1d', anahtarAcik: '#ff563c',
};

const klaAcik: Renk = {
  zemin: '#F2F2F7', yuzey: '#FFFFFF', metin: '#000000', soluk: 'rgba(0,0,0,0.58)', kenar: '#E5E5EA', iz: '#E5E5EA',
  vurgu: '#007AFF', vurgu600: '#0A84FF', vurgu700: '#0040DD',
  vurguZemin: 'linear-gradient(135deg, #0A84FF 0%, #0040DD 100%)', vurguButonYazi: '#0040DD',
  okundu: '#007AFF', okunduYazi: '#FFFFFF', telafi: '#00C7BE', kismi: '#FF9500', kacirildi: '#FF3B30',
  perde: 'rgba(0,0,0,0.35)', bildirimZemin: '#1F2937', bildirimYazi: '#FFFFFF', anahtarAcik: '#34C759',
};

const klaKoyu: Renk = {
  zemin: '#000000', yuzey: '#1C1C1E', metin: '#FFFFFF', soluk: 'rgba(255,255,255,0.58)', kenar: '#38383A', iz: '#2C2C2E',
  vurgu: '#0A84FF', vurgu600: '#409CFF', vurgu700: '#0040DD',
  vurguZemin: 'linear-gradient(135deg, #0A84FF 0%, #0033B3 100%)', vurguButonYazi: '#0033B3',
  okundu: '#0A84FF', okunduYazi: '#FFFFFF', telafi: '#63E6E2', kismi: '#FF9F0A', kacirildi: '#FF453A',
  perde: 'rgba(0,0,0,0.6)', bildirimZemin: '#2C2C2E', bildirimYazi: '#FFFFFF', anahtarAcik: '#30D158',
};

export function renklerSec(dil: Dil, koyu: boolean): Renkler {
  const sekil = dil === 'modernist' ? modernistSekil : klasikSekil;
  const renk = dil === 'modernist' ? (koyu ? modKoyu : modAcik) : koyu ? klaKoyu : klaAcik;
  return { ...renk, ...sekil, dil, koyu, ...(koyu && dil === 'klasik' ? { kartGolge: 'none', vurguGolge: 'none' } : {}) };
}

export function useRenkler(): Renkler {
  const koyu = useColorScheme() === 'dark';
  const { dil } = useDuzen();
  return renklerSec(dil, koyu);
}

// Düz renk ya da degrade (web: CSS, yerel: RN'in backgroundImage desteği)
export function zeminStili(deger: string) {
  if (!deger.startsWith('linear-gradient')) return { backgroundColor: deger };
  return (Platform.OS === 'web' ? { backgroundImage: deger } : { experimental_backgroundImage: deger }) as object;
}

// Köşe değeri; 'daire' boyutun yarısıdır
export const kose = (r: number | 'daire', boyut: number) => (r === 'daire' ? boyut / 2 : r);

export const bosluk = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40 } as const;
export const yazi = { xs: 12, sm: 14, base: 15, lg: 18, xl: 22, xxl: 26, dev: 34 } as const;

// '#rrggbb' → 'rgba(r,g,b,a)' (basılı/hover zeminleri için)
export function alfa(hex: string, a: number) {
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
