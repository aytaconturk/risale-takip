import { Text, View } from 'react-native';

import type { GunDurumu } from '@/src/api/cizelge';
import type { Renkler } from '@/src/lib/tema';

export function GunDairesi({ durum, metin, r, boyut = 32 }: { durum: GunDurumu; metin: string; r: Renkler; boyut?: number }) {
  const s = gunStili(durum, r);
  return (
    <View
      accessibilityLabel={`${metin} ${durum}`}
      style={{ width: boyut, height: boyut, borderRadius: boyut / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: s.bg, borderWidth: s.kenar ? 1.5 : 0, borderColor: s.kenar }}>
      <Text style={{ color: s.fg, fontSize: 12, fontWeight: '600', textDecorationLine: durum === 'duraklatma' ? 'line-through' : 'none' }}>{metin}</Text>
    </View>
  );
}

export function gunStili(durum: GunDurumu, r: Renkler): { bg: string; fg: string; kenar?: string } {
  switch (durum) {
    case 'okundu': return { bg: r.marka, fg: '#fff' };
    case 'telafi': return { bg: r.telafi, fg: '#fff' };
    case 'kismi': return { bg: 'transparent', fg: r.uyari, kenar: r.uyari };
    case 'kacirildi': return { bg: 'transparent', fg: r.tehlike, kenar: r.tehlike };
    case 'bugun': return { bg: 'transparent', fg: r.marka, kenar: r.marka };
    case 'duraklatma': return { bg: r.yuzeyAktif, fg: r.soluk };
    case 'gelecek': return { bg: 'transparent', fg: r.metin, kenar: r.kenar };
    default: return { bg: 'transparent', fg: r.soluk };
  }
}
