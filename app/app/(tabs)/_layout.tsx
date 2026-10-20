import { useQuery } from '@tanstack/react-query';
import { router, Tabs } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ilerlemeVerisi } from '@/src/api/ilerleme';
import { Ikon, type IkonAdi } from '@/src/components/Ikon';
import { Buton, Cubuk, tip } from '@/src/components/ui';
import { t, type Anahtar } from '@/src/i18n';
import { useDuzen } from '@/src/lib/duzen';
import { alfa, useRenkler } from '@/src/lib/tema';
import { useAktifProgram } from '@/src/lib/useAktifProgram';
import { useUi, type Sekme } from '@/src/store';

const SEKMELER: { ad: Sekme; ikon: IkonAdi; baslik: Anahtar }[] = [
  { ad: 'bugun', ikon: 'kitap', baslik: 'sekme.bugun' },
  { ad: 'cizelge', ikon: 'takvim', baslik: 'sekme.cizelge' },
  { ad: 'ilerleme', ikon: 'grafik', baslik: 'sekme.ilerleme' },
  { ad: 'gruplar', ikon: 'kisiler', baslik: 'sekme.ders' },
  { ad: 'notlar', ikon: 'yerimi', baslik: 'sekme.notlar' },
];

export default function SekmeLayout() {
  const { genis } = useDuzen();
  return (
    <Tabs
      tabBar={(p) => (genis ? <WebKenarMenu {...p} /> : <AltCubuk {...p} />)}
      screenOptions={{ headerShown: false, tabBarPosition: genis ? 'left' : 'bottom', tabBarHideOnKeyboard: true }}>
      {SEKMELER.map((s) => <Tabs.Screen key={s.ad} name={s.ad} options={{ title: t(s.baslik) }} />)}
    </Tabs>
  );
}

// Sekmeye basınca: odaktaysa olay yayılır (ör. kaydırma başa), değilse sekmeye geçilir
function sekmeyeGit({ state, emitter, navigateToTab }: BottomTabBarProps, i: number) {
  const key = state.routes[i].key;
  const olay = emitter.emit({ type: 'tabPress', target: key, canPreventDefault: true });
  if (i !== state.index && !olay.defaultPrevented) navigateToTab(key);
}

// Son açık sekme kalıcıdır; uygulama onunla açılır
function useSonSekme({ state }: BottomTabBarProps) {
  const sekmeSec = useUi((s) => s.sekmeSec);
  const ad = state.routes[state.index].name as Sekme;
  useEffect(() => {
    sekmeSec(ad);
  }, [ad, sekmeSec]);
}

// Yükseklik 56 + alt güvenli alan; sabit yükseklik verilmez (ana ekran çubuğunun altına taşmasın)
function AltCubuk(p: BottomTabBarProps) {
  const r = useRenkler();
  const klavye = useUi((s) => s.klavye);
  useSonSekme(p);
  if (klavye) return null;
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row', backgroundColor: r.yuzey, paddingBottom: p.insets.bottom,
        paddingLeft: p.insets.left, paddingRight: p.insets.right,
        borderTopWidth: r.dil === 'modernist' ? 2 : 1, borderTopColor: r.kenar,
      }}>
      {p.state.routes.map((route, i) => {
        const s = SEKMELER.find((x) => x.ad === route.name)!;
        const aktif = i === p.state.index;
        const renk = aktif ? r.vurgu : r.soluk;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: aktif }}
            accessibilityLabel={t(s.baslik)}
            onPress={() => sekmeyeGit(p, i)}
            style={{ flex: 1, height: 56, alignItems: 'center', justifyContent: 'center', gap: 3 }}>
            {/* Modernist imza: aktif sekmenin üstünde 3 px vurgu şerit */}
            {aktif && r.dil === 'modernist' ? <View style={{ position: 'absolute', top: -2, left: 8, right: 8, height: 3, backgroundColor: r.vurgu }} /> : null}
            <Ikon ad={s.ikon} renk={renk} boyut={24} />
            <Text numberOfLines={1} style={[tip(r, 'yari'), { fontSize: 11, color: renk }]}>{t(s.baslik)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function WebKenarMenu(p: BottomTabBarProps) {
  const r = useRenkler();
  const modernist = r.dil === 'modernist';
  useSonSekme(p);
  return (
    <View style={{ width: 240, backgroundColor: r.yuzey, borderRightWidth: 1, borderRightColor: r.kenar, paddingVertical: 24 }}>
      <View style={{ paddingHorizontal: 24, paddingBottom: 24, gap: 4 }}>
        <Text style={[tip(r, 'yari'), { fontSize: 11, letterSpacing: 1.1, color: r.vurgu }]}>{t('marka.ust').toLocaleUpperCase('tr-TR')}</Text>
        <Text style={[tip(r, 'kalin'), { fontSize: 22, letterSpacing: -0.4, color: r.metin }]}>{t('marka.ad')}</Text>
      </View>
      <View accessibilityRole="tablist" style={{ flex: 1 }}>
        {p.state.routes.map((route, i) => {
          const s = SEKMELER.find((x) => x.ad === route.name)!;
          const aktif = i === p.state.index;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: aktif }}
              onPress={() => sekmeyeGit(p, i)}
              style={({ hovered }: { hovered?: boolean }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: modernist ? 24 : 12,
                marginHorizontal: modernist ? 0 : 12, borderRadius: r.rButon,
                backgroundColor: aktif ? alfa(r.vurgu, 0.1) : hovered ? alfa(r.metin, 0.06) : 'transparent',
                borderTopWidth: modernist && i ? 2 : 0, borderTopColor: r.kenar,
              })}>
              <Ikon ad={s.ikon} renk={aktif ? r.vurgu : r.soluk} boyut={20} />
              <Text style={[tip(r, 'yari'), { fontSize: 15, color: aktif ? r.vurgu : r.metin }]}>{t(s.baslik)}</Text>
            </Pressable>
          );
        })}
      </View>
      <ProgramOzeti />
    </View>
  );
}

function ProgramOzeti() {
  const r = useRenkler();
  const { kp } = useAktifProgram();
  const q = useQuery({ queryKey: ['ilerleme', kp?.id], queryFn: () => ilerlemeVerisi(kp!), enabled: !!kp });
  const i = q.data?.ilerleme;
  return (
    <View style={{ marginHorizontal: 24, paddingTop: 16, gap: 8, borderTopWidth: 1, borderTopColor: r.kenar }}>
      {kp && i ? (
        <>
          <Text style={[tip(r, 'normal'), { fontSize: 12, color: r.soluk }]}>{t('ayarlar.program')}</Text>
          <Text style={[tip(r, 'yari'), { fontSize: 14, color: r.metin }]}>
            {`${kp.grup?.ad ?? kp.program?.ad ?? ''} · ${t('bugun.gunBasligi', { gun: i.bugunku_gun, toplam: i.toplam_gun })}`}
          </Text>
          <Cubuk oran={i.okunan_sayfa / Math.max(1, i.toplam_sayfa)} />
        </>
      ) : null}
      <Buton tur="ikincil" ikon="zil" baslik={t('ayarlar.baslik')} onPress={() => router.push('/ayarlar')} />
    </View>
  );
}
