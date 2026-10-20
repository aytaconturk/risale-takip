import type { Session } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { profil } from '@/src/api/giris';
import { AdFormu } from '@/src/components/GirisFormu';
import { pushKaydet } from '@/src/lib/bildirim';
import { supabase } from '@/src/lib/supabase';
import { useRenkler } from '@/src/lib/tema';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } });

export default function KokLayout() {
  const [oturum, setOturum] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setOturum(data.session));
    const { data } = supabase.auth.onAuthStateChange((_olay, s) => {
      setOturum(s);
      if (!s) qc.clear();
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (oturum !== undefined) SplashScreen.hideAsync();
    if (oturum) pushKaydet();
  }, [oturum]);

  if (oturum === undefined) return null;
  return (
    <QueryClientProvider client={qc}>
      <Gezinme oturumVar={!!oturum} />
    </QueryClientProvider>
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
    <ThemeProvider value={sema === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={oturumVar}>
          {/* index /bugun'a yönlendirir; korumasız kalırsa oturumsuz açılışta sonsuz yönlendirme olur */}
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="ayarlar" options={{ headerShown: true, title: 'Ayarlar', presentation: 'modal' }} />
          <Stack.Screen name="grup/[id]/ayarlar" options={{ headerShown: true, title: 'Grup ayarları' }} />
          <Stack.Screen name="program/yeni" options={{ headerShown: true, title: 'Yeni program' }} />
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
