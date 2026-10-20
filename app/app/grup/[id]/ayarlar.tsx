import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { grupDetayi } from '@/src/api/gruplar';
import { davetDurumu, davetIptal, davetler, dersGuncelle, uyeCikar } from '@/src/api/grupAyarlari';
import { BolumBasligi, Buton, Cip, Ekran, Girdi, IkonDugme, Kolon, onayla, Satir, tip, Yukleniyor } from '@/src/components/ui';
import { t } from '@/src/i18n';
import { KISA_GUNLER, kisaTarih, SAAT, saatBicimle } from '@/src/lib/bicim';
import { benimId } from '@/src/lib/supabase';
import { useRenkler } from '@/src/lib/tema';
import { useUi } from '@/src/store';

const GUNLER = ['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi', 'pazar'];

// Yönetici: davetleri iptal, üye çıkarma, ders günü/saat/konum. Yeni davet linki Ders sekmesinde oluşturulur.
export default function GrupAyarlari() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = useRenkler();
  const qc = useQueryClient();
  const bildir = useUi((s) => s.bildir);
  const grup = useQuery({ queryKey: ['grup', id], queryFn: () => grupDetayi(id) });
  const d = useQuery({ queryKey: ['davetler', id], queryFn: () => davetler(id) });
  const benim = useQuery({ queryKey: ['benimId'], queryFn: benimId });
  const [ders, setDers] = useState({ ders_gunu: null as string | null, ders_saati: '', konum: '' });

  useEffect(() => {
    const g = grup.data?.grup;
    if (g) setDers({ ders_gunu: g.ders_gunu, ders_saati: g.ders_saati?.slice(0, 5) ?? '', konum: g.konum ?? '' });
  }, [grup.data?.grup]);

  const islem = useMutation({
    mutationFn: async (f: () => Promise<string>) => bildir(await f()),
    onSuccess: () => qc.invalidateQueries(),
    onError: () => bildir(t('genel.hata')),
  });
  const kapat = () => (router.canGoBack() ? router.back() : router.replace('/gruplar'));

  if (!grup.data || !d.data) return <Yukleniyor />;
  const satir = { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 56, borderBottomWidth: 1, borderBottomColor: r.kenar } as const;
  const metin = (s: string, soluk?: boolean) => (
    <Text style={[tip(r, soluk ? 'normal' : 'yari'), { flex: 1, fontSize: soluk ? 13 : 15, color: soluk ? r.soluk : r.metin }]}>{s}</Text>
  );

  return (
    <Ekran ust={t('grupAyar.baslik')} baslik={grup.data.grup.ad} sag={<IkonDugme ad="kapat" etiket={t('genel.kapat')} onPress={kapat} />}>
      <Kolon>
        <View>
          <BolumBasligi baslik={t('grupAyar.davetler')} />
          {d.data.map((dv) => {
            const durum = davetDurumu(dv);
            return (
              <View key={dv.id} style={satir}>
                {metin(`${dv.token} · ${dv.telefon ?? t('grupAyar.genel')} · ${
                  durum === 'iptal' ? t('grupAyar.iptalEdildi') : durum === 'kullanildi' ? t('grupAyar.kullanildi') : t('grupAyar.gecerli', { tarih: kisaTarih(dv.son_gecerlilik) })
                }`, true)}
                {durum === 'gecerli' ? (
                  <Buton tur="hayalet" renk={r.kacirildi} baslik={t('grupAyar.iptal')}
                    onPress={() => islem.mutate(async () => { await davetIptal(dv.id); return t('ders.davetIptal'); })} />
                ) : null}
              </View>
            );
          })}
        </View>

        <View>
          <BolumBasligi baslik={t('grupAyar.uyeler')} />
          {grup.data.uyeler.filter((u) => u.kullanici_id !== benim.data).map((u) => (
            <View key={u.kullanici_program_id} style={satir}>
              {metin(`${u.ad} ${u.soyad ?? ''}`.trim())}
              <Buton tur="hayalet" renk={r.kacirildi} baslik={t('grupAyar.cikar')}
                onPress={async () => (await onayla(t('grupAyar.cikarOnay', { ad: u.ad }))) &&
                  islem.mutate(async () => { await uyeCikar(u.kullanici_program_id); return t('grupAyar.cikarildi', { ad: u.ad }); })} />
            </View>
          ))}
        </View>
      </Kolon>

      <Kolon>
        <View style={{ gap: 16 }}>
          <BolumBasligi baslik={t('grupAyar.ders')} />
          <View style={{ gap: 8 }}>
            <Text style={[tip(r, 'normal'), { fontSize: 12, color: r.soluk }]}>{t('grupAyar.dersGunu')}</Text>
            <Satir style={{ flexWrap: 'wrap' }}>
              {GUNLER.map((g, n) => (
                <Cip key={g} baslik={KISA_GUNLER[n]} secili={ders.ders_gunu === g} onPress={() => setDers({ ...ders, ders_gunu: ders.ders_gunu === g ? null : g })} />
              ))}
            </Satir>
          </View>
          <Girdi etiket={t('grupAyar.dersSaati')} value={ders.ders_saati} onChangeText={(v) => setDers({ ...ders, ders_saati: saatBicimle(v) })}
            placeholder="20:30" inputMode="numeric" keyboardType="numbers-and-punctuation" maxLength={5} returnKeyType="next" enterKeyHint="next" />
          <Girdi etiket={t('grupAyar.konum')} value={ders.konum} onChangeText={(v) => setDers({ ...ders, konum: v })} returnKeyType="done" enterKeyHint="done" />
          <Buton
            buyuk
            baslik={t('genel.kaydet')}
            pasif={!!ders.ders_saati && !SAAT.test(ders.ders_saati)}
            yukleniyor={islem.isPending}
            onPress={() => islem.mutate(async () => {
              await dersGuncelle(id, { ders_gunu: ders.ders_gunu, ders_saati: ders.ders_saati || null, konum: ders.konum.trim() || null });
              return t('grupAyar.kaydedildi');
            })}
          />
        </View>
      </Kolon>
    </Ekran>
  );
}
