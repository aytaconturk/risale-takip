import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { bugunVerisi } from '@/src/api/bugun';
import { Ikon } from '@/src/components/Ikon';
import { useOturum, type Okuma } from '@/src/components/OkumaKarti';
import { Buton, Etiket, IkonDugme, rakam, tip, Yukleniyor } from '@/src/components/ui';
import { t } from '@/src/i18n';
import { sure } from '@/src/lib/bicim';
import { useDuzen } from '@/src/lib/duzen';
import { useRenkler } from '@/src/lib/tema';
import { useAktifProgram } from '@/src/lib/useAktifProgram';

// Tam ekran zamanlayıcı + sayfa sayacı. Bugünün verisi Bugün ekranıyla aynı sorgudan gelir.
export default function Odak() {
  const r = useRenkler();
  const { kp } = useAktifProgram();
  const q = useQuery({ queryKey: ['bugun', kp?.id], queryFn: () => bugunVerisi(kp!), enabled: !!kp });
  if (!kp || !q.data) return <View style={{ flex: 1, backgroundColor: r.zemin }}><Yukleniyor /></View>;
  const { ilerleme: i, aralik, kismiSayfa } = q.data;
  return (
    <OdakIcerik kpId={kp.id} gun={i.bugunku_gun} aralik={aralik} gunluk={kp.program?.gunluk_sayfa ?? 0}
      okundu={i.bugun_okundu} kismi={kismiSayfa} seri={i.seri} />
  );
}

function OdakIcerik(o: Okuma) {
  const r = useRenkler();
  const { genis } = useDuzen();
  const ic = useSafeAreaInsets();
  const s = useOturum(o);
  const kapat = () => (router.canGoBack() ? router.back() : router.replace('/bugun'));
  return (
    <View
      style={{
        flex: 1, backgroundColor: r.zemin,
        paddingTop: genis ? 40 : ic.top + 8, paddingHorizontal: genis ? 56 : 20,
        paddingBottom: genis ? 40 : Math.max(ic.bottom, 16) + 20,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottomWidth: r.cizgi || 1, borderBottomColor: r.kenar }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Etiket>{t('odak.baslik')}</Etiket>
          <Text style={[tip(r, 'yari'), { fontSize: 15, color: r.metin }]}>{s.baslik}</Text>
        </View>
        <IkonDugme ad="kapat" etiket={t('genel.kapat')} onPress={kapat} />
      </View>

      <View style={{ flex: 1, justifyContent: 'center', gap: 24 }}>
        <View>
          <Text style={[tip(r, 'normal'), { fontSize: 13, color: r.soluk }]}>{t('odak.sure')}</Text>
          <Text style={[tip(r, 'kalin'), rakam, { fontSize: genis ? 160 : 96, lineHeight: genis ? 160 : 100, letterSpacing: -5, color: r.metin }]}>
            {sure(s.saniye)}
          </Text>
        </View>
        <View style={{ gap: 4 }}>
          <Text style={[tip(r, 'normal'), rakam, { fontSize: 13, color: r.soluk }]}>{t('odak.okunanOzet', { n: s.toplam, toplam: o.gunluk })}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Text style={[tip(r, 'kalin'), rakam, { fontSize: 64, letterSpacing: -2.5, color: r.vurgu }]}>{s.suankiSayfa}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('odak.geri')}
              onPress={s.geri}
              style={{ width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: r.kenar, borderRadius: r.rHucre === 'daire' ? 26 : r.rButon }}>
              <Ikon ad="eksi" renk={r.metin} boyut={22} />
            </Pressable>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 2 }}>
          {Array.from({ length: o.gunluk }, (_, n) => (
            <View key={n} style={{ flex: 1, height: 10, backgroundColor: n < s.toplam ? r.vurgu : r.iz }} />
          ))}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Buton ikon="arti" baslik={t('odak.cevirdim')} style={{ minHeight: 64 }} pasif={s.toplam >= o.gunluk} onPress={s.cevir} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Buton tur="ikincil" baslik={s.dugme} style={{ flex: 1 }} onPress={s.degistir} />
          <Buton tur="ikincil" baslik={t('odak.bitir')} style={{ flex: 1 }} pasif={s.toplam === 0} yukleniyor={s.kaydet.isPending}
            onPress={async () => { await s.bitir(); kapat(); }} />
        </View>
      </View>
    </View>
  );
}
