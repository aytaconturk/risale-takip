-- Ekranların istemcide tarih hesabı yapmaması için yardımcılar (rpc ile çağrılır)

create function kullanici_bugun() returns date
language sql stable security definer set search_path = public as $$
  select yerel_bugun(saat_dilimi) from kullanici where id = auth.uid()
$$;

-- Bugünün bulunduğu haftanın (Pzt–Paz) takvimi; başlangıçtan önceki günler 'bos'
create function bu_hafta(kp_id uuid) returns table (tarih date, gun_no int, durum text)
language sql stable as $$
  with h as (select date_trunc('week', kp_yerel_bugun(kp_id))::date as pzt)
  select d::date, t.gun_no, coalesce(t.durum, 'bos')
  from h cross join generate_series(h.pzt, h.pzt + 6, interval '1 day') d
  left join takvim(kp_id, (select pzt from h), (select pzt + 6 from h)) t on t.tarih = d::date
  order by 1
$$;

-- Telafi bekleyen günler: kaçırılan veya kısmi okunan (bugün hariç)
create function geride_gunler(kp_id uuid) returns table (tarih date, gun_no int, durum text)
language sql stable as $$
  select * from takvim(kp_id, '-infinity', kp_yerel_bugun(kp_id) - 1) where durum in ('kacirildi', 'kismi')
$$;

-- Bireysel okumaya başla (grup üyeliği davet_kabul / grup_kur ile açılır)
create function programa_basla(p_program_id uuid, p_baslangic date default null) returns uuid
language sql as $$
  insert into kullanici_program (kullanici_id, program_id, baslangic_tarihi)
  values (auth.uid(), p_program_id, coalesce(p_baslangic, kullanici_bugun()))
  returning id
$$;
