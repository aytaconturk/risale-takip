import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { useUi } from '@/src/store';

// Uygulama son açık sekmeyle açılır (kalıcı depodan okunur)
export default function Kok() {
  const [hazir, setHazir] = useState(useUi.persist.hasHydrated());
  const sonSekme = useUi((s) => s.sonSekme);
  useEffect(() => useUi.persist.onFinishHydration(() => setHazir(true)), []);
  if (!hazir) return null;
  return <Redirect href={`/${sonSekme}`} />;
}
