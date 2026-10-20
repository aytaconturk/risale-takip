import { supabase, veri } from '@/src/lib/supabase';

export type GunDurumu = 'okundu' | 'telafi' | 'kismi' | 'kacirildi' | 'duraklatma' | 'bugun' | 'gelecek' | 'bos';

export async function takvim(kpId: string, bas: string, son: string) {
  const satirlar = veri(await supabase.rpc('takvim', { kp_id: kpId, bas, son }));
  return satirlar.map((s) => ({ ...s, durum: s.durum as GunDurumu }));
}

// Ay özeti: okunan (telafi dahil), kısmi ve kaçırılan gün sayısı
export function ayOzeti(gunler: { durum: GunDurumu }[]) {
  const say = (...d: GunDurumu[]) => gunler.filter((g) => d.includes(g.durum)).length;
  return { okunan: say('okundu', 'telafi'), kismi: say('kismi'), kacirilan: say('kacirildi') };
}
