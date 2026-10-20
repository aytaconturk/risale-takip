import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { acikProgramlar, bugunVerisi, gunAraligi, gunuIsaretle, programaBasla, topluTelafi } from '@/src/api/bugun';
import type { GunDurumu } from '@/src/api/cizelge';
import { ilerlemeVerisi } from '@/src/api/ilerleme';
import { GunDairesi } from '@/src/components/GunDairesi';
import { Ikon } from '@/src/components/Ikon';
import { OkumaKarti } from '@/src/components/OkumaKarti';
import { BolumBasligi, Buton, Cip, Cubuk, Ekran, Etiket, Kart, Kolon, rakam, Satir, tip, Yazi, Yukleniyor } from '@/src/components/ui';
import { t } from '@/src/i18n';
import { aralikMetni, gunAdi, gunAy, gunNumarasi, KISA_GUNLER, kisaTarih, sayi, uzunTarih, yuzde } from '@/src/lib/bicim';
import { useRenkler } from '@/src/lib/tema';
import { useAktifProgram } from '@/src/lib/useAktifProgram';
import { useUi } from '@/src/store';

type Kp = NonNullable<ReturnType<typeof useAktifProgram>['kp']>;

export default function Bugun() {
  const { kp, isLoading } = useAktifProgram();
  if (isLoading) return <Yukleniyor />;
  if (!kp) return <ProgramSec />;
  return <BugunIcerik kp={kp} />;
}

