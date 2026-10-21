-- Hesap silme: 30 gün dolmadan dokunulmaz, dolunca kişisel veriler anonimleşir
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

create function pg_temp.u(onek int, no int) returns uuid language sql immutable as $$
  select format('00000000-0000-0000-%s-%s', lpad(to_hex(onek), 4, '0'), lpad(to_hex(no), 12, '0'))::uuid
$$;

-- k3: 31 gün önce silmek istedi; k4: 10 gün önce (hâlâ vazgeçebilir)
update kullanici set silinme_tarihi = now() - interval '31 days' where id = pg_temp.u(1, 3);
update kullanici set silinme_tarihi = now() - interval '10 days' where id = pg_temp.u(1, 4);
insert into notlar (kullanici_id, kitap_id, metin) select pg_temp.u(1, 3), id, 'kişisel not' from kitaplar limit 1;

select is(hesaplari_anonimlestir(), 1, 'yalnızca 30 günü dolan hesap');
select is((select ad from kullanici where id = pg_temp.u(1, 3)), 'Silinmiş kullanıcı', 'profil anonim');
select is((select email from auth.users where id = pg_temp.u(1, 3)), null, 'giriş e-postası silindi');
select is((select raw_user_meta_data from auth.users where id = pg_temp.u(1, 3)), '{}'::jsonb, 'kayıt bilgileri silindi');
select is((select count(*)::int from auth.identities where user_id = pg_temp.u(1, 3)), 0, 'kimlik kaydı silindi');
select is((select count(*)::int from notlar where kullanici_id = pg_temp.u(1, 3)), 0, 'notlar silindi');
select is((select count(*)::int from kullanici_program where kullanici_id = pg_temp.u(1, 3) and durum in ('aktif', 'duraklatildi')), 0,
  'programlardan çıkıldı');
select isnt((select email from auth.users where id = pg_temp.u(1, 4)), null, '30 günü dolmayan hesaba dokunulmadı');

select * from finish();
rollback;
