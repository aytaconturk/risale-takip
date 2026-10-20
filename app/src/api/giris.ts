import Constants from 'expo-constants';
import * as Linking from 'expo-linking';

import { telefonNormalize } from '@/src/lib/bicim';
import { benimId, supabase, veri } from '@/src/lib/supabase';

// Auth yanıtları veri()'nin tipine uymaz (hata durumunda data alanları null)
function hatayiFirlat<T extends { error: unknown }>(y: T): T {
  if (y.error) throw y.error;
  return y;
}

export type Kayit = { ad: string; soyad: string; eposta: string; telefon: string; sifre: string };

export async function girisYap(eposta: string, sifre: string) {
  hatayiFirlat(await supabase.auth.signInWithPassword({ email: eposta.trim(), password: sifre }));
}

// ad, soyad, telefon metadata ile gider; kullanici satırını trigger açar
// createURL web'de baseUrl'i (GitHub Pages alt dizini) eklemez, elle eklenir.
const uygulamaAdresi = (yol: string) => Linking.createURL(`${Constants.expoConfig?.experiments?.baseUrl ?? ''}${yol}`);

// E-posta doğrulaması açıksa oturum gelmez; true döner ve kullanıcı e-postadaki linke yönlendirilir.
export async function kayitOl(k: Kayit) {
  const sonuc = await supabase.auth.signUp({
    email: k.eposta.trim(),
    password: k.sifre,
    options: { emailRedirectTo: uygulamaAdresi('/'), data: { ad: k.ad.trim(), soyad: k.soyad.trim(), telefon: telefonNormalize(k.telefon) } },
  });
  hatayiFirlat(sonuc);
  return !sonuc.data.session;
}

// E-postadaki link /sifre-yenile ekranını oturum token'larıyla açar.
export async function sifreSifirla(eposta: string) {
  hatayiFirlat(await supabase.auth.resetPasswordForEmail(eposta.trim(), { redirectTo: uygulamaAdresi('/sifre-yenile') }));
}

export async function sifreDegistir(sifre: string) {
  hatayiFirlat(await supabase.auth.updateUser({ password: sifre }));
}

export async function profil() {
  const id = await benimId();
  return veri(await supabase.from('kullanici').select('*').eq('id', id).single());
}

export async function adKaydet(ad: string, soyad: string) {
  const id = await benimId();
  veri(await supabase.from('kullanici').update({ ad: ad.trim(), soyad: soyad.trim() || null }).eq('id', id));
}
