# Risale-i Nur Okuma Takip — Claude Code için kurulum talimatı

Bu dosyayı proje kök dizinine `CLAUDE.md` (veya `README.md`) olarak koyun. Aynı klasöre şu iki dosyayı da kopyalayın:

- `docs/Risale DB Şema v2.csv` — tablo/sütun sözlüğü (tek doğru kaynak)
- `docs/Risale DB Senaryo Verileri v2.csv` — seed verisi + kabul senaryoları

Claude Code'u başlatıp şu komutu verin:

```
CLAUDE.md'yi ve docs/ altındaki iki CSV'yi oku. "Yapılacaklar" bölümündeki adımları sırayla uygula. Her adım sonunda testleri çalıştır, geçmeden bir sonrakine geçme.
```

---

## Ürün

Risale-i Nur külliyatını (14 kitap, 5999 sayfa) günlük sayfa programıyla okuma takibi. Bireysel veya ders grubu halinde okunur. Grup WhatsApp linkiyle davet edilir; geride kalan üyeye günde en fazla bir hatırlatma gönderilir. Arayüz dili Türkçe.

## Teknoloji

- **Mobil:** Expo (SDK 52+) · React Native · TypeScript (strict) · Expo Router · TanStack Query · Zustand (yalnızca UI durumu)
- **Backend:** Supabase — Postgres 15, Auth (telefon OTP + e-posta), Edge Functions (Deno), `pg_cron`
- **Bildirim:** Expo Push API
- **Test:** pgTAP (SQL), Deno test (Edge Functions), Jest + React Native Testing Library (mobil)

## Klasör yapısı

```
/
├─ CLAUDE.md
├─ docs/                      # CSV'ler
├─ supabase/
│  ├─ migrations/             # 0001_schema.sql, 0002_functions.sql, 0003_rls.sql, 0004_cron.sql
│  ├─ seed.sql                # CSV v2'den üretilir
│  ├─ tests/                  # pgTAP
│  └─ functions/
│     ├─ davet-olustur/
│     ├─ davet-kabul/
│     ├─ hatirlatma-gonder/
│     └─ gunluk-hatirlatma/   # cron tetikler
└─ app/                       # Expo
   ├─ app/                    # Expo Router ekranları
   ├─ src/api/                # Supabase sorguları (ekran başına bir dosya)
   ├─ src/lib/                # tarih, gün_no, sayfa aralığı yardımcıları
   └─ src/types/database.ts   # `supabase gen types` çıktısı
```

## Lokal geliştirme

```bash
npm i -g supabase
supabase init
supabase start                      # Docker gerekli
supabase db reset                   # migrations + seed.sql
supabase functions serve --env-file supabase/.env.local
supabase gen types typescript --local > app/src/types/database.ts

cd app && npx create-expo-app@latest . --template tabs
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage expo-notifications expo-linking
npx expo start
```

`app/.env`:
```
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<supabase start çıktısındaki anon key>
```

## Veri modeli

Tablolar, sütunlar, tipler ve kısıtlar `docs/Risale DB Şema v2.csv` içindedir; migration'ı satır satır bu dosyadan üret. Tablolar: `kullanici, kitaplar, program, program_kitaplari, grup, kullanici_program, duraklatmalar, okuma_kayitlari, notlar, davetler, hatirlatmalar, cihazlar`.

Kurallar:
- Tüm `id` alanları `uuid` (`gen_random_uuid()`); seed'deki `k1, p1…` kodları seed.sql'de sabit uuid'lere eşlenir.
- Enum benzeri alanlar `text` + `CHECK` kısıtı (Postgres enum kullanma; değer eklemek kolay olsun).
- `kullanici.id` = `auth.users.id`; yeni Auth kullanıcısında trigger ile `kullanici` satırı açılır.
- Çizelge **saklanmaz, hesaplanır.** Saklanan tek şey okuma olaylarıdır (`okuma_kayitlari`).

## Hesaplama fonksiyonları (SQL, `0002_functions.sql`)

1. **`bugunku_gun_no(kullanici_program_id, tarih default yerel bugün) → int`**
   - Kullanıcının `saat_dilimi`ne göre yerel tarihi bul.
   - `baslangic_tarihi`nden o tarihe kadar olan günleri say; `duzen_modu=ozel` ise yalnızca `okuma_gunleri`'nde `1` olan haftanın günlerini say (Pzt=1. karakter).
   - `duraklatmalar` ile çakışan günleri düş (bitis boşsa bugüne kadar).
   - Başlangıçtan önceyse 0 döndür; `toplam_gun`'ü geçemez.
