import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { bugunVerisi, gunAraligi, gunuIsaretle, isaretiKaldir } from '@/src/api/bugun';
import { ayOzeti, takvim, type GunDurumu } from '@/src/api/cizelge';
import { ilerlemeVerisi } from '@/src/api/ilerleme';
import { GunDairesi, gunStili } from '@/src/components/GunDairesi';
import { Buton, Ekran, IkonDugme, Kart, Kolon, rakam, Serit, tip, Yukleniyor } from '@/src/components/ui';
import { t, type Anahtar } from '@/src/i18n';
import { aralikMetni, ayAraligi, ayBasligi, gunNumarasi, KISA_GUNLER, tamTarih } from '@/src/lib/bicim';
import { useRenkler } from '@/src/lib/tema';
import { useAktifProgram, useBugun } from '@/src/lib/useAktifProgram';
import { useUi } from '@/src/store';

const LEJANT = ['okundu', 'telafi', 'kismi', 'kacirildi', 'bugun'] as const;

export default function Cizelge() {
  const r = useRenkler();
  const qc = useQueryClient();
  const bildir = useUi((s) => s.bildir);
  const { kp } = useAktifProgram();
  const bugun = useBugun();
  const { tarih: istenen } = useLocalSearchParams<{ tarih?: string }>();
  const [ay, setAy] = useState<string | null>(null); // ayın herhangi bir günü (ISO)
  const [secili, setSecili] = useState<string | null>(null);

  // Bugün ekranındaki hafta şeridinden gelinince o gün seçilir
  useEffect(() => {
    const g = istenen ?? bugun;
    if (!g) return;
    setAy(g);
    setSecili(g);
  }, [istenen, bugun]);

  const aralik = ay ? ayAraligi(ay) : null;
  const q = useQuery({
    queryKey: ['takvim', kp?.id, aralik?.bas],
    queryFn: () => takvim(kp!.id, aralik!.bas, aralik!.son),
    enabled: !!kp && !!aralik,
  });
  const ilerleme = useQuery({ queryKey: ['ilerleme', kp?.id], queryFn: () => ilerlemeVerisi(kp!), enabled: !!kp });
  const bugunQ = useQuery({ queryKey: ['bugun', kp?.id], queryFn: () => bugunVerisi(kp!), enabled: !!kp });

  if (!kp || !aralik || !q.data || !ilerleme.data || !bugun) return <Yukleniyor />;
  const i = ilerleme.data.ilerleme;
  const gunler = Array.from({ length: gunNumarasi(aralik.son) }, (_, n) => {
    const tarih = `${aralik.bas.slice(0, 8)}${String(n + 1).padStart(2, '0')}`;
    return q.data.find((g) => g.tarih === tarih) ?? { tarih, gun_no: null, durum: 'bos' as GunDurumu };
  });
  // Ay gezinmesi programın başladığı ay ile bitiş ayı arasında
  const oncekiVar = aralik.bas.slice(0, 7) > kp.baslangic_tarihi.slice(0, 7);
  const sonrakiVar = !ilerleme.data.bitis || aralik.bas.slice(0, 7) < ilerleme.data.bitis.slice(0, 7);
  const hucreler = [...Array.from({ length: aralik.bosluk }, () => null), ...gunler];
  const haftalar = Array.from({ length: Math.ceil(hucreler.length / 7) }, (_, n) => hucreler.slice(n * 7, n * 7 + 7));
  const seciliGun = gunler.find((g) => g.tarih === secili && g.gun_no != null);
  const ozet = ayOzeti(q.data);

  return (
    <Ekran
      ust={t('cizelge.baslik')}
      baslik={t('cizelge.takvim')}
      alt={t('cizelge.altBaslik', { okunan: i.tamamlanan_gun, gun: i.bugunku_gun, geride: i.geride_gun })}
      yenile={() => qc.invalidateQueries()}>
      <Kolon>
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottomWidth: r.cizgi, borderBottomColor: r.kenar }}>
            <Text style={[tip(r, 'kalin'), { flex: 1, fontSize: 22, color: r.metin }]}>{ayBasligi(aralik.bas)}</Text>
            <View style={{ opacity: oncekiVar ? 1 : 0.45 }} pointerEvents={oncekiVar ? 'auto' : 'none'}>
              <IkonDugme ad="sol" boyut={40} etiket={t('cizelge.oncekiAy')} onPress={() => setAy(ayAraligi(aralik.bas, -1).bas)} />
            </View>
            <View style={{ opacity: sonrakiVar ? 1 : 0.45 }} pointerEvents={sonrakiVar ? 'auto' : 'none'}>
              <IkonDugme ad="sag" boyut={40} etiket={t('cizelge.sonrakiAy')} onPress={() => setAy(ayAraligi(aralik.bas, 1).bas)} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {KISA_GUNLER.map((g) => (
              <Text key={g} style={[tip(r, 'normal'), { flex: 1, textAlign: 'center', fontSize: 12, color: r.soluk }]}>{g}</Text>
            ))}
          </View>
          {haftalar.map((hafta, n) => (
            <View key={n} style={{ flexDirection: 'row', gap: 4 }}>
              {Array.from({ length: 7 }, (_, j) => {
                const g = hafta[j];
                if (!g) return <View key={j} style={{ flex: 1 }} />;
                return (
                  <Pressable key={g.tarih} accessibilityRole="button" disabled={g.gun_no == null}
                    onPress={() => setSecili(g.tarih)} style={{ flex: 1 }}>
                    <GunDairesi durum={g.durum} metin={String(gunNumarasi(g.tarih))} secili={g.tarih === secili} />
                  </Pressable>
                );
              })}
            </View>
          ))}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, columnGap: 16 }}>
            {LEJANT.map((d) => {
              const s = gunStili(d, r);
              return (
                <View key={d} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 14, height: 14, borderRadius: r.rHucre === 'daire' ? 7 : 0, backgroundColor: s.bg, borderWidth: 2, borderColor: s.kenar ?? s.bg }} />
                  <Text style={[tip(r, 'normal'), { fontSize: 13, color: r.soluk }]}>{t(`cizelge.${d}`)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </Kolon>

      <Kolon>
        {seciliGun ? (
          <GunDetayi kpId={kp.id} programId={kp.program_id} gun={seciliGun as GunSatiri} toplam={i.toplam_gun} bugun={bugun}
            gunluk={kp.program?.gunluk_sayfa ?? 0} kismi={bugunQ.data?.kismiler[seciliGun.gun_no!]}
            sonra={(m) => { qc.invalidateQueries(); bildir(m); }} hata={() => bildir(t('genel.hata'))} />
        ) : null}
        <Serit hucreler={[
          { etiket: t('cizelge.okunan'), deger: String(ozet.okunan) },
          { etiket: t('cizelge.kismi'), deger: String(ozet.kismi) },
          { etiket: t('cizelge.kacirilan'), deger: String(ozet.kacirilan) },
        ]} />
      </Kolon>
    </Ekran>
  );
}

type GunSatiri = { tarih: string; gun_no: number; durum: GunDurumu };

function GunDetayi({ kpId, programId, gun, toplam, bugun, gunluk, kismi, sonra, hata }: {
  kpId: string; programId: string; gun: GunSatiri; toplam: number; bugun: string; gunluk: number; kismi?: number;
  sonra: (mesaj: string) => void; hata: () => void;
}) {
  const r = useRenkler();
  const aralik = useQuery({ queryKey: ['gun_araligi', programId, gun.gun_no], queryFn: () => gunAraligi(programId, gun.gun_no) });
  const islem = useMutation({ mutationFn: (f: () => Promise<string>) => f(), onSuccess: sonra, onError: hata });
  const okundu = gun.durum === 'okundu' || gun.durum === 'telafi';
  const gecmis = gun.tarih < bugun;
  const renk = gunStili(gun.durum, r).kenar ?? r.soluk;
  return (
    <Kart cizgili style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[tip(r, 'yari'), rakam, { fontSize: 12, letterSpacing: 1, color: r.soluk }]}>
          {t('cizelge.gunBasligi', { gun: gun.gun_no, toplam }).toLocaleUpperCase('tr-TR')}
        </Text>
        <Text style={[tip(r, 'kalin'), { fontSize: 12, color: renk, borderWidth: 1, borderColor: renk, borderRadius: r.rHap, paddingHorizontal: 10, paddingVertical: 3 }]}>
          {t(`cizelge.${gun.durum}` as Anahtar)}
        </Text>
      </View>
      <Text style={[tip(r, 'kalin'), rakam, { fontSize: 26, color: r.metin, flexShrink: 1 }]}>{aralik.data ? aralikMetni(aralik.data) : ' '}</Text>
      <Text style={[tip(r, 'normal'), { fontSize: 14, color: r.soluk }]}>
        {tamTarih(gun.tarih)}{gun.durum === 'kismi' ? ` · ${t('bugun.sayfaSayac', { n: kismi ?? 0, toplam: gunluk })}` : ''}
      </Text>
      {okundu ? (
        <Buton tur="ikincil" baslik={t('cizelge.gerial')} yukleniyor={islem.isPending}
          onPress={() => islem.mutate(async () => { await isaretiKaldir(kpId, gun.gun_no); return t('bugun.isaretKaldirildi'); })} />
      ) : gun.tarih <= bugun && gun.durum !== 'duraklatma' ? (
        <Buton baslik={t(gecmis ? 'cizelge.okudumTelafi' : 'bugun.okudum')} yukleniyor={islem.isPending}
          onPress={() => islem.mutate(async () => {
            await gunuIsaretle(kpId, gun.gun_no);
            return gecmis ? t('bugun.gunTelafi', { gun: gun.gun_no }) : t('bugun.tamamlandiKisa');
          })} />
      ) : null}
    </Kart>
  );
}
