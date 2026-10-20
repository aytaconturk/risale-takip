-- Ders ekranındaki üye ilerleme çubuğu (tamamlanan / bugünkü gün) için bugunku_gun eklenir
drop function grup_durumu(uuid);
create function grup_durumu(p_grup_id uuid)
returns table (kullanici_id uuid, kullanici_program_id uuid, ad text, soyad text, rol text,
  tamamlanan int, geride_gun int, bugun_okudu bool, seri int, hatirlatma_kabul bool, bugun_hatirlatildi bool, bugunku_gun int)
language sql stable security definer set search_path = public as $$
  select k.id, kp.id, k.ad, k.soyad, kp.rol, i.tamamlanan_gun, i.geride_gun, i.bugun_okundu, i.seri,
    kp.hatirlatma_kabul,
    exists (select 1 from hatirlatmalar h
      where h.gonderen_id = auth.uid() and h.alan_id = k.id
        and h.tarih = (select yerel_bugun(saat_dilimi) from kullanici where id = auth.uid())),
    i.bugunku_gun
  from kullanici_program kp
  join kullanici k on k.id = kp.kullanici_id
  cross join lateral ilerleme(kp.id) i
  where kp.grup_id = p_grup_id and kp.durum = 'aktif'
    and (auth.uid() is null or is_grup_uyesi(p_grup_id))
  order by kp.rol = 'yonetici' desc, k.ad
$$;
