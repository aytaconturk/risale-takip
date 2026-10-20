"""docs/Risale DB Senaryo Verileri v2.csv → supabase/seed.sql

Kullanım: python3 supabase/seed_uret.py
Kodlar (k1, p1, ...) sabit uuid'lere eşlenir: önek tablo, son ek numara.
"""
import csv
import pathlib
import re

KOK = pathlib.Path(__file__).resolve().parent.parent
CSV = KOK / "docs" / "Risale DB Senaryo Verileri v2.csv"
CIKTI = KOK / "supabase" / "seed.sql"

ONEK = {"k": 1, "b": 2, "p": 3, "pk": 4, "g": 5, "c": 6, "du": 7, "d": 8, "o": 9, "h": 10, "n": 11, "cz": 12}


def uid(kod: str) -> str:
    m = re.fullmatch(r"([a-z]+)(\d+)", kod.strip())
    onek, no = m.group(1), int(m.group(2))
    return f"00000000-0000-0000-{ONEK[onek]:04x}-{no:012x}"


def bolumler():
    """CSV'yi BÜYÜK HARF başlıklı bölümlere ayırır: {ad: [satır dict]}"""
    satirlar = list(csv.reader(CSV.open(encoding="utf-8")))
    sonuc, i = {}, 0
    while i < len(satirlar):
        r = satirlar[i]
        ad = r[0].strip() if r else ""
        if ad and ad.split(" ")[0].isupper() and all(not x for x in r[1:]) and i + 1 < len(satirlar):
            basliklar = [h.strip() for h in satirlar[i + 1]]
            veri, i = [], i + 2
            # Bölüm boş satırda biter; aradaki açıklama satırları ("pk15–pk28 ...") atlanır
            while i < len(satirlar) and satirlar[i] and satirlar[i][0].strip():
                if re.fullmatch(r"[a-z]+\d+", satirlar[i][0].strip()):
                    veri.append(dict(zip(basliklar, (x.strip() for x in satirlar[i]))))
                i += 1
            sonuc[ad.split(" ")[0]] = veri
        else:
            i += 1
    return sonuc


def q(v):
    if v is None or v == "":
        return "null"
    if v in ("evet", "hayır"):
        return "true" if v == "evet" else "false"
    return "'" + str(v).replace("'", "''") + "'"


def ref(v):
    return q(uid(v)) if v else "null"


def ts(v):  # CSV saatleri Türkiye yerel saatidir
    return q(v + ":00+03") if v and " " in v else q(v)


