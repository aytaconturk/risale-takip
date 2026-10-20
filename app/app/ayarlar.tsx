import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Platform, Text, View } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import { cikis, devamEt, duraklat, hatirlatmaKabul, hesabiSil, profilGuncelle, SAAT_DILIMLERI } from '@/src/api/ayarlar';
import { profil } from '@/src/api/giris';
import { SaatSecici } from '@/src/components/SaatSecici';
import { AltSayfa, Anahtar, Buton, Cip, IkonDugme, onayla, SayfaBasligi, SegmentSecici, Satir, tip, Yazi, Yukleniyor } from '@/src/components/ui';
import { t } from '@/src/i18n';
import { useRenkler } from '@/src/lib/tema';
import { useAktifProgram } from '@/src/lib/useAktifProgram';
import { webPushAc, webPushDurumu } from '@/src/lib/webPush';
import { useUi } from '@/src/store';

// Mobilde alttan, geniş ekranda ortada açılır
export default function Ayarlar() {
  const kapat = () => (router.canGoBack() ? router.back() : router.replace('/bugun'));
  return (
    <AltSayfa acik rota kapat={kapat}>
      <AyarlarIcerik kapat={kapat} />
    </AltSayfa>
  );
}

function AyarlarIcerik({ kapat }: { kapat: () => void }) {
  const r = useRenkler();
  const qc = useQueryClient();
  const bildir = useUi((s) => s.bildir);
  const tema = useUi((s) => s.tema);
  const temaSec = useUi((s) => s.temaSec);
  const koyu = useColorScheme() === 'dark';
  const p = useQuery({ queryKey: ['profil'], queryFn: profil });
  const { data: programlar } = useAktifProgram();
  const [saat, setSaat] = useState('21:00');
  const islem = useMutation({
    mutationFn: (f: () => Promise<void>) => f(),
    onSuccess: () => qc.invalidateQueries(),
    onError: () => bildir(t('genel.hata')),
  });

  if (!p.data) return <Yukleniyor />;
  const k = p.data;
  const saatler = k.hatirlatma_saatleri.map((s) => s.slice(0, 5));
  const saatlerKaydet = (yeni: string[]) => islem.mutate(() => profilGuncelle({ hatirlatma_saatleri: yeni.sort() }));
  const saatEkle = () => !saatler.includes(saat) && saatlerKaydet([...saatler, saat]);

  return (
    <>
      <SayfaBasligi baslik={t('ayarlar.baslik')} alt={`${k.ad} ${k.soyad ?? ''} · ${k.telefon ?? ''}`} kapat={kapat} />

      <Bolum baslik={t('ayarlar.gorunum')}>
        <SatirAyar baslik={t('ayarlar.temaSistem')} alt={t('ayarlar.temaSistemAlt')}>
          <Anahtar etiket={t('ayarlar.temaSistem')} deger={tema === 'sistem'} degistir={(v) => temaSec(v ? 'sistem' : koyu ? 'koyu' : 'acik')} />
        </SatirAyar>
        <View style={{ paddingTop: 12 }}>
          <SegmentSecici
            secenekler={[{ deger: 'acik', etiket: t('ayarlar.temaAcik') }, { deger: 'koyu', etiket: t('ayarlar.temaKoyuKisa') }]}
            deger={koyu ? 'koyu' : 'acik'}
            degistir={temaSec}
          />
        </View>
      </Bolum>

      <Bolum baslik={t('ayarlar.hatirlatici')} cizgili>
        <SatirAyar baslik={t('ayarlar.gunluk')} alt={t('ayarlar.gunlukAcik')}>
          <Anahtar etiket={t('ayarlar.gunluk')} deger={k.hatirlatma_acik} degistir={(v) => islem.mutate(() => profilGuncelle({ hatirlatma_acik: v }))} />
        </SatirAyar>
        {programlar?.filter((g) => g.grup_id).map((g) => (
          <SatirAyar key={g.id} baslik={t('ayarlar.gruptanHatirlatma')} alt={t('ayarlar.gruptanHatirlatmaAcik', { grup: g.grup?.ad ?? '' })}>
            <Anahtar etiket={t('ayarlar.gruptanHatirlatmaAcik', { grup: g.grup?.ad ?? '' })} deger={g.hatirlatma_kabul}
              degistir={(v) => islem.mutate(() => hatirlatmaKabul(g.id, v))} />
          </SatirAyar>
        ))}
        {saatler.map((s) => (
          <SatirAyar key={s} baslik={s}>
            <IkonDugme ad="kapat" etiket={t('ayarlar.saatSil', { saat: s })} onPress={() => saatlerKaydet(saatler.filter((x) => x !== s))} />
          </SatirAyar>
        ))}
        <SatirAyar baslik={t('ayarlar.saatEkle')}>
          <SaatSecici etiket={t('ayarlar.saatEkle')} deger={saat} degistir={setSaat} />
          <IkonDugme ad="arti" etiket={t('ayarlar.saatEkle')} onPress={saatEkle} />
        </SatirAyar>
        <View style={{ gap: 8, paddingVertical: 12 }}>
          <Yazi tur="soluk">{t('ayarlar.saatDilimi')}</Yazi>
          <Satir style={{ flexWrap: 'wrap' }}>
            {SAAT_DILIMLERI.map((s) => (
              <Cip key={s} baslik={s.split('/')[1].replace('_', ' ')} secili={k.saat_dilimi === s} onPress={() => islem.mutate(() => profilGuncelle({ saat_dilimi: s }))} />
            ))}
          </Satir>
        </View>
        {Platform.OS === 'web' ? <WebBildirim /> : null}
      </Bolum>

      <Bolum baslik={t('ayarlar.program')}>
        {programlar?.map((g) => (
          <View key={g.id} style={{ gap: 8 }}>
            <Text style={[tip(r, 'yari'), { fontSize: 14, color: r.metin }]}>{g.grup?.ad ?? g.program?.ad}</Text>
            {g.durum === 'duraklatildi' ? (
              <Buton tur="ikincil" baslik={t('ayarlar.devam')} onPress={() => islem.mutate(() => devamEt(g.id))} />
            ) : (
              <Buton tur="ikincil" baslik={t('ayarlar.duraklat')} onPress={() => islem.mutate(() => duraklat(g.id))} />
            )}
          </View>
        ))}
        <Buton tur="ikincil" ikon="arti" baslik={t('ayarlar.yeniProgram')} onPress={() => router.push('/program/yeni')} />
      </Bolum>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: r.cizgi || 1, borderTopColor: r.kenar }}>
        <Buton tur="hayalet" baslik={t('ayarlar.cikis')} onPress={cikis} />
        <Buton tur="hayalet" renk={r.kacirildi} baslik={t('ayarlar.hesapSil')} onPress={async () => (await onayla(t('ayarlar.hesapSilOnay'))) && hesabiSil()} />
      </View>
    </>
  );
}

