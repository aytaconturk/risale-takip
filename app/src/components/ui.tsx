import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { t } from '@/src/i18n';
import { telefonBicimle, telefonGecerli } from '@/src/lib/bicim';
import { bosluk, useRenkler, yaricap, yazi } from '@/src/lib/tema';
import { useUi } from '@/src/store';

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
  yenile?: () => void;
}) {
  const r = useRenkler();
  const ic = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: r.zemin }}>
      <ScrollView
        contentContainerStyle={{ padding: bosluk[4], paddingTop: ic.top + bosluk[4], gap: bosluk[3], paddingBottom: 96 }}
        refreshControl={yenile ? <RefreshControl refreshing={false} onRefresh={yenile} /> : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: bosluk[2] }}>
          <View style={{ flex: 1 }}>
            {ust ? <Etiket>{ust}</Etiket> : null}
            <Text style={{ fontSize: 32, fontWeight: '700', letterSpacing: -0.6, color: r.metin, marginTop: 2 }}>{baslik}</Text>
            {alt ? <Text style={{ fontSize: yazi.sm, color: r.soluk }}>{alt}</Text> : null}
          </View>
          {sag}
        </View>
        {children}
      </ScrollView>
      <Bildirim />
    </View>
  );
}

function Bildirim() {
  const metin = useUi((s) => s.bildirim);
  if (!metin) return null;
  return (
    <View style={stil.bildirim} accessibilityLiveRegion="polite">
      <Text style={{ color: '#fff', fontSize: yazi.sm }}>{metin}</Text>
    </View>
  );
}

export function Kart({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const r = useRenkler();
  return (
    <View style={[{ backgroundColor: r.yuzey, borderRadius: yaricap.xl, padding: bosluk[4], gap: bosluk[2], boxShadow: r.golge }, style]}>
      {children}
    </View>
  );
}

export function Etiket({ children, renk }: { children: ReactNode; renk?: string }) {
  const r = useRenkler();
  return (
    <Text style={{ fontSize: yazi.xs, fontWeight: '600', letterSpacing: 0.6, color: renk ?? r.soluk, textTransform: 'uppercase' }}>
      {children}
    </Text>
  );
}

export function Yazi({ children, tur = 'govde', renk }: { children: ReactNode; tur?: 'govde' | 'baslik' | 'buyuk' | 'soluk'; renk?: string }) {
  const r = useRenkler();
  const s = {
    govde: { fontSize: yazi.sm, color: r.metin },
    baslik: { fontSize: yazi.lg, fontWeight: '700' as const, color: r.metin },
    buyuk: { fontSize: yazi.xxl, fontWeight: '700' as const, color: r.metin },
    soluk: { fontSize: yazi.xs, color: r.soluk },
  }[tur];
  return <Text style={[s, renk ? { color: renk } : null]}>{children}</Text>;
}

export function Buton({
  baslik,
  onPress,
  tur = 'ana',
  pasif,
  yukleniyor,
  ikon,
}: {
  baslik: string;
  onPress: () => void;
  tur?: 'ana' | 'ikincil' | 'basari' | 'tehlike' | 'beyaz';
  pasif?: boolean;
  yukleniyor?: boolean;
  ikon?: SymbolViewProps['name'];
}) {
  const r = useRenkler();
  const renk = {
    ana: { bg: r.marka, fg: '#fff', kenar: r.marka },
    ikincil: { bg: r.yuzey, fg: r.metin, kenar: r.kenar },
    basari: { bg: r.basariAcik, fg: r.basari, kenar: r.basari },
    tehlike: { bg: r.yuzey, fg: r.tehlike, kenar: r.tehlike },
    beyaz: { bg: '#fff', fg: r.vurgu2, kenar: '#fff' },
  }[tur];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: pasif || yukleniyor }}
      disabled={pasif || yukleniyor}
      onPress={onPress}
      style={({ pressed }) => [
        stil.buton,
        { backgroundColor: renk.bg, borderColor: renk.kenar, opacity: pasif ? 0.5 : pressed ? 0.8 : 1 },
      ]}>
      {yukleniyor ? (
        <ActivityIndicator color={renk.fg} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {ikon ? <SymbolView name={ikon} tintColor={renk.fg} size={18} /> : null}
          <Text style={{ color: renk.fg, fontWeight: '700', fontSize: yazi.sm }}>{baslik}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Girdi({ etiket, ...p }: TextInputProps & { etiket: string }) {
  const r = useRenkler();
  return (
    <View style={{ gap: bosluk[1] }}>
      <Text style={{ fontSize: yazi.xs, color: r.metin2, fontWeight: '500' }}>{etiket}</Text>
      <TextInput
        accessibilityLabel={etiket}
        placeholderTextColor={r.soluk}
        {...p}
        style={[stil.girdi, { borderColor: r.kenar, color: r.metin, backgroundColor: r.yuzey }, p.style]}
      />
    </View>
  );
}

// Yazarken biçimlenir; numara tamamlanıp geçersizse uyarı gösterir
export function TelefonGirdi({ etiket, value, onChangeText }: { etiket: string; value: string; onChangeText: (v: string) => void }) {
  const r = useRenkler();
  const hatali = value.replace(/\D/g, '').length >= 10 && !telefonGecerli(value);
  return (
    <View style={{ gap: bosluk[1] }}>
      <Girdi etiket={etiket} value={value} onChangeText={(v) => onChangeText(telefonBicimle(v))}
        keyboardType="phone-pad" autoComplete="tel" placeholder="0555 555 55 55" maxLength={20} />
      {hatali ? <Text style={{ fontSize: yazi.xs, color: r.tehlike }}>{t('giris.telefonHatali')}</Text> : null}
    </View>
  );
}

export function Cip({ baslik, secili, onPress }: { baslik: string; secili?: boolean; onPress: () => void }) {
  const r = useRenkler();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: secili }}
      onPress={onPress}
      style={[stil.cip, { backgroundColor: secili ? r.marka : r.yuzey, borderColor: secili ? r.marka : r.kenar }]}>
      <Text style={{ color: secili ? '#fff' : r.metin, fontSize: yazi.xs, fontWeight: '600' }}>{baslik}</Text>
    </Pressable>
  );
}

