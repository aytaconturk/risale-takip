import { fonksiyon, supabase, veri } from '@/src/lib/supabase';

export async function grupDetayi(grupId: string) {
  const [grup, uyeler] = await Promise.all([
    supabase.from('grup').select('*').eq('id', grupId).single().then(veri),
    supabase.rpc('grup_durumu', { p_grup_id: grupId }).then(veri),
  ]);
  return { grup, uyeler };
}

export type HatirlatmaSonucu = {
  durum: number;
  kayit_durumu?: 'gonderildi' | 'engellendi';
  alan_ad?: string;
  whatsapp?: string;
};

export async function hatirlat(grupId: string, alanId: string, kanal: 'push' | 'whatsapp') {
  return fonksiyon<HatirlatmaSonucu>('hatirlatma-gonder', { grup_id: grupId, alan_id: alanId, kanal });
}

export async function grupKur(ad: string, programId: string, baslangic: string) {
  return veri(await supabase.rpc('grup_kur', { p_ad: ad.trim(), p_program_id: programId, p_baslangic: baslangic }));
}

// Hatırlat butonunun durumu (günde bir; hatırlatma kapalıysa pasif)
export function hatirlatDurumu(u: { geride_gun: number; hatirlatma_kabul: boolean; bugun_hatirlatildi: boolean }) {
  if (u.geride_gun <= 0) return 'yok' as const;
  if (!u.hatirlatma_kabul) return 'kapali' as const;
  if (u.bugun_hatirlatildi) return 'gonderildi' as const;
  return 'aktif' as const;
}

// Bir sonraki yüz yüze ders tarihi (ders günü yoksa boş)
export async function sonrakiDers(grupId: string) {
  return veri(await supabase.rpc('sonraki_ders', { p_grup_id: grupId })) as string | null;
}
