import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Text, View } from 'react-native';

import { ilerlemeVerisi } from '@/src/api/ilerleme';
import { BolumBasligi, Cubuk, Ekran, Kolon, rakam, Serit, tip, Yukleniyor } from '@/src/components/ui';
import { t } from '@/src/i18n';
import { kisaTarih, sayi, yuzde } from '@/src/lib/bicim';
import { useRenkler } from '@/src/lib/tema';
import { useAktifProgram } from '@/src/lib/useAktifProgram';

export default function IlerlemeEkrani() {
  const r = useRenkler();
  const qc = useQueryClient();
  const { kp } = useAktifProgram();
  const q = useQuery({ queryKey: ['ilerleme', kp?.id], queryFn: () => ilerlemeVerisi(kp!), enabled: !!kp });
  if (!q.data || !kp) return <Yukleniyor />;
  const { ilerleme: i, bitis, kitaplar } = q.data;
  const sira = kitaplar.findIndex((k) => k.okunan < k.uzunluk);

  return (
    <Ekran
      ust={t('ilerleme.baslik')}
      baslik={t('bugun.kulliyat')}
      alt={t('ilerleme.ozet', { kitap: kitaplar.length, sayfa: sayi(i.toplam_sayfa), gun: i.toplam_gun })}
      yenile={() => qc.invalidateQueries()}>
      <Kolon>
        <View style={{ gap: 4 }}>
          <Text style={[tip(r, 'kalin'), rakam, { fontSize: 88, lineHeight: 88, letterSpacing: -4.4, color: r.vurgu }]}>{yuzde(i.yuzde)}</Text>
          <Text style={[tip(r, 'normal'), { fontSize: 15, color: r.soluk }]}>
            {t('ilerleme.okunanOzet', { toplam: sayi(i.toplam_sayfa), n: sayi(i.okunan_sayfa) })}
          </Text>
        </View>

        {/* Her parça bir kitap; genişlik sayfa sayısıyla orantılı, okunan kısım soldan dolar */}
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', height: 44, gap: 2 }}>
            {kitaplar.map((k) => (
              <View key={k.kitap_ad} accessibilityLabel={`${k.kitap_ad} ${k.okunan} / ${k.uzunluk}`}
                style={{ flexGrow: k.uzunluk, flexBasis: 0, backgroundColor: r.iz, borderRadius: r.rKucuk, overflow: 'hidden' }}>
                <View style={{ width: `${(k.okunan / Math.max(1, k.uzunluk)) * 100}%`, height: '100%', backgroundColor: r.metin }} />
              </View>
            ))}
          </View>
          <Text style={[tip(r, 'normal'), { fontSize: 12, color: r.soluk }]}>{t('ilerleme.serit')}</Text>
        </View>

        <Serit sutun={3} degerBoyut={20} hucreler={[
          { etiket: t('ilerleme.okunanGun'), deger: `${i.tamamlanan_gun} / ${i.bugunku_gun}` },
          { etiket: t('bugun.seri'), deger: t('genel.gun', { n: i.seri }) },
          { etiket: t('ilerleme.kacirilan'), deger: t('genel.gun', { n: i.geride_gun }), renk: i.geride_gun > 0 ? r.kacirildi : undefined },
          { etiket: t('ilerleme.kalan'), deger: t('genel.gun', { n: i.toplam_gun - i.tamamlanan_gun }) },
          { etiket: t('ilerleme.gunluk'), deger: t('genel.sayfa', { n: kp.program?.gunluk_sayfa ?? 0 }) },
          { etiket: t('ilerleme.bitis'), deger: bitis ? kisaTarih(bitis) : t('ilerleme.duraklatmada') },
        ]} />
      </Kolon>

      <Kolon>
        <View>
          <BolumBasligi baslik={t('ilerleme.kitaplar')} sag={t('ilerleme.programSirasi')} />
          {kitaplar.map((k, n) => (
            <View key={k.kitap_ad}
              style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingVertical: 6, gap: 8, borderBottomWidth: 1, borderBottomColor: r.kenar,
                opacity: n > sira && sira >= 0 && k.okunan === 0 ? 0.55 : 1 }}>
              <Text style={[tip(r, 'normal'), rakam, { width: 24, fontSize: 12, color: r.soluk }]}>{n + 1}</Text>
              <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                <Text numberOfLines={1} style={[tip(r, 'yari'), { fontSize: 14, color: r.metin }]}>{k.kitap_ad}</Text>
                <Cubuk oran={k.okunan / Math.max(1, k.uzunluk)} kalinlik={3} />
              </View>
              <Text style={[tip(r, 'normal'), rakam, { width: 72, textAlign: 'right', fontSize: 12, color: r.soluk }]}>{`${k.okunan} / ${k.uzunluk}`}</Text>
            </View>
          ))}
        </View>
      </Kolon>
    </Ekran>
  );
}
