-- Hesaplama fonksiyonları. Çizelge saklanmaz; okuma_kayitlari + duraklatmalar'dan hesaplanır.

-- Kullanıcının yerel bugünü. Testlerde `set app.bugun = '2026-10-25'` ile sabitlenir.
create function yerel_bugun(saat_dilimi text) returns date
language sql stable as $$
  select coalesce(
    nullif(current_setting('app.bugun', true), '')::date,
    (now() at time zone saat_dilimi)::date
  )
$$;

-- RLS yardımcıları (RLS özyinelemesini önlemek için SECURITY DEFINER)
create function is_grup_uyesi(p_grup_id uuid) returns bool
language sql stable security definer set search_path = public as $$
  select exists (select 1 from kullanici_program
    where grup_id = p_grup_id and kullanici_id = auth.uid() and durum in ('aktif', 'duraklatildi'))
$$;

create function is_grup_yoneticisi(p_grup_id uuid) returns bool
language sql stable security definer set search_path = public as $$
  select exists (select 1 from kullanici_program
    where grup_id = p_grup_id and kullanici_id = auth.uid() and rol = 'yonetici' and durum in ('aktif', 'duraklatildi'))
$$;

create function kp_sahibi_mi(kp_id uuid) returns bool
language sql stable security definer set search_path = public as $$
  select exists (select 1 from kullanici_program where id = kp_id and kullanici_id = auth.uid())
$$;

-- Kendi kaydı veya aynı grubun kaydı
create function kp_gorunur(kp_id uuid) returns bool
language sql stable security definer set search_path = public as $$
  select exists (select 1 from kullanici_program
    where id = kp_id and (kullanici_id = auth.uid() or (grup_id is not null and is_grup_uyesi(grup_id))))
$$;

create function program_gorunur(p_program_id uuid) returns bool
language sql stable security definer set search_path = public as $$
  select exists (select 1 from program p where p.id = p_program_id and (
    p.gorunurluk = 'herkes' or p.olusturan_id = auth.uid()
    or exists (select 1 from kullanici_program kp where kp.program_id = p.id and kp.kullanici_id = auth.uid())
    or exists (select 1 from grup g where g.program_id = p.id and is_grup_uyesi(g.id))))
$$;

create function kp_yerel_bugun(kp_id uuid) returns date
language sql stable security definer set search_path = public as $$
  select yerel_bugun(k.saat_dilimi)
  from kullanici_program kp join kullanici k on k.id = kp.kullanici_id
  where kp.id = kp_id
$$;

create function program_toplam(p_program_id uuid, out toplam_sayfa int, out toplam_gun int)
language sql stable as $$
  select s.toplam::int, ceil(s.toplam::numeric / p.gunluk_sayfa)::int
  from program p,
  lateral (
    select coalesce(sum(coalesce(pk.bitis_sayfasi, k.sayfa_sayisi) - pk.baslangic_sayfasi + 1), 0) as toplam
    from program_kitaplari pk join kitaplar k on k.id = pk.kitap_id
    where pk.program_id = p.id
  ) s
  where p.id = p_program_id
$$;

-- Başlangıçtan `son` tarihine kadar her tarih ve o tarihin gün numarası.
-- Okuma günü olmayan veya duraklatılmış tarihlerde gun_no boştur.
create function gun_serisi(kp_id uuid, son date)
returns table (tarih date, gun_no int, duraklatildi bool)
language sql stable as $$
  with kp as (
    select kp.baslangic_tarihi, p.duzen_modu, coalesce(p.okuma_gunleri, '1111111') as okuma_gunleri,
           kp_yerel_bugun(kp.id) as bugun
    from kullanici_program kp join program p on p.id = kp.program_id
    where kp.id = kp_id
  ), gunler as (
    select d::date as tarih,
      case kp.duzen_modu
        when 'gunluk' then true
        when 'hafta_ici' then extract(isodow from d) <= 5
        else substr(kp.okuma_gunleri, extract(isodow from d)::int, 1) = '1'
      end as okuma_gunu,
      exists (
        select 1 from duraklatmalar du
        where du.kullanici_program_id = kp_id
          and d::date between du.baslangic and coalesce(du.bitis, kp.bugun)
      ) as duraklatildi
    from kp, generate_series(kp.baslangic_tarihi, son, interval '1 day') d
  )
  select tarih,
    case when okuma_gunu and not duraklatildi
      then (count(*) filter (where okuma_gunu and not duraklatildi) over (order by tarih))::int
    end,
    duraklatildi
  from gunler
