-- RLS. Yardımcılar (is_grup_uyesi, is_grup_yoneticisi, kp_gorunur, kp_sahibi_mi, program_gorunur) 0002'de.

alter table kullanici enable row level security;
alter table kitaplar enable row level security;
alter table program enable row level security;
alter table program_kitaplari enable row level security;
alter table grup enable row level security;
alter table kullanici_program enable row level security;
alter table duraklatmalar enable row level security;
alter table okuma_kayitlari enable row level security;
alter table notlar enable row level security;
alter table davetler enable row level security;
alter table hatirlatmalar enable row level security;
alter table cihazlar enable row level security;

-- kullanici: diğer üyelerin ad/soyadı yalnızca grup_durumu() ile açılır (telefon/e-posta sızmasın)
create policy kullanici_oku on kullanici for select using (id = auth.uid());
create policy kullanici_guncelle on kullanici for update using (id = auth.uid()) with check (id = auth.uid());

create policy kitaplar_oku on kitaplar for select using (true);

create policy program_oku on program for select using (program_gorunur(id));
create policy program_ekle on program for insert with check (olusturan_id = auth.uid());
create policy program_guncelle on program for update using (olusturan_id = auth.uid()) with check (olusturan_id = auth.uid());
create policy program_sil on program for delete using (olusturan_id = auth.uid());

create policy program_kitaplari_oku on program_kitaplari for select using (program_gorunur(program_id));
create policy program_kitaplari_yaz on program_kitaplari for all
  using (exists (select 1 from program where id = program_id and olusturan_id = auth.uid()))
  with check (exists (select 1 from program where id = program_id and olusturan_id = auth.uid()));

create policy grup_oku on grup for select using (is_grup_uyesi(id) or kurucu_id = auth.uid());
create policy grup_guncelle on grup for update using (is_grup_yoneticisi(id)) with check (is_grup_yoneticisi(id));
-- Grup grup_kur() ile açılır.

create policy kp_oku on kullanici_program for select
  using (kullanici_id = auth.uid() or (grup_id is not null and is_grup_uyesi(grup_id)));
create policy kp_ekle on kullanici_program for insert with check (kullanici_id = auth.uid() and grup_id is null);
create policy kp_guncelle on kullanici_program for update
  using (kullanici_id = auth.uid() or (grup_id is not null and is_grup_yoneticisi(grup_id)));

-- Üye kendi rolünü değiştiremez, kendini çıkarılmış yapamaz; yönetici başkasında yalnızca rol/durum değiştirir.
create function kp_koruma() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_yonetici bool := new.grup_id is not null and is_grup_yoneticisi(new.grup_id);
begin
  if auth.uid() is null then return new; end if; -- service_role / seed
  if (new.kullanici_id, new.program_id, new.grup_id, new.davet_id, new.baslangic_tarihi)
     is distinct from (old.kullanici_id, old.program_id, old.grup_id, old.davet_id, old.baslangic_tarihi) then
    raise exception 'bu alanlar değiştirilemez' using errcode = '42501';
  end if;
  if (new.rol is distinct from old.rol or (new.durum = 'cikarildi' and old.durum <> 'cikarildi')) and not v_yonetici then
    raise exception 'yalnızca yönetici' using errcode = '42501';
  end if;
  if old.kullanici_id <> auth.uid()
     and (new.hatirlatma_kabul is distinct from old.hatirlatma_kabul or new.durum not in ('cikarildi', old.durum)) then
    raise exception 'yönetici yalnızca rol ve çıkarma işlemi yapabilir' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger kp_koruma before update on kullanici_program for each row execute function kp_koruma();

create policy okuma_oku on okuma_kayitlari for select using (kp_gorunur(kullanici_program_id));
create policy okuma_yaz on okuma_kayitlari for all
  using (kp_sahibi_mi(kullanici_program_id)) with check (kp_sahibi_mi(kullanici_program_id) and kaynak <> 'yonetici');

create policy duraklatma_oku on duraklatmalar for select using (kp_gorunur(kullanici_program_id));
create policy duraklatma_yaz on duraklatmalar for all
  using (kp_sahibi_mi(kullanici_program_id)) with check (kp_sahibi_mi(kullanici_program_id));

create policy not_oku on notlar for select
  using (kullanici_id = auth.uid() or (grupla_paylas is not null and is_grup_uyesi(grupla_paylas)));
create policy not_yaz on notlar for all using (kullanici_id = auth.uid())
  with check (kullanici_id = auth.uid() and (grupla_paylas is null or is_grup_uyesi(grupla_paylas)));

-- Davet davet_olustur() ile açılır; yönetici iptal edebilir.
create policy davet_oku on davetler for select using (is_grup_yoneticisi(grup_id));
create policy davet_iptal on davetler for update using (is_grup_yoneticisi(grup_id)) with check (is_grup_yoneticisi(grup_id));

create policy hatirlatma_oku on hatirlatmalar for select using (gonderen_id = auth.uid() or alan_id = auth.uid());

create policy cihaz_kendisi on cihazlar for all using (kullanici_id = auth.uid()) with check (kullanici_id = auth.uid());
