-- CLAUDE.md "Kabul testleri" (seed v2, bugün = 2026-10-25)
-- Kodlar seed_uret.py ile aynı uuid'lere eşlenir: k=1, b=2, p=3, g=5, c=6, d=8, o=9, h=10, n=11.
begin;
create extension if not exists pgtap with schema extensions;
set local app.bugun = '2026-10-25';
select plan(35);

create function pg_temp.u(onek int, no int) returns uuid language sql immutable as $$
  select format('00000000-0000-0000-%s-%s', lpad(to_hex(onek), 4, '0'), lpad(to_hex(no), 12, '0'))::uuid
$$;
create function pg_temp.olarak(k int) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', pg_temp.u(1, k), 'role', 'authenticated')::text, true)
$$;

-- 1
select is(bugunku_gun_no(pg_temp.u(6, 1), '2026-10-21'), 6, '1: c1 21 Ekim = 6. gün');
select is((select telafi_mi from okuma_kayitlari where id = pg_temp.u(9, 5)), true, '1: o5 telafi');
select is((select telafi_mi from okuma_kayitlari where id = pg_temp.u(9, 4)), false, '1: o4 telafi değil');

-- 2
select is(bugunku_gun_no(pg_temp.u(6, 3)), 4, '2: c3 bugün = 4. gün');
select is((ilerleme(pg_temp.u(6, 2))).geride_gun, 0, '2: c2 geride değil');
select is((ilerleme(pg_temp.u(6, 3))).geride_gun, 0, '2: c3 geride değil');

-- 3
select is((ilerleme(pg_temp.u(6, 4))).geride_gun, 0, '3: c4 toplu telafi sonrası geride değil');
select is((select durum from hatirlatmalar where id = pg_temp.u(10, 3)), 'engellendi', '3: h3 engellendi');
select throws_ok(
  format($$insert into hatirlatmalar (grup_id, gonderen_id, alan_id, gun_no, kanal, tarih, durum)
           values (%L, %L, %L, 4, 'push', '2026-10-25', 'gonderildi')$$, pg_temp.u(5, 1), pg_temp.u(1, 2), pg_temp.u(1, 3)),
  '23505', null, '3: aynı gün k2→k3 ikinci hatırlatma yazılmaz');

-- 4
select is(bugunku_gun_no(pg_temp.u(6, 5)), 7, '4: c5 duraklatma sonrası 7. gün');
select is((ilerleme(pg_temp.u(6, 5))).tamamlanan_gun, 6, '4: c5 kısmi gün tamamlanmış sayılmaz');

-- 6
select is((select row(toplam_sayfa, toplam_gun)::text from program_toplam(pg_temp.u(3, 4))), '(850,57)', '6: p4 toplam');
select results_eq(
  format('select kitap_ad, bas_sayfa, son_sayfa from gun_araligi(%L, 26)', pg_temp.u(3, 4)),
  $$values ('Barla Lahikası', 376, 382), ('Kastamonu Lahikası', 1, 8)$$,
  '6: p4 26. gün iki kitaba taşar');
select is(bugunku_gun_no(pg_temp.u(6, 7), '2026-10-31'), bugunku_gun_no(pg_temp.u(6, 7), '2026-10-30'),
  '6: p4 cumartesi gün saymaz');
select is(bugunku_gun_no(pg_temp.u(6, 7), '2026-10-25'), 0, '6: başlangıçtan önce 0');

-- 8
select results_eq(
  format('select kitap_ad, bas_sayfa, son_sayfa from gun_araligi(%L, 44)', pg_temp.u(3, 1)),
  $$values ('Sözler', 861, 862), ('Tarihçe-i Hayat', 1, 18)$$,
  '8: p1 44. gün iki satır');

-- Trigger: toplam günü aşan kayıt reddedilir
select throws_like(
  format($$insert into okuma_kayitlari (kullanici_program_id, gun_no, okunma_tarihi) values (%L, 58, '2027-12-31')$$, pg_temp.u(6, 7)),
  '%aşıyor%', 'trigger: gun_no > toplam_gun hata');

