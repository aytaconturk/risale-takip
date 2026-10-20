import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { acikProgramlar, bugunVerisi, gunAraligi, gunuIsaretle, isaretiKaldir, programaBasla, topluTelafi } from '@/src/api/bugun';
import type { GunDurumu } from '@/src/api/cizelge';
import { GunDairesi } from '@/src/components/GunDairesi';
import { useColorScheme } from '@/components/useColorScheme';
import { ilerlemeVerisi } from '@/src/api/ilerleme';
import { Buton, Cip, Cubuk, Ekran, Etiket, Girdi, IkonKutu, Kart, Satir, Yazi, Yukleniyor } from '@/src/components/ui';
import { t } from '@/src/i18n';
import { aralikMetni, gunAdi, gunNumarasi, KISA_GUNLER, kisaTarih, uzunTarih, yuzde } from '@/src/lib/bicim';
import { useRenkler } from '@/src/lib/tema';
import { useAktifProgram } from '@/src/lib/useAktifProgram';
import { useUi } from '@/src/store';

export default function Bugun() {
  const { kp, isLoading } = useAktifProgram();
  if (isLoading) return <Yukleniyor />;
  if (!kp) return <ProgramSec />;
  return <BugunIcerik kp={kp} />;
}

function BugunIcerik({ kp }: { kp: NonNullable<ReturnType<typeof useAktifProgram>['kp']> }) {
  const r = useRenkler();
  const qc = useQueryClient();
  const bildir = useUi((s) => s.bildir);
  const { data: programlar } = useAktifProgram();
  const kpSec = useUi((s) => s.kpSec);
  const q = useQuery({ queryKey: ['bugun', kp.id], queryFn: () => bugunVerisi(kp) });
  const [kismiAcik, setKismiAcik] = useState(false);
  const [kismiSayfa, setKismiSayfa] = useState('');

  const yenile = () => qc.invalidateQueries();
  const islem = useMutation({
    mutationFn: (f: () => Promise<void>) => f(),
    onSuccess: yenile,
    onError: () => bildir(t('genel.hata')),
  });

  if (!q.data) return <Yukleniyor />;
  const { ilerleme: i, hafta, geride, tarih, aralik, kismiSayfa: kayitliKismi } = q.data;
  const gunluk = kp.program?.gunluk_sayfa ?? 0;
  const okumaGunleri = hafta.filter((g) => g.gun_no != null);
  const haftaOkunan = hafta.filter((g) => g.durum === 'okundu' || g.durum === 'telafi').length;

  const okudum = () =>
    islem.mutate(async () => {
      await gunuIsaretle(kp.id, i.bugunku_gun);
      bildir(t('bugun.gunTamam', { gun: i.bugunku_gun, seri: i.seri + 1 }));
    });

  return (
    <Ekran
      ust={i.bugunku_gun > 0 ? t('bugun.gunBasligi', { gun: i.bugunku_gun, toplam: i.toplam_gun }) : undefined}
      baslik={uzunTarih(tarih)}
      alt={gunAdi(tarih)}
      yenile={yenile}
      sag={
        <Satir>
        <TemaDugmesi />
        <Link href="/ayarlar" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel={t('ayarlar.baslik')} style={{ padding: 10, borderRadius: 999, backgroundColor: r.yuzey, boxShadow: r.golge }}>
            <SymbolView name={{ ios: 'bell', android: 'notifications', web: 'notifications' }} tintColor={r.marka} size={20} />
          </Pressable>
        </Link>
        </Satir>
      }>
      {programlar && programlar.length > 1 ? (
        <Satir style={{ flexWrap: 'wrap' }}>
          {programlar.map((p) => (
            <Cip key={p.id} baslik={p.grup?.ad ?? p.program?.ad ?? ''} secili={p.id === kp.id} onPress={() => kpSec(p.id)} />
          ))}
        </Satir>
      ) : null}

      {kp.durum === 'duraklatildi' ? (
        <Kart><Yazi>{t('bugun.duraklatildi')}</Yazi></Kart>
      ) : i.bugunku_gun === 0 ? (
        <Kart><Yazi>{t('bugun.basladiginda', { tarih: uzunTarih(kp.baslangic_tarihi) })}</Yazi></Kart>
      ) : (
        <View style={[{ borderRadius: 20, padding: 20, gap: 12, overflow: 'hidden', backgroundColor: r.vurgu1, boxShadow: '0 10px 24px rgba(37, 99, 235, 0.28)' }, degrade(r.vurgu1, r.vurgu2)]}>
          <View style={{ position: 'absolute', right: -18, top: -10, opacity: 0.14 }}>
            <SymbolView name={{ ios: 'book.fill', android: 'menu_book', web: 'menu_book' }} tintColor="#fff" size={150} />
          </View>
          <Satir style={{ justifyContent: 'space-between' }}>
            <Etiket renk="rgba(255,255,255,0.8)">{t('bugun.bugunkuOkuma')}</Etiket>
            <Text style={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.18)', fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
              {t('genel.sayfa', { n: gunluk })}
            </Text>
          </Satir>
          {aralik.map((a) => (
            <View key={a.kitap_id} style={{ gap: 2 }}>
              <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: -0.4 }}>{a.kitap_ad}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '500' }}>{`Sayfa ${a.bas_sayfa} – ${a.son_sayfa}`}</Text>
            </View>
          ))}
          {i.bugun_okundu ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => islem.mutate(() => isaretiKaldir(kp.id, i.bugunku_gun))}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 12, padding: 12, marginTop: 4 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center' }}>
                <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} tintColor="#fff" size={18} />
              </View>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14, flex: 1 }}>{t('bugun.okundu')}</Text>
            </Pressable>
          ) : (
            <>
              {kayitliKismi ? <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>{t('bugun.kismiOkundu', { n: kayitliKismi, toplam: gunluk })}</Text> : null}
              <Buton tur="beyaz" ikon={{ ios: 'checkmark', android: 'check', web: 'check' }} baslik={t('bugun.okudum')} yukleniyor={islem.isPending} onPress={okudum} />
              {kismiAcik ? (
                <Satir>
                  <View style={{ flex: 1 }}>
                    <Girdi etiket={t('bugun.kacSayfa')} value={kismiSayfa} onChangeText={setKismiSayfa} keyboardType="number-pad" />
                  </View>
                  <View style={{ marginTop: 18 }}>
                    <Buton
                      tur="ikincil"
                      baslik={t('genel.kaydet')}
                      pasif={!(Number(kismiSayfa) > 0 && Number(kismiSayfa) < gunluk)}
                      onPress={() => {
                        islem.mutate(() => gunuIsaretle(kp.id, i.bugunku_gun, Number(kismiSayfa)));
                        setKismiAcik(false);
                      }}
                    />
                  </View>
                </Satir>
              ) : (
                <Pressable accessibilityRole="button" onPress={() => setKismiAcik(true)} style={{ alignSelf: 'center', padding: 4 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '600', fontSize: 13 }}>{t('bugun.kismen')}</Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      )}

      <Kart>
        <Satir style={{ justifyContent: 'space-between' }}>
          <Yazi tur="baslik">{t('bugun.buHafta')}</Yazi>
          <Yazi tur="soluk">{t('bugun.haftaOzet', { okunan: haftaOkunan, toplam: okumaGunleri.length })}</Yazi>
        </Satir>
        <Satir style={{ justifyContent: 'space-between' }}>
          {hafta.map((g, n) => (
            <View key={g.tarih} style={{ alignItems: 'center', gap: 4 }}>
              <Yazi tur="soluk">{KISA_GUNLER[n]}</Yazi>
              <GunDairesi durum={g.durum as GunDurumu} metin={String(gunNumarasi(g.tarih))} r={r} />
            </View>
          ))}
        </Satir>
      </Kart>

      <Satir style={{ alignItems: 'stretch' }}>
        <Kart style={{ flex: 1 }}>
          <Satir>
            <IkonKutu ad={{ ios: 'flame.fill', android: 'local_fire_department', web: 'local_fire_department' }} renk={r.turuncu} zemin={r.turuncuAcik} boyut={32} />
            <Yazi tur="soluk">{t('bugun.seri')}</Yazi>
          </Satir>
          <Yazi tur="buyuk">{t('genel.gun', { n: i.seri })}</Yazi>
          <Yazi tur="soluk">{t('bugun.enUzun', { n: i.okunan_sayfa })}</Yazi>
        </Kart>
        <Kart style={{ flex: 1 }}>
          <Satir>
            <IkonKutu ad={{ ios: 'books.vertical.fill', android: 'auto_stories', web: 'auto_stories' }} renk={r.mor} zemin={r.morAcik} boyut={32} />
            <Yazi tur="soluk">{t('bugun.kulliyat')}</Yazi>
          </Satir>
          <Yazi tur="buyuk">{yuzde(i.yuzde)}</Yazi>
          <Cubuk oran={i.okunan_sayfa / Math.max(1, i.toplam_sayfa)} renk={r.mor} />
          <Yazi tur="soluk">{`${i.okunan_sayfa} / ${i.toplam_sayfa}`}</Yazi>
        </Kart>
      </Satir>

      <OkunanKitap kp={kp} />

      {geride.length > 0 ? (
        <Kart>
          <Satir style={{ justifyContent: 'space-between' }}>
            <Yazi tur="baslik">{t('bugun.geride')}</Yazi>
            <Yazi tur="soluk" renk={r.tehlike}>{t('genel.gun', { n: geride.length })}</Yazi>
          </Satir>
          {geride.map((g) => (
            <GerideGun key={g.gun_no} programId={kp.program_id} gun={g} onIsaretle={() => islem.mutate(() => gunuIsaretle(kp.id, g.gun_no!))} />
          ))}
          <Buton tur="ikincil" baslik={t('bugun.topluTelafi')} yukleniyor={islem.isPending}
            onPress={() => islem.mutate(() => topluTelafi(kp.id, geride.map((g) => g.gun_no!)))} />
        </Kart>
      ) : null}
    </Ekran>
  );
}

