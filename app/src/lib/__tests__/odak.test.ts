import { oturumSayfasi, sayfaKaydet } from '@/src/api/bugun';
import { useOdak } from '@/src/lib/odak';
import { arg, sifirla } from '@/src/test/sahteSupabase';

jest.mock('@/src/lib/supabase', () => require('@/src/test/sahteSupabase').modul);
beforeEach(() => {
  sifirla();
  useOdak.getState().sifirla();
});

const cevir = (n: number, gunluk = 20) => {
  for (let i = 0; i < n; i++) useOdak.getState().cevir(gunluk);
};
const bitir = async (gunluk = 20) => {
  const { baslangicOkunan, okunan } = useOdak.getState();
  await sayfaKaydet('c1', 30, oturumSayfasi(baslangicOkunan, okunan, gunluk), gunluk);
  return (arg('upsert')![0] as { okunan_sayfa: number | null }).okunan_sayfa;
};

test('7 sayfa çevirip bitirince kısmi 7 kaydedilir', async () => {
  useOdak.getState().hazirla('c1:30', 0);
  cevir(7);
  expect(await bitir()).toBe(7);
});

test('önceki kısmi kaydın üstüne eklenir', async () => {
  useOdak.getState().hazirla('c1:30', 5);
  cevir(7);
  expect(await bitir()).toBe(12);
});

test('20 ve üstünde tam okuma (okunan_sayfa boş); sayaç günlük sayfayı geçmez', async () => {
  useOdak.getState().hazirla('c1:30', 15);
  cevir(9);
  expect(useOdak.getState().okunan).toBe(5);
  expect(await bitir()).toBeNull();
});

test('aynı gün için oturum korunur, başka güne geçince sıfırlanır', () => {
  useOdak.getState().hazirla('c1:30', 0);
  cevir(3);
  useOdak.setState({ saniye: 42 });
  useOdak.getState().hazirla('c1:30', 0);
  expect(useOdak.getState().okunan).toBe(3);
  useOdak.getState().hazirla('c1:31', 0);
  expect(useOdak.getState()).toMatchObject({ okunan: 0, saniye: 0, anahtar: 'c1:31' });
});
