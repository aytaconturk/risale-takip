import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Linking, Platform, Text, View } from 'react-native';

import { acikProgramlar } from '@/src/api/bugun';
import { davetIptal, davetOlustur, type DavetSonucu } from '@/src/api/grupAyarlari';
import { grupDetayi, grupKur, hatirlat, hatirlatDurumu, sonrakiDers } from '@/src/api/gruplar';
import { Ikon } from '@/src/components/Ikon';
import {
  BolumBasligi, Buton, Cip, Cubuk, Ekran, Girdi, Kart, Kolon, SegmentSecici, Serit, Satir, TelefonGirdi, tip, Yazi, Yukleniyor,
} from '@/src/components/ui';
import { t } from '@/src/i18n';
import { basHarfler, DERS_GUNU, gunAdi, gunAy, telefonGecerli, uzunTarih } from '@/src/lib/bicim';
import { benimId } from '@/src/lib/supabase';
import { useRenkler } from '@/src/lib/tema';
import { useAktifProgram, useBugun } from '@/src/lib/useAktifProgram';
import { useUi } from '@/src/store';

type Kp = NonNullable<ReturnType<typeof useAktifProgram>['kp']>;

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
      key={kp.grup_id}
      kp={kp}
      yeniGrup={() => setKurAcik(true)}
      ust={gruplar.length > 1 ? (
        <Satir style={{ flexWrap: 'wrap' }}>
          {gruplar.map((g) => <Cip key={g.id} baslik={g.grup?.ad ?? ''} secili={g.id === kp.id} onPress={() => setSeciliGrup(g.grup_id)} />)}
        </Satir>
      ) : null}
    />
  );
}

