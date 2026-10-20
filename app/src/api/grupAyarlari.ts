import { bugun } from '@/src/api/bugun';
import { telefonNormalize } from '@/src/lib/bicim';
import { fonksiyon, supabase, veri } from '@/src/lib/supabase';

export async function davetler(grupId: string) {
  return veri(
    await supabase
      .from('davetler')
      .select('id, tip, telefon, token, maks_kullanim, son_gecerlilik, iptal_tarihi, kullanan_id')
      .eq('grup_id', grupId)
      .order('olusturma', { ascending: false }),
  );
}

export type DavetSonucu = {
  durum: number;
  link?: string;
  whatsapp?: string;
  hata?: string;
  davet?: { id: string; tip: 'kisisel' | 'genel'; son_gecerlilik: string; maks_kullanim: number };
};

export async function davetOlustur(grupId: string, tip: 'kisisel' | 'genel', telefon?: string) {
  // wa.me ülke kodlu numara ister; "0555..." → "+90555..."
  return fonksiyon<DavetSonucu>('davet-olustur', { grup_id: grupId, tip, telefon: telefon && telefonNormalize(telefon) });
}

export async function davetIptal(davetId: string) {
  veri(await supabase.from('davetler').update({ iptal_tarihi: new Date().toISOString() }).eq('id', davetId));
}

export async function uyeCikar(kpId: string) {
  const tarih = await bugun();
  veri(await supabase.from('kullanici_program').update({ durum: 'cikarildi', durum_tarihi: tarih }).eq('id', kpId));
}

export async function dersGuncelle(grupId: string, alanlar: { ders_gunu: string | null; ders_saati: string | null; konum: string | null }) {
  veri(await supabase.from('grup').update(alanlar).eq('id', grupId));
}

export function davetDurumu(d: { iptal_tarihi: string | null; kullanan_id: string | null; tip: string }) {
  if (d.iptal_tarihi) return 'iptal' as const;
  if (d.tip === 'kisisel' && d.kullanan_id) return 'kullanildi' as const;
  return 'gecerli' as const;
}
