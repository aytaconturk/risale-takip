import { Archivo_400Regular, Archivo_600SemiBold, Archivo_800ExtraBold, useFonts } from '@expo-google-fonts/archivo';
import type { Session } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Keyboard, Platform, View } from 'react-native';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { profil } from '@/src/api/giris';
import { AdFormu } from '@/src/components/GirisFormu';
import { Bildirim } from '@/src/components/ui';
import { t } from '@/src/i18n';
import { pushKaydet } from '@/src/lib/bildirim';
import { gorunurAlaniIzle } from '@/src/lib/gorunurAlan';
import { swKaydet } from '@/src/lib/webPush';
import { supabase } from '@/src/lib/supabase';
import { useRenkler } from '@/src/lib/tema';
import { useUi } from '@/src/store';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();
if (Platform.OS === 'web') {
  swKaydet(() => useUi.getState().bildir(t('genel.yeniSurum')));
  gorunurAlaniIzle();
} else {
  Keyboard.addListener('keyboardDidShow', () => useUi.getState().klavyeSec(true));
  Keyboard.addListener('keyboardDidHide', () => useUi.getState().klavyeSec(false));
}

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } });

export default function KokLayout() {
  const [oturum, setOturum] = useState<Session | null | undefined>(undefined);
  const [fontHazir] = useFonts({ Archivo_400Regular, Archivo_600SemiBold, Archivo_800ExtraBold });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setOturum(data.session));
    const { data } = supabase.auth.onAuthStateChange((_olay, s) => {
      setOturum(s);
      if (!s) qc.clear();
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (oturum !== undefined && fontHazir) SplashScreen.hideAsync();
  }, [oturum, fontHazir]);

  useEffect(() => {
    if (oturum) pushKaydet();
  }, [oturum]);

  // Font hazır olana kadar SplashScreen açık kalır; sistem fontundan Archivo'ya atlama görünmez
  if (oturum === undefined || !fontHazir) return null;
  return (
    // viewport-fit=cover sayesinde webde de gerçek güvenli alan değerleri ölçülür
    <SafeAreaProvider initialMetrics={Platform.OS === 'web' ? undefined : initialWindowMetrics}>
      <QueryClientProvider client={qc}>
        <Kok oturumVar={!!oturum} />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

// Tüm katmanlar (alt sayfa, toast) bu kökün içinde position: absolute; position: fixed kullanılmaz
function Kok({ oturumVar }: { oturumVar: boolean }) {
  const r = useRenkler();
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    // Android durum çubuğu, iOS açılış/geçiş rengi ve odak çerçevesi temayla birlikte değişir
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', r.zemin);
    document.documentElement.style.setProperty('--zemin', r.zemin);
    document.documentElement.style.setProperty('--vurgu', r.vurgu);
  }, [r.zemin, r.vurgu]);
  return (
    <View style={{ flex: 1, minHeight: 0, overflow: 'hidden', backgroundColor: r.zemin }}>
      <Gezinme oturumVar={oturumVar} />
      <Bildirim />
    </View>
  );
}

function Gezinme({ oturumVar }: { oturumVar: boolean }) {
  const sema = useColorScheme();
  const r = useRenkler();
  const p = useQuery({ queryKey: ['profil'], queryFn: profil, enabled: oturumVar });

  // Yeni kullanıcı (trigger ad'ı boş açar) önce adını girer
  if (oturumVar && p.data && !p.data.ad) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 16, backgroundColor: r.zemin }}>
        <AdFormu tamam={() => p.refetch()} />
      </View>
    );
  }

  return (
    <ThemeProvider value={tema(sema === 'dark' ? DarkTheme : DefaultTheme, r.zemin)}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={oturumVar}>
          {/* index /bugun'a yönlendirir; korumasız kalırsa oturumsuz açılışta sonsuz yönlendirme olur */}
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          {/* Ayarlar kendi AltSayfa'sını çizer; mobilde alttan, webde ortada */}
          <Stack.Screen name="ayarlar" options={{ presentation: 'transparentModal', animation: 'fade' }} />
          <Stack.Screen name="grup/[id]/ayarlar" />
          <Stack.Screen name="program/yeni" />
          <Stack.Screen name="odak" options={{ presentation: 'fullScreenModal' }} />
        </Stack.Protected>
        <Stack.Protected guard={!oturumVar}>
          <Stack.Screen name="giris" />
        </Stack.Protected>
        {/* Davet linki oturum olmadan da açılır; ekran gerekirse girişi kendisi ister */}
        <Stack.Screen name="d/[token]" />
        {/* Şifre sıfırlama linki oturumu kendisi açar */}
        <Stack.Screen name="sifre-yenile" />
      </Stack>
    </ThemeProvider>
  );
}

// Ekran geçişlerinde zemin rengi tema ile aynı kalsın
const tema = (t: typeof DefaultTheme, zemin: string) => ({ ...t, colors: { ...t.colors, background: zemin, card: zemin } });