function GrupDetayi({ kp, ust, yeniGrup }: { kp: Kp; ust: ReactNode; yeniGrup: () => void }) {
  const r = useRenkler();
  const qc = useQueryClient();
  const bildir = useUi((s) => s.bildir);
  const grupId = kp.grup_id!;
  const yonetici = kp.rol === 'yonetici';
  const q = useQuery({ queryKey: ['grup', grupId], queryFn: () => grupDetayi(grupId) });
  const ders = useQuery({ queryKey: ['sonrakiDers', grupId], queryFn: () => sonrakiDers(grupId) });
  const benim = useQuery({ queryKey: ['benimId'], queryFn: benimId });

  const gonder = useMutation({
    mutationFn: (alanId: string) => hatirlat(grupId, alanId, 'push'),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ['grup', grupId] });
      if (s.durum === 429) return bildir(t('ders.hatirlatmaBugunVar'));
      if (s.durum !== 200) return bildir(t('genel.hata'));
      if (s.kayit_durumu === 'engellendi') return bildir(t('ders.hatirlatmaEngellendi', { ad: s.alan_ad ?? '' }));
      bildir(t('ders.hatirlatmaGonderildi', { ad: s.alan_ad ?? '' }));
    },
    onError: () => bildir(t('genel.hata')),
  });

  if (!q.data) return <Yukleniyor />;
  const { grup, uyeler } = q.data;
  const okuyan = uyeler.filter((u) => u.bugun_okudu).length;
  // Önce siz, sonra diğer üyeler
  const sirali = [...uyeler].sort((a, b) => Number(b.kullanici_id === benim.data) - Number(a.kullanici_id === benim.data));
  const saat = grup.ders_saati?.slice(0, 5) ?? '';

  return (
    <Ekran
      ust={t('sekme.ders')}
      baslik={grup.ad}
      alt={t('ders.ozet', { n: uyeler.length, program: kp.program?.ad ?? '' })}
      yenile={() => qc.invalidateQueries()}>
      {ust ? <View style={{ flexBasis: '100%' }}>{ust}</View> : null}
      <Kolon>
        <Serit hucreler={[
          { etiket: t('ders.bugunOkuyan'), deger: `${okuyan} / ${uyeler.length}`, boyut: 30 },
          { etiket: t('ders.sonrakiDers'), deger: ders.data ? `${gunAdi(ders.data)} ${gunAy(ders.data)}${saat ? ` · ${saat}` : ''}` : '–', boyut: 20 },
        ]} />

        <View>
          {sirali.map((u) => {
            const ben = u.kullanici_id === benim.data;
            const durum = hatirlatDurumu(u);
            return (
              <View key={u.kullanici_id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 68, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: r.kenar }}>
                <View style={{ width: 40, height: 40, borderRadius: r.rHap === 999 ? 20 : 0, backgroundColor: r.iz, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={[tip(r, 'yari'), { fontSize: 14, color: r.metin }]}>{basHarfler(u.ad, u.soyad)}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                  <Text numberOfLines={1} style={[tip(r, 'yari'), { fontSize: 15, color: r.metin }]}>{ben ? t('ders.siz') : `${u.ad} ${u.soyad ?? ''}`.trim()}</Text>
                  <Text style={[tip(r, 'normal'), { fontSize: 13, color: u.geride_gun > 0 ? r.kacirildi : r.soluk }]}>
                    {u.geride_gun > 0 ? t('ders.seriGeride', { seri: u.seri, geride: u.geride_gun }) : t('ders.seriGun', { seri: u.seri })}
                  </Text>
                  <Cubuk oran={u.tamamlanan / Math.max(1, u.bugunku_gun)} renk={r.metin} kalinlik={3} />
                </View>
                {u.bugun_okudu ? (
                  <Satir style={{ gap: 4 }}>
                    <Ikon ad="tik" renk={r.metin} boyut={16} />
                    <Text style={[tip(r, 'yari'), { fontSize: 13, color: r.metin }]}>{t('ders.okudu')}</Text>
                  </Satir>
                ) : ben || durum === 'yok' ? null : durum === 'kapali' ? (
                  <Text style={[tip(r, 'normal'), { fontSize: 12, color: r.soluk }]}>{t('ders.hatirlatmaKapali')}</Text>
                ) : durum === 'gonderildi' ? (
                  <Text style={[tip(r, 'normal'), { fontSize: 13, color: r.soluk }]}>{t('ders.hatirlatildi')}</Text>
                ) : (
                  <Buton tur="ikincil" baslik={t('ders.hatirlat')} style={{ minHeight: 40 }}
                    yukleniyor={gonder.isPending && gonder.variables === u.kullanici_id} onPress={() => gonder.mutate(u.kullanici_id)} />
                )}
              </View>
            );
          })}
        </View>
        <Buton tur="ikincil" ikon="arti" baslik={t('ders.yeniGrup')} onPress={yeniGrup} />
      </Kolon>

      <Kolon>
        {yonetici ? <DavetEt grupId={grupId} /> : null}
        {grup.ders_gunu ? (
          <View style={{ gap: 4 }}>
            <Text style={[tip(r, 'yari'), { fontSize: 13, color: r.metin }]}>{t('ders.yuzYuze')}</Text>
            <Text style={[tip(r, 'normal'), { fontSize: 14, color: r.soluk }]}>
              {[DERS_GUNU[grup.ders_gunu], saat, grup.konum].filter(Boolean).join(' · ')}
            </Text>
          </View>
        ) : null}
        {yonetici ? <Buton tur="ikincil" baslik={t('ders.grupAyarlari')} onPress={() => router.push(`/grup/${grupId}/ayarlar`)} /> : null}
      </Kolon>
    </Ekran>
  );
}

