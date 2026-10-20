import { Text, View } from 'react-native';

import type { GunDurumu } from '@/src/api/cizelge';
import { rakam, tip } from '@/src/components/ui';
import { kose, useRenkler, type Renkler } from '@/src/lib/tema';

// boyut verilmezse hücre genişliği kadar (aspectRatio 1)
export function GunDairesi({ durum, metin, boyut, secili }: { durum: GunDurumu; metin: string; boyut?: number; secili?: boolean }) {
  const r = useRenkler();
  const s = gunStili(durum, r);
  const olcu = boyut ?? 44;
  const radius = kose(r.rHucre, olcu);
  const hucre = (
    <View
      accessibilityLabel={`${metin} ${durum}`}
      style={{
        width: boyut ?? '100%', aspectRatio: 1, borderRadius: r.rHucre === 'daire' ? 999 : radius,
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        backgroundColor: s.bg, borderWidth: s.kenar ? 2 : 0, borderColor: s.kenar,
      }}>
      <Text
        style={[tip(r, 'kalin'), rakam, {
          color: s.fg, fontSize: olcu < 32 ? 12 : 14,
          textDecorationLine: durum === 'duraklatma' ? 'line-through' : 'none',
        }]}>
        {metin}
      </Text>
      {durum === 'kismi' ? <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 5, backgroundColor: r.kismi }} /> : null}
    </View>
  );
  if (!secili) return hucre;
  // Seçili gün: 2 px boşlukla 2 px vurgu çerçeve
  return (
    <View style={{ width: boyut ? boyut + 8 : '100%', padding: 2, borderWidth: 2, borderColor: r.vurgu, borderRadius: r.rHucre === 'daire' ? 999 : radius }}>
      {hucre}
    </View>
  );
}

export function gunStili(durum: GunDurumu, r: Renkler): { bg: string; fg: string; kenar?: string } {
  switch (durum) {
    case 'okundu': return { bg: r.okundu, fg: r.okunduYazi, kenar: r.okundu };
    case 'telafi': return { bg: r.telafi, fg: r.okunduYazi, kenar: r.telafi };
    case 'kismi': return { bg: 'transparent', fg: r.kismi, kenar: r.kismi };
    case 'kacirildi': return { bg: 'transparent', fg: r.kacirildi, kenar: r.kacirildi };
    case 'bugun': return { bg: 'transparent', fg: r.vurgu, kenar: r.vurgu };
    case 'gelecek': return { bg: 'transparent', fg: r.soluk, kenar: r.iz };
    case 'duraklatma': return { bg: r.iz, fg: r.soluk };
    default: return { bg: 'transparent', fg: r.iz };
  }
}
