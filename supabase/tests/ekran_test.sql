-- 0010_ekran.sql (seed v2, bugün = 2026-10-25 Pazar)
begin;
create extension if not exists pgtap with schema extensions;
set local app.bugun = '2026-10-25';
select plan(10);

create function pg_temp.u(onek int, no int) returns uuid language sql immutable as $$
  select format('00000000-0000-0000-%s-%s', lpad(to_hex(onek), 4, '0'), lpad(to_hex(no), 12, '0'))::uuid
$$;

-- p4: 850 sayfa, günde 15, hafta içi → 57 okuma günü; 26 Ekim Pazartesi başlayınca 12 Ocak 2027
select is(program_bitis(pg_temp.u(3, 4), '2026-10-26'), '2027-01-12'::date, 'program_bitis: p4');
select is(program_bitis(pg_temp.u(3, 4), '2026-10-26'), bitis_tarihi(pg_temp.u(6, 7)), 'program_bitis: aradan vermeyen c7 ile aynı');
select is(program_bitis(pg_temp.u(3, 1), '2026-10-16'), bitis_tarihi(pg_temp.u(6, 1)), 'program_bitis: p1 / c1');

select is(
  (select row(toplam_sayfa, toplam_gun, bitis)::text from program_onizleme(
    '[{"bas": 1, "son": 382}, {"bas": 1, "son": 268}, {"bas": 1, "son": 200}]', 15, '1111100', '2026-10-26')),
  '(850,57,2027-01-12)', 'program_onizleme: p4 ile aynı sonuç');
select is((select bitis from program_onizleme('[]', 15, '0000000')), null, 'program_onizleme: okuma günü yoksa boş');

select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', json_build_object('sub', pg_temp.u(1, 1))::text, true);
select is(sonraki_ders(pg_temp.u(5, 1)), '2026-10-29'::date, 'sonraki_ders: Pazar → Perşembe');
reset role;

-- Oturumsuz (anon) davet önizlemesi; d3 (z9c4p0) kullanılmamış, d1 (a7f3k9) kullanılmış
-- son_gecerlilik gerçek saate göre kontrol edilir; test tarihten bağımsız olsun
update davetler set son_gecerlilik = now() + interval '1 day' where token = 'z9c4p0';
set local role anon;
select results_eq(
  $$select grup_ad, davet_eden, program_ad, ders_gunu, konum, uye_sayisi, gecerli from davet_onizleme(' Z9C4P0 ')$$,
  $$values ('Perşembe Dersi', 'Ömer Talha', '20 sayfalık okuma', 'persembe', 'Fatih Camii yanı dershane', 3, true)$$,
  'davet_onizleme: geçerli davet');
select is((select gecerli from davet_onizleme('wh5t2n')), false, 'davet_onizleme: iptal edilen davet geçersiz');
select is((select gecerli from davet_onizleme('a7f3k9')), false, 'davet_onizleme: kullanılmış kişisel davet geçersiz');
select is((select count(*)::int from davetler), 0, 'anon davetler tablosunu doğrudan göremez');
reset role;

select * from finish();
rollback;
