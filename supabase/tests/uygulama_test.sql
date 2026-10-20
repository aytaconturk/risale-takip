-- 0005_uygulama.sql yardımcıları (seed v2, bugün = 2026-10-25 Pazar)
begin;
create extension if not exists pgtap with schema extensions;
set local app.bugun = '2026-10-25';
select plan(6);

create function pg_temp.u(onek int, no int) returns uuid language sql immutable as $$
  select format('00000000-0000-0000-%s-%s', lpad(to_hex(onek), 4, '0'), lpad(to_hex(no), 12, '0'))::uuid
$$;

-- c3 (k1, g1): 22–25 Ekim okundu
select results_eq(
  format('select tarih::text, durum from bu_hafta(%L)', pg_temp.u(6, 3)),
  $$values ('2026-10-19', 'bos'), ('2026-10-20', 'bos'), ('2026-10-21', 'bos'),
           ('2026-10-22', 'okundu'), ('2026-10-23', 'okundu'), ('2026-10-24', 'okundu'), ('2026-10-25', 'okundu')$$,
  'bu_hafta: c3');
select is((select count(*)::int from geride_gunler(pg_temp.u(6, 3))), 0, 'geride_gunler: c3 yok');
delete from okuma_kayitlari where id = pg_temp.u(9, 13);
select results_eq(format('select gun_no from geride_gunler(%L)', pg_temp.u(6, 3)), $$values (3)$$,
  'geride_gunler: c3 3. gün');
-- c5: 7. gün bugün kısmi okundu → geride sayılmaz
select is((select count(*)::int from geride_gunler(pg_temp.u(6, 5))), 0, 'geride_gunler: bugünkü kısmi gün hariç');

select set_config('role', 'authenticated', true),
       set_config('request.jwt.claims', json_build_object('sub', pg_temp.u(1, 3))::text, true);
select is(kullanici_bugun(), '2026-10-25'::date, 'kullanici_bugun');
create temp table yeni as select programa_basla(pg_temp.u(3, 2)) as id;
select is((select baslangic_tarihi from kullanici_program where id = (select id from yeni)), '2026-10-25'::date,
  'programa_basla: bugünden başlar');
reset role;

select * from finish();
rollback;