function Bolum({ baslik, cizgili, children }: { baslik: string; cizgili?: boolean; children: ReactNode }) {
  const r = useRenkler();
  return (
    <View style={{ gap: 8 }}>
      <Text style={[tip(r, 'yari'), { fontSize: 12, letterSpacing: 1, color: r.soluk }]}>{baslik.toLocaleUpperCase('tr-TR')}</Text>
      <View style={cizgili ? { borderTopWidth: r.cizgi || 1, borderTopColor: r.metin } : { gap: 12 }}>{children}</View>
    </View>
  );
}

function SatirAyar({ baslik, alt, children }: { baslik: string; alt?: string; children: ReactNode }) {
  const r = useRenkler();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: r.kenar }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[tip(r, 'yari'), { fontSize: 15, color: r.metin }]}>{baslik}</Text>
        {alt ? <Text style={[tip(r, 'normal'), { fontSize: 13, color: r.soluk }]}>{alt}</Text> : null}
      </View>
      {children}
    </View>
  );
}

// PWA: bildirim izni ve abonelik. iPhone'da yalnızca ana ekrana eklenmiş uygulamada çalışır.
function WebBildirim() {
  const r = useRenkler();
  const bildir = useUi((s) => s.bildir);
  const d = useQuery({ queryKey: ['webPush'], queryFn: webPushDurumu });
  const ac = useMutation({ mutationFn: webPushAc, onSettled: () => d.refetch(), onError: () => bildir(t('ayarlar.bildirimHata')) });
  if (!d.data) return null;
  if (d.data === 'kapali') return <Buton tur="ikincil" ikon="zil" baslik={t('ayarlar.bildirimAc')} yukleniyor={ac.isPending} onPress={() => ac.mutate()} />;
  const metin = ({ acik: 'ayarlar.bildirimAcik', anaEkran: 'ayarlar.bildirimAnaEkran', engelli: 'ayarlar.bildirimEngelli', desteklenmiyor: 'ayarlar.bildirimYok' } as const)[d.data];
  return <Yazi tur="soluk" renk={d.data === 'acik' ? r.metin : undefined}>{t(metin)}</Yazi>;
}