// iOS anahtarı: açıkken yeşil iz
export function Anahtar({ deger, degistir, etiket }: { deger: boolean; degistir: (v: boolean) => void; etiket: string }) {
  const r = useRenkler();
  return (
    <Switch
      accessibilityLabel={etiket}
      value={deger}
      onValueChange={degistir}
      trackColor={{ false: r.yuzeyAktif, true: r.basari }}
      thumbColor="#FFFFFF"
      {...({ activeThumbColor: '#FFFFFF' } as object)}
      ios_backgroundColor={r.yuzeyAktif}
    />
  );
}

export function Cubuk({ oran, renk }: { oran: number; renk?: string }) {
  const r = useRenkler();
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: r.yuzeyAktif, overflow: 'hidden' }}>
      <View style={{ width: `${Math.min(100, Math.max(0, oran * 100))}%`, height: 8, borderRadius: 4, backgroundColor: renk ?? r.marka }} />
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

// Kart başlıklarındaki renkli ikon kutusu
export function IkonKutu({ ad, renk, zemin, boyut = 36 }: { ad: SymbolViewProps['name']; renk: string; zemin: string; boyut?: number }) {
  return (
    <View style={{ width: boyut, height: boyut, borderRadius: boyut / 3, backgroundColor: zemin, alignItems: 'center', justifyContent: 'center' }}>
      <SymbolView name={ad} tintColor={renk} size={boyut * 0.55} />
    </View>
  );
}

export function BosDurum({ ikon, baslik, alt }: { ikon: SymbolViewProps['name']; baslik: string; alt?: string }) {
  const r = useRenkler();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 10 }}>
      <IkonKutu ad={ikon} renk={r.marka} zemin={r.markaAcik} boyut={64} />
      <Text style={{ fontSize: yazi.base, fontWeight: '700', color: r.metin, textAlign: 'center' }}>{baslik}</Text>
      {alt ? <Text style={{ fontSize: yazi.sm, color: r.soluk, textAlign: 'center' }}>{alt}</Text> : null}
    </View>
  );
}

export function Yukleniyor() {
  return <ActivityIndicator style={{ marginTop: 48 }} />;
}

export function Satir({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: bosluk[2] }, style]}>{children}</View>;
}

const stil = StyleSheet.create({
  buton: { minHeight: 48, borderRadius: yaricap.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  girdi: { minHeight: 44, borderRadius: yaricap.lg, borderWidth: 1, paddingHorizontal: 12, fontSize: yazi.sm },
  cip: { borderRadius: yaricap.tam, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  bildirim: { position: 'absolute', left: 16, right: 16, bottom: 16, backgroundColor: '#1F2937', borderRadius: yaricap.lg, padding: 12 },
});
