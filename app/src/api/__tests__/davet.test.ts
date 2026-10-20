import { davetKabul, kabulMesaji } from '@/src/api/davet';
import { modul, sifirla } from '@/src/test/sahteSupabase';

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
