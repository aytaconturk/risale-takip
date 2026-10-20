-- Yeni arayüzün ihtiyaç duyduğu hesaplar (istemci tarih hesabı yapmaz)

-- p_baslangic'tan itibaren p_gunler (Pzt=1. karakter) düzenine göre n. okuma günü
create function nci_okuma_gunu(p_baslangic date, p_gunler text, p_n int) returns date
language sql immutable as $$
  select d::date from (
    select d, row_number() over (order by d) as n
    from generate_series(p_baslangic, p_baslangic + p_n * 7 + 7, interval '1 day') d
    where substr(p_gunler, extract(isodow from d)::int, 1) = '1'
  ) s
  where n = p_n
$$;

create function program_gunleri(p_program_id uuid) returns text
language sql stable as $$
  select case duzen_modu when 'gunluk' then '1111111' when 'hafta_ici' then '1111100' else coalesce(okuma_gunleri, '1111111') end
  from program where id = p_program_id
$$;

-- Programa p_baslangic'ta başlayan ve ara vermeyen birinin bitiş tarihi
create function program_bitis(p_program_id uuid, p_baslangic date) returns date
language sql stable as $$
  select nci_okuma_gunu(p_baslangic, program_gunleri(p_program_id), (program_toplam(p_program_id)).toplam_gun)
$$;

-- Program oluşturma ekranının kaydetmeden önceki özeti. p_kitaplar: [{"bas": 1, "son": 382}, ...]
create function program_onizleme(p_kitaplar jsonb, p_gunluk int, p_gunler text, p_baslangic date default null,
  out toplam_sayfa int, out toplam_gun int, out bitis date)
language sql stable as $$
  select s.t, g.n, nci_okuma_gunu(coalesce(p_baslangic, kullanici_bugun()), p_gunler, g.n)
  from (select coalesce(sum((k->>'son')::int - (k->>'bas')::int + 1), 0)::int as t
        from jsonb_array_elements(p_kitaplar) k) s,
  lateral (select ceil(s.t::numeric / p_gunluk)::int as n) g
  where p_gunluk > 0 and p_gunler ~ '^[01]{7}$' and p_gunler <> '0000000'
$$;

-- Ders grubunun bir sonraki yüz yüze ders tarihi (bugün ders günüyse bugün)
create function sonraki_ders(p_grup_id uuid) returns date
language sql stable as $$
  select kullanici_bugun() + ((array_position(array['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi', 'pazar'], g.ders_gunu)
    - extract(isodow from kullanici_bugun())::int + 7) % 7)
  from grup g where g.id = p_grup_id and g.ders_gunu is not null
$$;

-- Davet linki açılınca, katılmadan (oturum olmadan da) gösterilen bilgiler. Yalnızca bu alanlar açılır.
create function davet_onizleme(p_token text)
returns table (grup_ad text, davet_eden text, program_ad text, baslangic_tarihi date, ders_gunu text, ders_saati time,
  konum text, uye_sayisi int, gecerli bool)
language sql stable security definer set search_path = public as $$
  select g.ad, k.ad, p.ad, g.baslangic_tarihi, g.ders_gunu, g.ders_saati, g.konum,
    (select count(*)::int from kullanici_program kp where kp.grup_id = g.id and kp.durum = 'aktif'),
    d.iptal_tarihi is null and d.son_gecerlilik > now() and g.aktif
      and (select count(*) from kullanici_program kp where kp.davet_id = d.id) < d.maks_kullanim
  from davetler d
  join grup g on g.id = d.grup_id
  join program p on p.id = g.program_id
  join kullanici k on k.id = d.gonderen_id
  where d.token = lower(trim(p_token))
$$;

grant execute on function davet_onizleme(text) to anon, authenticated;
