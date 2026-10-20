import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { kitaplar, programHatasi, programOlustur, programOnizleme, type SeciliKitap } from '@/src/api/program';
import {
  AltSayfa, BolumBasligi, Buton, Cip, Ekran, Girdi, IkonDugme, Kart, Kolon, rakam, SayfaBasligi, Stepper, tip, Yazi, Yukleniyor,
} from '@/src/components/ui';
import { t, type Anahtar } from '@/src/i18n';
import { KISA_GUNLER, kisaTarihYil, sayi } from '@/src/lib/bicim';
import { useRenkler } from '@/src/lib/tema';
import { useUi } from '@/src/store';

export default function YeniProgram() {
  const r = useRenkler();
  const qc = useQueryClient();
  const { bildir, kpSec } = useUi();
  const k = useQuery({ queryKey: ['kitaplar'], queryFn: kitaplar });
  const [ad, setAd] = useState('');
  const [secili, setSecili] = useState<SeciliKitap[]>([]);
  const [gunluk, setGunluk] = useState(10);
  const [gunler, setGunler] = useState('1111111');
  const [duzenlenen, setDuzenlenen] = useState<string | null>(null);
  const hata = programHatasi(ad, secili, gunluk, gunler);
  const onizleme = useQuery({
    queryKey: ['programOnizleme', secili.map((s) => `${s.bas}-${s.son}`).join(','), gunluk, gunler],
    queryFn: () => programOnizleme(secili, gunluk, gunler),
    enabled: secili.length > 0 && gunler !== '0000000',
    placeholderData: keepPreviousData,
  });

  const olustur = useMutation({
    mutationFn: () => programOlustur(ad, secili, gunluk, gunler),
    onSuccess: (kpId) => {
      kpSec(kpId);
      qc.invalidateQueries();
      bildir(t('program.olusturuldu', { ad: ad.trim() }));
      router.replace('/bugun');
    },
    onError: () => bildir(t('genel.hata')),
  });
  const kapat = () => (router.canGoBack() ? router.back() : router.replace('/bugun'));

  if (!k.data) return <Yukleniyor />;
  const sec = (b: { id: string; ad: string; sayfa_sayisi: number }) =>
    setSecili(secili.some((s) => s.kitap_id === b.id)
      ? secili.filter((s) => s.kitap_id !== b.id)
      : [...secili, { kitap_id: b.id, ad: b.ad, sayfa_sayisi: b.sayfa_sayisi, bas: 1, son: b.sayfa_sayisi }]);
  const duzen = secili.find((s) => s.kitap_id === duzenlenen);
  const guncelle = (alan: Partial<SeciliKitap>) => setSecili(secili.map((s) => (s.kitap_id === duzenlenen ? { ...s, ...alan } : s)));
  const o = secili.length ? onizleme.data : null;

  return (
    <Ekran ust={t('program.ust')} baslik={t('program.baslik')} sag={<IkonDugme ad="kapat" etiket={t('genel.kapat')} onPress={kapat} />}>
      <Kolon>
        <Girdi etiket={t('program.ad')} value={ad} onChangeText={setAd} placeholder="Lahikalar" returnKeyType="done" enterKeyHint="done" />
        <View>
          <BolumBasligi baslik={t('program.kitaplar')} sag={t('program.secili', { n: secili.length })} />
          <View style={{ backgroundColor: r.yuzey, borderRadius: r.rKart, overflow: 'hidden', marginTop: 8 }}>
            {k.data.map((b) => {
              const sira = secili.findIndex((s) => s.kitap_id === b.id);
              const s = secili[sira];
              return (
                <Pressable
                  key={b.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: sira >= 0 }}
                  accessibilityHint={t('program.aralik')}
                  onPress={() => sec(b)}
                  onLongPress={() => sira >= 0 && setDuzenlenen(b.id)}
                  style={({ pressed }) => ({
                    flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingHorizontal: 12,
                    borderBottomWidth: 1, borderBottomColor: r.kenar, opacity: pressed ? 0.7 : 1,
                  })}>
                  <View style={{
                    width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: r.rKucuk,
                    backgroundColor: sira >= 0 ? r.vurgu : 'transparent', borderWidth: sira >= 0 ? 0 : 2, borderColor: r.kenar,
                  }}>
                    {sira >= 0 ? <Text style={[tip(r, 'kalin'), rakam, { fontSize: 12, color: '#fff' }]}>{sira + 1}</Text> : null}
                  </View>
                  <Text numberOfLines={1} style={[tip(r, sira >= 0 ? 'yari' : 'normal'), { flex: 1, fontSize: 15, color: r.metin }]}>{b.ad}</Text>
                  <Text style={[tip(r, 'normal'), rakam, { fontSize: 13, color: r.soluk }]}>
                    {s && (s.bas !== 1 || s.son !== b.sayfa_sayisi) ? `${s.bas}–${s.son} s.` : `${b.sayfa_sayisi} s.`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Kolon>

      <Kolon>
        <View style={{ gap: 12 }}>
          <BolumBasligi baslik={t('program.gunluk')} />
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <Stepper etiket={t('program.gunluk')} deger={gunluk} azalt={() => setGunluk(Math.max(1, gunluk - 1))} artir={() => setGunluk(gunluk + 1)} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[5, 10, 15, 20].map((n) => <Cip key={n} baslik={String(n)} secili={gunluk === n} onPress={() => setGunluk(n)} />)}
            </View>
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <BolumBasligi baslik={t('program.gunler')} />
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {KISA_GUNLER.map((g, n) => {
              const acik = gunler[n] === '1';
              return (
                <Pressable key={g} accessibilityRole="checkbox" accessibilityState={{ checked: acik }} accessibilityLabel={g}
                  onPress={() => setGunler(gunler.slice(0, n) + (acik ? '0' : '1') + gunler.slice(n + 1))}
                  style={{ flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: r.rHucreKare,
                    backgroundColor: acik ? r.metin : 'transparent', borderWidth: 2, borderColor: acik ? r.metin : r.kenar }}>
                  <Text style={[tip(r, 'yari'), { fontSize: 13, color: acik ? r.zemin : r.metin }]}>{g}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Kart cizgili style={{ flexDirection: 'row', padding: 0, gap: 0 }}>
          {[
            [t('program.toplam'), o?.toplam_sayfa != null ? `${sayi(o.toplam_sayfa)} s.` : '–'],
            [t('program.okumaGunu'), o?.toplam_gun != null ? String(o.toplam_gun) : '–'],
            [t('program.bitis'), o?.bitis ? kisaTarihYil(o.bitis) : '–'],
          ].map(([etiket, deger], i) => (
            <View key={etiket} style={{ flex: 1, minWidth: 0, gap: 4, padding: 12, borderLeftWidth: i ? 1 : 0, borderLeftColor: r.kenar }}>
              <Text style={[tip(r, 'normal'), { fontSize: 12, color: r.soluk }]}>{etiket}</Text>
              <Text style={[tip(r, 'kalin'), rakam, { fontSize: 18, color: r.metin }]}>{deger}</Text>
            </View>
          ))}
        </Kart>

        {hata && ad.trim() ? <Yazi renk={r.kacirildi}>{t(hata as Anahtar)}</Yazi> : null}
        <Buton buyuk baslik={t('program.olustur')} pasif={!!hata} yukleniyor={olustur.isPending} onPress={() => olustur.mutate()} />
      </Kolon>

      <AltSayfa acik={!!duzen} kapat={() => setDuzenlenen(null)}>
        {duzen ? (
          <>
            <SayfaBasligi baslik={duzen.ad} alt={t('program.aralik')} kapat={() => setDuzenlenen(null)} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Girdi etiket={t('program.bas')} value={String(duzen.bas || '')} keyboardType="number-pad" inputMode="numeric"
                  onChangeText={(v) => guncelle({ bas: Number(v.replace(/\D/g, '')) || 0 })} />
              </View>
              <View style={{ flex: 1 }}>
                <Girdi etiket={t('program.son')} value={String(duzen.son || '')} keyboardType="number-pad" inputMode="numeric"
                  onChangeText={(v) => guncelle({ son: Number(v.replace(/\D/g, '')) || 0 })} />
              </View>
            </View>
            <Buton buyuk baslik={t('genel.kaydet')} pasif={duzen.bas < 1 || duzen.son > duzen.sayfa_sayisi || duzen.son < duzen.bas}
              onPress={() => setDuzenlenen(null)} />
          </>
        ) : null}
      </AltSayfa>
    </Ekran>
  );
}
