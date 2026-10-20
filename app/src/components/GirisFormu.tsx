import { useRef, useState, type ComponentRef } from 'react';
import { Text, TextInput, View } from 'react-native';

import { adKaydet, girisYap, kayitOl, sifreSifirla } from '@/src/api/giris';
import { Buton, Girdi, TelefonGirdi, tip, Yazi } from '@/src/components/ui';
import { t } from '@/src/i18n';
import { telefonGecerli } from '@/src/lib/bicim';
import { useRenkler } from '@/src/lib/tema';

const EPOSTA = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// E-posta + şifre. Oturum açılınca kök layout yönlendirir.
export function GirisFormu({ marka = true }: { marka?: boolean }) {
  const r = useRenkler();
  const [mod, setMod] = useState<'giris' | 'kayit' | 'sifre'>('giris');
  const [f, setF] = useState({ ad: '', soyad: '', eposta: '', telefon: '', sifre: '' });
  const [mesaj, setMesaj] = useState<{ metin: string; hata: boolean } | null>(null);
  const [bekle, setBekle] = useState(false);
  const alan = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });
  const git = (m: typeof mod) => { setMod(m); setMesaj(null); };
  // Klavyede "ileri" sonraki girdiye geçer, son girdide "bitti" formu gönderir
  const ref = { soyad: useRef<Girdi>(null), telefon: useRef<Girdi>(null), eposta: useRef<Girdi>(null), sifre: useRef<Girdi>(null) };
  const ileri = (k: keyof typeof ref) => ({ returnKeyType: 'next' as const, enterKeyHint: 'next' as const, submitBehavior: 'submit' as const, onSubmitEditing: () => ref[k].current?.focus() });

  // is() true dönerse (ör. e-posta doğrulaması bekleniyor) başarı mesajı gösterilir
  async function calistir(is: () => Promise<unknown>, hataMetni: string, basari?: string) {
    setMesaj(null);
    setBekle(true);
    try {
      const sonuc = await is();
      if (basari && sonuc !== false) setMesaj({ metin: basari, hata: false });
    } catch {
      setMesaj({ metin: hataMetni, hata: true });
    } finally {
      setBekle(false);
    }
  }

  const epostaTamam = EPOSTA.test(f.eposta.trim());
  const sifreTamam = f.sifre.length >= 6;
  const girisPasif = !epostaTamam || !f.sifre;
  const kayitPasif = !f.ad.trim() || !telefonGecerli(f.telefon) || !epostaTamam || !sifreTamam;
  const gonder = {
    giris: () => !girisPasif && calistir(() => girisYap(f.eposta, f.sifre), t('giris.girisHatali')),
    kayit: () => !kayitPasif && calistir(() => kayitOl(f), t('giris.kayitHatali'), t('giris.dogrulamaGonderildi')),
    sifre: () => epostaTamam && calistir(() => sifreSifirla(f.eposta), t('genel.hata'), t('giris.linkGonderildi')),
  }[mod];
  const bitti = { returnKeyType: 'done' as const, enterKeyHint: 'done' as const, onSubmitEditing: gonder };
  const aciklama = t(mod === 'kayit' ? 'giris.kayitAciklama' : mod === 'sifre' ? 'giris.sifreAciklama' : 'giris.aciklama');

  return (
    <View style={{ gap: 24 }}>
      {marka ? (
        <View style={{ gap: 8, paddingBottom: 24, borderBottomWidth: r.cizgi || 1, borderBottomColor: r.kenar }}>
          <Text style={[tip(r, 'yari'), { fontSize: 12, letterSpacing: 1, color: r.vurgu }]}>{t('marka.ust').toLocaleUpperCase('tr-TR')}</Text>
          <Text accessibilityRole="header" style={[tip(r, 'kalin'), { fontSize: 40, lineHeight: 42, letterSpacing: -1.2, color: r.metin }]}>{t('marka.ad')}</Text>
          <Text style={[tip(r, 'normal'), { fontSize: 15, lineHeight: 22, color: r.soluk }]}>{aciklama}</Text>
        </View>
      ) : (
        <Yazi tur="soluk">{aciklama}</Yazi>
      )}
      <View style={{ gap: 16 }}>
        {mod === 'kayit' ? (
          <>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Girdi etiket={t('giris.ad')} value={f.ad} onChangeText={alan('ad')} autoComplete="given-name" {...ileri('soyad')} />
              </View>
              <View style={{ flex: 1 }}>
                <Girdi ref={ref.soyad} etiket={t('giris.soyad')} value={f.soyad} onChangeText={alan('soyad')} autoComplete="family-name" {...ileri('telefon')} />
              </View>
            </View>
            <TelefonGirdi ref={ref.telefon} etiket={t('giris.telefon')} value={f.telefon} onChangeText={alan('telefon')} {...ileri('eposta')} />
          </>
        ) : null}
        <Girdi ref={ref.eposta} etiket={t('giris.eposta')} value={f.eposta} onChangeText={alan('eposta')} keyboardType="email-address" inputMode="email"
          autoCapitalize="none" autoCorrect={false} autoComplete="email" placeholder="ornek@eposta.com" {...(mod === 'sifre' ? bitti : ileri('sifre'))} />
        {mod !== 'sifre' ? (
          <Girdi ref={ref.sifre} etiket={t('giris.sifre')} value={f.sifre} onChangeText={alan('sifre')} secureTextEntry autoCapitalize="none"
            autoComplete={mod === 'kayit' ? 'new-password' : 'current-password'} placeholder={mod === 'kayit' ? t('giris.sifreIpucu') : undefined} {...bitti} />
        ) : null}
      </View>

      <View style={{ gap: 8 }}>
        {mod === 'giris' ? (
          <Buton buyuk baslik={t('giris.girisYap')} pasif={girisPasif} yukleniyor={bekle} onPress={gonder} />
        ) : mod === 'kayit' ? (
          <Buton buyuk baslik={t('giris.kayitOl')} pasif={kayitPasif} yukleniyor={bekle} onPress={gonder} />
        ) : (
          <Buton buyuk baslik={t('giris.linkGonder')} pasif={!epostaTamam} yukleniyor={bekle} onPress={gonder} />
        )}
        {mesaj ? <Yazi renk={mesaj.hata ? r.kacirildi : r.metin}>{mesaj.metin}</Yazi> : null}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          {mod === 'giris' ? (
            <>
              <Buton tur="hayalet" baslik={t('giris.hesapOlustur')} onPress={() => git('kayit')} />
              <Buton tur="hayalet" renk={r.soluk} baslik={t('giris.sifremiUnuttum')} onPress={() => git('sifre')} />
            </>
          ) : (
            <Buton tur="hayalet" baslik={t(mod === 'kayit' ? 'giris.hesabimVar' : 'giris.girisDon')} onPress={() => git('giris')} />
          )}
        </View>
      </View>
    </View>
  );
}