def main():
    b = bolumler()
    o = ["-- Üretildi: supabase/seed_uret.py (elle düzenlemeyin)", ""]
    o.append("-- Lokal demo: uygulama senaryodaki 'bugün'ü görsün. Gerçek tarihe dönmek için bu satırı silin.")
    # (alter database ... set app.bugun yetki hatası verir; seed süper kullanıcı değildir)
    o.append(
        "create or replace function yerel_bugun(saat_dilimi text) returns date language sql stable as $$\n"
        "  select coalesce(nullif(current_setting('app.bugun', true), '')::date, date '2026-10-25')\n$$;"
    )
    # 0004_cron.sql: DB konteynerinden Edge Function'lara kong üzerinden ulaşılır (anahtar lokal demo anahtarıdır)
    o.append("select vault.create_secret('http://kong:8000', 'project_url');")
    o.append(
        "select vault.create_secret('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0"
        ".EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU', 'service_role_key');"
    )
    o.append("")

    for k in b["KULLANICI"]:
        # E-posta + şifre girişi; tüm seed kullanıcılarının şifresi test1234
        o.append(
            "insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, raw_app_meta_data, "
            "email_confirmed_at, created_at, updated_at, encrypted_password, confirmation_token, "
            "recovery_token, email_change_token_new, email_change, phone_change, phone_change_token, reauthentication_token) values "
            f"('00000000-0000-0000-0000-000000000000', {ref(k['id'])}, 'authenticated', 'authenticated', {q(k['eposta'])}, "
            f"jsonb_build_object('ad', {q(k['ad'])}), '{{\"provider\":\"email\",\"providers\":[\"email\"]}}', "
            f"now(), {q(k['kayit_tarihi'])}, now(), extensions.crypt('test1234', extensions.gen_salt('bf')), '', '', '', '', '', '', '');"
        )
        o.append(
            "insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at) values "
            f"({q(uid(k['id']))}, {ref(k['id'])}, jsonb_build_object('sub', {q(uid(k['id']))}, 'email', {q(k['eposta'])}), 'email', now(), now());"
        )
        o.append(
            f"update kullanici set ad = {q(k['ad'])}, soyad = {q(k['soyad'])}, telefon = {q(k['telefon'])}, "
            f"eposta = {q(k['eposta'])}, hatirlatma_acik = {q(k['hatirlatma_acik'])}, hatirlatma_saati = {q(k['hatirlatma_saati'])}, "
            f"saat_dilimi = {q(k['saat_dilimi'])}, dil = {q(k['dil'])}, kayit_tarihi = {q(k['kayit_tarihi'])}, "
            f"silinme_tarihi = {q(k['silinme_tarihi'])} where id = {ref(k['id'])};"
        )
    o.append("")

    for k in b["KITAPLAR"]:
        o.append(f"insert into kitaplar (id, ad, sayfa_sayisi) values ({ref(k['id'])}, {q(k['ad'])}, {k['sayfa_sayisi']});")
    o.append("")

    for p in b["PROGRAM"]:
        o.append(
            "insert into program (id, ad, gunluk_sayfa, onerilen_baslangic, duzen_modu, okuma_gunleri, olusturan_id, gorunurluk) values "
            f"({ref(p['id'])}, {q(p['ad'])}, {p['gunluk_sayfa']}, {q(p['onerilen_baslangic'])}, {q(p['duzen_modu'])}, "
            f"{q(p['okuma_gunleri'])}, {ref(p['olusturan_id'])}, {q(p['gorunurluk'])});"
        )
    o.append("")

    pk = b["PROGRAM_KITAPLARI"]
    p1 = [r for r in pk if r["program_id"] == "p1"]
    # pk15–pk28 (p2) ve pk29–pk42 (p3): p1 ile aynı 14 kitap, aynı sıra
    for program, bas in (("p2", 15), ("p3", 29)):
        pk += [dict(r, id=f"pk{bas + i}", program_id=program) for i, r in enumerate(p1)]
    for r in sorted(pk, key=lambda r: int(r["id"][2:])):
        o.append(
            "insert into program_kitaplari (id, program_id, kitap_id, sira, baslangic_sayfasi, bitis_sayfasi) values "
            f"({ref(r['id'])}, {ref(r['program_id'])}, {ref(r['kitap_id'])}, {r['sira']}, {r['baslangic_sayfasi'] or 1}, "
            f"{r['bitis_sayfasi'] or 'null'});"
        )
    o.append("")

    for g in b["GRUP"]:
        o.append(
            "insert into grup (id, ad, program_id, kurucu_id, baslangic_tarihi, davet_kodu, ders_gunu, ders_saati, konum, aktif, olusturma_tarihi) values "
            f"({ref(g['id'])}, {q(g['ad'])}, {ref(g['program_id'])}, {ref(g['kurucu_id'])}, {q(g['baslangic_tarihi'])}, "
            f"{q(g['davet_kodu'])}, {q(g['ders_gunu'])}, {q(g['ders_saati'])}, {q(g['konum'])}, {q(g['aktif'])}, {q(g['olusturma_tarihi'])});"
        )
    o.append("")

    for d in b["DAVETLER"]:
        kullanan = d["kullanan_id / kullanilma"]
        kullanan_id, kullanilma = (kullanan.split(" · ") if " · " in kullanan else ("", ""))
        o.append(
            "insert into davetler (id, grup_id, gonderen_id, tip, telefon, token, maks_kullanim, olusturma, son_gecerlilik, iptal_tarihi, kullanan_id, kullanilma) values "
            f"({ref(d['id'])}, {ref(d['grup_id'])}, {ref(d['gonderen_id'])}, {q(d['tip'])}, {q(d['telefon'])}, {q(d['token'])}, "
            f"{d['maks_kullanim']}, {ts(d['olusturma'])}, {q(d['son_gecerlilik'] + ' 23:59:59+03')}, {ts(d['iptal_tarihi'])}, "
            f"{ref(kullanan_id)}, {ts(kullanilma)});"
        )
    o.append("")

    for c in b["KULLANICI_PROGRAM"]:
        o.append(
            "insert into kullanici_program (id, kullanici_id, program_id, grup_id, rol, davet_id, dahil_olma_tarihi, baslangic_tarihi, durum, durum_tarihi, hatirlatma_kabul) values "
            f"({ref(c['id'])}, {ref(c['kullanici_id'])}, {ref(c['program_id'])}, {ref(c['grup_id'])}, {q(c['rol'])}, {ref(c['davet_id'])}, "
            f"{q(c['dahil_olma_tarihi'])}, {q(c['baslangic_tarihi'])}, {q(c['durum'])}, {q(c['durum_tarihi'])}, {q(c['hatirlatma_kabul'])});"
        )
    o.append("")

    for d in b["DURAKLATMALAR"]:
        o.append(
            "insert into duraklatmalar (id, kullanici_program_id, baslangic, bitis, neden) values "
            f"({ref(d['id'])}, {ref(d['kullanici_program_id'])}, {q(d['baslangic'])}, {q(d['bitis'])}, {q(d['neden'])});"
        )
    o.append("")

    # telafi_mi trigger tarafından okunma_tarihi'ne göre hesaplanır
    for r in b["OKUMA_KAYITLARI"]:
        o.append(
            "insert into okuma_kayitlari (id, kullanici_program_id, gun_no, okunma_tarihi, okunan_sayfa, kaynak) values "
            f"({ref(r['id'])}, {ref(r['kullanici_program_id'])}, {r['gun_no']}, {q(r['okunma_tarihi'])}, "
            f"{r['okunan_sayfa'] or 'null'}, {q(r['kaynak'])});"
        )
    o.append("")

    for h in b["HATIRLATMALAR"]:
        o.append(
            "insert into hatirlatmalar (id, grup_id, gonderen_id, alan_id, gun_no, kanal, zaman, tarih, durum) values "
            f"({ref(h['id'])}, {ref(h['grup_id'])}, {ref(h['gonderen_id'])}, {ref(h['alan_id'])}, {h['gun_no']}, "
            f"{q(h['kanal'])}, {ts(h['zaman'])}, {q(h['tarih'])}, {q(h['durum'])});"
        )
    o.append("")

    for n in b["NOTLAR"]:
        o.append(
            "insert into notlar (id, kullanici_id, kitap_id, sayfa, metin, grupla_paylas, olusturma) values "
            f"({ref(n['id'])}, {ref(n['kullanici_id'])}, {ref(n['kitap_id'])}, {n['sayfa'] or 'null'}, {q(n['metin'])}, "
            f"{ref(n['grupla_paylas'])}, {ts(n['olusturma'])});"
        )
    o.append("")

    for c in b["CIHAZLAR"]:
        o.append(
            "insert into cihazlar (id, kullanici_id, expo_push_token, platform, son_gorulme) values "
            f"({ref(c['id'])}, {ref(c['kullanici_id'])}, {q(c['expo_push_token'])}, {q(c['platform'])}, {ts(c['son_gorulme'])});"
        )

    CIKTI.write_text("\n".join(o) + "\n", encoding="utf-8")
    print(f"{CIKTI} yazıldı")


if __name__ == "__main__":
    main()
