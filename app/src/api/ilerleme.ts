import { ilerleme } from '@/src/api/bugun';
import { supabase, veri } from '@/src/lib/supabase';

export type KitapIlerlemesi = { kitap_ad: string; uzunluk: number; okunan: number };

// Program sırayla okunduğu için okunan sayfa kitaplara baştan dağıtılır.
export function kitapIlerlemesi(kitaplar: { kitap_ad: string; uzunluk: number }[], okunanSayfa: number): KitapIlerlemesi[] {
  let kalan = okunanSayfa;
  return kitaplar.map((k) => {
    const okunan = Math.min(k.uzunluk, Math.max(0, kalan));
    kalan -= k.uzunluk;
    return { ...k, okunan };
  });
}

export async function ilerlemeVerisi(kp: { id: string; program_id: string }) {
  const [i, bitis, pk] = await Promise.all([
    ilerleme(kp.id),
    supabase.rpc('bitis_tarihi', { kp_id: kp.id }).then(veri),
    supabase
      .from('program_kitaplari')
      .select('sira, baslangic_sayfasi, bitis_sayfasi, kitaplar(ad, sayfa_sayisi)')
      .eq('program_id', kp.program_id)
      .order('sira')
      .then(veri),
  ]);
  const kitaplar = pk.map((r) => ({
    kitap_ad: r.kitaplar?.ad ?? '',
    uzunluk: (r.bitis_sayfasi ?? r.kitaplar?.sayfa_sayisi ?? 0) - (r.baslangic_sayfasi ?? 1) + 1,
  }));
  return { ilerleme: i, bitis, kitaplar: kitapIlerlemesi(kitaplar, i.okunan_sayfa) };
}
