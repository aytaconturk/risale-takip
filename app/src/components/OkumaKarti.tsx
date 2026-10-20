import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { cetvelDokunus, oturumSayfasi, sayfaKaydet } from '@/src/api/bugun';
import { Ikon, type IkonAdi } from '@/src/components/Ikon';
import { AltSayfa, Buton, Cubuk, Etiket, Kart, rakam, SayfaBasligi, Stepper, tip } from '@/src/components/ui';
import { t } from '@/src/i18n';
import { aralikMetni, sayfaNo, sure, type Aralik } from '@/src/lib/bicim';
import { useDuzen } from '@/src/lib/duzen';
import { useOdak, useOdakZamanlayici } from '@/src/lib/odak';
import { useRenkler, zeminStili } from '@/src/lib/tema';
import { useUi } from '@/src/store';

export type Okuma = { kpId: string; gun: number; aralik: Aralik[]; gunluk: number; okundu: boolean; kismi: number | null; seri: number };

// Okunan sayfa sayısını kaydeder (tam / kısmi / kaldır), önbelleği tazeler ve bildirim gösterir.
export function useOkumaKaydi({ kpId, gun, gunluk, seri }: Okuma) {
  const qc = useQueryClient();
  const bildir = useUi((s) => s.bildir);
  return useMutation({
    mutationFn: async (n: number) => {
      await sayfaKaydet(kpId, gun, n, gunluk);
      return n;
    },
    onSuccess: (n) => {
      qc.invalidateQueries();
      if (n >= gunluk) {
        if (Platform.OS === 'web') navigator.vibrate?.(10);
        else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        bildir(t('bugun.gunTamam', { gun, seri: seri + 1 }));
      } else bildir(n <= 0 ? t('bugun.isaretKaldirildi') : t('bugun.kismiKaydedildi', { n, toplam: gunluk }));
    },
    onError: () => bildir(t('genel.hata')),
  });
}

// Odak modu ve oturum kartının ortak durumu
export function useOturum(o: Okuma) {
  const kaydet = useOkumaKaydi(o);
  const { calisiyor, saniye, okunan, baslangicOkunan, hazirla, cevir, geri, calistir, sifirla } = useOdak();
  useOdakZamanlayici();
  const anahtar = `${o.kpId}:${o.gun}`;
  const baslangic = o.okundu ? o.gunluk : (o.kismi ?? 0);
  useEffect(() => {
    hazirla(anahtar, baslangic);
  }, [anahtar, baslangic, hazirla]);
  const toplam = oturumSayfasi(baslangicOkunan, okunan, o.gunluk);
  return {
    calisiyor, saniye, okunan, toplam, kaydet,
    baslik: aralikMetni(o.aralik),
    suankiSayfa: sayfaNo(o.aralik, Math.min(toplam, o.gunluk - 1)),
    cevir: () => cevir(o.gunluk),
    geri,
    dugme: calisiyor ? t('odak.duraklat') : saniye > 0 ? t('odak.devam') : t('odak.baslat'),
    degistir: () => calistir(!calisiyor),
    bitir: async () => {
      calistir(false);
      if (toplam > 0) await kaydet.mutateAsync(toplam);
      sifirla();
    },
  };
}

export function OkumaKarti(o: Okuma) {
  const v = useDuzen().bugunVaryant;
  if (v === 'cetvel') return <CetvelKarti {...o} />;
  if (v === 'oturum') return <OturumKarti {...o} />;
  return <VurguKarti {...o} />;
}

const BEYAZ_KENAR = 'rgba(255,255,255,0.6)';

