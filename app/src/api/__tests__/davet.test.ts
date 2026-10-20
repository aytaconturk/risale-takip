import { davetKabul, davetOnizleme, kabulMesaji } from '@/src/api/davet';
import { cagrilar, modul, sifirla, sonuclar } from '@/src/test/sahteSupabase';

jest.mock('@/src/lib/supabase', () => require('@/src/test/sahteSupabase').modul);
beforeEach(sifirla);

test.each([
  [200, 'davet.katildiniz'],
  [409, 'davet.zatenUye'],
  [410, 'davet.gecersiz'],
  [404, 'davet.bulunamadi'],
  [500, 'genel.hata'],
])('davet-kabul %i → %s', (durum, anahtar) => {
  expect(kabulMesaji(durum)).toBe(anahtar);
});

test('token Edge Function\'a iletilir', async () => {
  modul.fonksiyon.mockResolvedValueOnce({ durum: 410 });
  expect((await davetKabul('wh5t2n')).durum).toBe(410);
  expect(modul.fonksiyon).toHaveBeenCalledWith('davet-kabul', { token: 'wh5t2n' });
});

test('önizleme davet_onizleme RPC\'sinden gelir', async () => {
  sonuclar.davet_onizleme = { grup_ad: 'Perşembe Dersi', gecerli: true };
  expect((await davetOnizleme('z9c4p0'))?.grup_ad).toBe('Perşembe Dersi');
  expect(cagrilar).toContainEqual(['rpc', ['davet_onizleme', { p_token: 'z9c4p0' }]]);
});
