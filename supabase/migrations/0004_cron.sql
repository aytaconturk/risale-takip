-- Zamanlanmış işler. Edge Function adresi ve service_role anahtarı Vault'tan okunur:
--   select vault.create_secret('https://<proje>.supabase.co', 'project_url');
--   select vault.create_secret('<service_role key>', 'service_role_key');
-- (lokal değerleri seed.sql ekler)
create extension if not exists pg_cron;
create extension if not exists pg_net;

create function edge_cagir(fonksiyon text) returns bigint
language sql security definer set search_path = public as $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/' || fonksiyon,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')),
    body := '{}'::jsonb)
$$;
revoke execute on function edge_cagir(text) from public, anon, authenticated;

select cron.schedule('gunluk-hatirlatma', '*/15 * * * *', $$select edge_cagir('gunluk-hatirlatma')$$);
select cron.schedule('hesaplari-anonimlestir', '0 3 * * *', $$select hesaplari_anonimlestir()$$);
