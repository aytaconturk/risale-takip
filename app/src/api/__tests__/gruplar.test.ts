import { grupKur, hatirlat, hatirlatDurumu } from '@/src/api/gruplar';
import { cagrilar, modul, sifirla } from '@/src/test/sahteSupabase';

jest.mock('@/src/lib/supabase', () => require('@/src/test/sahteSupabase').modul);
beforeEach(sifirla);

test.each([
  [{ geride_gun: 0, hatirlatma_kabul: true, bugun_hatirlatildi: false }, 'yok'],
  [{ geride_gun: 2, hatirlatma_kabul: false, bugun_hatirlatildi: false }, 'kapali'],
  [{ geride_gun: 2, hatirlatma_kabul: true, bugun_hatirlatildi: true }, 'gonderildi'],
  [{ geride_gun: 2, hatirlatma_kabul: true, bugun_hatirlatildi: false }, 'aktif'],
])('hatırlat butonu %o → %s', (u, beklenen) => {
  expect(hatirlatDurumu(u)).toBe(beklenen);
});

test('hatırlatma Edge Function üzerinden gider', async () => {
  await hatirlat('g1', 'k3', 'whatsapp');
  expect(modul.fonksiyon).toHaveBeenCalledWith('hatirlatma-gonder', { grup_id: 'g1', alan_id: 'k3', kanal: 'whatsapp' });
});

test('grup grup_kur rpc ile kurulur', async () => {
  await grupKur('  Perşembe Dersi ', 'p1', '2026-10-22');
  expect(cagrilar).toContainEqual(['rpc', ['grup_kur', { p_ad: 'Perşembe Dersi', p_program_id: 'p1', p_baslangic: '2026-10-22' }]]);
});