function DavetEt({ grupId }: { grupId: string }) {
  const r = useRenkler();
  const qc = useQueryClient();
  const bildir = useUi((s) => s.bildir);
  const [tur, setTur] = useState<'kisisel' | 'genel'>('kisisel');
  const [telefon, setTelefon] = useState('');
  const [sonuc, setSonuc] = useState<DavetSonucu | null>(null);
  const olustur = useMutation({
    mutationFn: () => davetOlustur(grupId, tur, tur === 'kisisel' ? telefon : undefined),
    onSuccess: (s) => {
      if (s.durum !== 200) return bildir(t('genel.hata'));
      setSonuc(s);
      qc.invalidateQueries({ queryKey: ['davetler', grupId] });
      bildir(t('ders.linkOlusturuldu'));
    },
    onError: () => bildir(t('genel.hata')),
  });
  const iptal = useMutation({
    mutationFn: () => davetIptal(sonuc!.davet!.id),
    onSuccess: () => {
      setSonuc(null);
      qc.invalidateQueries({ queryKey: ['davetler', grupId] });
      bildir(t('ders.davetIptal'));
    },
    onError: () => bildir(t('genel.hata')),
  });
  const d = sonuc?.davet;
  return (
    <View style={{ gap: 16 }}>
      <BolumBasligi baslik={t('ders.davetEt')} sag={t('ders.davetGecerlilik')} />
      <SegmentSecici
        secenekler={[{ deger: 'kisisel', etiket: t('grupAyar.kisisel') }, { deger: 'genel', etiket: t('grupAyar.genel') }]}
        deger={tur}
        degistir={(v) => { setTur(v); setSonuc(null); }}
      />
      {tur === 'kisisel' && !sonuc ? <TelefonGirdi etiket={t('grupAyar.telefon')} value={telefon} onChangeText={setTelefon} /> : null}
      {sonuc?.link ? (
        <Kart cizgili style={{ gap: 12 }}>
          <Text selectable style={[tip(r, 'kalin'), { fontSize: 22, color: r.metin }, Platform.OS === 'web' ? ({ wordBreak: 'break-all' } as object) : null]}>
            {sonuc.link}
          </Text>
          {d ? (
            <Text style={[tip(r, 'normal'), { fontSize: 13, color: r.soluk }]}>
              {`${t('grupAyar.gecerli', { tarih: uzunTarih(d.son_gecerlilik) })} · ${d.tip === 'kisisel' ? t('ders.tekKullanim') : t('ders.enFazla', { n: d.maks_kullanim })}`}
            </Text>
          ) : null}
          <Buton ikon="mesaj" baslik={t('grupAyar.whatsappAc')} onPress={() => Linking.openURL(sonuc.whatsapp!)} />
          {d ? <Buton tur="hayalet" baslik={t('grupAyar.iptal')} yukleniyor={iptal.isPending} onPress={() => iptal.mutate()} /> : null}
        </Kart>
      ) : (
        <Buton baslik={t('grupAyar.olustur')} yukleniyor={olustur.isPending}
          pasif={tur === 'kisisel' && !telefonGecerli(telefon)} onPress={() => olustur.mutate()} />
      )}
    </View>
  );
}

// Grubu kurar; davet linki Ders ekranındaki "Davet et" bölümünden oluşturulur
function GrupKur({ kapat }: { kapat?: () => void }) {
  const qc = useQueryClient();
  const bildir = useUi((s) => s.bildir);
  const bugun = useBugun();
  const p = useQuery({ queryKey: ['acikProgramlar'], queryFn: acikProgramlar });
  const [ad, setAd] = useState('');
  const [programId, setProgramId] = useState<string | null>(null);
  const kur = useMutation({
    mutationFn: () => grupKur(ad, programId!, bugun!),
    onSuccess: async () => {
      await qc.invalidateQueries();
      kapat?.();
      bildir(t('ders.grupKuruldu', { ad: ad.trim() }));
    },
    onError: () => bildir(t('genel.hata')),
  });
  return (
    <Ekran
      ust={t('sekme.ders')}
      baslik={t('ders.grupKur')}
      alt={kapat ? undefined : t('ders.grupYok')}
      sag={kapat ? <Buton tur="ikincil" baslik={t('genel.iptal')} onPress={kapat} /> : undefined}>
      <Kolon>
        <Yazi tur="soluk">{t('ders.grupKurAlt')}</Yazi>
        <Girdi etiket={t('ders.grupAdi')} placeholder={t('ders.grupAdiIpucu')} value={ad} onChangeText={setAd} />
        <View style={{ gap: 8 }}>
          <Yazi tur="soluk">{t('ders.programSec')}</Yazi>
          <Satir style={{ flexWrap: 'wrap' }}>
            {p.data?.map((pr) => (
              <Cip key={pr.id} baslik={`${pr.ad} · ${t('genel.sayfa', { n: pr.gunluk_sayfa })}`} secili={pr.id === programId} onPress={() => setProgramId(pr.id)} />
            ))}
          </Satir>
        </View>
        <Buton buyuk ikon="sag" baslik={t('ders.kurVeDavet')}
          pasif={!ad.trim() || !programId || !bugun} yukleniyor={kur.isPending} onPress={() => kur.mutate()} />
      </Kolon>
    </Ekran>
  );
}
