import type { Session } from '@supabase/supabase-js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { bugunVerisi, programlarim } from '@/src/api/bugun';
import { davetKabul, davetOnizleme, kabulMesaji, type KabulSonucu } from '@/src/api/davet';
import { GirisFormu } from '@/src/components/GirisFormu';
import { Ikon } from '@/src/components/Ikon';
import { Buton, IkonDugme, tip, Yazi, Yukleniyor } from '@/src/components/ui';
import { t } from '@/src/i18n';
import { aralikMetni, DERS_GUNU, uzunTarih } from '@/src/lib/bicim';
import { supabase } from '@/src/lib/supabase';
import { useRenkler, zeminStili } from '@/src/lib/tema';
import { useUi } from '@/src/store';

// WhatsApp'tan gelen davet linki. Grup bilgisi oturumsuz da görünür; katılmak için giriş istenir.
export default function Davet() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const r = useRenkler();
  const ic = useSafeAreaInsets();
  const [oturum, setOturum] = useState<Session | null | undefined>(undefined);
  const [sonuc, setSonuc] = useState<KabulSonucu | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setOturum(data.session));
    const { data } = supabase.auth.onAuthStateChange((_o, s) => setOturum(s));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: r.zemin }} keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingTop: ic.top + 8, paddingBottom: Math.max(ic.bottom, 16) + 20, paddingHorizontal: 16 }}>
      <View style={{ width: '100%', maxWidth: 460, alignSelf: 'center', gap: 24 }}>
        <View style={{ alignItems: 'flex-end' }}>
          <IkonDugme ad="kapat" etiket={t('genel.kapat')} onPress={() => router.replace('/')} />
        </View>
        {sonuc?.durum === 200 ? <Katildi sonuc={sonuc} /> : <Onizleme token={token} oturum={oturum} sonuc={sonuc} setSonuc={setSonuc} />}
      </View>
    </ScrollView>
  );
}

function Onizleme({ token, oturum, sonuc, setSonuc }: {
  token: string; oturum: Session | null | undefined; sonuc: KabulSonucu | null; setSonuc: (s: KabulSonucu) => void;
}) {
  const r = useRenkler();
  const q = useQuery({ queryKey: ['davetOnizleme', token], queryFn: () => davetOnizleme(token) });
  const katil = useMutation({ mutationFn: () => davetKabul(token), onSuccess: setSonuc, onError: () => setSonuc({ durum: 500 }) });

  if (q.isLoading || oturum === undefined) return <Yukleniyor />;
  const d = q.data;
  if (!d) return <Yazi>{t('davet.bulunamadi')}</Yazi>;
  const satirlar: [string, string][] = [
    [t('davet.program'), d.program_ad],
    [t('davet.baslangic'), uzunTarih(d.baslangic_tarihi)],
    ...(d.ders_gunu ? [[t('davet.ders'), [DERS_GUNU[d.ders_gunu], d.ders_saati?.slice(0, 5)].filter(Boolean).join(' · ')] as [string, string]] : []),
    ...(d.konum ? [[t('davet.konum'), d.konum] as [string, string]] : []),
    [t('davet.uyeler'), String(d.uye_sayisi)],
  ];
  return (
    <>
      <View style={[zeminStili(r.vurguZemin), { borderRadius: r.rKart, boxShadow: r.vurguGolge, padding: 24, gap: 8 }]}>
        <Text style={[tip(r, 'yari'), { fontSize: 12, letterSpacing: 1.2, color: '#fff' }]}>{t('davet.baslik').toLocaleUpperCase('tr-TR')}</Text>
        <Text style={[tip(r, 'kalin'), { fontSize: 36, lineHeight: 38, letterSpacing: -1.1, color: '#fff' }]}>{d.grup_ad}</Text>
        <Text style={[tip(r, 'normal'), { fontSize: 15, color: '#fff' }]}>{t('davet.davetEtti', { ad: d.davet_eden })}</Text>
      </View>
      <View style={{ backgroundColor: r.yuzey, borderRadius: r.rKart, overflow: 'hidden' }}>
        {satirlar.map(([k, v], i) => (
          <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 14, paddingHorizontal: 16,
            borderBottomWidth: i < satirlar.length - 1 ? 1 : 0, borderBottomColor: r.kenar }}>
            <Text style={[tip(r, 'normal'), { fontSize: 14, color: r.soluk }]}>{k}</Text>
            <Text style={[tip(r, 'yari'), { fontSize: 14, color: r.metin, flexShrink: 1, textAlign: 'right' }]}>{v}</Text>
          </View>
        ))}
      </View>
      {!d.gecerli ? (
        <Yazi renk={r.kacirildi}>{t('davet.gecersiz')}</Yazi>
      ) : !oturum ? (
        <GirisFormu marka={false} />
      ) : sonuc ? (
        <View style={{ gap: 12 }}>
          <Yazi renk={sonuc.durum === 409 ? r.metin : r.kacirildi}>{t(kabulMesaji(sonuc.durum), { grup: d.grup_ad })}</Yazi>
          {sonuc.durum === 409 ? <Buton baslik={t('davet.devam')} onPress={() => router.replace('/gruplar')} /> : null}
        </View>
      ) : (
        <>
          <Text style={[tip(r, 'normal'), { fontSize: 13, lineHeight: 19, color: r.soluk }]}>{t('davet.aciklama')}</Text>
          <Buton buyuk baslik={t('davet.katil')} yukleniyor={katil.isPending} onPress={() => katil.mutate()} />
        </>
      )}
    </>
  );
}

function Katildi({ sonuc }: { sonuc: KabulSonucu }) {
  const r = useRenkler();
  const qc = useQueryClient();
  const kpSec = useUi((s) => s.kpSec);
  // Yeni üyeliğin bugünkü günü ve aralığı (gün sayısı grubun başlangıcına göre SQL'de hesaplanır)
  const q = useQuery({
    queryKey: ['davetSonrasi', sonuc.kullanici_program_id],
    queryFn: async () => {
      await qc.invalidateQueries({ queryKey: ['programlarim'] });
      const kp = (await programlarim()).find((p) => p.id === sonuc.kullanici_program_id);
      return kp ? bugunVerisi(kp) : null;
    },
    enabled: !!sonuc.kullanici_program_id,
  });
  const gun = q.data?.ilerleme.bugunku_gun ?? 0;
  return (
    <View style={{ gap: 16, paddingTop: 24, borderTopWidth: r.cizgi || 1, borderTopColor: r.metin }}>
      <View style={{ width: 56, height: 56, borderRadius: r.rHap === 999 ? 28 : 0, backgroundColor: r.vurgu, alignItems: 'center', justifyContent: 'center' }}>
        <Ikon ad="tik" renk="#fff" boyut={30} kalinlik={3} />
      </View>
      <Text style={[tip(r, 'kalin'), { fontSize: 30, lineHeight: 34, color: r.metin }]}>{t('davet.katildiniz', { grup: sonuc.grup_ad ?? '' })}</Text>
      {q.data && gun > 0 ? (
        <Text style={[tip(r, 'normal'), { fontSize: 15, color: r.soluk }]}>{t('davet.bugunOzet', { gun, aralik: aralikMetni(q.data.aralik) })}</Text>
      ) : null}
      <Buton buyuk baslik={t('davet.devam')} onPress={() => {
        if (sonuc.kullanici_program_id) kpSec(sonuc.kullanici_program_id);
        router.replace('/bugun');
      }} />
    </View>
  );
}
