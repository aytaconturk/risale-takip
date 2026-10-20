import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { ilerlemeVerisi } from '@/src/api/ilerleme';
import type { SymbolViewProps } from 'expo-symbols';

import { Cubuk, Ekran, Etiket, IkonKutu, Kart, Satir, Yazi, Yukleniyor } from '@/src/components/ui';
import { t } from '@/src/i18n';
import { uzunTarih, yuzde } from '@/src/lib/bicim';
import { useRenkler } from '@/src/lib/tema';
import { useAktifProgram } from '@/src/lib/useAktifProgram';

type Ikon = { ad: SymbolViewProps['name']; renk: string; zemin: string };

function Kutu({ etiket, deger, alt, ikon }: { etiket: string; deger: ReactNode; alt?: string; ikon: Ikon }) {
  return (
    <Kart style={{ flex: 1 }}>
      <IkonKutu {...ikon} boyut={32} />
      <Yazi tur="soluk">{etiket}</Yazi>
      <Yazi tur="buyuk">{deger}</Yazi>
      {alt ? <Yazi tur="soluk">{alt}</Yazi> : null}
    </Kart>
  );
}

export default function IlerlemeEkrani() {
  const r = useRenkler();
  const { kp } = useAktifProgram();
  const q = useQuery({ queryKey: ['ilerleme', kp?.id], queryFn: () => ilerlemeVerisi(kp!), enabled: !!kp });
  if (!q.data) return <Yukleniyor />;
  const { ilerleme: i, bitis, kitaplar } = q.data;
  const ik = (ios: string, web: string, renk: string, zemin: string): Ikon =>
    ({ ad: { ios, android: web, web } as SymbolViewProps['name'], renk, zemin });

  return (
    <Ekran baslik={t('ilerleme.baslik')} alt={kp?.grup?.ad ?? kp?.program?.ad}>
      <Satir style={{ alignItems: 'stretch' }}>
        <Kutu ikon={ik('book.fill', 'menu_book', r.marka, r.markaAcik)} etiket={t('ilerleme.okunanSayfa')} deger={i.okunan_sayfa}
          alt={t('ilerleme.sayfaninYuzde', { toplam: i.toplam_sayfa, yuzde: yuzde(i.yuzde) })} />
        <Kutu ikon={ik('checkmark.circle.fill', 'task_alt', r.basari, r.basariAcik)} etiket={t('ilerleme.okunanGun')} deger={`${i.tamamlanan_gun} / ${i.bugunku_gun}`} />
      </Satir>
      <Satir style={{ alignItems: 'stretch' }}>
        <Kutu ikon={ik('flame.fill', 'local_fire_department', r.turuncu, r.turuncuAcik)} etiket={t('ilerleme.seri')} deger={t('genel.gun', { n: i.seri })} />
        <Kutu ikon={ik('clock.arrow.circlepath', 'history', r.tehlike, r.tehlikeAcik)} etiket={t('ilerleme.kacirilan')} deger={t('genel.gun', { n: i.geride_gun })} />
      </Satir>
      <Satir style={{ alignItems: 'stretch' }}>
        <Kutu ikon={ik('hourglass', 'hourglass_top', r.mor, r.morAcik)} etiket={t('ilerleme.kalan')} deger={t('genel.gun', { n: i.toplam_gun - i.tamamlanan_gun })}
          alt={t('genel.sayfa', { n: i.toplam_sayfa - i.okunan_sayfa })} />
        <Kutu ikon={ik('flag.checkered', 'flag', r.basari, r.basariAcik)} etiket={t('ilerleme.bitis')} deger={bitis ? uzunTarih(bitis) : t('ilerleme.duraklatmada')} />
      </Satir>

      <Kart>
        <Etiket>{t('program.kitaplar')}</Etiket>
        {kitaplar.map((k, n) => (
          <View key={k.kitap_ad} style={{ gap: 4, paddingVertical: 4 }}>
            <Satir style={{ justifyContent: 'space-between' }}>
              <Yazi>{`${n + 1}. ${k.kitap_ad}`}</Yazi>
              <Yazi tur="soluk">{`${k.okunan} / ${k.uzunluk}`}</Yazi>
            </Satir>
            <Cubuk oran={k.okunan / k.uzunluk} renk={k.okunan === k.uzunluk ? r.basari : r.marka} />
          </View>
        ))}
      </Kart>
    </Ekran>
  );
}