function BugunIcerik({ kp }: { kp: Kp }) {
  const r = useRenkler();
  const qc = useQueryClient();
  const bildir = useUi((s) => s.bildir);
  const kpSec = useUi((s) => s.kpSec);
  const { data: programlar } = useAktifProgram();
  const q = useQuery({ queryKey: ['bugun', kp.id], queryFn: () => bugunVerisi(kp) });

  const telafi = useMutation({
    mutationFn: async (gunler: number[]) => {
      await (gunler.length === 1 ? gunuIsaretle(kp.id, gunler[0]) : topluTelafi(kp.id, gunler));
      return gunler;
    },
    onSuccess: (g) => {
      qc.invalidateQueries();
      bildir(g.length === 1 ? t('bugun.gunTelafi', { gun: g[0] }) : t('bugun.topluTelafiTamam', { n: g.length }));
    },
    onError: () => bildir(t('genel.hata')),
  });

  if (!q.data) return <Yukleniyor />;
  const { ilerleme: i, hafta, geride, tarih, aralik, kismiler, kismiSayfa } = q.data;
  const gunluk = kp.program?.gunluk_sayfa ?? 0;
  const gecenOkumaGunu = hafta.filter((g) => g.gun_no != null && g.tarih <= tarih).length;
  const haftaOkunan = hafta.filter((g) => g.durum === 'okundu' || g.durum === 'telafi').length;
  const ad = kp.grup?.ad ?? kp.program?.ad ?? '';

  return (
    <Ekran
      ust={i.bugunku_gun > 0 ? t('bugun.gunBasligi', { gun: i.bugunku_gun, toplam: i.toplam_gun }) : undefined}
      baslik={gunAy(tarih)}
      alt={`${gunAdi(tarih)} · ${ad}`}
      yenile={() => qc.invalidateQueries()}>
      {programlar && programlar.length > 1 ? (
        <Satir style={{ flexWrap: 'wrap', flexBasis: '100%' }}>
          {programlar.map((p) => (
            <Cip key={p.id} baslik={p.grup?.ad ?? p.program?.ad ?? ''} secili={p.id === kp.id} onPress={() => kpSec(p.id)} />
          ))}
        </Satir>
      ) : null}

      <Kolon>
        {kp.durum === 'duraklatildi' ? (
          <Kart cizgili><Yazi>{t('bugun.duraklatildi')}</Yazi></Kart>
        ) : i.bugunku_gun === 0 ? (
          <Kart cizgili><Yazi>{t('bugun.basladiginda', { tarih: uzunTarih(kp.baslangic_tarihi) })}</Yazi></Kart>
        ) : (
          <OkumaKarti kpId={kp.id} gun={i.bugunku_gun} aralik={aralik} gunluk={gunluk} okundu={i.bugun_okundu} kismi={kismiSayfa} seri={i.seri} />
        )}

        <View style={{ gap: 12 }}>
          <BolumBasligi baslik={t('bugun.buHafta')} sag={t('bugun.haftaOzet', { okunan: haftaOkunan, toplam: gecenOkumaGunu })} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {hafta.map((g, n) => (
              <Pressable
                key={g.tarih}
                accessibilityRole="button"
                disabled={g.gun_no == null}
                onPress={() => router.push({ pathname: '/cizelge', params: { tarih: g.tarih } })}
                style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                <Text style={[tip(r, 'normal'), { fontSize: 12, color: r.soluk }]}>{KISA_GUNLER[n]}</Text>
                <View style={{ width: '100%', maxWidth: 44 }}>
                  <GunDairesi durum={g.durum as GunDurumu} metin={String(gunNumarasi(g.tarih))} />
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </Kolon>

      <Kolon>
        <View style={{ flexDirection: 'row', gap: r.statAralik }}>
          <Istatistik ust={<Satir style={{ gap: 6 }}><Ikon ad="alev" renk={r.vurgu} boyut={16} /><Etiket renk={r.soluk}>{t('bugun.seri')}</Etiket></Satir>}
            deger={t('genel.gun', { n: i.seri })} alt={<Yazi tur="soluk">{t('bugun.arkaArkaya')}</Yazi>} />
          <Istatistik ust={<Etiket renk={r.soluk}>{t('bugun.kulliyat')}</Etiket>} deger={yuzde(i.yuzde)}
            alt={<View style={{ gap: 6 }}><Cubuk oran={i.okunan_sayfa / Math.max(1, i.toplam_sayfa)} /><Yazi tur="soluk">{`${sayi(i.okunan_sayfa)} / ${sayi(i.toplam_sayfa)}`}</Yazi></View>} />
        </View>

        <OkunanKitap kp={kp} />

        {geride.length > 0 ? (
          <View>
            <BolumBasligi baslik={t('bugun.geride')} sag={t('genel.gun', { n: geride.length })} sagRenk={r.kacirildi} />
            {geride.map((g) => (
              <GerideGun key={g.gun_no} programId={kp.program_id} gun={g} kismi={kismiler[g.gun_no!]} gunluk={gunluk}
                onIsaretle={() => telafi.mutate([g.gun_no!])} />
            ))}
            <View style={{ marginTop: 12 }}>
              <Buton tur="ikincil" baslik={t('bugun.topluTelafi')} yukleniyor={telafi.isPending}
                onPress={() => telafi.mutate(geride.map((g) => g.gun_no!))} />
            </View>
          </View>
        ) : null}
      </Kolon>
    </Ekran>
  );
}

// Ayrı kartlar
function Istatistik({ ust, deger, alt }: { ust: ReactNode; deger: string; alt: ReactNode }) {
  const r = useRenkler();
  return (
    <View style={{ flex: 1, gap: 6, padding: 16, backgroundColor: r.yuzey, borderRadius: r.rKart, boxShadow: r.kartGolge }}>
      {ust}
      <Text style={[tip(r, 'kalin'), rakam, { fontSize: 32, letterSpacing: -0.6, color: r.metin }]}>{deger}</Text>
      {alt}
    </View>
  );
}

// Programın sıradaki kitabı; veri İlerleme ekranıyla aynı sorgudan (önbellek paylaşılır)
function OkunanKitap({ kp }: { kp: { id: string; program_id: string } }) {
  const r = useRenkler();
  const q = useQuery({ queryKey: ['ilerleme', kp.id], queryFn: () => ilerlemeVerisi(kp) });
  if (!q.data) return null;
  const { kitaplar, bitis, ilerleme: i } = q.data;
  const sira = kitaplar.findIndex((k) => k.okunan < k.uzunluk);
  if (sira < 0) return null;
  const k = kitaplar[sira];
  return (
    <Link href="/ilerleme" asChild>
      <Pressable accessibilityRole="button">
        <Kart cizgili>
          <Satir style={{ justifyContent: 'space-between' }}>
            <Etiket renk={r.soluk}>{t('bugun.okunanKitap', { n: sira + 1, toplam: kitaplar.length })}</Etiket>
            <Ikon ad="sag" renk={r.soluk} boyut={18} />
          </Satir>
          <Text style={[tip(r, 'kalin'), { fontSize: 22, color: r.metin }]}>{k.kitap_ad}</Text>
          <Cubuk oran={k.okunan / Math.max(1, k.uzunluk)} renk={r.metin} />
          <Satir style={{ justifyContent: 'space-between' }}>
            <Yazi tur="soluk">{`${sayi(k.okunan)} / ${sayi(k.uzunluk)} sayfa`}</Yazi>
            <Yazi tur="soluk">{t('bugun.kalanGun', { n: i.toplam_gun - i.tamamlanan_gun })}</Yazi>
          </Satir>
          {bitis ? (
            <View style={{ marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: r.kenar }}>
              <Yazi tur="soluk">{t('bugun.programBitis', { tarih: uzunTarih(bitis) })}</Yazi>
            </View>
          ) : null}
        </Kart>
      </Pressable>
    </Link>
  );
}

function GerideGun({ programId, gun, kismi, gunluk, onIsaretle }: {
  programId: string; gun: { gun_no: number | null; tarih: string; durum: string }; kismi?: number; gunluk: number; onIsaretle: () => void;
}) {
  const r = useRenkler();
  const aralik = useQuery({
    queryKey: ['gun_araligi', programId, gun.gun_no],
    queryFn: () => gunAraligi(programId, gun.gun_no!),
  });
  const kismiMetin = gun.durum === 'kismi' ? ` · ${t('cizelge.kismi')} ${kismi ?? 0}/${gunluk}` : '';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onIsaretle}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: r.kenar, opacity: pressed ? 0.6 : 1 })}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[tip(r, 'yari'), rakam, { fontSize: 15, color: r.metin }]}>{`Gün ${gun.gun_no} · ${kisaTarih(gun.tarih)}${kismiMetin}`}</Text>
        <Yazi tur="soluk">{aralik.data ? aralikMetni(aralik.data) : ' '}</Yazi>
      </View>
      <View style={{ width: 28, height: 28, borderRadius: r.rHucre === 'daire' ? 14 : 0, borderWidth: 2, borderColor: r.kenar }} />
    </Pressable>
  );
}

function ProgramSec() {
  const qc = useQueryClient();
  const bildir = useUi((s) => s.bildir);
  const p = useQuery({ queryKey: ['acikProgramlar'], queryFn: acikProgramlar });
  const basla = useMutation({
    mutationFn: programaBasla,
    onSuccess: () => qc.invalidateQueries(),
    onError: () => bildir(t('genel.hata')),
  });
  return (
    <Ekran baslik={t('bugun.programYok')} alt={t('bugun.programSec')}>
      <Kolon>
        {p.data?.map((pr) => (
          <Kart key={pr.id} cizgili>
            <Yazi tur="baslik">{pr.ad}</Yazi>
            <Yazi tur="soluk">{t('genel.sayfa', { n: pr.gunluk_sayfa })}</Yazi>
            <Buton baslik={t('bugun.programaBasla')} yukleniyor={basla.isPending} onPress={() => basla.mutate(pr.id)} />
          </Kart>
        ))}
        <Buton tur="ikincil" baslik={t('bugun.ozelProgram')} onPress={() => router.push('/program/yeni')} />
      </Kolon>
    </Ekran>
  );
}
