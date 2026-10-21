# PWA ikonları ve iOS açılış görselleri. Kullanım: python3 scripts/ikon-uret.py (app/ içinde)
from PIL import Image, ImageDraw

VURGU, ZEMIN, METIN = '#007AFF', '#F2F2F7', '#000000'


def isaret(d, cx, cy, s, renk):
    # Açık kitap: ortada sırt, iki yana eğik sayfalar (s = işaret genişliği)
    h, g = s * 0.62, s * 0.06
    for yon in (-1, 1):
        ic, dis = cx + yon * g, cx + yon * s / 2
        d.polygon([(ic, cy - h / 2 + s * 0.06), (dis, cy - h / 2), (dis, cy + h / 2 - s * 0.06), (ic, cy + h / 2)], fill=renk)


def ikon(boyut, oran, ad):
    im = Image.new('RGB', (boyut, boyut), VURGU)
    isaret(ImageDraw.Draw(im), boyut / 2, boyut / 2, boyut * oran, 'white')
    im.save(ad if '/' in ad else f'public/{ad}')


ikon(180, 0.62, 'ikon-180.png')
ikon(192, 0.62, 'ikon-192.png')
ikon(512, 0.62, 'ikon-512.png')
ikon(512, 0.5, 'ikon-maskable-512.png')  # güvenli alan: ortadaki %80
ikon(1024, 0.5, 'assets/images/icon.png')  # iOS uygulama ikonu: saydamlık yok, köşeleri iOS yuvarlar

# Yerel açılış ekranı işareti (zemin rengi app.json'da, açık/koyu)
im = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
isaret(ImageDraw.Draw(im), 512, 512, 640, VURGU)
im.save('assets/images/splash-icon.png')

# iPhone dikey ekranlar (CSS genişlik, yükseklik, piksel oranı) — web-hazirla.mjs adlardan media sorgusu üretir
for w, h, r in [(375, 667, 2), (414, 896, 2), (375, 812, 3), (414, 896, 3), (390, 844, 3), (428, 926, 3), (393, 852, 3), (430, 932, 3), (402, 874, 3), (440, 956, 3)]:
    im = Image.new('RGB', (w * r, h * r), ZEMIN)
    isaret(ImageDraw.Draw(im), w * r / 2, h * r / 2, 96 * r, METIN)
    im.save(f'public/acilis/{w}x{h}@{r}.png')
