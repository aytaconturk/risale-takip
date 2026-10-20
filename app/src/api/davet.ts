import type { Anahtar } from '@/src/i18n';
import { fonksiyon } from '@/src/lib/supabase';

export type KabulSonucu = { durum: number; grup_id?: string; grup_ad?: string };

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