-- 5
select is((select count(*)::int from grup_durumu(pg_temp.u(5, 1))), 3, '5: g1 aktif üyeleri (k1, k2, k3)');
select pg_temp.olarak(4);
select is(davet_kabul('wh5t2n') ->> 'durum', '410', '5: iptal edilen d4 → 410');
reset role;
select pg_temp.olarak(2);
select is((select count(*)::int from grup_durumu(pg_temp.u(5, 1)) where kullanici_id = pg_temp.u(1, 5)), 0,
  '5: çıkarılan k5 grup durumunda yok');
reset role;

-- 7
select pg_temp.olarak(3);
select is((select count(*)::int from notlar where id = pg_temp.u(11, 1)), 1, '7: k3 n1 notunu görür');
select is((select count(*)::int from notlar where id = pg_temp.u(11, 2)), 0, '7: k3 n2 notunu görmez');
reset role;
select pg_temp.olarak(4);
select is((select count(*)::int from notlar where id = pg_temp.u(11, 2)), 1, '7: k4 kendi notunu görür');

-- 9
select is((select count(*)::int from okuma_kayitlari o join kullanici_program kp on kp.id = o.kullanici_program_id
           where kp.grup_id = pg_temp.u(5, 1)), 0, '9: k4 g1 okuma kayıtlarını görmez');
reset role;
select pg_temp.olarak(1);
select ok((select count(*) from okuma_kayitlari where kullanici_program_id = pg_temp.u(6, 2)) > 0,
  '9: k1 (g1 üyesi) k2 kayıtlarını görür');
reset role;

-- gunluk-hatirlatma: k4 (22:00) 7. günü kısmi okudu → aday; k1 (21:30) bugünü okudu → aday değil
select is((select array_agg(kullanici_id) from gunluk_hatirlatma_adaylari('2026-10-25 22:05+03')),
  array[pg_temp.u(1, 4)], 'cron: 22:05 adayı yalnızca k4');
select is((select count(*)::int from gunluk_hatirlatma_adaylari('2026-10-25 21:35+03')), 0, 'cron: 21:35 aday yok');
-- Birden fazla saat: k4 07:00 ve 22:00
update kullanici set hatirlatma_saatleri = '{07:00,22:00}' where id = pg_temp.u(1, 4);
select ok(pg_temp.u(1, 4) = any(array(select kullanici_id from gunluk_hatirlatma_adaylari('2026-10-25 07:05+03'))), 'cron: k4 07:05 aday');
select ok(pg_temp.u(1, 4) = any(array(select kullanici_id from gunluk_hatirlatma_adaylari('2026-10-25 22:05+03'))), 'cron: k4 22:05 hâlâ aday');
select is((select count(*)::int from cron.job where jobname = 'gunluk-hatirlatma' and schedule = '*/15 * * * *'), 1,
  'cron: 15 dakikada bir zamanlandı');

-- Edge Function rpc'leri
select pg_temp.olarak(1);
select throws_ok($$select davet_olustur('00000000-0000-0000-0005-000000000001', 'genel')$$, '42501', null,
  'davet_olustur: üye davet açamaz');
reset role;
select pg_temp.olarak(2);
select matches((davet_olustur(pg_temp.u(5, 1), 'genel')).token, '^[a-z2-9]{6}$', 'davet_olustur: 6 karakter token');
select is(hatirlatma_gonder(pg_temp.u(5, 1), pg_temp.u(1, 3), 'push') ->> 'durum', '409', 'hatirlatma: geride olmayana 409');
reset role;
delete from okuma_kayitlari where id = pg_temp.u(9, 13); -- k1 (c3) 3. günü okumamış olsun
select pg_temp.olarak(2);
select is(hatirlatma_gonder(pg_temp.u(5, 1), pg_temp.u(1, 1), 'whatsapp') ->> 'telefon', '+905555555554', 'hatirlatma: geride olana 200');
select is(hatirlatma_gonder(pg_temp.u(5, 1), pg_temp.u(1, 1), 'push') ->> 'durum', '429', 'hatirlatma: aynı gün ikincisi 429');
reset role;

select * from finish();
rollback;
