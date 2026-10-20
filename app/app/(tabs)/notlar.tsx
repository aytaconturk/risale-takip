import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { bugunVerisi } from '@/src/api/bugun';
import { notEkle, notlar, notSil } from '@/src/api/notlar';
import { kitaplar } from '@/src/api/program';
import {
  BolumBasligi, BosDurum, Buton, Ekran, Girdi, Kart, Kolon, onayla, OnayKutusu, SegmentSecici, Secici, tip, Yukleniyor,
} from '@/src/components/ui';
import { t } from '@/src/i18n';
import { benimId } from '@/src/lib/supabase';
import { useRenkler } from '@/src/lib/tema';
import { useAktifProgram } from '@/src/lib/useAktifProgram';
import { useUi } from '@/src/store';

export default function Notlar() {
  const r = useRenkler();
  const qc = useQueryClient();
  const bildir = useUi((s) => s.bildir);
  const q = useQuery({ queryKey: ['notlar'], queryFn: notlar });
  const benim = useQuery({ queryKey: ['benimId'], queryFn: benimId });
  const [filtre, setFiltre] = useState<'tumu' | 'paylasilan'>('tumu');
  const sil = useMutation({
    mutationFn: notSil,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notlar'] }),
    onError: () => bildir(t('genel.hata')),
  });

  if (!q.data) return <Yukleniyor />;
  const paylasilan = q.data.filter((n) => n.grupla_paylas);
  const liste = filtre === 'tumu' ? q.data : paylasilan;

  return (
    <Ekran
      ust={t('notlar.baslik')}
      baslik={t('notlar.baslikUzun')}
      alt={t('notlar.ozet', { n: q.data.length, m: paylasilan.length })}
      yenile={() => q.refetch()}>
      <Kolon>
        <SegmentSecici
          secenekler={[{ deger: 'tumu', etiket: t('notlar.tumu') }, { deger: 'paylasilan', etiket: t('notlar.paylasilan') }]}
          deger={filtre}
          degistir={setFiltre}
        />
        {liste.length === 0 ? <BosDurum ikon="yerimi" baslik={t('notlar.bos')} alt={t('notlar.bosAlt')} /> : null}
        {liste.map((n) => (
          <Kart key={n.id} cizgili>
            <Text style={[tip(r, 'yari'), { fontSize: 11, letterSpacing: 1.1, color: r.vurgu }]}>
              {[n.kitaplar?.ad, n.sayfa ? `s. ${n.sayfa}` : null].filter(Boolean).join(' · ').toLocaleUpperCase('tr-TR')}
            </Text>
            <Text selectable style={[tip(r, 'normal'), { fontSize: 16, lineHeight: 24, color: r.metin }]}>{n.metin}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <Text style={[tip(r, 'normal'), { flex: 1, fontSize: 12, color: r.soluk }]}>
                {n.grup?.ad ? t('notlar.paylasildi', { grup: n.grup.ad }) : t('notlar.yalnizSiz')}
              </Text>
              {n.kullanici_id === benim.data ? (
                <Buton tur="hayalet" baslik={t('notlar.sil')} renk={r.kacirildi}
                  onPress={async () => (await onayla(t('notlar.silOnay'))) && sil.mutate(n.id)} />
              ) : null}
            </View>
          </Kart>
        ))}
      </Kolon>
      <Kolon>
        <NotFormu />
      </Kolon>
    </Ekran>
  );
}

// Satır içi yeni not formu; kitap ve sayfa bugünkü okumadan önerilir
function NotFormu() {
  const qc = useQueryClient();
  const bildir = useUi((s) => s.bildir);
  const k = useQuery({ queryKey: ['kitaplar'], queryFn: kitaplar });
  const { kp } = useAktifProgram();
  const b = useQuery({ queryKey: ['bugun', kp?.id], queryFn: () => bugunVerisi(kp!), enabled: !!kp });
  const bugunku = b.data?.aralik[0];
  const [kitapId, setKitapId] = useState<string | null>(null);
  const [sayfa, setSayfa] = useState('');
  const [metin, setMetin] = useState('');
  const [paylas, setPaylas] = useState(false);

  // Bugünkü okuma yüklenince onun kitabı önerilir
  const hazir = !!k.data && (!kp || b.isFetched);
  useEffect(() => {
    if (!kitapId && hazir) setKitapId(bugunku?.kitap_id ?? k.data?.[0]?.id ?? null);
  }, [kitapId, hazir, bugunku?.kitap_id, k.data]);

  const ekle = useMutation({
    mutationFn: () =>
      notEkle({ kitap_id: kitapId!, sayfa: Number(sayfa) || null, metin, grupla_paylas: paylas && kp?.grup_id ? kp.grup_id : null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notlar'] });
      setMetin('');
      setSayfa('');
      bildir(t('notlar.eklendi'));
    },
    onError: () => bildir(t('genel.hata')),
  });

  return (
    <View style={{ gap: 16 }}>
      <BolumBasligi baslik={t('notlar.yeni')} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Secici etiket={t('notlar.kitap')} deger={kitapId} degistir={setKitapId}
            secenekler={(k.data ?? []).map((x) => ({ deger: x.id, etiket: x.ad }))} />
        </View>
        <View style={{ width: 96 }}>
          <Girdi etiket={t('notlar.sayfa')} value={sayfa} onChangeText={(v) => setSayfa(v.replace(/\D/g, ''))}
            keyboardType="number-pad" inputMode="numeric" returnKeyType="next" enterKeyHint="next"
            placeholder={bugunku && bugunku.kitap_id === kitapId ? String(bugunku.bas_sayfa) : undefined} />
        </View>
      </View>
      <Girdi etiket={t('notlar.metin')} placeholder={t('notlar.metinIpucu')} value={metin} onChangeText={setMetin}
        multiline style={{ minHeight: 90, textAlignVertical: 'top', paddingTop: 12 }} />
      {kp?.grup_id ? <OnayKutusu etiket={t('notlar.grupla', { grup: kp.grup?.ad ?? '' })} deger={paylas} degistir={setPaylas} /> : null}
      <Buton buyuk baslik={t('notlar.ekle')} pasif={!kitapId} yukleniyor={ekle.isPending}
        onPress={() => (metin.trim() ? ekle.mutate() : bildir(t('notlar.metinBos')))} />
    </View>
  );
}
