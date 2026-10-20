-- Şema: docs/Risale DB Şema v2.csv
create extension if not exists pgcrypto;

create table kullanici (
  id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  ad text not null,
  soyad text,
  telefon text unique,
  eposta text unique,
  hatirlatma_acik bool not null default true,
  hatirlatma_saati time default '21:00',
  saat_dilimi text not null default 'Europe/Istanbul',
  dil text not null default 'tr' check (dil in ('tr', 'en')),
  kayit_tarihi timestamptz not null default now(),
  silinme_tarihi timestamptz
);

create table kitaplar (
  id uuid primary key default gen_random_uuid(),
  ad text not null unique,
  sayfa_sayisi int not null check (sayfa_sayisi > 0)
);

create table program (
  id uuid primary key default gen_random_uuid(),
  ad text not null,
  gunluk_sayfa int not null check (gunluk_sayfa > 0),
  onerilen_baslangic date,
  duzen_modu text not null default 'gunluk' check (duzen_modu in ('gunluk', 'hafta_ici', 'ozel')),
  okuma_gunleri text default '1111111' check (okuma_gunleri ~ '^[01]{7}$' and okuma_gunleri <> '0000000'),
  olusturan_id uuid references kullanici(id),
  gorunurluk text not null default 'herkes' check (gorunurluk in ('herkes', 'ozel'))
);

create table program_kitaplari (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references program(id) on delete cascade,
  kitap_id uuid not null references kitaplar(id),
  sira int not null,
  baslangic_sayfasi int default 1 check (baslangic_sayfasi >= 1),
  bitis_sayfasi int check (bitis_sayfasi >= baslangic_sayfasi),
  unique (program_id, sira)
);

create table grup (
  id uuid primary key default gen_random_uuid(),
  ad text not null,
  program_id uuid not null references program(id),
  kurucu_id uuid not null references kullanici(id),
  baslangic_tarihi date not null,
  davet_kodu text not null unique,
  ders_gunu text check (ders_gunu in ('pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi', 'pazar')),
  ders_saati time,
  konum text,
  aktif bool not null default true,
  olusturma_tarihi timestamptz not null default now()
);

create table davetler (
  id uuid primary key default gen_random_uuid(),
  grup_id uuid not null references grup(id),
  gonderen_id uuid not null references kullanici(id),
  tip text not null default 'kisisel' check (tip in ('kisisel', 'genel')),
  telefon text,
  token text not null unique,
  maks_kullanim int not null default 1 check (maks_kullanim > 0),
  olusturma timestamptz not null default now(),
  son_gecerlilik timestamptz not null default now() + interval '7 days',
  iptal_tarihi timestamptz,
  kullanan_id uuid references kullanici(id),
  kullanilma timestamptz,
  check (tip = 'genel' or maks_kullanim = 1)
);

create table kullanici_program (
  id uuid primary key default gen_random_uuid(),
  kullanici_id uuid not null references kullanici(id),
  program_id uuid not null references program(id),
  grup_id uuid references grup(id),
  rol text check (rol in ('yonetici', 'uye')),
  davet_id uuid references davetler(id),
  dahil_olma_tarihi date not null default current_date,
  baslangic_tarihi date not null,
  durum text not null default 'aktif' check (durum in ('aktif', 'duraklatildi', 'birakti', 'tamamladi', 'cikarildi')),
  durum_tarihi date,
  hatirlatma_kabul bool not null default true,
  check ((grup_id is null) = (rol is null))
);
-- Aynı anda iki aktif kayıt engellenir (bireysel okumada grup_id boş, NULL'lar eşit sayılır)
create unique index kullanici_program_tek_aktif on kullanici_program (kullanici_id, program_id, grup_id)
  nulls not distinct where durum in ('aktif', 'duraklatildi');
create index kullanici_program_grup_durum on kullanici_program (grup_id, durum);

create table duraklatmalar (
  id uuid primary key default gen_random_uuid(),
  kullanici_program_id uuid not null references kullanici_program(id) on delete cascade,
  baslangic date not null,
  bitis date check (bitis >= baslangic),
  neden text
);

create table okuma_kayitlari (
  id uuid primary key default gen_random_uuid(),
  kullanici_program_id uuid not null references kullanici_program(id) on delete cascade,
  gun_no int not null check (gun_no > 0),
  okunma_tarihi date not null,
  telafi_mi bool not null default false,
  okunan_sayfa int check (okunan_sayfa > 0),
  kaynak text not null default 'uygulama' check (kaynak in ('uygulama', 'toplu', 'yonetici')),
  olusturma timestamptz not null default now(),
  unique (kullanici_program_id, gun_no)
);

create table notlar (
  id uuid primary key default gen_random_uuid(),
  kullanici_id uuid not null default auth.uid() references kullanici(id),
  kitap_id uuid not null references kitaplar(id),
  sayfa int check (sayfa > 0),
  metin text not null check (length(trim(metin)) > 0),
  grupla_paylas uuid references grup(id),
  olusturma timestamptz not null default now()
);

create table hatirlatmalar (
  id uuid primary key default gen_random_uuid(),
  grup_id uuid not null references grup(id),
  gonderen_id uuid not null references kullanici(id),
  alan_id uuid not null references kullanici(id),
  gun_no int not null,
  kanal text not null check (kanal in ('push', 'whatsapp')),
  zaman timestamptz not null default now(),
  tarih date not null,
  durum text not null default 'gonderildi' check (durum in ('gonderildi', 'engellendi', 'hata')),
  unique (gonderen_id, alan_id, tarih)
);

create table cihazlar (
  id uuid primary key default gen_random_uuid(),
  kullanici_id uuid not null default auth.uid() references kullanici(id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null check (platform in ('ios', 'android')),
  son_gorulme timestamptz not null default now()
);

-- Yeni Auth kullanıcısı → kullanici satırı
create function yeni_auth_kullanici() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into kullanici (id, ad, telefon, eposta)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'ad', ''),
    case when new.phone is not null and new.phone <> '' then '+' || ltrim(new.phone, '+') end,
    nullif(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger auth_kullanici_ac after insert on auth.users
  for each row execute function yeni_auth_kullanici();
