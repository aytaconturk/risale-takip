import { Link } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef, type ReactNode, type Ref } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/components/useColorScheme';
import { Ikon, type IkonAdi } from '@/src/components/Ikon';
import { t } from '@/src/i18n';
import { telefonBicimle, telefonGecerli } from '@/src/lib/bicim';
import { useDuzen } from '@/src/lib/duzen';
import { alfa, useRenkler, yazi, type Renkler } from '@/src/lib/tema';
import { useUi } from '@/src/store';

// Sistem fontu + fontWeight
export const tip = (r: Renkler, a: 'kalin' | 'yari' | 'normal') =>
  ({ fontWeight: a === 'kalin' ? r.baslikAgirlik : a === 'yari' ? '600' : '400' }) as const;

// Sayılar (sayfa, süre, yüzde) hizalı
export const rakam = { fontVariant: ['tabular-nums'] } as TextStyle;

// Hover yalnızca fareli cihazlarda; telefonda dokunduktan sonra renk kalmaz
const HOVER = Platform.OS === 'web' && typeof window !== 'undefined' && !!window.matchMedia?.('(hover: hover)').matches;

export function Ekran({
  ust,
  baslik,
  alt,
  sag,
  children,
  yenile,
}: {
  ust?: string;
  baslik: string;
  alt?: string;
  sag?: ReactNode;
  children: ReactNode;
  yenile?: () => unknown;
}) {
  const r = useRenkler();
  const { genis } = useDuzen();
  const ic = useSafeAreaInsets();
  const cek = useCekYenile(yenile);
  const yatay = genis ? 40 : 16;
  return (
    <View style={{ flex: 1, minHeight: 0, backgroundColor: r.zemin }}>
      <View
        style={{
          flexDirection: 'row', alignItems: 'flex-start', gap: 12,
          paddingTop: genis ? 28 : ic.top + 8, paddingBottom: genis ? 20 : 16,
          paddingLeft: yatay + ic.left, paddingRight: yatay + ic.right,
          borderBottomWidth: r.cizgi, borderBottomColor: r.kenar,
        }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          {ust ? <Etiket>{ust}</Etiket> : null}
          <Text
            accessibilityRole="header"
            style={[tip(r, 'kalin'), { color: r.metin, flexShrink: 1, marginTop: ust ? 4 : 0 },
              genis ? { fontSize: 40, lineHeight: 42, letterSpacing: -1 } : { fontSize: 34, lineHeight: 36, letterSpacing: -0.85 }]}>
            {baslik}
          </Text>
          {alt ? <Text style={[tip(r, 'normal'), { fontSize: yazi.sm, color: r.soluk, marginTop: 4 }]}>{alt}</Text> : null}
        </View>
        {sag === undefined ? <UstDugmeler /> : sag}
      </View>
      {cek?.gosterge}
      <ScrollView
        {...cek?.olaylar}
        style={[{ flex: 1 }, Platform.OS === 'web' ? ({ overscrollBehaviorY: 'contain' } as object) : null]}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={
          genis
            ? { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', rowGap: 24, columnGap: 24, paddingTop: 32, paddingHorizontal: 40, paddingBottom: 48 }
            : { gap: 24, paddingTop: 20, paddingLeft: 16 + ic.left, paddingRight: 16 + ic.right, paddingBottom: 32 }
        }
        refreshControl={yenile && Platform.OS !== 'web' ? <RefreshControl refreshing={false} onRefresh={() => void yenile()} /> : undefined}>
        {children}
      </ScrollView>
    </View>
  );
}

// Web/PWA: iPhone ana ekran uygulamasında tarayıcının çekip yenilemesi yok. Sayfanın başındayken aşağı çekince yenile çağrılır.
const ESIK = 64;
function useCekYenile(yenile?: () => unknown) {
  const r = useRenkler();
  const [cekme, setCekme] = useState(0);
  const [yukleniyor, setYukleniyor] = useState(false);
  const bas = useRef<number | null>(null);
  const enUstte = useRef(true);
  if (Platform.OS !== 'web' || !yenile) return null;

  const birak = async () => {
    const yeter = cekme >= ESIK;
    bas.current = null;
    setCekme(0);
    if (!yeter || yukleniyor) return;
    setYukleniyor(true);
    try {
      await yenile();
    } finally {
      setYukleniyor(false);
    }
  };
  const yukseklik = yukleniyor ? 44 : Math.min(cekme, ESIK);
  return {
    gosterge: yukseklik ? (
      <View style={{ height: yukseklik, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <ActivityIndicator color={r.soluk} animating={yukleniyor || cekme >= ESIK} style={{ opacity: yukleniyor ? 1 : cekme / ESIK }} />
      </View>
    ) : null,
    olaylar: {
      scrollEventThrottle: 16,
      onScroll: (e: { nativeEvent: { contentOffset: { y: number } } }) => { enUstte.current = e.nativeEvent.contentOffset.y <= 0; },
      onTouchStart: (e: { nativeEvent: { pageY: number } }) => { bas.current = enUstte.current ? e.nativeEvent.pageY : null; },
      onTouchMove: (e: { nativeEvent: { pageY: number } }) => {
        if (bas.current !== null) setCekme(Math.max(0, (e.nativeEvent.pageY - bas.current) * 0.5));
      },
      onTouchEnd: birak,
      onTouchCancel: () => { bas.current = null; setCekme(0); },
    },
  };
}

// Geniş düzende yan yana kolon; mobilde (dikey akışta flexBasis yüksekliğe dönüşür) yalnızca grup
export function Kolon({ children }: { children: ReactNode }) {
  const { genis } = useDuzen();
  return <View style={genis ? { gap: 24, flexBasis: 400, flexGrow: 1, minWidth: 0 } : { gap: 24 }}>{children}</View>;
}

// Tema düğmesi + ayarlar (zil)
export function UstDugmeler() {
  const koyu = useColorScheme() === 'dark';
  const temaSec = useUi((s) => s.temaSec);
  return (
    <Satir>
      <IkonDugme ad={koyu ? 'gunes' : 'ay'} etiket={t('ayarlar.temaKoyu')} onPress={() => temaSec(koyu ? 'acik' : 'koyu')} />
      <Link href="/ayarlar" asChild>
        <IkonDugme ad="zil" etiket={t('ayarlar.baslik')} />
      </Link>
    </Satir>
  );
}

export function IkonDugme({ ad, etiket, onPress, boyut = 44, renk }: { ad: IkonAdi; etiket: string; onPress?: () => void; boyut?: number; renk?: string }) {
  const r = useRenkler();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiket}
      onPress={onPress}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => ({
        width: boyut, height: boyut, alignItems: 'center', justifyContent: 'center',
        backgroundColor: pressed ? alfa(r.metin, 0.14) : HOVER && hovered ? alfa(r.metin, 0.08) : r.yuzey,
        borderRadius: r.rHap === 999 ? boyut / 2 : r.rHap, borderWidth: r.ikonKenar, borderColor: r.kenar, boxShadow: r.kartGolge,
      })}>
      <Ikon ad={ad} renk={renk ?? r.metin} boyut={20} />
    </Pressable>
  );
}

export function BolumBasligi({ baslik, sag, sagRenk }: { baslik: string; sag?: string; sagRenk?: string }) {
  const r = useRenkler();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, paddingBottom: 8, borderBottomWidth: r.cizgi, borderBottomColor: r.kenar }}>
      <Text accessibilityRole="header" style={[tip(r, 'kalin'), { fontSize: 18, color: r.metin, flexShrink: 1 }]}>{baslik}</Text>
      {sag ? <Text style={[tip(r, 'normal'), rakam, { fontSize: 13, color: sagRenk ?? r.soluk }]}>{sag}</Text> : null}
    </View>
  );
}

