// '@/src/lib/supabase' yerine geçer:
//   jest.mock('@/src/lib/supabase', () => require('@/src/test/sahteSupabase').modul);
// Her sorgu zinciri çağrıları `cagrilar`a yazar; await edilince sonuclar[tablo|rpc] döner.

export const cagrilar: [string, unknown[]][] = [];
export const sonuclar: Record<string, unknown> = {};

function zincir(anahtar: string): unknown {
  const vekil: unknown = new Proxy(
    {},
    {
      get(_, ad) {
        if (ad === 'then') {
          return (ok: (v: unknown) => unknown, red: (e: unknown) => unknown) =>
            Promise.resolve({ data: sonuclar[anahtar] ?? null, error: null }).then(ok, red);
        }
        return (...args: unknown[]) => {
          cagrilar.push([String(ad), args]);
          return vekil;
        };
      },
    },
  );
  return vekil;
}

export const modul = {
  supabase: {
    from: (tablo: string) => (cagrilar.push(['from', [tablo]]), zincir(tablo)),
    rpc: (ad: string, args?: unknown) => (cagrilar.push(['rpc', [ad, args]]), zincir(ad)),
    auth: {
      signInWithPassword: jest.fn(async () => ({ data: {}, error: null })),
      signUp: jest.fn(async () => ({ data: {}, error: null })),
      signOut: jest.fn(async () => ({ error: null })),
    },
  },
  veri: ({ data, error }: { data: unknown; error: unknown }) => {
    if (error) throw error;
    return data;
  },
  benimId: async () => 'ben',
  fonksiyon: jest.fn(async () => ({ durum: 200 })),
};

export function sifirla() {
  cagrilar.length = 0;
  for (const k of Object.keys(sonuclar)) delete sonuclar[k];
  jest.clearAllMocks();
}

// Belirli bir çağrının argümanları (ör. 'upsert', 'update')
export function arg(ad: string, sira = 0) {
  return cagrilar.filter(([a]) => a === ad)[sira]?.[1];
}