// Açık/koyu hızlı geçiş; seçim kalıcıdır (Ayarlar > Görünüm)
function TemaDugmesi() {
  const r = useRenkler();
  const koyu = useColorScheme() === 'dark';
  const temaSec = useUi((s) => s.temaSec);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: koyu }}
      accessibilityLabel={t('ayarlar.temaKoyu')}
      onPress={() => temaSec(koyu ? 'acik' : 'koyu')}
      style={{ padding: 10, borderRadius: 999, backgroundColor: r.yuzey, boxShadow: r.golge }}>
      <SymbolView name={koyu ? { ios: 'sun.max.fill', android: 'light_mode', web: 'light_mode' } : { ios: 'moon.fill', android: 'dark_mode', web: 'dark_mode' }} tintColor={koyu ? r.turuncu : r.mor} size={20} />
    </Pressable>
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
        <Kart>
          <Satir style={{ justifyContent: 'space-between' }}>
            <Etiket>{t('bugun.okunanKitap', { n: sira + 1, toplam: kitaplar.length })}</Etiket>
            <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} tintColor={r.soluk} size={18} />
          </Satir>
          <Yazi tur="baslik">{k.kitap_ad}</Yazi>
          <Cubuk oran={k.okunan / Math.max(1, k.uzunluk)} />
          <Satir style={{ justifyContent: 'space-between' }}>
            <Yazi tur="soluk">{`${k.okunan} / ${k.uzunluk} sayfa`}</Yazi>
            <Yazi tur="soluk">{t('bugun.kalanGun', { n: i.toplam_gun - i.tamamlanan_gun })}</Yazi>
          </Satir>
          {bitis ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: r.kenar }}>
              <SymbolView name={{ ios: 'flag.checkered', android: 'flag', web: 'flag' }} tintColor={r.basari} size={16} />
              <Yazi tur="soluk">{t('bugun.programBitis', { tarih: uzunTarih(bitis) })}</Yazi>
            </View>
          ) : null}
        </Kart>
      </Pressable>
    </Link>
  );
}

