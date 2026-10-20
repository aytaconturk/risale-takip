import { girisYap, kayitOl } from '@/src/api/giris';
import { telefonBicimle, telefonGecerli, telefonNormalize } from '@/src/lib/bicim';
import { modul, sifirla } from '@/src/test/sahteSupabase';

jest.mock('@/src/lib/supabase', () => require('@/src/test/sahteSupabase').modul);
jest.mock('expo-linking', () => ({ createURL: (yol: string) => `https://ornek${yol}` }));
beforeEach(sifirla);

test.each([
  ['0555 555 55 54', '+905555555554'],
  ['555 555 5554', '+905555555554'],
  ['+90 (555) 555-55-54', '+905555555554'],
  ['0049 151 12345678', '+4915112345678'],
])('telefonNormalize(%s)', (girdi, beklenen) => {
  expect(telefonNormalize(girdi)).toBe(beklenen);
});

test.each([
  ['05555555554', '0555 555 55 54'],
  ['+4915112345678', '+49 1511 2345678'],
])('telefonBicimle(%s)', (girdi, beklenen) => {
  expect(telefonBicimle(girdi)).toBe(beklenen);
});

test('telefonGecerli: eksik hane ve geçersiz alan kodu reddedilir', () => {
  expect(telefonGecerli('0555 555 55 54')).toBe(true);
  expect(telefonGecerli('+49 1511 2345678')).toBe(true);
  expect(telefonGecerli('0555 555 55')).toBe(false);
  expect(telefonGecerli('0111 111 11 11')).toBe(false);
});

test('kayıtta telefon E.164 olarak metadata ile gider', async () => {
  // sahte signUp oturum döndürmez: e-posta doğrulaması bekleniyor
  expect(await kayitOl({ ad: ' Ali ', soyad: '', eposta: ' ali@test.com ', telefon: '0555 555 55 54', sifre: 'gizli12' })).toBe(true);
  expect(modul.supabase.auth.signUp).toHaveBeenCalledWith({
    email: 'ali@test.com', password: 'gizli12',
    options: { emailRedirectTo: 'https://ornek/', data: { ad: 'Ali', soyad: '', telefon: '+905555555554' } },
  });
  await girisYap(' ali@test.com', 'gizli12');
  expect(modul.supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'ali@test.com', password: 'gizli12' });
});
