import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { kitaplar, programHatasi, programOlustur, programOzeti, type SeciliKitap } from '@/src/api/program';
import { Buton, Cip, Ekran, Girdi, Kart, Satir, Yazi, Yukleniyor } from '@/src/components/ui';
import { t, type Anahtar } from '@/src/i18n';
import { KISA_GUNLER } from '@/src/lib/bicim';
import { useRenkler } from '@/src/lib/tema';
import { useUi } from '@/src/store';

export default function YeniProgram() {
  const r = useRenkler();
  const qc = useQueryClient();
  const { bildir, kpSec } = useUi();
  const k = useQuery({ queryKey: ['kitaplar'], queryFn: kitaplar });
  const [ad, setAd] = useState('');
  const [secili, setSecili] = useState<SeciliKitap[]>([]);
  const [gunluk, setGunluk] = useState('10');
  const [gunler, setGunler] = useState('1111111');

  const olustur = useMutation({
    mutationFn: () => programOlustur(ad, secili, Number(gunluk), gunler),
    onSuccess: (kpId) => { kpSec(kpId); qc.invalidateQueries(); router.replace('/bugun'); },
    onError: () => bildir(t('genel.hata')),
  });

  if (!k.data) return <Yukleniyor />;
  const hata = programHatasi(ad, secili, Number(gunluk), gunler);
  const ozet = programOzeti(secili, Number(gunluk));
  const guncelle = (i: number, alan: Partial<SeciliKitap>) => setSecili(secili.map((s, n) => (n === i ? { ...s, ...alan } : s)));

  return (
    <Ekran baslik={t('program.baslik')}>
      <Kart>
        <Girdi etiket={t('program.ad')} value={ad} onChangeText={setAd} placeholder="Lahikalar" />
        <Yazi tur="soluk">{t('program.ekle')}</Yazi>
        <Satir style={{ flexWrap: 'wrap' }}>
          {k.data.filter((b) => !secili.some((s) => s.kitap_id === b.id)).map((b) => (
            <Cip key={b.id} baslik={b.ad}
              onPress={() => setSecili([...secili, { kitap_id: b.id, ad: b.ad, sayfa_sayisi: b.sayfa_sayisi, bas: 1, son: b.sayfa_sayisi }])} />
          ))}
        </Satir>
      </Kart>

      {secili.length ? (
        <Kart>
          <Yazi tur="baslik">{t('program.kitaplar')}</Yazi>
          {secili.map((s, i) => (
            <View key={s.kitap_id} style={{ gap: 6, paddingVertical: 6, borderBottomWidth: 1, borderColor: r.kenar }}>
              <Satir style={{ justifyContent: 'space-between' }}>
                <Yazi>{`${i + 1}. ${s.ad} (${s.sayfa_sayisi})`}</Yazi>
                <Satir>
                  {i > 0 ? (
                    <Cip baslik={t('program.yukari')} onPress={() => setSecili([...secili.slice(0, i - 1), s, secili[i - 1], ...secili.slice(i + 1)])} />
                  ) : null}
                  <Cip baslik={t('program.cikar')} onPress={() => setSecili(secili.filter((_, n) => n !== i))} />
                </Satir>
              </Satir>
              <Satir>
                <View style={{ flex: 1 }}>
                  <Girdi etiket={t('program.bas')} value={String(s.bas)} keyboardType="number-pad" onChangeText={(v) => guncelle(i, { bas: Number(v) || 0 })} />
                </View>
                <View style={{ flex: 1 }}>
                  <Girdi etiket={t('program.son')} value={String(s.son)} keyboardType="number-pad" onChangeText={(v) => guncelle(i, { son: Number(v) || 0 })} />
                </View>
              </Satir>
            </View>
          ))}
        </Kart>
      ) : null}

      <Kart>
        <Girdi etiket={t('program.gunluk')} value={gunluk} onChangeText={setGunluk} keyboardType="number-pad" />
        <Yazi tur="soluk">{t('program.gunler')}</Yazi>
        <Satir style={{ flexWrap: 'wrap' }}>
          {KISA_GUNLER.map((g, n) => (
            <Cip key={g} baslik={g} secili={gunler[n] === '1'}
              onPress={() => setGunler(gunler.slice(0, n) + (gunler[n] === '1' ? '0' : '1') + gunler.slice(n + 1))} />
          ))}
        </Satir>
        <Yazi>{t('program.ozet', { sayfa: ozet.sayfa, gun: ozet.gun })}</Yazi>
        {hata && secili.length ? <Yazi renk={r.tehlike}>{t(hata as Anahtar)}</Yazi> : null}
        <Buton baslik={t('program.olustur')} pasif={!!hata} yukleniyor={olustur.isPending} onPress={() => olustur.mutate()} />
      </Kart>
    </Ekran>
  );
}
