import { davetDurumu, davetOlustur, uyeCikar } from '@/src/api/grupAyarlari';
import { arg, modul, sifirla, sonuclar } from '@/src/test/sahteSupabase';

jest.mock('@/src/lib/supabase', () => require('@/src/test/sahteSupabase').modul);
beforeEach(sifirla);

test('davet durumu: iptal > kullanıldı > geçerli', () => {
  expect(davetDurumu({ tip: 'genel', iptal_tarihi: '2026-10-25T07:00:00Z', kullanan_id: null })).toBe('iptal');
  expect(davetDurumu({ tip: 'kisisel', iptal_tarihi: null, kullanan_id: 'k1' })).toBe('kullanildi');
  expect(davetDurumu({ tip: 'genel', iptal_tarihi: null, kullanan_id: null })).toBe('gecerli');
});

test('davet Edge Function ile oluşturulur', async () => {
  await davetOlustur('g1', 'kisisel', '+905555555557');
  expect(modul.fonksiyon).toHaveBeenCalledWith('davet-olustur', { grup_id: 'g1', tip: 'kisisel', telefon: '+905555555557' });
});

test('üye çıkarma kullanıcının yerel bugünüyle yazılır', async () => {
  sonuclar.kullanici_bugun = '2026-10-25';
  await uyeCikar('c6');
  expect(arg('update')).toEqual([{ durum: 'cikarildi', durum_tarihi: '2026-10-25' }]);
  expect(arg('eq')).toEqual(['id', 'c6']);
});
