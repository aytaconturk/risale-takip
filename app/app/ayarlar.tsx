import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Platform, View } from 'react-native';

import { cikis, devamEt, duraklat, HATIRLATMA_SAATLERI, hatirlatmaKabul, hesabiSil, profilGuncelle, SAAT_DILIMLERI } from '@/src/api/ayarlar';
import { profil } from '@/src/api/giris';
import { useColorScheme } from '@/components/useColorScheme';
import { Anahtar, Buton, Cip, Ekran, Kart, onayla, Satir, Yazi, Yukleniyor } from '@/src/components/ui';
import { t } from '@/src/i18n';
import { useRenkler } from '@/src/lib/tema';
import { useAktifProgram } from '@/src/lib/useAktifProgram';
import { webPushAc, webPushDurumu } from '@/src/lib/webPush';
import { useUi } from '@/src/store';

export default function Ayarlar() {
  const qc = useQueryClient();
  const bildir = useUi((s) => s.bildir);
  const tema = useUi((s) => s.tema);
  const temaSec = useUi((s) => s.temaSec);
  const koyu = useColorScheme() === 'dark';
  const p = useQuery({ queryKey: ['profil'], queryFn: profil });
  const { data: programlar } = useAktifProgram();
  const islem = useMutation({
    mutationFn: (f: () => Promise<void>) => f(),
    onSuccess: () => qc.invalidateQueries(),
    onError: () => bildir(t('genel.hata')),
  });

  if (!p.data) return <Yukleniyor />;
  const k = p.data;

  return (
    <Ekran baslik={t('ayarlar.baslik')} alt={`${k.ad} ${k.soyad ?? ''} · ${k.telefon ?? ''}`}>
      <Kart>
        <Yazi tur="baslik">{t('ayarlar.gorunum')}</Yazi>
        <Satir style={{ justifyContent: 'space-between' }}>
          <Yazi>{t('ayarlar.temaKoyu')}</Yazi>
          <Anahtar etiket={t('ayarlar.temaKoyu')} deger={koyu} degistir={(v) => temaSec(v ? 'koyu' : 'acik')} />
        </Satir>
        <Satir style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Yazi>{t('ayarlar.temaSistem')}</Yazi>
            <Yazi tur="soluk">{t('ayarlar.temaSistemAlt')}</Yazi>
          </View>
          <Anahtar etiket={t('ayarlar.temaSistem')} deger={tema === 'sistem'} degistir={(v) => temaSec(v ? 'sistem' : koyu ? 'koyu' : 'acik')} />
        </Satir>
      </Kart>

      <Kart>
        <Yazi tur="baslik">{t('ayarlar.hatirlatici')}</Yazi>
        {Platform.OS === 'web' ? <WebBildirim /> : null}
        <Satir style={{ justifyContent: 'space-between' }}>
          <Yazi>{t('ayarlar.gunluk')}</Yazi>
          <Anahtar etiket={t('ayarlar.gunluk')} deger={k.hatirlatma_acik}
            degistir={(v) => islem.mutate(() => profilGuncelle({ hatirlatma_acik: v }))} />
        </Satir>
        <Yazi tur="soluk">{t('ayarlar.saat')}</Yazi>
        <Satir style={{ flexWrap: 'wrap' }}>
          {HATIRLATMA_SAATLERI.map((s) => (
            <Cip key={s} baslik={s} secili={k.hatirlatma_saati?.slice(0, 5) === s} onPress={() => islem.mutate(() => profilGuncelle({ hatirlatma_saati: s }))} />
          ))}
        </Satir>
        <Yazi tur="soluk">{t('ayarlar.saatDilimi')}</Yazi>
        <Satir style={{ flexWrap: 'wrap' }}>
          {SAAT_DILIMLERI.map((s) => (
            <Cip key={s} baslik={s.split('/')[1].replace('_', ' ')} secili={k.saat_dilimi === s} onPress={() => islem.mutate(() => profilGuncelle({ saat_dilimi: s }))} />
          ))}
        </Satir>
      </Kart>

      {programlar?.some((g) => g.grup_id) ? (
        <Kart>
          <Yazi tur="baslik">{t('ayarlar.gruptanHatirlatma')}</Yazi>
          {programlar.filter((g) => g.grup_id).map((g) => (
            <Satir key={g.id} style={{ justifyContent: 'space-between' }}>
              <Yazi>{t('ayarlar.gruptanHatirlatmaAcik', { grup: g.grup?.ad ?? '' })}</Yazi>
              <Anahtar etiket={g.grup?.ad ?? ''} deger={g.hatirlatma_kabul} degistir={(v) => islem.mutate(() => hatirlatmaKabul(g.id, v))} />
            </Satir>
          ))}
        </Kart>
      ) : null}

      <Kart>
        <Yazi tur="baslik">{t('ayarlar.ara')}</Yazi>
        {programlar?.map((g) => (
          <Satir key={g.id} style={{ justifyContent: 'space-between' }}>
            <Yazi>{g.grup?.ad ?? g.program?.ad}</Yazi>
            {g.durum === 'duraklatildi' ? (
              <Buton baslik={t('ayarlar.devam')} onPress={() => islem.mutate(() => devamEt(g.id))} />
            ) : (
              <Buton tur="ikincil" baslik={t('ayarlar.duraklat')} onPress={() => islem.mutate(() => duraklat(g.id))} />
            )}
          </Satir>
        ))}
        <Buton tur="ikincil" baslik={t('ayarlar.yeniProgram')} onPress={() => router.push('/program/yeni')} />
      </Kart>

      <Buton tur="ikincil" baslik={t('ayarlar.cikis')} onPress={cikis} />
      <Buton tur="tehlike" baslik={t('ayarlar.hesapSil')} onPress={async () => (await onayla(t('ayarlar.hesapSilOnay'))) && hesabiSil()} />
    </Ekran>
  );
}

// PWA: bildirim izni ve abonelik. iPhone'da yalnızca ana ekrana eklenmiş uygulamada çalışır.
function WebBildirim() {
  const r = useRenkler();
  const bildir = useUi((s) => s.bildir);
  const d = useQuery({ queryKey: ['webPush'], queryFn: webPushDurumu });
  const ac = useMutation({ mutationFn: webPushAc, onSettled: () => d.refetch(), onError: () => bildir(t('ayarlar.bildirimHata')) });
  if (!d.data) return null;
  if (d.data === 'kapali') return <Buton baslik={t('ayarlar.bildirimAc')} yukleniyor={ac.isPending} onPress={() => ac.mutate()} />;
  const metin = ({ acik: 'ayarlar.bildirimAcik', anaEkran: 'ayarlar.bildirimAnaEkran', engelli: 'ayarlar.bildirimEngelli', desteklenmiyor: 'ayarlar.bildirimYok' } as const)[d.data];
  return <Yazi tur={d.data === 'acik' ? undefined : 'soluk'} renk={d.data === 'acik' ? r.basari : undefined}>{t(metin)}</Yazi>;
}
