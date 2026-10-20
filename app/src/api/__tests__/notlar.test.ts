import { notEkle } from '@/src/api/notlar';
import { arg, sifirla } from '@/src/test/sahteSupabase';

jest.mock('@/src/lib/supabase', () => require('@/src/test/sahteSupabase').modul);
beforeEach(sifirla);

test('boş not eklenmez', async () => {
  await expect(notEkle({ kitap_id: 'b1', sayfa: null, metin: '   ', grupla_paylas: null })).rejects.toThrow();
  expect(arg('insert')).toBeUndefined();
});

test('not kırpılır ve kendi adına grupla paylaşılır', async () => {
  await notEkle({ kitap_id: 'b1', sayfa: 47, metin: ' Onuncu Söz ', grupla_paylas: 'g1' });
  expect(arg('insert')).toEqual([{ kitap_id: 'b1', sayfa: 47, metin: 'Onuncu Söz', grupla_paylas: 'g1', kullanici_id: 'ben' }]);
});