function VurguKarti(o: Okuma) {
  const r = useRenkler();
  const kaydet = useOkumaKaydi(o);
  const [kismiAcik, setKismiAcik] = useState(false);
  const beyaz = (a: 'kalin' | 'yari' | 'normal', boyut: number, ek?: object) => [tip(r, a), { color: '#fff', fontSize: boyut }, ek];
  return (
    <View style={[zeminStili(r.vurguZemin), { borderRadius: r.rKart, boxShadow: r.vurguGolge, padding: 24, gap: 16 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <Text style={beyaz('yari', 12, { letterSpacing: 1.2 })}>{t('bugun.bugunkuOkuma').toLocaleUpperCase('tr-TR')}</Text>
        <Text style={beyaz('kalin', 12, { borderWidth: 1, borderColor: BEYAZ_KENAR, borderRadius: r.rHap, paddingHorizontal: 10, paddingVertical: 4 })}>
          {t('genel.sayfa', { n: o.gunluk })}
        </Text>
      </View>
      {o.aralik.map((a) => (
        <View key={a.kitap_ad}>
          <Text style={beyaz('kalin', 30, { lineHeight: 32, letterSpacing: -0.6 })}>{a.kitap_ad}</Text>
          <Text style={[...beyaz('kalin', 64, { lineHeight: 64, letterSpacing: -2.5, flexShrink: 1 }), rakam]}>{`${a.bas_sayfa}–${a.son_sayfa}`}</Text>
        </View>
      ))}
      {o.kismi && !o.okundu ? (
        <View style={{ gap: 6 }}>
          <Cubuk oran={o.kismi / o.gunluk} renk="#fff" zemin="rgba(255,255,255,0.3)" />
          <Text style={[...beyaz('yari', 13), rakam]}>{t('bugun.kismiOkundu', { n: o.kismi, toplam: o.gunluk })}</Text>
        </View>
      ) : null}
      {o.okundu ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => kaydet.mutate(0)}
          style={({ pressed }) => ({
            flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingHorizontal: 12, borderRadius: r.rButon,
            backgroundColor: pressed ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: BEYAZ_KENAR,
          })}>
          <View style={{ width: 28, height: 28, borderRadius: r.rHap === 999 ? 14 : 0, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <Ikon ad="tik" renk={r.vurguButonYazi} boyut={18} kalinlik={3} />
          </View>
          <Text style={beyaz('yari', 15, { flex: 1 })}>{t('bugun.okundu')}</Text>
        </Pressable>
      ) : (
        <>
          <Buton tur="beyaz" ikon="tik" buyuk baslik={t('bugun.okudum')} yukleniyor={kaydet.isPending} onPress={() => kaydet.mutate(o.gunluk)} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {o.gunluk > 1 ? <CerceveButon baslik={t('bugun.kismen')} onPress={() => setKismiAcik(true)} /> : null}
            <CerceveButon ikon="zamanlayici" baslik={t('bugun.odakModu')} onPress={() => router.push('/odak')} />
          </View>
        </>
      )}
      <KismiSayfa acik={kismiAcik} kapat={() => setKismiAcik(false)} okuma={o} />
    </View>
  );
}

// Vurgu kartı içinde beyaz çerçeveli şeffaf buton
function CerceveButon({ baslik, ikon, onPress }: { baslik: string; ikon?: IkonAdi; onPress: () => void }) {
  const r = useRenkler();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: r.butonHiza, gap: 8, paddingHorizontal: 14,
        borderRadius: r.rButon, borderWidth: 1, borderColor: BEYAZ_KENAR, backgroundColor: pressed ? 'rgba(255,255,255,0.14)' : 'transparent',
      })}>
      {ikon ? <Ikon ad={ikon} renk="#fff" boyut={18} /> : null}
      <Text style={[tip(r, 'yari'), { color: '#fff', fontSize: 15, flexShrink: 1 }]}>{baslik}</Text>
    </Pressable>
  );
}

export function KismiSayfa({ acik, kapat, okuma: o }: { acik: boolean; kapat: () => void; okuma: Okuma }) {
  const r = useRenkler();
  const kaydet = useOkumaKaydi(o);
  const ust = o.gunluk - 1;
  const [n, setN] = useState(Math.min(o.kismi ?? 10, ust));
  useEffect(() => {
    if (acik) setN(Math.max(1, Math.min(o.kismi ?? 10, ust)));
  }, [acik, o.kismi, ust]);
  return (
    <AltSayfa acik={acik} kapat={kapat}>
      <SayfaBasligi baslik={t('bugun.kismiBaslik')} alt={`${aralikMetni(o.aralik)} · ${t('genel.sayfa', { n: o.gunluk })}`} kapat={kapat} />
      <Stepper etiket={t('bugun.kismiBaslik')} buyuk deger={n} azalt={() => setN(Math.max(1, n - 1))} artir={() => setN(Math.min(ust, n + 1))} />
      <Text style={[tip(r, 'normal'), rakam, { fontSize: 14, color: r.soluk }]}>
        {t('bugun.kismiIpucu', { bas: sayfaNo(o.aralik, 0), son: sayfaNo(o.aralik, n - 1), kalan: o.gunluk - n })}
      </Text>
      <Buton buyuk baslik={t('genel.kaydet')} yukleniyor={kaydet.isPending}
        onPress={() => kaydet.mutate(n, { onSuccess: kapat })} />
    </AltSayfa>
  );
}

