import { ayOzeti, takvim } from '@/src/api/cizelge';
import { ayAraligi, aralikMetni, gunAdi, uzunTarih } from '@/src/lib/bicim';
import { cagrilar, sifirla, sonuclar } from '@/src/test/sahteSupabase';

jest.mock('@/src/lib/supabase', () => require('@/src/test/sahteSupabase').modul);
beforeEach(sifirla);

test('takvim ay sınırlarıyla istenir', async () => {
  sonuclar.takvim = [{ tarih: '2026-10-16', gun_no: 1, durum: 'okundu' }];
  const t = await takvim('c1', '2026-10-01', '2026-10-31');
  expect(cagrilar).toContainEqual(['rpc', ['takvim', { kp_id: 'c1', bas: '2026-10-01', son: '2026-10-31' }]]);
  expect(t[0].durum).toBe('okundu');
});

test('ay ızgarası: Ekim 2026 Perşembe başlar, yıl geçişi', () => {
  expect(ayAraligi('2026-10-25')).toEqual({ bas: '2026-10-01', son: '2026-10-31', bosluk: 3 });
  expect(ayAraligi('2026-12-10', 1)).toEqual({ bas: '2027-01-01', son: '2027-01-31', bosluk: 4 });
  expect(ayAraligi('2026-03-01', -1).son).toBe('2026-02-28');
});

test('ay özeti telafiyi sayar, kısmi ve kaçırılanı saymaz', () => {
  const g = (['okundu', 'telafi', 'kismi', 'kacirildi', 'duraklatma'] as const).map((durum) => ({ durum }));
  expect(ayOzeti(g, 20)).toEqual({ okunanGun: 2, sayfa: 40 });
});

test('tarih ve aralık biçimleri', () => {
  expect(uzunTarih('2026-11-04')).toBe('4 Kasım 2026');
  expect(gunAdi('2026-11-04')).toBe('Çarşamba');
  expect(aralikMetni([
    { kitap_ad: 'Sözler', bas_sayfa: 861, son_sayfa: 862 },
    { kitap_ad: 'Tarihçe-i Hayat', bas_sayfa: 1, son_sayfa: 18 },
  ])).toBe('Sözler 861–862 · Tarihçe-i Hayat 1–18');
});
