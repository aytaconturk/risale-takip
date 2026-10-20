import { supabase, veri } from '@/src/lib/supabase';

export type GunDurumu = 'okundu' | 'telafi' | 'kismi' | 'kacirildi' | 'duraklatma' | 'bugun' | 'gelecek' | 'bos';

export async function takvim(kpId: string, bas: string, son: string) {
  const satirlar = veri(await supabase.rpc('takvim', { kp_id: kpId, bas, son }));
  return satirlar.map((s) => ({ ...s, durum: s.durum as GunDurumu }));
}

// Ay özeti: okunan gün ve sayfa (kısmi günler okunan sayfası kadar)
export function ayOzeti(gunler: { durum: GunDurumu }[], gunlukSayfa: number) {
  const okunan = gunler.filter((g) => g.durum === 'okundu' || g.durum === 'telafi').length;
  return { okunanGun: okunan, sayfa: okunan * gunlukSayfa };
}
