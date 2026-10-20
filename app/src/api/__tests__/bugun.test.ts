import { bugunVerisi, cetvelDokunus, gunuIsaretle, sayfaKaydet, topluTelafi } from '@/src/api/bugun';
import { arg, cagrilar, sifirla, sonuclar } from '@/src/test/sahteSupabase';

jest.mock('@/src/lib/supabase', () => require('@/src/test/sahteSupabase').modul);
beforeEach(sifirla);

const rpcler = () => cagrilar.filter(([a]) => a === 'rpc').map(([, [ad]]) => ad);

test('program başlamadıysa gün aralığı istenmez', async () => {
  sonuclar.ilerleme = { bugunku_gun: 0 };
  sonuclar.kullanici_bugun = '2026-10-25';
  const v = await bugunVerisi({ id: 'c7', program_id: 'p4' });
  expect(v.aralik).toEqual([]);
  expect(rpcler()).not.toContain('gun_araligi');
});

test('bugünkü aralık bugunku_gun ile istenir; tarih hesabı SQL\'de', async () => {
  sonuclar.ilerleme = { bugunku_gun: 44 };
  sonuclar.gun_araligi = [{ kitap_ad: 'Sözler', bas_sayfa: 861, son_sayfa: 862 }];
  const v = await bugunVerisi({ id: 'c1', program_id: 'p1' });
  expect(rpcler()).toEqual(expect.arrayContaining(['ilerleme', 'bu_hafta', 'geride_gunler', 'kullanici_bugun', 'gun_araligi']));
  expect(cagrilar).toContainEqual(['rpc', ['gun_araligi', { p_program_id: 'p1', p_gun_no: 44 }]]);
  expect(v.aralik).toHaveLength(1);
});

test('tam okuma kısmi kaydın üzerine yazar (okunan_sayfa boş)', async () => {
  await gunuIsaretle('c1', 7);
  expect(arg('upsert')).toEqual([
    { kullanici_program_id: 'c1', gun_no: 7, okunan_sayfa: null, kaynak: 'uygulama' },
    { onConflict: 'kullanici_program_id,gun_no' },
  ]);
});

test('kısmi okuma sayfa sayısıyla yazılır', async () => {
  await gunuIsaretle('c5', 7, 6);
  expect((arg('upsert')![0] as { okunan_sayfa: number }).okunan_sayfa).toBe(6);
});

test('toplu telafi tek istekte kaynak=toplu', async () => {
  await topluTelafi('c4', [2, 3]);
  expect(cagrilar.filter(([a]) => a === 'upsert')).toHaveLength(1);
  expect(arg('upsert')![0]).toEqual([
    { kullanici_program_id: 'c4', gun_no: 2, okunan_sayfa: null, kaynak: 'toplu' },
    { kullanici_program_id: 'c4', gun_no: 3, okunan_sayfa: null, kaynak: 'toplu' },
  ]);
});

test('kısmi kayıtlar gün numarasına göre döner; bugünkü kısmi ayrıca verilir', async () => {
  sonuclar.ilerleme = { bugunku_gun: 7 };
  sonuclar.okuma_kayitlari = [{ gun_no: 3, okunan_sayfa: 12 }, { gun_no: 7, okunan_sayfa: 6 }];
  const v = await bugunVerisi({ id: 'c5', program_id: 'p1' });
  expect(v.kismiler).toEqual({ 3: 12, 7: 6 });
  expect(v.kismiSayfa).toBe(6);
});

describe('sayfa cetveli', () => {
  test('i. kutuya dokununca i+1 sayfa okunmuş sayılır', () => {
    expect(cetvelDokunus(0, 11)).toBe(12);
    expect(cetvelDokunus(12, 4)).toBe(5);
    expect(cetvelDokunus(5, 19)).toBe(20);
  });
  test('son dolu kutuya dokunmak bir sayfa geri alır', () => {
    expect(cetvelDokunus(12, 11)).toBe(11);
    expect(cetvelDokunus(1, 0)).toBe(0);
  });

  test('12. kutu kısmi 12 yazar', async () => {
    await sayfaKaydet('c1', 30, cetvelDokunus(0, 11), 20);
    expect((arg('upsert')![0] as { okunan_sayfa: number }).okunan_sayfa).toBe(12);
  });
  test('20. kutu tam okuma yazar (okunan_sayfa boş)', async () => {
    await sayfaKaydet('c1', 30, cetvelDokunus(12, 19), 20);
    expect((arg('upsert')![0] as { okunan_sayfa: number | null }).okunan_sayfa).toBeNull();
  });
  test('0 sayfa kaydı siler', async () => {
    await sayfaKaydet('c1', 30, cetvelDokunus(1, 0), 20);
    expect(cagrilar.map(([a]) => a)).toEqual(['from', 'delete', 'eq', 'eq']);
    expect(arg('eq', 1)).toEqual(['gun_no', 30]);
  });
});

test('kısmen okudum: stepper değeri kısmi olarak kaydedilir', async () => {
  await sayfaKaydet('c1', 30, 7, 20);
  expect(arg('upsert')![0]).toEqual({ kullanici_program_id: 'c1', gun_no: 30, okunan_sayfa: 7, kaynak: 'uygulama' });
});