// İstatistik şeridi: 12 aralıklı ayrı kartlar
export function Serit({ hucreler, sutun, degerBoyut = 26 }: { hucreler: { etiket: string; deger: string; renk?: string; boyut?: number }[]; sutun?: number; degerBoyut?: number }) {
  const r = useRenkler();
  const n = sutun ?? hucreler.length;
  const satirlar = Array.from({ length: Math.ceil(hucreler.length / n) }, (_, i) => hucreler.slice(i * n, i * n + n));
  return (
    <View style={{ gap: r.statAralik }}>
      {satirlar.map((satir, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: r.statAralik }}>
          {satir.map((h) => (
            <View
              key={h.etiket}
              style={{ flex: 1, minWidth: 0, gap: 4, padding: 16, backgroundColor: r.yuzey, borderRadius: r.rKart, boxShadow: r.kartGolge }}>
              <Text style={[tip(r, 'normal'), { fontSize: 12, color: r.soluk }]}>{h.etiket}</Text>
              <Text style={[tip(r, 'kalin'), rakam, { fontSize: h.boyut ?? degerBoyut, color: h.renk ?? r.metin, flexShrink: 1 }]}>{h.deger}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export function Kart({ children, cizgili, style }: { children: ReactNode; cizgili?: boolean; style?: StyleProp<ViewStyle> }) {
  const r = useRenkler();
  return (
    <View
      style={[
        { backgroundColor: r.yuzey, borderRadius: r.rKart, boxShadow: r.kartGolge, padding: 16, gap: 8 },
        cizgili ? { borderTopWidth: r.cizgi, borderTopColor: r.metin } : null,
        style,
      ]}>
      {children}
    </View>
  );
}

// Üst etiket (eyebrow): büyük harf, Türkçe kurallarıyla (i → İ)
export function Etiket({ children, renk }: { children: string; renk?: string }) {
  const r = useRenkler();
  return (
    <Text style={[tip(r, 'yari'), { fontSize: 12, letterSpacing: 1, color: renk ?? r.vurgu }]}>
      {children.toLocaleUpperCase('tr-TR')}
    </Text>
  );
}

export function Yazi({ children, tur = 'govde', renk }: { children: ReactNode; tur?: 'govde' | 'baslik' | 'buyuk' | 'soluk'; renk?: string }) {
  const r = useRenkler();
  const s = {
    govde: [tip(r, 'normal'), { fontSize: yazi.base, lineHeight: 22, color: r.metin }],
    baslik: [tip(r, 'kalin'), { fontSize: yazi.lg, color: r.metin }],
    buyuk: [tip(r, 'kalin'), rakam, { fontSize: 32, letterSpacing: -0.6, color: r.metin }],
    soluk: [tip(r, 'normal'), { fontSize: 13, color: r.soluk }],
  }[tur];
  return <Text style={[...s, { flexShrink: 1 }, renk ? { color: renk } : null]}>{children}</Text>;
}

export type ButonTuru = 'ana' | 'ikincil' | 'hayalet' | 'beyaz';

export function Buton({
  baslik,
  onPress,
  tur = 'ana',
  pasif,
  yukleniyor,
  ikon,
  buyuk,
  renk,
  style,
}: {
  baslik: string;
  onPress: () => void;
  tur?: ButonTuru;
  pasif?: boolean;
  yukleniyor?: boolean;
  ikon?: IkonAdi;
  buyuk?: boolean;
  renk?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const r = useRenkler();
  const yaziRengi = renk ?? {
    ana: '#fff',
    ikincil: r.metin,
    hayalet: r.vurgu,
    beyaz: r.vurguButonYazi,
  }[tur];
  const zemin = (basili: boolean, uzerinde: boolean) => {
    const vurgulu = basili ? 0.14 : HOVER && uzerinde ? 0.08 : 0;
    if (tur === 'ana') return basili || (HOVER && uzerinde) ? r.vurgu600 : r.vurgu;
    if (tur === 'beyaz') return basili ? 'rgba(255,255,255,0.86)' : '#fff';
    if (!vurgulu) return 'transparent';
    return alfa(tur === 'hayalet' ? r.vurgu : r.metin, vurgulu);
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={baslik}
      accessibilityState={{ disabled: !!(pasif || yukleniyor) }}
      disabled={pasif || yukleniyor}
      onPress={onPress}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        {
          minHeight: buyuk ? 52 : tur === 'hayalet' ? 44 : 48,
          paddingHorizontal: tur === 'hayalet' ? 4 : 16,
          borderRadius: r.rButon,
          flexDirection: 'row', alignItems: 'center', justifyContent: r.butonHiza, gap: 8,
          backgroundColor: zemin(pressed, !!hovered),
          borderWidth: tur === 'ikincil' ? 1 : 0, borderColor: r.kenar,
          opacity: pasif ? 0.45 : 1,
        },
        style,
      ]}>
      {yukleniyor ? (
        <ActivityIndicator color={yaziRengi} />
      ) : (
        <>
          {ikon ? <Ikon ad={ikon} renk={yaziRengi} boyut={18} /> : null}
          <Text style={[tip(r, tur === 'ana' || tur === 'beyaz' ? 'kalin' : 'yari'), { color: yaziRengi, fontSize: buyuk || tur === 'ana' ? 16 : 15, flexShrink: 1 }]}>
            {baslik}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function SegmentSecici<T extends string>({ secenekler, deger, degistir }: { secenekler: { deger: T; etiket: string }[]; deger: T; degistir: (d: T) => void }) {
  const r = useRenkler();
  return (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', borderWidth: 1, borderColor: r.kenar, borderRadius: r.rButon, overflow: 'hidden' }}>
      {secenekler.map((s, i) => {
        const secili = s.deger === deger;
        return (
          <Pressable
            key={s.deger}
            accessibilityRole="tab"
            accessibilityState={{ selected: secili }}
            onPress={() => degistir(s.deger)}
            style={{
              flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8,
              backgroundColor: secili ? r.vurgu : 'transparent', borderLeftWidth: i ? 1 : 0, borderLeftColor: r.kenar,
            }}>
            <Text style={[tip(r, 'yari'), { fontSize: 14, color: secili ? '#fff' : r.metin }]}>{s.etiket}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Tüm girdilerin tek stili: iOS 16 px altındaki girdilerde odakta sayfayı büyütür, bu yüzden yazı 16
export function girdiStili(r: Renkler, odak = false): TextStyle {
  return {
    ...tip(r, 'normal'),
    minHeight: 48, fontSize: 16, paddingHorizontal: 12, color: r.metin, backgroundColor: r.yuzey,
    borderWidth: 1, borderColor: odak ? r.vurgu : r.kenar, borderRadius: r.rButon,
  };
}

// etiketGizli: etiket satırın kendisinde yazılıysa yalnızca erişilebilirlik için kullanılır
export function Girdi({ etiket, etiketGizli, ref, ...p }: TextInputProps & { etiket: string; etiketGizli?: boolean; ref?: Ref<ComponentRef<typeof TextInput>> }) {
  const r = useRenkler();
  const [odak, setOdak] = useState(false);
  return (
    <View style={{ gap: 5, minWidth: 0 }}>
      {etiketGizli ? null : <Text style={[tip(r, 'normal'), { fontSize: 12, color: r.soluk }]}>{etiket}</Text>}
      <TextInput
        ref={ref}
        accessibilityLabel={etiket}
        placeholderTextColor={r.soluk}
        {...p}
        onFocus={(e) => {
          setOdak(true);
          gorunurYap(e.target as unknown);
          p.onFocus?.(e);
        }}
        onBlur={(e) => {
          setOdak(false);
          p.onBlur?.(e);
        }}
        style={[girdiStili(r, odak), p.style]}
      />
    </View>
  );
}

// Web: klavye açılınca görünür alanın alt kısmında kalan girdi ortaya kaydırılır
function gorunurYap(el: unknown) {
  if (Platform.OS !== 'web' || !(el instanceof HTMLElement)) return;
  setTimeout(() => {
    const vv = window.visualViewport;
    const alt = el.getBoundingClientRect().bottom;
    if (vv && alt > vv.height * 0.6) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, 300);
}

// Seçim listesi: webde yerel <select>, telefonda alt sayfada liste
export function Secici({ etiket, deger, secenekler, degistir }: { etiket: string; deger: string | null; secenekler: { deger: string; etiket: string }[]; degistir: (d: string) => void }) {
  const r = useRenkler();
  const [acik, setAcik] = useState(false);
  const secili = secenekler.find((s) => s.deger === deger);
  const g = girdiStili(r);
  return (
    <View style={{ gap: 5, minWidth: 0 }}>
      <Text style={[tip(r, 'normal'), { fontSize: 12, color: r.soluk }]}>{etiket}</Text>
      {Platform.OS === 'web' ? (
        <select
          aria-label={etiket}
          value={deger ?? ''}
          onChange={(e) => degistir(e.target.value)}
          style={{
            minHeight: 48, fontSize: 16, padding: '0 12px', color: r.metin, backgroundColor: r.yuzey, fontFamily: g.fontFamily,
            border: `1px solid ${r.kenar}`, borderRadius: r.rButon, width: '100%', minWidth: 0,
          }}>
          {secenekler.map((s) => <option key={s.deger} value={s.deger}>{s.etiket}</option>)}
        </select>
      ) : (
        <>
          <Pressable accessibilityRole="button" accessibilityLabel={etiket} onPress={() => setAcik(true)} style={[g as ViewStyle, { justifyContent: 'center' }]}>
            <Text numberOfLines={1} style={[tip(r, 'normal'), { fontSize: 16, color: secili ? r.metin : r.soluk }]}>{secili?.etiket ?? ''}</Text>
          </Pressable>
          <AltSayfa acik={acik} kapat={() => setAcik(false)}>
            <SayfaBasligi baslik={etiket} kapat={() => setAcik(false)} />
            <View>
              {secenekler.map((s) => (
                <Pressable key={s.deger} accessibilityRole="button" accessibilityState={{ selected: s.deger === deger }}
                  onPress={() => { degistir(s.deger); setAcik(false); }}
                  style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: r.kenar }}>
                  <Text style={[tip(r, s.deger === deger ? 'yari' : 'normal'), { flex: 1, fontSize: 16, color: r.metin }]}>{s.etiket}</Text>
                  {s.deger === deger ? <Ikon ad="tik" renk={r.vurgu} /> : null}
                </Pressable>
              ))}
            </View>
          </AltSayfa>
        </>
      )}
    </View>
  );
}

// Onay kutusu: seçiliyken vurgu dolgu + beyaz tik
export function OnayKutusu({ etiket, deger, degistir }: { etiket: string; deger: boolean; degistir: (v: boolean) => void }) {
  const r = useRenkler();
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: deger }} onPress={() => degistir(!deger)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}>
      <View style={{ width: 22, height: 22, borderRadius: r.rKucuk, borderWidth: 2, borderColor: deger ? r.vurgu : r.kenar, backgroundColor: deger ? r.vurgu : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
        {deger ? <Ikon ad="tik" renk="#fff" boyut={14} kalinlik={3} /> : null}
      </View>
      <Text style={[tip(r, 'normal'), { fontSize: 15, color: r.metin, flexShrink: 1 }]}>{etiket}</Text>
    </Pressable>
  );
}

// Yazarken biçimlenir; numara tamamlanıp geçersizse uyarı gösterir
export function TelefonGirdi({ etiket, value, onChangeText, ref, ...p }: TextInputProps & { etiket: string; value: string; onChangeText: (v: string) => void; ref?: Ref<ComponentRef<typeof TextInput>> }) {
  const r = useRenkler();
  const hatali = value.replace(/\D/g, '').length >= 10 && !telefonGecerli(value);
  return (
    <View style={{ gap: 4 }}>
      <Girdi ref={ref} etiket={etiket} value={value} onChangeText={(v) => onChangeText(telefonBicimle(v))}
        keyboardType="phone-pad" inputMode="tel" autoComplete="tel" placeholder="0555 555 55 55" maxLength={20} {...p} />
      {hatali ? <Text style={[tip(r, 'normal'), { fontSize: 12, color: r.kacirildi }]}>{t('giris.telefonHatali')}</Text> : null}
    </View>
  );
}

export function Cip({ baslik, secili, onPress }: { baslik: string; secili?: boolean; onPress: () => void }) {
  const r = useRenkler();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!secili }}
      onPress={onPress}
      style={{
        minHeight: 36, paddingHorizontal: 14, justifyContent: 'center', borderRadius: r.rHap,
        backgroundColor: secili ? r.metin : 'transparent', borderWidth: 1, borderColor: secili ? r.metin : r.kenar,
      }}>
      <Text style={[tip(r, 'yari'), { fontSize: 14, color: secili ? r.zemin : r.metin }]}>{baslik}</Text>
    </Pressable>
  );
}

export function Anahtar({ deger, degistir, etiket }: { deger: boolean; degistir: (v: boolean) => void; etiket: string }) {
  const r = useRenkler();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={etiket}
      accessibilityState={{ checked: deger }}
      onPress={() => degistir(!deger)}
      hitSlop={7}
      style={{ width: 50, height: 30, borderRadius: r.rHap, backgroundColor: deger ? r.anahtarAcik : r.iz, justifyContent: 'center' }}>
      <View
        style={[
          { position: 'absolute', left: deger ? 23 : 3, width: 24, height: 24, borderRadius: r.rHap, backgroundColor: '#fff' },
          Platform.OS === 'web' ? ({ transition: 'left 150ms' } as object) : null,
        ]}
      />
    </Pressable>
  );
}

export function Cubuk({ oran, renk, zemin, kalinlik = 6 }: { oran: number; renk?: string; zemin?: string; kalinlik?: number }) {
  const r = useRenkler();
  const yuzde = Math.min(100, Math.max(0, (oran || 0) * 100));
  return (
    <View style={{ height: kalinlik, borderRadius: r.rHap, backgroundColor: zemin ?? r.iz, overflow: 'hidden' }}>
      <View style={{ width: `${yuzde}%`, height: kalinlik, backgroundColor: renk ?? r.vurgu }} />
    </View>
  );
}

export function Stepper({ deger, azalt, artir, buyuk, etiket }: { deger: number; azalt: () => void; artir: () => void; buyuk?: boolean; etiket: string }) {
  const r = useRenkler();
  const b = buyuk ? 52 : 48;
  const dugme = (ad: 'eksi' | 'arti', f: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${etiket} ${ad === 'arti' ? '+' : '−'}`}
      onPress={f}
      style={({ pressed }) => ({
        width: b, height: b, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: r.kenar,
        borderRadius: r.rHucre === 'daire' ? b / 2 : r.rButon, backgroundColor: pressed ? alfa(r.metin, 0.14) : 'transparent',
      })}>
      <Ikon ad={ad} renk={r.metin} boyut={22} />
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      {dugme('eksi', azalt)}
      <Text accessibilityLabel={`${etiket} ${deger}`} style={[tip(r, 'kalin'), rakam, { fontSize: buyuk ? 64 : 44, minWidth: buyuk ? 96 : 64, textAlign: 'center', color: r.metin, letterSpacing: buyuk ? -2.5 : -1 }]}>
        {deger}
      </Text>
      {dugme('arti', artir)}
    </View>
  );
}

// Kök layout'ta bir kez çizilir; sekme çubuğunun üstünde durur
export function Bildirim() {
  const r = useRenkler();
  const { genis } = useDuzen();
  const ic = useSafeAreaInsets();
  const metin = useUi((s) => s.bildirim);
  if (!metin) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, bottom: genis ? 24 : 56 + ic.bottom + 12, alignItems: 'center' }}>
      <View
        accessibilityLiveRegion="polite"
        style={{ width: '100%', maxWidth: 420, backgroundColor: r.bildirimZemin, borderRadius: r.rButon, paddingVertical: 14, paddingHorizontal: 16, boxShadow: '0 12px 32px rgba(45,43,43,.22)' }}>
        <Text style={[tip(r, 'yari'), { color: r.bildirimYazi, fontSize: 14 }]}>{metin}</Text>
      </View>
    </View>
  );
}

// Mobilde alttan açılan sayfa, geniş ekranda ortada pencere. `rota`: sayfa kendi rotasıdır (Modal ve geçmiş kaydı router'da).
export function AltSayfa({ acik, kapat, children, rota }: { acik: boolean; kapat: () => void; children: ReactNode; rota?: boolean }) {
  const r = useRenkler();
  const { genis } = useDuzen();
  const ic = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  // Web: tarayıcı/Android geri tuşu önce sayfayı kapatır
  useEffect(() => {
    if (Platform.OS !== 'web' || !acik || rota) return;
    window.history.pushState(window.history.state, '');
    let geriIle = false;
    const dinle = () => {
      geriIle = true;
      kapat();
    };
    window.addEventListener('popstate', dinle);
    return () => {
      window.removeEventListener('popstate', dinle);
      if (!geriIle) window.history.back();
    };
    // kapat her çizimde değişebilir; yalnızca açılış/kapanış izlenir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acik, rota]);

  if (!acik) return null;
  const icerik = (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[{ flex: 1, justifyContent: genis ? 'center' : 'flex-end', alignItems: 'center' }, Platform.OS === 'web' ? ({ maxHeight: 'var(--vvh, 100%)' } as object) : null]}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('genel.kapat')} onPress={kapat}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: r.perde }} />
      <View
        accessibilityViewIsModal
        style={{
          width: '100%', maxWidth: genis ? 480 : 440, maxHeight: Math.round(height * 0.92), backgroundColor: r.zemin,
          borderTopWidth: r.cizgi, borderTopColor: r.metin,
          borderTopLeftRadius: r.rSayfa, borderTopRightRadius: r.rSayfa,
          borderBottomLeftRadius: genis ? r.rSayfa : 0, borderBottomRightRadius: genis ? r.rSayfa : 0,
          overflow: 'hidden',
        }}>
        <ScrollView keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 24, paddingBottom: genis ? 36 : Math.max(ic.bottom, 16) + 20, gap: 16 }}>
          {children}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
  if (rota) return icerik;
  return (
    <Modal transparent visible animationType={Platform.OS === 'web' ? 'fade' : 'slide'} onRequestClose={kapat} statusBarTranslucent>
      {icerik}
    </Modal>
  );
}

// Alt sayfa başlığı: büyük başlık + kapat
export function SayfaBasligi({ baslik, alt, kapat }: { baslik: string; alt?: string; kapat: () => void }) {
  const r = useRenkler();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text accessibilityRole="header" style={[tip(r, 'kalin'), { fontSize: 24, color: r.metin }]}>{baslik}</Text>
        {alt ? <Text style={[tip(r, 'normal'), { fontSize: 14, color: r.soluk }]}>{alt}</Text> : null}
      </View>
      <IkonDugme ad="kapat" etiket={t('genel.kapat')} onPress={kapat} />
    </View>
  );
}

// Alert.alert web'de düğme göstermez
export function onayla(mesaj: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(mesaj));
  return new Promise((coz) =>
    Alert.alert('', mesaj, [
      { text: t('genel.iptal'), style: 'cancel', onPress: () => coz(false) },
      { text: 'Tamam', style: 'destructive', onPress: () => coz(true) },
    ]),
  );
}

export function BosDurum({ baslik, alt, ikon }: { baslik: string; alt?: string; ikon?: IkonAdi }) {
  const r = useRenkler();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 10 }}>
      {ikon ? (
        <View style={{ width: 64, height: 64, borderRadius: 21, backgroundColor: alfa(r.vurgu, 0.12), alignItems: 'center', justifyContent: 'center' }}>
          <Ikon ad={ikon} renk={r.vurgu} boyut={32} />
        </View>
      ) : null}
      <Text style={[tip(r, 'kalin'), { fontSize: 18, color: r.metin, textAlign: 'center' }]}>{baslik}</Text>
      {alt ? <Text style={[tip(r, 'normal'), { fontSize: 14, color: r.soluk, textAlign: 'center' }]}>{alt}</Text> : null}
    </View>
  );
}

export function Yukleniyor() {
  return <ActivityIndicator style={{ marginTop: 48 }} />;
}

export function Satir({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }, style]}>{children}</View>;
}
