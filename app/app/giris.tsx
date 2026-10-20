import { View } from 'react-native';

import { GirisFormu } from '@/src/components/GirisFormu';
import { useRenkler } from '@/src/lib/tema';

export default function Giris() {
  const r = useRenkler();
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 16, backgroundColor: r.zemin }}>
      <GirisFormu />
    </View>
  );
}
