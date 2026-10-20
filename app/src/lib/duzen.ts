import { useWindowDimensions } from 'react-native';

// Görünüm kararı Platform.OS ile değil, ekran genişliğiyle verilir: telefondaki PWA yerel uygulamayla aynı görünür.
export const GENIS = 1024;

export type BugunVaryant = 'kart' | 'cetvel' | 'oturum';
// null: genişliğe göre (mobil kart, geniş oturum). Başka bir varyantı denemek için burada sabitlenir.
export const BUGUN_VARYANT: BugunVaryant | null = null;

export function useDuzen() {
  const { width } = useWindowDimensions();
  const genis = width >= GENIS;
  return {
    genis,
    dil: genis ? 'klasik' : 'modernist',
    bugunVaryant: BUGUN_VARYANT ?? (genis ? 'oturum' : 'kart'),
  } as const;
}