// Web'de CSS, yerelde RN'in backgroundImage desteği
function degrade(a: string, b: string) {
  const deger = `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
  return Platform.OS === 'web' ? ({ backgroundImage: deger } as object) : ({ experimental_backgroundImage: deger } as object);
}

function GerideGun({ programId, gun, onIsaretle }: { programId: string; gun: { gun_no: number | null; tarih: string; durum: string }; onIsaretle: () => void }) {
  const r = useRenkler();
  const aralik = useQuery({
    queryKey: ['gun_araligi', programId, gun.gun_no],
    queryFn: () => gunAraligi(programId, gun.gun_no!),
  });
  return (
    <Pressable accessibilityRole="button" onPress={onIsaretle} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 }}>
      <View style={{ flex: 1 }}>
        <Yazi>{`Gün ${gun.gun_no} · ${kisaTarih(gun.tarih)}${gun.durum === 'kismi' ? ` · ${t('cizelge.kismi')}` : ''}`}</Yazi>
        <Yazi tur="soluk">{aralik.data ? aralikMetni(aralik.data) : ' '}</Yazi>
      </View>
      <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: r.kenar }} />
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
      {p.data?.map((pr) => (
        <Kart key={pr.id}>
          <Yazi tur="baslik">{pr.ad}</Yazi>
          <Yazi tur="soluk">{t('genel.sayfa', { n: pr.gunluk_sayfa })}</Yazi>
          <Buton baslik={t('bugun.programaBasla')} yukleniyor={basla.isPending} onPress={() => basla.mutate(pr.id)} />
        </Kart>
      ))}
      <Buton tur="ikincil" baslik={t('bugun.ozelProgram')} onPress={() => router.push('/program/yeni')} />
    </Ekran>
  );
}
