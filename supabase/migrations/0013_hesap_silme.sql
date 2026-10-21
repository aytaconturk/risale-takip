-- Hesap silme: "Hesabımı sil" yalnızca silinme_tarihi yazar (soft delete); kullanıcı 30 gün içinde giriş yapıp vazgeçebilir.
-- 30 gün dolunca satırlar silinmez, kişisel veriler anonimleştirilir: giriş kaydı (e-posta, telefon, şifre, kayıt bilgileri)
-- boşaltılır ve hesap kalıcı kapatılır, notlar silinir, programlardan çıkılır. Okuma kayıtları isimsiz kalır (grup geçmişi bozulmaz).
create or replace function hesaplari_anonimlestir() returns int
language plpgsql security definer set search_path = public as $$
declare
  v_ids uuid[];
begin
  select array_agg(id) into v_ids from kullanici
  where silinme_tarihi < now() - interval '30 days' and ad <> 'Silinmiş kullanıcı';
  if v_ids is null then return 0; end if;

  update kullanici set ad = 'Silinmiş kullanıcı', soyad = null, telefon = null, eposta = null, hatirlatma_acik = false,
    hatirlatma_saatleri = '{}' where id = any(v_ids);
  delete from cihazlar where kullanici_id = any(v_ids);
  delete from notlar where kullanici_id = any(v_ids);
  update kullanici_program set durum = 'birakti', durum_tarihi = current_date
  where kullanici_id = any(v_ids) and durum in ('aktif', 'duraklatildi');

  delete from auth.identities where user_id = any(v_ids);
  delete from auth.sessions where user_id = any(v_ids);
  update auth.users set email = null, phone = null, encrypted_password = '', raw_user_meta_data = '{}',
    email_change = '', phone_change = '', banned_until = 'infinity'
  where id = any(v_ids);
  return cardinality(v_ids);
end $$;
revoke execute on function hesaplari_anonimlestir() from public, anon, authenticated;
