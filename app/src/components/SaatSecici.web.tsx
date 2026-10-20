import { girdiStili } from '@/src/components/ui';
import { useRenkler } from '@/src/lib/tema';

// Tarayıcının kendi saat seçicisi; iPhone Safari/PWA'da saat çarkı açılır
export function SaatSecici({ deger, degistir, etiket }: { deger: string; degistir: (saat: string) => void; etiket: string }) {
  const r = useRenkler();
  const g = girdiStili(r);
  return (
    <input
      type="time"
      aria-label={etiket}
      value={deger}
      onChange={(e) => e.target.value && degistir(e.target.value)}
      style={{
        boxSizing: 'border-box', minHeight: g.minHeight as number, fontSize: 16, padding: '0 12px', fontFamily: 'inherit',
        color: r.metin, backgroundColor: r.yuzey, border: `1px solid ${r.kenar}`, borderRadius: r.rButon, colorScheme: r.koyu ? 'dark' : 'light',
      }}
    />
  );
}
