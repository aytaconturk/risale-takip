import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Share } from 'react-native';

import { grupDetayi } from '@/src/api/gruplar';
import { davetDurumu, davetIptal, davetler, davetOlustur, dersGuncelle, uyeCikar, type DavetSonucu } from '@/src/api/grupAyarlari';
import { Buton, Cip, Ekran, Girdi, Kart, onayla, Satir, TelefonGirdi, Yazi, Yukleniyor } from '@/src/components/ui';
import { t } from '@/src/i18n';
import { kisaTarih, telefonGecerli } from '@/src/lib/bicim';
import { benimId } from '@/src/lib/supabase';
import { useRenkler } from '@/src/lib/tema';
import { useUi } from '@/src/store';

const GUNLER = ['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi', 'pazar'];
const GUN_KISA = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export default function GrupAyarlari() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = useRenkler();
  const qc = useQueryClient();
  const bildir = useUi((s) => s.bildir);
  const grup = useQuery({ queryKey: ['grup', id], queryFn: () => grupDetayi(id) });
  const d = useQuery({ queryKey: ['davetler', id], queryFn: () => davetler(id) });
  const benim = useQuery({ queryKey: ['benimId'], queryFn: benimId });
  const [tip, setTip] = useState<'kisisel' | 'genel'>('genel');
  const [telefon, setTelefon] = useState('');
  const [sonuc, setSonuc] = useState<DavetSonucu | null>(null);
  const [ders, setDers] = useState({ ders_gunu: null as string | null, ders_saati: '', konum: '' });

  useEffect(() => {
    const g = grup.data?.grup;
    if (g) setDers({ ders_gunu: g.ders_gunu, ders_saati: g.ders_saati?.slice(0, 5) ?? '', konum: g.konum ?? '' });
  }, [grup.data?.grup]);

  const yenile = () => qc.invalidateQueries();
  const hata = () => bildir(t('genel.hata'));
  const olustur = useMutation({
    mutationFn: () => davetOlustur(id, tip, tip === 'kisisel' ? telefon : undefined),
    onSuccess: (s) => { if (s.durum !== 200) return hata(); setSonuc(s); qc.invalidateQueries({ queryKey: ['davetler', id] }); },
    onError: hata,
  });
  const islem = useMutation({ mutationFn: (f: () => Promise<void>) => f(), onSuccess: yenile, onError: hata });

  if (!grup.data || !d.data) return <Yukleniyor />;

  return (
    <Ekran baslik={grup.data.grup.ad}>
      <Kart>
        <Yazi tur="baslik">{t('grupAyar.davetler')}</Yazi>
        <Satir>
          <Cip baslik={t('grupAyar.genel')} secili={tip === 'genel'} onPress={() => setTip('genel')} />
          <Cip baslik={t('grupAyar.kisisel')} secili={tip === 'kisisel'} onPress={() => setTip('kisisel')} />
        </Satir>
        {tip === 'kisisel' ? <TelefonGirdi etiket={t('grupAyar.telefon')} value={telefon} onChangeText={setTelefon} /> : null}
        <Buton baslik={t('grupAyar.olustur')} yukleniyor={olustur.isPending} pasif={tip === 'kisisel' && !telefonGecerli(telefon)} onPress={() => olustur.mutate()} />
        {sonuc?.link ? (
          <>
            <Yazi renk={r.marka}>{sonuc.link}</Yazi>
            <Satir>
              <Buton tur="basari" baslik={t('grupAyar.whatsappAc')} onPress={() => Linking.openURL(sonuc.whatsapp!)} />
              <Buton tur="ikincil" baslik="Paylaş" onPress={() => Share.share({ message: sonuc.link! })} />
            </Satir>
          </>
        ) : null}
        {d.data.map((dv) => {
          const durum = davetDurumu(dv);
          return (
            <Satir key={dv.id} style={{ justifyContent: 'space-between', paddingVertical: 4 }}>
              <Yazi tur="soluk">
                {`${dv.token} · ${dv.telefon ?? t('grupAyar.genel')} · ${
                  durum === 'iptal' ? t('grupAyar.iptalEdildi') : durum === 'kullanildi' ? t('grupAyar.kullanildi') : t('grupAyar.gecerli', { tarih: kisaTarih(dv.son_gecerlilik) })
                }`}
              </Yazi>
              {durum === 'gecerli' ? (
                <Buton tur="tehlike" baslik={t('grupAyar.iptal')} onPress={() => islem.mutate(() => davetIptal(dv.id))} />
              ) : null}
            </Satir>
          );
        })}
      </Kart>

      <Kart>
        <Yazi tur="baslik">{t('grupAyar.uyeler')}</Yazi>
        {grup.data.uyeler.filter((u) => u.kullanici_id !== benim.data).map((u) => (
          <Satir key={u.kullanici_program_id} style={{ justifyContent: 'space-between' }}>
            <Yazi>{`${u.ad} ${u.soyad ?? ''}`}</Yazi>
            <Buton tur="tehlike" baslik={t('grupAyar.cikar')}
              onPress={async () => (await onayla(t('grupAyar.cikarOnay', { ad: u.ad }))) && islem.mutate(() => uyeCikar(u.kullanici_program_id))} />
          </Satir>
        ))}
      </Kart>

      <Kart>
        <Yazi tur="baslik">{t('grupAyar.ders')}</Yazi>
        <Yazi tur="soluk">{t('grupAyar.dersGunu')}</Yazi>
        <Satir style={{ flexWrap: 'wrap' }}>
          {GUNLER.map((g, n) => (
            <Cip key={g} baslik={GUN_KISA[n]} secili={ders.ders_gunu === g} onPress={() => setDers({ ...ders, ders_gunu: ders.ders_gunu === g ? null : g })} />
          ))}
        </Satir>
        <Girdi etiket={t('grupAyar.dersSaati')} value={ders.ders_saati} onChangeText={(v) => setDers({ ...ders, ders_saati: v })} placeholder="20:30" />
        <Girdi etiket={t('grupAyar.konum')} value={ders.konum} onChangeText={(v) => setDers({ ...ders, konum: v })} />
        <Buton
          baslik={t('genel.kaydet')}
          pasif={!!ders.ders_saati && !/^([01]\d|2[0-3]):[0-5]\d$/.test(ders.ders_saati)}
          onPress={() => islem.mutate(async () => {
            await dersGuncelle(id, { ders_gunu: ders.ders_gunu, ders_saati: ders.ders_saati || null, konum: ders.konum.trim() || null });
            bildir(t('genel.kaydet'));
          })}
        />
      </Kart>
    </Ekran>
  );
}