export function AdFormu({ tamam }: { tamam: () => void }) {
  const r = useRenkler();
  const [ad, setAd] = useState('');
  const [soyad, setSoyad] = useState('');
  const [bekle, setBekle] = useState(false);
  const soyadRef = useRef<Girdi>(null);
  const kaydet = async () => {
    if (!ad.trim()) return;
    setBekle(true);
    await adKaydet(ad, soyad).finally(() => setBekle(false));
    tamam();
  };
  return (
    <View style={{ gap: 24 }}>
      <Text accessibilityRole="header" style={[tip(r, 'kalin'), { fontSize: 28, color: r.metin, paddingBottom: 16, borderBottomWidth: r.cizgi || 1, borderBottomColor: r.kenar }]}>
        {t('giris.adBaslik')}
      </Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Girdi etiket={t('giris.ad')} value={ad} onChangeText={setAd} autoComplete="given-name"
            returnKeyType="next" enterKeyHint="next" submitBehavior="submit" onSubmitEditing={() => soyadRef.current?.focus()} />
        </View>
        <View style={{ flex: 1 }}>
          <Girdi ref={soyadRef} etiket={t('giris.soyad')} value={soyad} onChangeText={setSoyad} autoComplete="family-name"
            returnKeyType="done" enterKeyHint="done" onSubmitEditing={kaydet} />
        </View>
      </View>
      <Buton buyuk baslik={t('giris.devam')} pasif={!ad.trim()} yukleniyor={bekle} onPress={kaydet} />
    </View>
  );
}

type Girdi = ComponentRef<typeof TextInput>;
