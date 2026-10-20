import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Linking, Text, View } from 'react-native';

import { acikProgramlar } from '@/src/api/bugun';
import { grupDetayi, grupKur, hatirlat, hatirlatDurumu } from '@/src/api/gruplar';
import { Buton, Cip, Cubuk, Ekran, Girdi, IkonKutu, Kart, Satir, Yazi, Yukleniyor } from '@/src/components/ui';
import { t } from '@/src/i18n';
import { basHarfler } from '@/src/lib/bicim';
import { benimId } from '@/src/lib/supabase';
import { useRenkler } from '@/src/lib/tema';
import { useAktifProgram, useBugun } from '@/src/lib/useAktifProgram';
import { useUi } from '@/src/store';

const GUN_ADLARI: Record<string, string> = {
  pazartesi: 'Pazartesi', sali: 'Salı', carsamba: 'Çarşamba', persembe: 'Perşembe', cuma: 'Cuma', cumartesi: 'Cumartesi', pazar: 'Pazar',
};

export default function Gruplar() {
  const { data: programlar, isLoading } = useAktifProgram();
  const [seciliGrup, setSeciliGrup] = useState<string | null>(null);
  const [kurAcik, setKurAcik] = useState(false);
  if (isLoading) return <Yukleniyor />;
  const gruplar = (programlar ?? []).filter((p) => p.grup_id);
  if (gruplar.length === 0) return <GrupKur />;
  if (kurAcik) return <GrupKur kapat={() => setKurAcik(false)} />;
  const kp = gruplar.find((g) => g.grup_id === seciliGrup) ?? gruplar[0];
  return (
    <GrupDetayi
      grupId={kp.grup_id!}
      yonetici={kp.rol === 'yonetici'}
      yeniGrup={() => setKurAcik(true)}
      ust={gruplar.length > 1 ? (
        <Satir style={{ flexWrap: 'wrap' }}>
          {gruplar.map((g) => <Cip key={g.id} baslik={g.grup?.ad ?? ''} secili={g.id === kp.id} onPress={() => setSeciliGrup(g.grup_id)} />)}
        </Satir>
      ) : null}
    />
  );
}

function GrupDetayi({ grupId, yonetici, ust, yeniGrup }: { grupId: string; yonetici: boolean; ust: ReactNode; yeniGrup: () => void }) {
  const r = useRenkler();
  const qc = useQueryClient();
  const bildir = useUi((s) => s.bildir);
  const q = useQuery({ queryKey: ['grup', grupId], queryFn: () => grupDetayi(grupId) });
  const benim = useQuery({ queryKey: ['benimId'], queryFn: benimId });

  const gonder = useMutation({
    mutationFn: (a: { alanId: string; kanal: 'push' | 'whatsapp' }) => hatirlat(grupId, a.alanId, a.kanal),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ['grup', grupId] });
      if (s.durum === 429) return bildir(t('ders.hatirlatmaBugunVar'));
      if (s.durum !== 200) return bildir(t('genel.hata'));
      if (s.kayit_durumu === 'engellendi') return bildir(t('ders.hatirlatmaEngellendi', { ad: s.alan_ad ?? '' }));
      if (s.whatsapp) Linking.openURL(s.whatsapp);
      else bildir(t('ders.hatirlatmaGonderildi', { ad: s.alan_ad ?? '' }));
    },
    onError: () => bildir(t('genel.hata')),
  });

  if (!q.data) return <Yukleniyor />;
  const { grup, uyeler } = q.data;
  const okuyan = uyeler.filter((u) => u.bugun_okudu).length;

  return (
    <Ekran
      baslik={t('ders.baslik')}
      yenile={() => q.refetch()}
      sag={yonetici ? <Buton tur="ikincil" baslik={t('ders.davetEt')} onPress={() => router.push(`/grup/${grupId}/ayarlar`)} /> : null}>
      {ust}
      <Kart>
        <Yazi tur="baslik">{grup.ad}</Yazi>
        <Yazi tur="soluk">{t('ders.davetKodu', { kod: grup.davet_kodu, n: uyeler.length })}</Yazi>
        {grup.ders_gunu ? (
          <Yazi tur="soluk">
            {t('ders.dersBilgisi', { gun: GUN_ADLARI[grup.ders_gunu] ?? grup.ders_gunu, saat: grup.ders_saati?.slice(0, 5) ?? '', konum: grup.konum ?? '' })}
          </Yazi>
        ) : null}
        <Satir style={{ justifyContent: 'space-between', marginTop: 8 }}>
          <Yazi tur="soluk">{t('ders.bugunOkuyan')}</Yazi>
          <Yazi tur="soluk">{`${okuyan} / ${uyeler.length}`}</Yazi>
        </Satir>
        <Cubuk oran={okuyan / Math.max(1, uyeler.length)} renk={r.basari} />
      </Kart>

      <Kart>
        {uyeler.map((u) => {
          const ben = u.kullanici_id === benim.data;
          const durum = hatirlatDurumu(u);
          return (
            <Satir key={u.kullanici_id} style={{ paddingVertical: 6 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: ben ? r.marka : r.yuzeyAktif }}>
                <Text style={{ color: ben ? '#fff' : r.metin2, fontWeight: '600', fontSize: 12 }}>{basHarfler(u.ad, u.soyad)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Yazi>{ben ? t('ders.siz') : `${u.ad} ${u.soyad ?? ''}`.trim()}</Yazi>
                <Yazi tur="soluk">{u.geride_gun > 0 ? t('ders.seriGeride', { seri: u.seri, geride: u.geride_gun }) : t('ders.seriGun', { seri: u.seri })}</Yazi>
              </View>
              {u.bugun_okudu ? (
                <Yazi renk={r.basari}>{t('ders.okudu')}</Yazi>
              ) : ben || durum === 'yok' ? null : durum === 'kapali' ? (
                <Yazi tur="soluk">{t('ders.hatirlatmaKapali')}</Yazi>
              ) : durum === 'gonderildi' ? (
                <Yazi tur="soluk">{t('ders.hatirlatildi')}</Yazi>
              ) : (
                <Satir style={{ gap: 4 }}>
                  <Buton tur="ikincil" baslik={t('ders.hatirlat')} onPress={() => gonder.mutate({ alanId: u.kullanici_id, kanal: 'push' })} />
                  <Buton tur="ikincil" baslik="WA" onPress={() => gonder.mutate({ alanId: u.kullanici_id, kanal: 'whatsapp' })} />
                </Satir>
              )}
            </Satir>
          );
        })}
      </Kart>

      <Buton tur="ikincil" ikon={{ ios: 'plus', android: 'add', web: 'add' }} baslik={t('ders.yeniGrup')} onPress={yeniGrup} />
    </Ekran>
  );
}