2. **`gun_araligi(program_id, gun_no) → table(kitap_id, kitap_ad, bas_sayfa, son_sayfa)`**
   - Program içi sayfa: `bas = (gun_no−1)·gunluk_sayfa + 1`, `son = min(gun_no·gunluk_sayfa, toplam_sayfa)`.
   - `program_kitaplari` (sıra, baslangic_sayfasi, bitis_sayfasi) ile kitap sayfasına çevir. Bir gün iki kitaba taşabilir → birden fazla satır döner (p1 44. gün: Sözler 861–862 + Tarihçe-i Hayat 1–18).
3. **`program_toplam(program_id) → (toplam_sayfa, toplam_gun)`**
4. **`ilerleme(kullanici_program_id) → (tamamlanan_gun, bugunku_gun, geride_gun, yuzde)`**
   - Tamamlanan gün = `okunan_sayfa IS NULL` olan kayıt sayısı (kısmi okuma tamamlanmış sayılmaz).
5. **`grup_durumu(grup_id) → table(kullanici_id, ad, tamamlanan, geride_gun, bugun_okudu)`** — yalnızca `durum='aktif'` üyeler.
6. Trigger: `okuma_kayitlari` insert'inde `telafi_mi = gun_no < bugunku_gun_no(...)`; `gun_no > toplam_gun` ise hata. Program son günü tamamlanınca `kullanici_program.durum='tamamladi'`.

## RLS (`0003_rls.sql`)

Her tabloda RLS açık. Özet:

| Tablo | Okuma | Yazma |
|---|---|---|
| kullanici | kendisi + aynı aktif gruptaki üyelerin `ad, soyad` | kendisi |
| kitaplar, program_kitaplari | herkes (program görünürse) | yalnızca service_role / program sahibi |
| program | `gorunurluk='herkes'` veya `olusturan_id=auth.uid()` veya kullanıcının grubunun programı | olusturan |
| grup | üyeleri | yonetici rolündekiler |
| kullanici_program | kendi satırları + aynı grubun satırları | kendisi; gruptaki `rol`/`durum=cikarildi` yalnızca yonetici |
| okuma_kayitlari, duraklatmalar | kendi + aynı grup üyeleri (yalnız okuma) | yalnızca sahibi |
| notlar | kendi + `grupla_paylas` grubunun üyeleri | sahibi |
| davetler | grup yöneticileri | Edge Function (service_role) |
| hatirlatmalar | gonderen veya alan | Edge Function |
| cihazlar | kendisi | kendisi |

Yardımcı: `is_grup_uyesi(grup_id)`, `is_grup_yoneticisi(grup_id)` — `SECURITY DEFINER`, `search_path` sabit.

## Edge Functions

- **davet-olustur** `POST {grup_id, tip, telefon?, maks_kullanim?}` → yalnızca yönetici. 6 karakterlik token, 7 gün geçerlilik. Dönüş: `https://<alan>/d/<token>` ve hazır WhatsApp linki `https://wa.me/<telefon>?text=<urlencoded>` (genel davette telefonsuz `https://wa.me/?text=`).
- **davet-kabul** `POST {token}` → token geçerli mi (süre, iptal, kullanım sayısı = `count(kullanici_program where davet_id)` < maks). Kullanıcıya `kullanici_program` açar: `baslangic_tarihi = grup.baslangic_tarihi`, `rol='uye'`, `davet_id`. Kişisel davette `kullanan_id/kullanilma` doldur. Zaten aktif üyeyse 409.
- **hatirlatma-gonder** `POST {grup_id, alan_id, kanal}` → gönderen aynı grupta aktif olmalı; alan geride olmalı (`geride_gun > 0`). `alan.hatirlatma_kabul=false` ise `durum='engellendi'` yaz, bildirim gönderme. `UNIQUE(gonderen_id, alan_id, tarih)` ihlalinde 429. `push` → `cihazlar` token'larına Expo Push; `whatsapp` → yalnızca wa.me linki döndür (WhatsApp API yok).
- **gunluk-hatirlatma** — `pg_cron` her 15 dakikada çağırır. `hatirlatma_acik=true` ve yerel saati `hatirlatma_saati` penceresine giren, bugün okumamış, duraklatmada olmayan kullanıcılara kendi hatırlatmasını gönderir. `DeviceNotRegistered` dönen token'ı sil.

