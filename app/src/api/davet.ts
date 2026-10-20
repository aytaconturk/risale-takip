import type { Anahtar } from '@/src/i18n';
import { fonksiyon, supabase, veri } from '@/src/lib/supabase';

export type KabulSonucu = { durum: number; grup_id?: string; grup_ad?: string; kullanici_program_id?: string };

export async function davetKabul(token: string) {
  return fonksiyon<KabulSonucu>('davet-kabul', { token });
}

export function kabulMesaji(durum: number): Anahtar {
  if (durum === 200) return 'davet.katildiniz';
  if (durum === 409) return 'davet.zatenUye';
  if (durum === 410) return 'davet.gecersiz';
  if (durum === 404) return 'davet.bulunamadi';
  return 'genel.hata';
}

// Katılmadan önce gösterilen grup bilgileri (oturum gerekmez); token yoksa boş
export async function davetOnizleme(token: string) {
  return veri(await supabase.rpc('davet_onizleme', { p_token: token }).maybeSingle());
}
