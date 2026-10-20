import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { create } from 'zustand';

// Okuma oturumu (Odak modu ve geniş ekrandaki oturum kartı) yalnızca istemcide tutulur; veritabanına süre yazılmaz.
type Odak = {
  anahtar: string | null; // "kpId:gun" — başka güne geçilince oturum sıfırlanır
  calisiyor: boolean;
  saniye: number;
  okunan: number;
  baslangicOkunan: number;
  hazirla: (anahtar: string, baslangicOkunan: number) => void;
  cevir: (gunluk: number) => void;
  geri: () => void;
  calistir: (acik: boolean) => void;
  sifirla: () => void;
};

const bos = { anahtar: null, calisiyor: false, saniye: 0, okunan: 0, baslangicOkunan: 0 };

export const useOdak = create<Odak>()((set) => ({
  ...bos,
  hazirla: (anahtar, baslangicOkunan) =>
    set((s) => (s.anahtar === anahtar ? s : { ...bos, anahtar, baslangicOkunan })),
  cevir: (gunluk) => set((s) => (s.baslangicOkunan + s.okunan >= gunluk ? s : { okunan: s.okunan + 1 })),
  geri: () => set((s) => ({ okunan: Math.max(0, s.okunan - 1) })),
  calistir: (calisiyor) => set({ calisiyor }),
  sifirla: () => set(bos),
}));

// Çalışırken saniye sayar, ekranı açık tutar; uygulama arka plana geçince (webde sekme gizlenince) durur.
export function useOdakZamanlayici() {
  const calisiyor = useOdak((s) => s.calisiyor);
  useEffect(() => {
    if (!calisiyor) return;
    const id = setInterval(() => useOdak.setState((s) => ({ saniye: s.saniye + 1 })), 1000);
    const dinle = AppState.addEventListener('change', (d) => d !== 'active' && useOdak.getState().calistir(false));
    activateKeepAwakeAsync('odak').catch(() => {});
    return () => {
      clearInterval(id);
      dinle.remove();
      deactivateKeepAwake('odak').catch(() => {});
    };
  }, [calisiyor]);
}
