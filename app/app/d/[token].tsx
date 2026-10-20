import type { Session } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { davetKabul, kabulMesaji } from '@/src/api/davet';
import { GirisFormu } from '@/src/components/GirisFormu';
import { Buton, Kart, Yazi, Yukleniyor } from '@/src/components/ui';
import { t } from '@/src/i18n';
import { supabase } from '@/src/lib/supabase';
import { useRenkler } from '@/src/lib/tema';

// WhatsApp'tan gelen davet linki. Oturum yoksa önce giriş istenir, sonra davet kabul edilir.
export default function Davet() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const r = useRenkler();
  const [oturum, setOturum] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setOturum(data.session));
    const { data } = supabase.auth.onAuthStateChange((_o, s) => setOturum(s));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 16, gap: 12, backgroundColor: r.zemin }}>
      <Yazi tur="buyuk">{t('davet.baslik')}</Yazi>
      {oturum === undefined ? <Yukleniyor /> : oturum ? <Kabul token={token} /> : <GirisFormu />}
    </View>
  );
}

function Kabul({ token }: { token: string }) {
  const qc = useQueryClient();
  // Aynı token iki kez gönderilse de davet_kabul 409 döner; staleTime ile tekrar çağrı önlenir
  const q = useQuery({ queryKey: ['davet', token], queryFn: () => davetKabul(token), staleTime: Infinity, retry: false });
  useEffect(() => {
    if (q.data?.durum === 200) qc.invalidateQueries({ queryKey: ['programlarim'] });
  }, [q.data?.durum, qc]);

  if (!q.data) return <Yukleniyor />;
  return (
    <Kart>
      <Yazi>{t(kabulMesaji(q.data.durum), { grup: q.data.grup_ad ?? '' })}</Yazi>
      <Buton baslik={t('davet.devam')} onPress={() => router.replace(q.data.durum === 200 || q.data.durum === 409 ? '/gruplar' : '/bugun')} />
    </Kart>
  );
}
