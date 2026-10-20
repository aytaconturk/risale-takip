import { useState } from 'react';
import { View } from 'react-native';

import { adKaydet, girisYap, kayitOl, sifreSifirla } from '@/src/api/giris';
import { Buton, Girdi, Kart, TelefonGirdi, Yazi } from '@/src/components/ui';
import { t } from '@/src/i18n';
import { telefonGecerli } from '@/src/lib/bicim';
import { useRenkler } from '@/src/lib/tema';

const EPOSTA = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// E-posta + şifre. Oturum açılınca kök layout yönlendirir.
export function GirisFormu() {
  const r = useRenkler();
  const [mod, setMod] = useState<'giris' | 'kayit' | 'sifre'>('giris');
  const [f, setF] = useState({ ad: '', soyad: '', eposta: '', telefon: '', sifre: '' });
  const [mesaj, setMesaj] = useState<{ metin: string; hata: boolean } | null>(null);
  const [bekle, setBekle] = useState(false);
  const alan = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });
  const git = (m: typeof mod) => { setMod(m); setMesaj(null); };

  async function calistir(is: () => Promise<unknown>, hataMetni: string, basari?: string) {
    setMesaj(null);
    setBekle(true);
    try {
      await is();
      if (basari) setMesaj({ metin: basari, hata: false });
    } catch {
      setMesaj({ metin: hataMetni, hata: true });
    } finally {
      setBekle(false);
    }
  }

  const epostaTamam = EPOSTA.test(f.eposta.trim());
  const sifreTamam = f.sifre.length >= 6;

  return (
    <Kart>
      <Yazi tur="baslik">{t('giris.baslik')}</Yazi>
      <Yazi tur="soluk">{t(mod === 'kayit' ? 'giris.kayitAciklama' : mod === 'sifre' ? 'giris.sifreAciklama' : 'giris.aciklama')}</Yazi>
      {mod === 'kayit' ? (
        <>
          <Girdi etiket={t('giris.ad')} value={f.ad} onChangeText={alan('ad')} autoComplete="given-name" />
          <Girdi etiket={t('giris.soyad')} value={f.soyad} onChangeText={alan('soyad')} autoComplete="family-name" />
          <TelefonGirdi etiket={t('giris.telefon')} value={f.telefon} onChangeText={alan('telefon')} />
        </>
      ) : null}
      <Girdi etiket={t('giris.eposta')} value={f.eposta} onChangeText={alan('eposta')} keyboardType="email-address"
        autoCapitalize="none" autoComplete="email" placeholder="ornek@eposta.com" />
      {mod !== 'sifre' ? (
        <Girdi etiket={t('giris.sifre')} value={f.sifre} onChangeText={alan('sifre')} secureTextEntry
          autoComplete={mod === 'kayit' ? 'new-password' : 'current-password'} placeholder={mod === 'kayit' ? t('giris.sifreIpucu') : undefined} />
      ) : null}

      {mod === 'giris' ? (
        <>
          <Buton baslik={t('giris.girisYap')} pasif={!epostaTamam || !f.sifre} yukleniyor={bekle}
            onPress={() => calistir(() => girisYap(f.eposta, f.sifre), t('giris.girisHatali'))} />
          <Buton baslik={t('giris.sifremiUnuttum')} tur="ikincil" onPress={() => git('sifre')} />
          <Buton baslik={t('giris.hesapOlustur')} tur="ikincil" onPress={() => git('kayit')} />
        </>
      ) : mod === 'kayit' ? (
        <>
          <Buton baslik={t('giris.kayitOl')} yukleniyor={bekle}
            pasif={!f.ad.trim() || !telefonGecerli(f.telefon) || !epostaTamam || !sifreTamam}
            onPress={() => calistir(() => kayitOl(f), t('giris.kayitHatali'))} />
          <Buton baslik={t('giris.hesabimVar')} tur="ikincil" onPress={() => git('giris')} />
        </>
      ) : (
        <>
          <Buton baslik={t('giris.linkGonder')} pasif={!epostaTamam} yukleniyor={bekle}
            onPress={() => calistir(() => sifreSifirla(f.eposta), t('genel.hata'), t('giris.linkGonderildi'))} />
          <Buton baslik={t('giris.girisDon')} tur="ikincil" onPress={() => git('giris')} />
        </>
      )}
      {mesaj ? <Yazi renk={mesaj.hata ? r.tehlike : r.basari}>{mesaj.metin}</Yazi> : null}
    </Kart>
  );
}

export function AdFormu({ tamam }: { tamam: () => void }) {
  const [ad, setAd] = useState('');
  const [soyad, setSoyad] = useState('');
  const [bekle, setBekle] = useState(false);
  return (
    <Kart>
      <Yazi tur="baslik">{t('giris.adBaslik')}</Yazi>
      <View style={{ gap: 12 }}>
        <Girdi etiket={t('giris.ad')} value={ad} onChangeText={setAd} autoComplete="given-name" />
        <Girdi etiket={t('giris.soyad')} value={soyad} onChangeText={setSoyad} autoComplete="family-name" />
      </View>
      <Buton baslik={t('giris.devam')} pasif={!ad.trim()} yukleniyor={bekle}
        onPress={async () => { setBekle(true); await adKaydet(ad, soyad).finally(() => setBekle(false)); tamam(); }} />
    </Kart>
  );
}