function CetvelKarti(o: Okuma) {
  const r = useRenkler();
  const kaydet = useOkumaKaydi(o);
  const mevcut = o.okundu ? o.gunluk : (o.kismi ?? 0);
  const ilk = o.aralik[0];
  return (
    <Kart cizgili style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Etiket>{t('bugun.bugunkuOkuma')}</Etiket>
        <Text style={[tip(r, 'yari'), rakam, { fontSize: 13, color: r.soluk }]}>{t('bugun.sayfaSayac', { n: mevcut, toplam: o.gunluk })}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <Text style={[tip(r, 'kalin'), { fontSize: 32, color: r.metin, letterSpacing: -0.6 }]}>{ilk?.kitap_ad}</Text>
        <Text style={[tip(r, 'normal'), rakam, { fontSize: 18, color: r.soluk }]}>{aralikMetni(o.aralik).slice((ilk?.kitap_ad.length ?? 0) + 1)}</Text>
      </View>
      {/* 10 sütun; son satır boş hücrelerle tamamlanır */}
      {Array.from({ length: Math.ceil(o.gunluk / 10) }, (_, satir) => (
        <View key={satir} style={{ flexDirection: 'row', gap: 4 }}>
        {Array.from({ length: 10 }, (_, j) => {
          const i = satir * 10 + j;
          const dolu = i < mevcut;
          if (i >= o.gunluk) return <View key={i} style={{ flex: 1 }} />;
          return (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={t('bugun.sayfaSayac', { n: i + 1, toplam: o.gunluk })}
              accessibilityState={{ selected: dolu }}
              onPress={() => kaydet.mutate(cetvelDokunus(mevcut, i))}
              style={{
                flex: 1, aspectRatio: 3 / 4, justifyContent: 'flex-end', padding: 3,
                borderRadius: 6, borderWidth: 2,
                borderColor: dolu ? r.okundu : r.iz, backgroundColor: dolu ? r.okundu : 'transparent',
              }}>
              <Text style={[tip(r, 'yari'), rakam, { fontSize: 10, color: dolu ? r.okunduYazi : r.soluk }]}>{sayfaNo(o.aralik, i)}</Text>
            </Pressable>
          );
        })}
        </View>
      ))}
      <Text style={[tip(r, 'normal'), { fontSize: 13, color: r.soluk }]}>{t(mevcut >= o.gunluk ? 'bugun.tamamlandiKisa' : 'bugun.cetvelIpucu')}</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {o.okundu ? (
          <Buton tur="ikincil" baslik={t('bugun.okunduGeriAl')} style={{ flex: 1 }} onPress={() => kaydet.mutate(0)} />
        ) : (
          <Buton buyuk baslik={t('bugun.tumunuOkudum')} style={{ flex: 1 }} yukleniyor={kaydet.isPending} onPress={() => kaydet.mutate(o.gunluk)} />
        )}
        <Buton tur="ikincil" ikon="zamanlayici" baslik={t('bugun.odakModu')} onPress={() => router.push('/odak')} />
      </View>
    </Kart>
  );
}

function OturumKarti(o: Okuma) {
  const r = useRenkler();
  const s = useOturum(o);
  const bolum = { padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: r.kenar } as const;
  const deger = (etiket: string, metin: string) => (
    <View style={{ flex: 1, gap: 4 }}>
      <Text style={[tip(r, 'normal'), { fontSize: 12, color: r.soluk }]}>{etiket}</Text>
      <Text style={[tip(r, 'kalin'), rakam, { fontSize: 44, color: r.metin, letterSpacing: -1 }]}>{metin}</Text>
    </View>
  );
  return (
    <Kart cizgili style={{ padding: 0, gap: 0 }}>
      <View style={{ padding: 16, gap: 4 }}>
        <Etiket>{t('odak.oturum')}</Etiket>
        <Text style={[tip(r, 'kalin'), { fontSize: 24, color: r.metin }]}>{s.baslik}</Text>
      </View>
      <View style={[bolum, { flexDirection: 'row' }]}>
        {deger(t('odak.sure'), sure(s.saniye))}
        {deger(t('odak.suankiSayfa'), String(s.suankiSayfa))}
      </View>
      <Cubuk oran={s.toplam / o.gunluk} />
      <View style={bolum}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('odak.geri')}
            onPress={s.geri}
            style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: r.kenar, borderRadius: r.rHucre === 'daire' ? 24 : r.rButon }}>
            <Ikon ad="eksi" renk={r.metin} />
          </Pressable>
          <Buton tur="ikincil" ikon="arti" baslik={t('odak.cevirdim')} style={{ flex: 1 }} pasif={s.toplam >= o.gunluk} onPress={s.cevir} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Buton baslik={s.dugme} style={{ flex: 1 }} onPress={s.degistir} />
          <Buton tur="ikincil" baslik={t('odak.bitir')} style={{ flex: 1 }} pasif={s.toplam === 0} yukleniyor={s.kaydet.isPending} onPress={s.bitir} />
        </View>
        <Text style={[tip(r, 'normal'), rakam, { fontSize: 13, color: r.soluk }]}>{t('odak.ipucu', { n: s.toplam, toplam: o.gunluk })}</Text>
      </View>
    </Kart>
  );
}