$$;

create function bugunku_gun_no(kp_id uuid, tarih date default null) returns int
language sql stable as $$
  select least(
    coalesce((select max(s.gun_no) from gun_serisi(kp_id, coalesce(tarih, kp_yerel_bugun(kp_id))) s), 0),
    (select t.toplam_gun from kullanici_program kp, program_toplam(kp.program_id) t where kp.id = kp_id)
  )
$$;

create function gun_araligi(p_program_id uuid, p_gun_no int)
returns table (kitap_id uuid, kitap_ad text, bas_sayfa int, son_sayfa int)
language sql stable as $$
  with p as (
    select (p_gun_no - 1) * gunluk_sayfa + 1 as bas,
           least(p_gun_no * gunluk_sayfa, (program_toplam(id)).toplam_sayfa) as son
    from program where id = p_program_id
  ), pk as (
    select k.id, k.ad, pk.sira, pk.baslangic_sayfasi as kb,
      coalesce(pk.bitis_sayfasi, k.sayfa_sayisi) - pk.baslangic_sayfasi + 1 as uzunluk,
      coalesce(sum(coalesce(pk.bitis_sayfasi, k.sayfa_sayisi) - pk.baslangic_sayfasi + 1)
        over (order by pk.sira rows between unbounded preceding and 1 preceding), 0) as onceki
    from program_kitaplari pk join kitaplar k on k.id = pk.kitap_id
    where pk.program_id = p_program_id
  )
  select pk.id, pk.ad,
    (pk.kb + greatest(p.bas, pk.onceki + 1) - pk.onceki - 1)::int,
    (pk.kb + least(p.son, pk.onceki + pk.uzunluk) - pk.onceki - 1)::int
  from pk, p
  where p_gun_no > 0 and pk.onceki + 1 <= p.son and pk.onceki + pk.uzunluk >= p.bas
  order by pk.sira
$$;

create function ilerleme(kp_id uuid, out tamamlanan_gun int, out bugunku_gun int, out geride_gun int,
  out yuzde numeric, out seri int, out okunan_sayfa int, out toplam_sayfa int, out toplam_gun int,
  out bugun_okundu bool)
language plpgsql stable as $$
declare
  v_program uuid;
  v_gunluk int;
begin
  select kp.program_id, p.gunluk_sayfa into v_program, v_gunluk
  from kullanici_program kp join program p on p.id = kp.program_id where kp.id = kp_id;
  if v_program is null then return; end if;

  select t.toplam_sayfa, t.toplam_gun into toplam_sayfa, toplam_gun from program_toplam(v_program) t;
  bugunku_gun := bugunku_gun_no(kp_id);

  select count(*) filter (where o.okunan_sayfa is null),
    count(*) filter (where o.okunan_sayfa is null and o.gun_no = bugunku_gun) > 0,
    coalesce(sum(case when o.okunan_sayfa is null
      then least(o.gun_no * v_gunluk, toplam_sayfa) - (o.gun_no - 1) * v_gunluk
      else o.okunan_sayfa end), 0)
  into tamamlanan_gun, bugun_okundu, okunan_sayfa
  from okuma_kayitlari o where o.kullanici_program_id = kp_id;

  -- Bugün geride sayılmaz; gün henüz bitmedi.
  select count(*) into geride_gun
  from generate_series(1, bugunku_gun - 1) g
  where not exists (select 1 from okuma_kayitlari o
    where o.kullanici_program_id = kp_id and o.gun_no = g and o.okunan_sayfa is null);

  -- Seri: bugünden (okunmadıysa dünden) geriye kesintisiz tamamlanan gün sayısı
  seri := bugunku_gun - case when bugun_okundu then 0 else 1 end;
  seri := greatest(seri - coalesce((select max(g) from generate_series(1, seri) g
    where not exists (select 1 from okuma_kayitlari o
      where o.kullanici_program_id = kp_id and o.gun_no = g and o.okunan_sayfa is null)), 0), 0);

  yuzde := round(okunan_sayfa * 100.0 / nullif(toplam_sayfa, 0), 1);
end $$;

