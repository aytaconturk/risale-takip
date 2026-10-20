import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { sifreDegistir } from '@/src/api/giris';
import { Buton, Girdi, Kart, Yazi, Yukleniyor } from '@/src/components/ui';
import { t } from '@/src/i18n';
import { supabase } from '@/src/lib/supabase';
import { useRenkler } from '@/src/lib/tema';

// Şifre sıfırlama e-postasındaki link buraya #access_token=…&refresh_token=… ile döner
export default function SifreYenile() {
  const r = useRenkler();
  const url = Linking.useLinkingURL();
  const [hazir, setHazir] = useState<boolean | null>(null);
  const [sifre, setSifre] = useState('');
  const [hata, setHata] = useState(false);
  const [bekle, setBekle] = useState(false);

  useEffect(() => {
    if (!url) return;
    const p = new URLSearchParams(url.split('#')[1] ?? '');
    const access_token = p.get('access_token');
    const refresh_token = p.get('refresh_token');
    if (!access_token || !refresh_token) return setHazir(false);
    supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => setHazir(!error));
  }, [url]);

  async function kaydet() {
    setBekle(true);
    setHata(false);
    try {
      await sifreDegistir(sifre);
      router.replace('/bugun');
    } catch {
      setHata(true);
    } finally {
      setBekle(false);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 16, backgroundColor: r.zemin }}>
      {hazir === null ? <Yukleniyor /> : !hazir ? (
        <Kart>
          <Yazi>{t('giris.linkGecersiz')}</Yazi>
          <Buton baslik={t('giris.girisDon')} onPress={() => router.replace('/')} />
        </Kart>
      ) : (
        <Kart>
          <Yazi tur="baslik">{t('giris.yeniSifre')}</Yazi>
          <Girdi etiket={t('giris.sifre')} value={sifre} onChangeText={setSifre} secureTextEntry autoComplete="new-password" placeholder={t('giris.sifreIpucu')} />
          <Buton baslik={t('genel.kaydet')} pasif={sifre.length < 6} yukleniyor={bekle} onPress={kaydet} />
          {hata ? <Yazi renk={r.tehlike}>{t('genel.hata')}</Yazi> : null}
        </Kart>
      )}
    </View>
  );
}
