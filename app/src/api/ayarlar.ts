import { benimId, supabase, veri } from '@/src/lib/supabase';
import type { Database, Json } from '@/src/types/database';

type KullaniciGuncelle = Pick<
  Database['public']['Tables']['kullanici']['Update'],
  'hatirlatma_acik' | 'hatirlatma_saati' | 'saat_dilimi'
>;

export async function profilGuncelle(alanlar: KullaniciGuncelle) {
  const id = await benimId();
  veri(await supabase.from('kullanici').update(alanlar).eq('id', id));
}

export async function hatirlatmaKabul(kpId: string, kabul: boolean) {
  veri(await supabase.from('kullanici_program').update({ hatirlatma_kabul: kabul }).eq('id', kpId));
}

export async function duraklat(kpId: string) {
  veri(await supabase.rpc('duraklat', { kp_id: kpId }));
}

export async function devamEt(kpId: string) {
  veri(await supabase.rpc('devam_et', { kp_id: kpId }));
}

// 30 gün sonra hesaplari_anonimlestir() (cron) kişisel verileri siler
export async function hesabiSil() {
  const id = await benimId();
  veri(await supabase.from('kullanici').update({ silinme_tarihi: new Date().toISOString() }).eq('id', id));
  await supabase.auth.signOut();
}

export async function cikis() {
  await supabase.auth.signOut();
}

// Web'de token = abonelik endpoint'i, abonelik = PushSubscription JSON
export async function cihazKaydet(token: string, platform: 'ios' | 'android' | 'web', abonelik?: object) {
  const id = await benimId();
  veri(
    await supabase
      .from('cihazlar')
      .upsert(
        { kullanici_id: id, expo_push_token: token, platform, abonelik: (abonelik ?? null) as Json, son_gorulme: new Date().toISOString() },
        { onConflict: 'expo_push_token' },
      ),
  );
}

export const SAAT_DILIMLERI = ['Europe/Istanbul', 'Europe/Berlin', 'Europe/London', 'Asia/Tashkent', 'America/New_York'];
