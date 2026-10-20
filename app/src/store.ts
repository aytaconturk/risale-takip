import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type TemaTercihi = 'sistem' | 'acik' | 'koyu';

// Yalnızca UI durumu; sunucu verisi TanStack Query'de.
type UiDurumu = {
  seciliKpId: string | null;
  bildirim: string | null;
  tema: TemaTercihi;
  kpSec: (id: string) => void;
  bildir: (metin: string) => void;
  temaSec: (tema: TemaTercihi) => void;
};

let zamanlayici: ReturnType<typeof setTimeout> | undefined;

export const useUi = create<UiDurumu>()(
  persist(
    (set) => ({
      seciliKpId: null,
      bildirim: null,
      tema: 'sistem',
      kpSec: (id) => set({ seciliKpId: id }),
      bildir: (metin) => {
        clearTimeout(zamanlayici);
        set({ bildirim: metin });
        zamanlayici = setTimeout(() => set({ bildirim: null }), 2500);
      },
      temaSec: (tema) => set({ tema }),
    }),
    { name: 'ui', storage: createJSONStorage(() => AsyncStorage), partialize: (s) => ({ tema: s.tema }) },
  ),
);
