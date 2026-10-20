-- Kitap kataloğu: seed'den taşındı, üretimde de gerekli
insert into kitaplar (id, ad, sayfa_sayisi) values ('00000000-0000-0000-0002-000000000001', 'Sözler', 862) on conflict (id) do nothing;
insert into kitaplar (id, ad, sayfa_sayisi) values ('00000000-0000-0000-0002-000000000002', 'Lem''alar', 488) on conflict (id) do nothing;
insert into kitaplar (id, ad, sayfa_sayisi) values ('00000000-0000-0000-0002-000000000003', 'Barla Lahikası', 382) on conflict (id) do nothing;
insert into kitaplar (id, ad, sayfa_sayisi) values ('00000000-0000-0000-0002-000000000004', 'Tarihçe-i Hayat', 725) on conflict (id) do nothing;
insert into kitaplar (id, ad, sayfa_sayisi) values ('00000000-0000-0000-0002-000000000005', 'Mektubat', 562) on conflict (id) do nothing;
insert into kitaplar (id, ad, sayfa_sayisi) values ('00000000-0000-0000-0002-000000000006', 'Asâ-yı Mûsâ', 270) on conflict (id) do nothing;
insert into kitaplar (id, ad, sayfa_sayisi) values ('00000000-0000-0000-0002-000000000007', 'Kastamonu Lahikası', 268) on conflict (id) do nothing;
insert into kitaplar (id, ad, sayfa_sayisi) values ('00000000-0000-0000-0002-000000000008', 'Şuâlar', 759) on conflict (id) do nothing;
insert into kitaplar (id, ad, sayfa_sayisi) values ('00000000-0000-0000-0002-000000000009', 'Mesnevî-i Nuriye', 258) on conflict (id) do nothing;
insert into kitaplar (id, ad, sayfa_sayisi) values ('00000000-0000-0000-0002-00000000000a', 'Emirdağ Lahikası', 557) on conflict (id) do nothing;
insert into kitaplar (id, ad, sayfa_sayisi) values ('00000000-0000-0000-0002-00000000000b', 'İşârâtü''l-İ''caz', 253) on conflict (id) do nothing;
insert into kitaplar (id, ad, sayfa_sayisi) values ('00000000-0000-0000-0002-00000000000c', 'İman ve Küfür Muvazeneleri', 207) on conflict (id) do nothing;
insert into kitaplar (id, ad, sayfa_sayisi) values ('00000000-0000-0000-0002-00000000000d', 'Sikke-i Tasdik-i Gaybî', 278) on conflict (id) do nothing;
insert into kitaplar (id, ad, sayfa_sayisi) values ('00000000-0000-0000-0002-00000000000e', 'Muhakemat', 130) on conflict (id) do nothing;