-- Takvim: tarih aralığındaki her gün için durum (ekran tarih hesabı yapmaz)
create function takvim(kp_id uuid, bas date, son date)
returns table (tarih date, gun_no int, durum text)
language sql stable as $$
  select s.tarih, case when s.gun_no <= t.toplam_gun then s.gun_no end,
    case
      when s.duraklatildi then 'duraklatma'
      when s.gun_no is null or s.gun_no > t.toplam_gun then 'bos'
      when o.id is not null and o.okunan_sayfa is not null then 'kismi'
      when o.id is not null and o.telafi_mi then 'telafi'
      when o.id is not null then 'okundu'
      when s.tarih = kp_yerel_bugun(kp_id) then 'bugun'
      when s.tarih < kp_yerel_bugun(kp_id) then 'kacirildi'
      else 'gelecek'
    end
  from gun_serisi(kp_id, son) s
  cross join lateral (select t.toplam_gun from kullanici_program kp, program_toplam(kp.program_id) t where kp.id = kp_id) t
  left join okuma_kayitlari o on o.kullanici_program_id = kp_id and o.gun_no = s.gun_no
  where s.tarih >= bas
  order by s.tarih
$$;

-- Planlanan bitiş tarihi (açık duraklatma varsa boş)
create function bitis_tarihi(kp_id uuid) returns date
language sql stable as $$
  select min(s.tarih)
  from kullanici_program kp, program_toplam(kp.program_id) t,
    gun_serisi(kp_id, kp.baslangic_tarihi + t.toplam_gun * 7 + 366) s
  where kp.id = kp_id and s.gun_no = t.toplam_gun
    and not exists (select 1 from duraklatmalar du where du.kullanici_program_id = kp_id and du.bitis is null)
$$;

-- Grup üyelerinin durumu. Diğer üyelerin yalnızca ad/soyadını açar (kullanici tablosu RLS ile kapalıdır).
create function grup_durumu(p_grup_id uuid)
returns table (kullanici_id uuid, kullanici_program_id uuid, ad text, soyad text, rol text,
  tamamlanan int, geride_gun int, bugun_okudu bool, seri int, hatirlatma_kabul bool, bugun_hatirlatildi bool)
language sql stable security definer set search_path = public as $$
  select k.id, kp.id, k.ad, k.soyad, kp.rol, i.tamamlanan_gun, i.geride_gun, i.bugun_okundu, i.seri,
    kp.hatirlatma_kabul,
    exists (select 1 from hatirlatmalar h
      where h.gonderen_id = auth.uid() and h.alan_id = k.id
        and h.tarih = (select yerel_bugun(saat_dilimi) from kullanici where id = auth.uid()))
  from kullanici_program kp
  join kullanici k on k.id = kp.kullanici_id
  cross join lateral ilerleme(kp.id) i
  where kp.grup_id = p_grup_id and kp.durum = 'aktif'
    and (auth.uid() is null or is_grup_uyesi(p_grup_id))
  order by kp.rol = 'yonetici' desc, k.ad
$$;

-- okuma_kayitlari: doğrulama + telafi hesabı
create function okuma_kaydi_hazirla() returns trigger
language plpgsql as $$
declare
  v_toplam_gun int;
  v_gunluk int;
begin
  select t.toplam_gun, p.gunluk_sayfa into v_toplam_gun, v_gunluk
  from kullanici_program kp join program p on p.id = kp.program_id, program_toplam(kp.program_id) t
  where kp.id = new.kullanici_program_id;

  if new.gun_no > v_toplam_gun then
    raise exception 'gun_no % programın toplam gününü (%) aşıyor', new.gun_no, v_toplam_gun;
  end if;
  if new.okunan_sayfa > v_gunluk then
    raise exception 'okunan_sayfa % günlük sayfayı (%) aşıyor', new.okunan_sayfa, v_gunluk;
  end if;

  new.okunma_tarihi := coalesce(new.okunma_tarihi, kp_yerel_bugun(new.kullanici_program_id));
  if new.gun_no > bugunku_gun_no(new.kullanici_program_id, new.okunma_tarihi) then
    raise exception 'gun_no % henüz gelmedi', new.gun_no;
  end if;
  new.telafi_mi := new.gun_no < bugunku_gun_no(new.kullanici_program_id, new.okunma_tarihi);
  return new;
end $$;

create trigger okuma_kaydi_hazirla before insert or update on okuma_kayitlari
  for each row execute function okuma_kaydi_hazirla();

create function program_tamamlandi_mi() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update kullanici_program kp set durum = 'tamamladi', durum_tarihi = new.okunma_tarihi
  where kp.id = new.kullanici_program_id and kp.durum = 'aktif'
    and (select count(*) from okuma_kayitlari o
         where o.kullanici_program_id = kp.id and o.okunan_sayfa is null)
        >= (select t.toplam_gun from program_toplam(kp.program_id) t);
  return null;
end $$;

