import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GirisFormu } from '@/src/components/GirisFormu';
import { useDuzen } from '@/src/lib/duzen';
import { useRenkler } from '@/src/lib/tema';

export default function Giris() {
  const r = useRenkler();
  const { genis } = useDuzen();
  const ic = useSafeAreaInsets();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: r.zemin }} keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingTop: ic.top + 24, paddingBottom: Math.max(ic.bottom, 16) + 20, paddingHorizontal: genis ? 40 : 16 }}>
      <View style={{ width: '100%', maxWidth: 440, alignSelf: genis ? 'center' : 'flex-start' }}>
        <GirisFormu />
      </View>
    </ScrollView>
  );
}
