import { duraklat, hesabiSil, profilGuncelle, silmeyiIptal } from '@/src/api/ayarlar';
import { arg, cagrilar, modul, sifirla } from '@/src/test/sahteSupabase';

jest.mock('@/src/lib/supabase', () => require('@/src/test/sahteSupabase').modul);
beforeEach(sifirla);

test('profil yalnızca kendi satırını günceller', async () => {
  await profilGuncelle({ hatirlatma_saatleri: ['21:30'] });
  expect(arg('update')).toEqual([{ hatirlatma_saatleri: ['21:30'] }]);
  expect(arg('eq')).toEqual(['id', 'ben']);
});

test('ara verme duraklat rpc ile', async () => {
  await duraklat('c5');
  expect(cagrilar).toContainEqual(['rpc', ['duraklat', { kp_id: 'c5' }]]);
});

test('hesap silme talebi işaretlenir ve oturum kapanır', async () => {
  await hesabiSil();
  expect(Object.keys(arg('update')![0] as object)).toEqual(['silinme_tarihi']);
  expect(modul.supabase.auth.signOut).toHaveBeenCalled();
});

test('silmekten vazgeçince silinme tarihi temizlenir', async () => {
  await silmeyiIptal();
  expect(arg('update')).toEqual([{ silinme_tarihi: null }]);
  expect(arg('eq')).toEqual(['id', 'ben']);
});
