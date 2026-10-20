-- E-posta + şifre kaydı: ad, soyad, telefon signUp metadata'sından gelir.
-- Telefon SMS ile doğrulanmaz; yalnızca E.164 biçimindeyse yazılır.
create or replace function yeni_auth_kullanici() returns trigger
language plpgsql security definer set search_path = public as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}');
begin
  insert into kullanici (id, ad, soyad, telefon, eposta)
  values (
    new.id,
    coalesce(m ->> 'ad', ''),
    nullif(m ->> 'soyad', ''),
    case when m ->> 'telefon' ~ '^\+[1-9][0-9]{7,14}$' then m ->> 'telefon' end,
    nullif(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end $$;
