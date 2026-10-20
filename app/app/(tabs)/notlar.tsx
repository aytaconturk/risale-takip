import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { SymbolView } from 'expo-symbols';
import { Pressable, Text, View } from 'react-native';

import { kitaplar } from '@/src/api/program';
import { notEkle, notlar, notSil } from '@/src/api/notlar';
import { Anahtar, BosDurum, Buton, Cip, Ekran, Girdi, Kart, onayla, Satir, Yazi, Yukleniyor } from '@/src/components/ui';
import { t } from '@/src/i18n';
import { kisaTarih } from '@/src/lib/bicim';
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
  const [formAcik, setFormAcik] = useState(false);
  const sil = useMutation({
    mutationFn: notSil,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notlar'] }),
    onError: () => bildir(t('genel.hata')),
  });

  if (!q.data) return <Yukleniyor />;
  const liste = filtre === 'tumu' ? q.data : q.data.filter((n) => n.grupla_paylas);

  return (
    <Ekran baslik={t('notlar.baslik')} sag={<Buton ikon={{ ios: 'plus', android: 'add', web: 'add' }} baslik={t('notlar.ekle')} onPress={() => setFormAcik(!formAcik)} />}>
      <Satir>
        <Cip baslik={t('notlar.tumu')} secili={filtre === 'tumu'} onPress={() => setFiltre('tumu')} />
        <Cip baslik={t('notlar.paylasilan')} secili={filtre === 'paylasilan'} onPress={() => setFiltre('paylasilan')} />
      </Satir>
      {formAcik ? <NotFormu kapat={() => setFormAcik(false)} /> : null}
      {liste.length === 0 ? <BosDurum ikon={{ ios: 'bookmark', android: 'bookmark', web: 'bookmark' }} baslik={t('notlar.bos')} alt={t('notlar.bosAlt')} /> : null}
      {liste.map((n) => (
        <Kart key={n.id} style={{ borderLeftWidth: 4, borderLeftColor: n.grupla_paylas ? r.basari : r.marka, gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <SymbolView name={{ ios: 'quote.opening', android: 'format_quote', web: 'format_quote' }} tintColor={r.marka} size={26} />
            <Text style={{ flex: 1, fontSize: 15, lineHeight: 22, color: r.metin, fontWeight: '500' }}>{n.metin}</Text>
          </View>
          <Satir style={{ justifyContent: 'space-between' }}>
            <Yazi tur="soluk" renk={r.marka}>
              {[n.kitaplar?.ad, n.sayfa ? `s. ${n.sayfa}` : null, n.grup?.ad].filter(Boolean).join(' · ')}
            </Yazi>
            <Satir>
              <Yazi tur="soluk">{kisaTarih(n.olusturma)}</Yazi>
              {n.kullanici_id === benim.data ? (
                <Pressable accessibilityRole="button" onPress={async () => (await onayla(t('notlar.sil'))) && sil.mutate(n.id)}>
                  <Yazi tur="soluk" renk={r.tehlike}>{t('notlar.sil')}</Yazi>
                </Pressable>
              ) : null}
            </Satir>
          </Satir>
        </Kart>
      ))}
    </Ekran>
  );
}

function NotFormu({ kapat }: { kapat: () => void }) {
  const qc = useQueryClient();
  const bildir = useUi((s) => s.bildir);
  const k = useQuery({ queryKey: ['kitaplar'], queryFn: kitaplar });
  const { kp } = useAktifProgram();
  const [kitapId, setKitapId] = useState<string | null>(null);
  const [sayfa, setSayfa] = useState('');
  const [metin, setMetin] = useState('');
  const [paylas, setPaylas] = useState(false);
  const ekle = useMutation({
    mutationFn: () =>
      notEkle({ kitap_id: kitapId!, sayfa: Number(sayfa) || null, metin, grupla_paylas: paylas && kp?.grup_id ? kp.grup_id : null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notlar'] }); kapat(); },
    onError: () => bildir(t('genel.hata')),
  });
  return (
    <Kart>
      <Yazi tur="baslik">{t('notlar.yeni')}</Yazi>
      <Yazi tur="soluk">{t('notlar.kitap')}</Yazi>
      <Satir style={{ flexWrap: 'wrap' }}>
        {k.data?.map((b) => <Cip key={b.id} baslik={b.ad} secili={b.id === kitapId} onPress={() => setKitapId(b.id)} />)}
      </Satir>
      <Girdi etiket={t('notlar.sayfa')} value={sayfa} onChangeText={setSayfa} keyboardType="number-pad" />
      <Girdi etiket={t('notlar.metin')} placeholder={t('notlar.metinIpucu')} value={metin} onChangeText={setMetin} multiline style={{ minHeight: 96, textAlignVertical: 'top', paddingTop: 10 }} />
      {kp?.grup_id ? (
        <Satir style={{ justifyContent: 'space-between' }}>
          <Yazi>{t('notlar.grupla', { grup: kp.grup?.ad ?? '' })}</Yazi>
          <Anahtar deger={paylas} degistir={setPaylas} etiket={t('notlar.grupla', { grup: kp.grup?.ad ?? '' })} />
        </Satir>
      ) : null}
      <Buton baslik={t('genel.kaydet')} pasif={!kitapId || !metin.trim()} yukleniyor={ekle.isPending} onPress={() => ekle.mutate()} />
    </Kart>
  );
}
