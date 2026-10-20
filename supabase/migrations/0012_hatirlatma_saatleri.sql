-- Birden fazla günlük hatırlatma saati; boş dizi = saat yok
alter table kullanici rename column hatirlatma_saati to hatirlatma_saatleri;
alter table kullanici
  alter column hatirlatma_saatleri drop default,
  alter column hatirlatma_saatleri type time[]
    using case when hatirlatma_saatleri is null then '{}' else array[hatirlatma_saatleri] end,
  alter column hatirlatma_saatleri set default '{21:00}',
  alter column hatirlatma_saatleri set not null;

create or replace function gunluk_hatirlatma_adaylari(p_simdi timestamptz default now())
returns table (kullanici_id uuid, kullanici_program_id uuid, gun_no int)
language sql stable security definer set search_path = public as $$
  select k.id, kp.id, bugunku_gun_no(kp.id)
  from kullanici k join kullanici_program kp on kp.kullanici_id = k.id and kp.durum = 'aktif'
  where k.hatirlatma_acik and k.silinme_tarihi is null
    and exists (select 1 from unnest(k.hatirlatma_saatleri) s
                where (extract(epoch from (p_simdi at time zone k.saat_dilimi)::time - s)::int + 86400) % 86400 < 900)
    and bugunku_gun_no(kp.id) > 0
    and not exists (select 1 from okuma_kayitlari o where o.kullanici_program_id = kp.id
                    and o.gun_no = bugunku_gun_no(kp.id) and o.okunan_sayfa is null)
    and not exists (select 1 from duraklatmalar du where du.kullanici_program_id = kp.id
                    and kp_yerel_bugun(kp.id) between du.baslangic and coalesce(du.bitis, 'infinity'))
$$;
