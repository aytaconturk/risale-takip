import { programHatasi, programOlustur, programOzeti, type SeciliKitap } from '@/src/api/program';
import { arg, cagrilar, sifirla, sonuclar } from '@/src/test/sahteSupabase';

jest.mock('@/src/lib/supabase', () => require('@/src/test/sahteSupabase').modul);
beforeEach(sifirla);

// p4: Barla + Kastamonu + Emirdağ 1–200, günde 15 sayfa
const p4: SeciliKitap[] = [
  { kitap_id: 'b3', ad: 'Barla Lahikası', sayfa_sayisi: 382, bas: 1, son: 382 },
  { kitap_id: 'b7', ad: 'Kastamonu Lahikası', sayfa_sayisi: 268, bas: 1, son: 268 },
  { kitap_id: 'b10', ad: 'Emirdağ Lahikası', sayfa_sayisi: 557, bas: 1, son: 200 },
];

test('önizleme program_toplam(p4) ile aynı: 850 sayfa, 57 gün', () => {
  expect(programOzeti(p4, 15)).toEqual({ sayfa: 850, gun: 57 });
});

test('doğrulama', () => {
  expect(programHatasi('Lahikalar', p4, 15, '1111100')).toBeNull();
  expect(programHatasi(' ', p4, 15, '1111100')).toBe('program.ad');
  expect(programHatasi('x', [], 15, '1111100')).toBe('program.kitaplar');
  expect(programHatasi('x', [{ ...p4[0], son: 400 }], 15, '1111100')).toBe('program.kitaplar');
  expect(programHatasi('x', p4, 0, '1111100')).toBe('program.gunluk');
  expect(programHatasi('x', p4, 15, '0000000')).toBe('program.gunler');
});

test('oluşturma: özel düzen, tam kitapta bitis boş, sonra programa başlanır', async () => {
  sonuclar.program = { id: 'yeni' };
  sonuclar.programa_basla = 'kp-yeni';
  expect(await programOlustur('Lahikalar', p4, 15, '1111100')).toBe('kp-yeni');
  expect(arg('insert', 0)![0]).toMatchObject({ duzen_modu: 'ozel', okuma_gunleri: '1111100', gorunurluk: 'ozel', olusturan_id: 'ben' });
  expect((arg('insert', 1)![0] as object[]).map((r) => r)).toEqual([
    { program_id: 'yeni', kitap_id: 'b3', sira: 1, baslangic_sayfasi: 1, bitis_sayfasi: null },
    { program_id: 'yeni', kitap_id: 'b7', sira: 2, baslangic_sayfasi: 1, bitis_sayfasi: null },
    { program_id: 'yeni', kitap_id: 'b10', sira: 3, baslangic_sayfasi: 1, bitis_sayfasi: 200 },
  ]);
  expect(cagrilar).toContainEqual(['rpc', ['programa_basla', { p_program_id: 'yeni' }]]);
});

test('her gün okunursa düzen günlük', async () => {
  sonuclar.program = { id: 'yeni' };
  await programOlustur('x', p4, 15, '1111111');
  expect((arg('insert', 0)![0] as { duzen_modu: string }).duzen_modu).toBe('gunluk');
});