create trigger program_tamamlandi_mi after insert or update on okuma_kayitlari
  for each row execute function program_tamamlandi_mi();

-- ─── İşlemler (Edge Function'lar ve ekranlar rpc ile çağırır) ───────────────
-- Dönüşlerdeki `durum` HTTP kodudur; Edge Function aynen iletir.

create function grup_kur(p_ad text, p_program_id uuid, p_baslangic date) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'oturum yok' using errcode = '42501'; end if;
  if not program_gorunur(p_program_id) then raise exception 'program görünmüyor' using errcode = '42501'; end if;
  loop
    begin
      insert into grup (ad, program_id, kurucu_id, baslangic_tarihi, davet_kodu)
      values (p_ad, p_program_id, auth.uid(), p_baslangic, 'RN-' || lpad((floor(random() * 10000))::int::text, 4, '0'))
      returning id into v_id;
      exit;
    exception when unique_violation then -- davet kodu çakıştı, yeniden dene
    end;
  end loop;
  insert into kullanici_program (kullanici_id, program_id, grup_id, rol, dahil_olma_tarihi, baslangic_tarihi)
  select auth.uid(), p_program_id, v_id, 'yonetici', yerel_bugun(saat_dilimi), p_baslangic
  from kullanici where id = auth.uid();
  return v_id;
end $$;

create function davet_olustur(p_grup_id uuid, p_tip text, p_telefon text default null, p_maks_kullanim int default null)
returns davetler
language plpgsql security definer set search_path = public as $$
declare
  v davetler;
begin
  if not is_grup_yoneticisi(p_grup_id) then raise exception 'yalnızca yönetici' using errcode = '42501'; end if;
  loop
    begin
      insert into davetler (grup_id, gonderen_id, tip, telefon, token, maks_kullanim)
      values (p_grup_id, auth.uid(), p_tip, case when p_tip = 'kisisel' then p_telefon end,
        (select string_agg(substr('abcdefghijkmnpqrstuvwxyz23456789', 1 + get_byte(b, i) % 32, 1), '')
         from extensions.gen_random_bytes(6) b, generate_series(0, 5) i),
        case when p_tip = 'genel' then coalesce(p_maks_kullanim, 50) else 1 end)
      returning * into v;
      return v;
    exception when unique_violation then -- token çakıştı, yeniden dene
    end;
  end loop;
end $$;

create function davet_kabul(p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  d record;
  v_kp uuid;
begin
  if auth.uid() is null then return jsonb_build_object('durum', 401); end if;

  select dv.*, g.baslangic_tarihi, g.program_id, g.aktif, g.ad as grup_ad into d
  from davetler dv join grup g on g.id = dv.grup_id
  where dv.token = lower(trim(p_token)) for update of dv;

  if not found then return jsonb_build_object('durum', 404); end if;
  if d.iptal_tarihi is not null or d.son_gecerlilik < now() or not d.aktif then
    return jsonb_build_object('durum', 410);
  end if;
  if exists (select 1 from kullanici_program where kullanici_id = auth.uid() and grup_id = d.grup_id
             and durum in ('aktif', 'duraklatildi')) then
    return jsonb_build_object('durum', 409, 'grup_id', d.grup_id);
  end if;
  if (select count(*) from kullanici_program where davet_id = d.id) >= d.maks_kullanim then
    return jsonb_build_object('durum', 410);
  end if;

  insert into kullanici_program (kullanici_id, program_id, grup_id, rol, davet_id, dahil_olma_tarihi, baslangic_tarihi)
  select auth.uid(), d.program_id, d.grup_id, 'uye', d.id, yerel_bugun(saat_dilimi), d.baslangic_tarihi
  from kullanici where id = auth.uid()
  returning id into v_kp;

  if d.tip = 'kisisel' then
    update davetler set kullanan_id = auth.uid(), kullanilma = now() where id = d.id;
  end if;
  return jsonb_build_object('durum', 200, 'grup_id', d.grup_id, 'grup_ad', d.grup_ad, 'kullanici_program_id', v_kp);
end $$;

create function hatirlatma_gonder(p_grup_id uuid, p_alan_id uuid, p_kanal text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_alan record;
  v_ilerleme record;
  v_durum text;
  v_id uuid;
begin
  if auth.uid() is null then return jsonb_build_object('durum', 401); end if;
  if p_alan_id = auth.uid() then return jsonb_build_object('durum', 400); end if;
  if not exists (select 1 from kullanici_program where kullanici_id = auth.uid() and grup_id = p_grup_id and durum = 'aktif') then
    return jsonb_build_object('durum', 403);
  end if;

  select kp.id, kp.hatirlatma_kabul, k.ad, k.telefon into v_alan
  from kullanici_program kp join kullanici k on k.id = kp.kullanici_id
  where kp.kullanici_id = p_alan_id and kp.grup_id = p_grup_id and kp.durum = 'aktif';
  if not found then return jsonb_build_object('durum', 404); end if;

  select * into v_ilerleme from ilerleme(v_alan.id);
  if v_ilerleme.geride_gun = 0 then return jsonb_build_object('durum', 409); end if;

  v_durum := case when v_alan.hatirlatma_kabul then 'gonderildi' else 'engellendi' end;
  begin
    insert into hatirlatmalar (grup_id, gonderen_id, alan_id, gun_no, kanal, tarih, durum)
    select p_grup_id, auth.uid(), p_alan_id, v_ilerleme.bugunku_gun, p_kanal, yerel_bugun(saat_dilimi), v_durum
    from kullanici where id = auth.uid()
    returning id into v_id;
  exception when unique_violation then
    return jsonb_build_object('durum', 429);
  end;

  return jsonb_build_object('durum', 200, 'hatirlatma_id', v_id, 'kayit_durumu', v_durum,
    'alan_ad', v_alan.ad, 'geride_gun', v_ilerleme.geride_gun,
    'telefon', case when p_kanal = 'whatsapp' and v_durum = 'gonderildi' then v_alan.telefon end);
end $$;

-- Kendi hatırlatması gelecek kullanıcılar (yalnızca service_role)
create function gunluk_hatirlatma_adaylari(p_simdi timestamptz default now())
returns table (kullanici_id uuid, kullanici_program_id uuid, gun_no int)
language sql stable security definer set search_path = public as $$
  select k.id, kp.id, bugunku_gun_no(kp.id)
  from kullanici k join kullanici_program kp on kp.kullanici_id = k.id and kp.durum = 'aktif'
  where k.hatirlatma_acik and k.silinme_tarihi is null and k.hatirlatma_saati is not null
    and (extract(epoch from (p_simdi at time zone k.saat_dilimi)::time - k.hatirlatma_saati)::int + 86400) % 86400 < 900
    and bugunku_gun_no(kp.id) > 0
    and not exists (select 1 from okuma_kayitlari o where o.kullanici_program_id = kp.id
                    and o.gun_no = bugunku_gun_no(kp.id) and o.okunan_sayfa is null)
    and not exists (select 1 from duraklatmalar du where du.kullanici_program_id = kp.id
                    and kp_yerel_bugun(kp.id) between du.baslangic and coalesce(du.bitis, 'infinity'))
$$;

create function duraklat(kp_id uuid, p_neden text default null) returns void
language plpgsql as $$
declare
  v_bugun date := kp_yerel_bugun(kp_id);
begin
  if not exists (select 1 from duraklatmalar where kullanici_program_id = kp_id and bitis is null) then
    insert into duraklatmalar (kullanici_program_id, baslangic, neden) values (kp_id, v_bugun, p_neden);
  end if;
  update kullanici_program set durum = 'duraklatildi', durum_tarihi = v_bugun where id = kp_id and durum = 'aktif';
end $$;

create function devam_et(kp_id uuid) returns void
language plpgsql as $$
declare
  v_bugun date := kp_yerel_bugun(kp_id);
begin
  delete from duraklatmalar where kullanici_program_id = kp_id and bitis is null and baslangic >= v_bugun;
  update duraklatmalar set bitis = v_bugun - 1 where kullanici_program_id = kp_id and bitis is null;
  update kullanici_program set durum = 'aktif', durum_tarihi = v_bugun where id = kp_id and durum = 'duraklatildi';
end $$;

-- KVKK: silme talebinden 30 gün sonra kişisel veriler anonimleşir (cron çağırır)
create function hesaplari_anonimlestir() returns int
language sql security definer set search_path = public as $$
  with s as (
    update kullanici set ad = 'Silinmiş kullanıcı', soyad = null, telefon = null, eposta = null, hatirlatma_acik = false
    where silinme_tarihi < now() - interval '30 days' and ad <> 'Silinmiş kullanıcı'
    returning id
  ), c as (delete from cihazlar where kullanici_id in (select id from s))
  select count(*)::int from s
$$;

revoke execute on function gunluk_hatirlatma_adaylari(timestamptz), hesaplari_anonimlestir() from public, anon, authenticated;
