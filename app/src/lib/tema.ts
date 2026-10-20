import { useColorScheme } from '@/components/useColorScheme';

// iOS sistem renkleri (UIKit: systemGroupedBackground, label, systemBlue …)
const acik = {
  zemin: '#F2F2F7',
  yuzey: '#FFFFFF',
  yuzeyAktif: '#E5E5EA',
  kenar: '#E5E5EA',
  metin: '#000000',
  metin2: '#3C3C43',
  soluk: '#8E8E93',
  marka: '#007AFF',
  markaAcik: 'rgba(0, 122, 255, 0.12)',
  basari: '#34C759',
  basariAcik: 'rgba(52, 199, 89, 0.15)',
  tehlike: '#FF3B30',
  tehlikeAcik: 'rgba(255, 59, 48, 0.12)',
  uyari: '#FF9500',
  telafi: '#00C7BE',
  turuncu: '#FF9500',
  turuncuAcik: 'rgba(255, 149, 0, 0.15)',
  mor: '#AF52DE',
  morAcik: 'rgba(175, 82, 222, 0.14)',
  // Bugünkü okuma kartının degradesi
  vurgu1: '#0A84FF',
  vurgu2: '#0040DD',
  golge: '0 1px 3px rgba(0, 0, 0, 0.06)',
};

const koyu: typeof acik = {
  zemin: '#000000',
  yuzey: '#1C1C1E',
  yuzeyAktif: '#2C2C2E',
  kenar: '#38383A',
  metin: '#FFFFFF',
  metin2: '#EBEBF5',
  soluk: '#8E8E93',
  marka: '#0A84FF',
  markaAcik: 'rgba(10, 132, 255, 0.22)',
  basari: '#30D158',
  basariAcik: 'rgba(48, 209, 88, 0.2)',
  tehlike: '#FF453A',
  tehlikeAcik: 'rgba(255, 69, 58, 0.2)',
  uyari: '#FF9F0A',
  telafi: '#63E6E2',
  turuncu: '#FF9F0A',
  turuncuAcik: 'rgba(255, 159, 10, 0.2)',
  mor: '#BF5AF2',
  morAcik: 'rgba(191, 90, 242, 0.22)',
  vurgu1: '#0A84FF',
  vurgu2: '#0033B3',
  golge: 'none',
};

export type Renkler = typeof acik;

export function useRenkler(): Renkler {
  return useColorScheme() === 'dark' ? koyu : acik;
}

export const bosluk = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24 } as const;
export const yaricap = { lg: 12, xl: 16, xxl: 20, tam: 9999 } as const;
export const yazi = { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, xxl: 24, dev: 32 } as const;
