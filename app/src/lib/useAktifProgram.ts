import { useQuery } from '@tanstack/react-query';

import { bugun, programlarim } from '@/src/api/bugun';
import { useUi } from '@/src/store';

// Seçili (yoksa ilk) okuma programı; birden çok ekran paylaşır.
export function useAktifProgram() {
  const seciliId = useUi((s) => s.seciliKpId);
  const q = useQuery({ queryKey: ['programlarim'], queryFn: programlarim });
  return { ...q, kp: q.data?.find((p) => p.id === seciliId) ?? q.data?.[0] };
}

export function useBugun() {
  return useQuery({ queryKey: ['kullanici_bugun'], queryFn: bugun }).data;
}
