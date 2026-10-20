import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

import { Cip } from '@/src/components/ui';
import { ceyrek } from '@/src/lib/bicim';
import { useRenkler } from '@/src/lib/tema';

const tarih = (saat: string) => {
  const [s, d] = saat.split(':').map(Number);
  const t = new Date();
  t.setHours(s, d, 0, 0);
  return t;
};
const metin = (t: Date) => ceyrek(`${t.getHours()}:${t.getMinutes()}`);

// iOS: saat çarkı (alarm kurar gibi), dakikalar 15'er; Android: sistem saat penceresi, seçim çeyreğe yuvarlanır
export function SaatSecici({ deger, degistir, etiket }: { deger: string; degistir: (saat: string) => void; etiket: string }) {
  const r = useRenkler();
  if (Platform.OS === 'ios') {
    return (
      <DateTimePicker accessibilityLabel={etiket} value={tarih(deger)} mode="time" display="compact" locale="tr-TR" minuteInterval={15}
        themeVariant={r.koyu ? 'dark' : 'light'} accentColor={r.vurgu} onChange={(_, t) => t && degistir(metin(t))} />
    );
  }
  return (
    <Cip baslik={deger} onPress={() => DateTimePickerAndroid.open({
      value: tarih(deger), mode: 'time', is24Hour: true, onChange: (e, t) => e.type === 'set' && t && degistir(metin(t)),
    })} />
  );
}
