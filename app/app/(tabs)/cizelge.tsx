import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { gunAraligi, gunuIsaretle, isaretiKaldir } from '@/src/api/bugun';
import { ayOzeti, takvim, type GunDurumu } from '@/src/api/cizelge';
import { GunDairesi, gunStili } from '@/src/components/GunDairesi';
import { Buton, Ekran, Kart, Satir, Yazi, Yukleniyor } from '@/src/components/ui';
import { t } from '@/src/i18n';
import { aralikMetni, ayAraligi, ayBasligi, gunNumarasi, KISA_GUNLER, uzunTarih } from '@/src/lib/bicim';
import { useRenkler } from '@/src/lib/tema';
import { useAktifProgram, useBugun } from '@/src/lib/useAktifProgram';
import { useUi } from '@/src/store';

const ACIKLAMA = ['okundu', 'telafi', 'kismi', 'kacirildi', 'duraklatma'] as const;

export default function Cizelge() {
  const r = useRenkler();
  const qc = useQueryClient();
  const bildir = useUi((s) => s.bildir);
  const { kp } = useAktifProgram();
  const bugun = useBugun();
  const [kaydir, setKaydir] = useState(0);
  const [secili, setSecili] = useState<{ tarih: string; gun_no: number; durum: GunDurumu } | null>(null);

  const ay = bugun ? ayAraligi(bugun, kaydir) : null;
  const q = useQuery({
    queryKey: ['takvim', kp?.id, ay?.bas],
    queryFn: () => takvim(kp!.id, ay!.bas, ay!.son),
    enabled: !!kp && !!ay,
  });
  const aralik = useQuery({
    queryKey: ['gun_araligi', kp?.program_id, secili?.gun_no],
    queryFn: () => gunAraligi(kp!.program_id, secili!.gun_no),
    enabled: !!secili,
  });
  const islem = useMutation({
    mutationFn: (f: () => Promise<void>) => f(),
    onSuccess: () => { setSecili(null); qc.invalidateQueries(); },
    onError: () => bildir(t('genel.hata')),
  });

  if (!kp || !ay || !q.data) return <Yukleniyor />;
  // takvim() yalnızca programın başladığı günden itibaren satır döner; ızgara ayın tüm günlerini gösterir
  const gunler = Array.from({ length: gunNumarasi(ay.son) }, (_, n) => {
    const tarih = `${ay.bas.slice(0, 8)}${String(n + 1).padStart(2, '0')}`;
    return q.data.find((g) => g.tarih === tarih) ?? { tarih, gun_no: null, durum: 'bos' as GunDurumu };
  });
  const ozet = ayOzeti(q.data, kp.program?.gunluk_sayfa ?? 0);

  return (
    <Ekran baslik={t('cizelge.baslik')}>
      <Kart>
        <Satir style={{ justifyContent: 'space-between' }}>
          <Buton tur="ikincil" baslik="‹" onPress={() => setKaydir(kaydir - 1)} />
          <Yazi tur="baslik">{ayBasligi(ay.bas)}</Yazi>
          <Buton tur="ikincil" baslik="›" onPress={() => setKaydir(kaydir + 1)} />
        </Satir>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {KISA_GUNLER.map((g) => (
            <View key={g} style={{ width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4 }}><Yazi tur="soluk">{g}</Yazi></View>
          ))}
          {Array.from({ length: ay.bosluk }, (_, n) => <View key={`b${n}`} style={{ width: `${100 / 7}%` }} />)}
          {gunler.map((g) => (
            <Pressable
              key={g.tarih}
              accessibilityRole="button"
              disabled={g.gun_no == null}
              onPress={() => setSecili({ tarih: g.tarih, gun_no: g.gun_no!, durum: g.durum })}
              style={{ width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4 }}>
              <GunDairesi durum={g.durum} metin={String(gunNumarasi(g.tarih))} r={r} boyut={36} />
            </Pressable>
          ))}
        </View>
        <Satir style={{ flexWrap: 'wrap', gap: 12 }}>
          {ACIKLAMA.map((d) => (
            <Satir key={d} style={{ gap: 4 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: gunStili(d, r).kenar ?? gunStili(d, r).bg }} />
              <Yazi tur="soluk">{t(`cizelge.${d}`)}</Yazi>
            </Satir>
          ))}
        </Satir>
      </Kart>

      {secili ? (
        <Kart>
          <Yazi tur="soluk">{t('cizelge.gunSayfa', { gun: secili.gun_no, n: kp.program?.gunluk_sayfa ?? 0 })}</Yazi>
          <Yazi tur="baslik">{uzunTarih(secili.tarih)}</Yazi>
          <Yazi>{aralik.data ? aralikMetni(aralik.data) : ' '}</Yazi>
          {secili.durum === 'okundu' || secili.durum === 'telafi' ? (
            <Buton tur="ikincil" baslik={t('cizelge.gerial')} onPress={() => islem.mutate(() => isaretiKaldir(kp.id, secili.gun_no))} />
          ) : secili.durum !== 'gelecek' ? (
            <Buton baslik={t('bugun.okudum')} yukleniyor={islem.isPending} onPress={() => islem.mutate(() => gunuIsaretle(kp.id, secili.gun_no))} />
          ) : null}
        </Kart>
      ) : null}

      <Kart>
        <Yazi tur="soluk">{t('cizelge.buAy')}</Yazi>
        <Satir style={{ gap: 24 }}>
          <Yazi tur="baslik">{t('genel.gun', { n: ozet.okunanGun })}</Yazi>
          <Yazi tur="baslik">{t('genel.sayfa', { n: ozet.sayfa })}</Yazi>
        </Satir>
      </Kart>
    </Ekran>
  );
}
