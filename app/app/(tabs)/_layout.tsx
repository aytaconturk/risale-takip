import { Tabs } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { t } from '@/src/i18n';
import { useRenkler } from '@/src/lib/tema';

function ikon(ad: SymbolViewProps['name']) {
  return ({ color }: { color: SymbolViewProps['tintColor'] }) => <SymbolView name={ad} tintColor={color} size={24} />;
}

export default function SekmeLayout() {
  const r = useRenkler();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: r.marka,
        tabBarInactiveTintColor: r.soluk,
        tabBarStyle: { backgroundColor: r.yuzey, borderTopColor: r.kenar },
      }}>
      <Tabs.Screen name="bugun" options={{ title: t('sekme.bugun'), tabBarIcon: ikon({ ios: 'book', android: 'menu_book', web: 'menu_book' }) }} />
      <Tabs.Screen name="cizelge" options={{ title: t('sekme.cizelge'), tabBarIcon: ikon({ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }) }} />
      <Tabs.Screen name="ilerleme" options={{ title: t('sekme.ilerleme'), tabBarIcon: ikon({ ios: 'chart.bar', android: 'bar_chart', web: 'bar_chart' }) }} />
      <Tabs.Screen name="gruplar" options={{ title: t('sekme.ders'), tabBarIcon: ikon({ ios: 'person.2', android: 'group', web: 'group' }) }} />
      <Tabs.Screen name="notlar" options={{ title: t('sekme.notlar'), tabBarIcon: ikon({ ios: 'bookmark', android: 'bookmark', web: 'bookmark' }) }} />
    </Tabs>
  );
}
