import { ilerlemeVerisi, kitapIlerlemesi } from '@/src/api/ilerleme';
import { sifirla, sonuclar } from '@/src/test/sahteSupabase';

jest.mock('@/src/lib/supabase', () => require('@/src/test/sahteSupabase').modul);
beforeEach(sifirla);

test('okunan sayfa kitaplara sırayla dağıtılır', () => {
  const k = [{ kitap_ad: 'Sözler', uzunluk: 862 }, { kitap_ad: 'Tarihçe-i Hayat', uzunluk: 725 }, { kitap_ad: 'Mektubat', uzunluk: 562 }];
  expect(kitapIlerlemesi(k, 880).map((x) => x.okunan)).toEqual([862, 18, 0]);
  expect(kitapIlerlemesi(k, 0).map((x) => x.okunan)).toEqual([0, 0, 0]);
});

test('kısmi kitap aralığı uzunluğa yansır (p4 Emirdağ 1–200)', async () => {
  sonuclar.ilerleme = { okunan_sayfa: 700 };
  sonuclar.bitis_tarihi = '2027-02-12';
  sonuclar.program_kitaplari = [
    { sira: 1, baslangic_sayfasi: 1, bitis_sayfasi: null, kitaplar: { ad: 'Barla Lahikası', sayfa_sayisi: 382 } },
    { sira: 2, baslangic_sayfasi: 1, bitis_sayfasi: null, kitaplar: { ad: 'Kastamonu Lahikası', sayfa_sayisi: 268 } },
    { sira: 3, baslangic_sayfasi: 1, bitis_sayfasi: 200, kitaplar: { ad: 'Emirdağ Lahikası', sayfa_sayisi: 557 } },
  ];
  const v = await ilerlemeVerisi({ id: 'c7', program_id: 'p4' });
  expect(v.kitaplar.map((k) => [k.uzunluk, k.okunan])).toEqual([[382, 382], [268, 268], [200, 50]]);
  expect(v.bitis).toBe('2027-02-12');
});