## Ekranlar (Expo Router)

| Rota | İçerik | Veri |
|---|---|---|
| `/(auth)/giris` | Telefon OTP | Supabase Auth |
| `/(tabs)/bugun` | Bugünün aralığı, "Okudum", "Kısmen okudum (sayfa)", geride kalan günler listesi + toplu telafi | `bugunku_gun_no`, `gun_araligi`, `ilerleme` |
| `/(tabs)/cizelge` | Takvim: her gün okundu / telafi / kısmi / kaçırıldı / duraklatma | `okuma_kayitlari` + `duraklatmalar` |
| `/(tabs)/gruplar` | Grup listesi, üye ilerlemesi, hatırlat butonu (günde 1, engellendiyse pasif) | `grup_durumu` |
| `/grup/[id]/ayarlar` | Davet linki (kişisel/genel), iptal, üye çıkarma, ders günü/saat/konum | davet-olustur, kullanici_program |
| `/d/[token]` | Deep link → davet-kabul | davet-kabul |
| `/program/yeni` | Özel program: kitap seç, sırala, sayfa aralığı, günlük sayfa, okuma günleri | program, program_kitaplari |
| `/notlar` | Kitap/sayfa notları, grupla paylaş | notlar |
| `/(tabs)/ayarlar` | Hatırlatma saati, saat dilimi, gruptan hatırlatma alma, duraklat/devam et, hesabı sil | kullanici, kullanici_program, duraklatmalar |

Kurallar: tarih hesabını istemcide tekrar yazma, SQL fonksiyonlarını `rpc()` ile çağır. Tüm metinler `src/i18n/tr.json`'da; ünlem ve emoji yok, hitap "-iniz".

## Kabul testleri (pgTAP, seed v2 ile, "bugün" = 2026-10-25)

1. `bugunku_gun_no(c1, '2026-10-21') = 6`; o5 `telafi_mi = true`.
2. `bugunku_gun_no(c3) = 4`; c2 ve c3 geride değil.
3. `ilerleme(c4).geride_gun = 0` (25 Ekim toplu telafi sonrası); h3 `durum='engellendi'`; aynı gün k2→k3 ikinci hatırlatma insert'i hata verir.
4. `bugunku_gun_no(c5) = 7`; c5 tamamlanan gün = 6 (o25 kısmi).
5. d4 iptal edildi → davet-kabul 410 döner; c6 `durum='cikarildi'` → `grup_durumu(g1)` k5'i içermez.
6. `program_toplam(p4) = (850, 57)`; `gun_araligi(p4, 26)` = Barla 376–382 + Kastamonu 1–8; p4 cumartesi gün sayısını artırmaz.
7. n1'i k3 görür (g1 üyesi), n2'yi kimse görmez (k4 hariç).
8. `gun_araligi(p1, 44)` iki satır döner: Sözler 861–862, Tarihçe-i Hayat 1–18.
9. RLS: k4, g1 üyelerinin `okuma_kayitlari`'nı göremez.

## Yapılacaklar

1. `supabase/migrations/0001_schema.sql` — Şema v2 CSV'den tablolar, FK, UNIQUE, CHECK, index (`okuma_kayitlari(kullanici_program_id, gun_no)`, `kullanici_program(grup_id, durum)`).
2. `0002_functions.sql` — yukarıdaki 6 madde.
3. `0003_rls.sql` — politikalar + yardımcı fonksiyonlar.
4. `seed.sql` — Senaryo Verileri v2 CSV'den (p2/p3 kitap satırlarını p1'den kopyala). Auth kullanıcılarını `auth.users`'a sabit uuid ile ekle.
5. `supabase/tests/*.sql` — kabul testleri; `supabase test db` geçmeli.
6. Edge Functions + Deno testleri; `0004_cron.sql` ile `gunluk-hatirlatma` zamanlaması.
7. `supabase gen types` → Expo uygulaması, ekranlar sırasıyla: giris → bugun → cizelge → gruplar → davet deep link → ayarlar → program/yeni → notlar.
8. Her ekran için `src/api/<ekran>.ts` ve Jest testi.

## Kapsam dışı (şimdilik)

Farklı baskıların sayfa numarası farkı, grup içi sohbet, lider tablosu, WhatsApp Business API ile otomatik mesaj, çevrimdışı senkronizasyon.