// Grubu kurar, ardından davet linki oluşturmak için grup ayarlarına geçer
function GrupKur({ kapat }: { kapat?: () => void }) {
  const r = useRenkler();
  const qc = useQueryClient();
  const bildir = useUi((s) => s.bildir);
  const bugun = useBugun();
  const p = useQuery({ queryKey: ['acikProgramlar'], queryFn: acikProgramlar });
  const [ad, setAd] = useState('');
  const [programId, setProgramId] = useState<string | null>(null);
  const kur = useMutation({
    mutationFn: () => grupKur(ad, programId!, bugun!),
    onSuccess: async (id) => {
      await qc.invalidateQueries();
      kapat?.();
      bildir(t('ders.grupKuruldu', { ad: ad.trim() }));
      router.push(`/grup/${id}/ayarlar`);
    },
    onError: () => bildir(t('genel.hata')),
  });
  return (
    <Ekran
      baslik={t('ders.grupKur')}
      alt={kapat ? undefined : t('ders.grupYok')}
      sag={kapat ? <Buton tur="ikincil" baslik={t('genel.iptal')} onPress={kapat} /> : null}>
      <Kart style={{ alignItems: 'center', paddingVertical: 24 }}>
        <IkonKutu ad={{ ios: 'person.3.fill', android: 'groups', web: 'groups' }} renk={r.marka} zemin={r.markaAcik} boyut={56} />
        <Yazi tur="soluk">{t('ders.grupKurAlt')}</Yazi>
      </Kart>
      <Kart>
        <Girdi etiket={t('ders.grupAdi')} placeholder={t('ders.grupAdiIpucu')} value={ad} onChangeText={setAd} />
        <Yazi tur="soluk">{t('ders.programSec')}</Yazi>
        <Satir style={{ flexWrap: 'wrap' }}>
          {p.data?.map((pr) => (
            <Cip key={pr.id} baslik={`${pr.ad} · ${t('genel.sayfa', { n: pr.gunluk_sayfa })}`} secili={pr.id === programId} onPress={() => setProgramId(pr.id)} />
          ))}
        </Satir>
      </Kart>
      <Buton ikon={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} baslik={t('ders.kurVeDavet')}
        pasif={!ad.trim() || !programId || !bugun} yukleniyor={kur.isPending} onPress={() => kur.mutate()} />
    </Ekran>
  );
}
