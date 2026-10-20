import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type TemaTercihi = 'sistem' | 'acik' | 'koyu';
export type Sekme = 'bugun' | 'cizelge' | 'ilerleme' | 'gruplar' | 'notlar';

// Yalnızca UI durumu; sunucu verisi TanStack Query'de.
type UiDurumu = {
  seciliKpId: string | null;
  bildirim: string | null;
  tema: TemaTercihi;
  klavye: boolean;
  sonSekme: Sekme;
  kpSec: (id: string) => void;
  bildir: (metin: string) => void;
  temaSec: (tema: TemaTercihi) => void;
  klavyeSec: (acik: boolean) => void;
  sekmeSec: (s: Sekme) => void;
};

let zamanlayici: ReturnType<typeof setTimeout> | undefined;

export const useUi = create<UiDurumu>()(
  persist(
    (set) => ({
      seciliKpId: null,
      bildirim: null,
      tema: 'sistem',
      klavye: false,
      sonSekme: 'bugun',
      kpSec: (id) => set({ seciliKpId: id }),
      bildir: (metin) => {
        clearTimeout(zamanlayici);
        set({ bildirim: metin });
        zamanlayici = setTimeout(() => set({ bildirim: null }), 2600);
      },
      temaSec: (tema) => set({ tema }),
      klavyeSec: (klavye) => set({ klavye }),
      sekmeSec: (sonSekme) => set({ sonSekme }),
    }),
    { name: 'ui', storage: createJSONStorage(() => AsyncStorage), partialize: (s) => ({ tema: s.tema, sonSekme: s.sonSekme }) },
  ),
);
