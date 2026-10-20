import { benimId, supabase, veri } from '@/src/lib/supabase';

export type SeciliKitap = { kitap_id: string; ad: string; sayfa_sayisi: number; bas: number; son: number };

export async function kitaplar() {
  return veri(await supabase.from('kitaplar').select('id, ad, sayfa_sayisi').order('ad'));
}

// Kaydetmeden önce önizleme; kayıttan sonra değerler program_toplam()'dan okunur.
export function programOzeti(secili: SeciliKitap[], gunlukSayfa: number) {
  const sayfa = secili.reduce((t, k) => t + Math.max(0, k.son - k.bas + 1), 0);
  return { sayfa, gun: gunlukSayfa > 0 ? Math.ceil(sayfa / gunlukSayfa) : 0 };
}

export function programHatasi(ad: string, secili: SeciliKitap[], gunlukSayfa: number, okumaGunleri: string): string | null {
  if (!ad.trim()) return 'program.ad';
  if (secili.length === 0) return 'program.kitaplar';
  if (secili.some((k) => k.bas < 1 || k.son > k.sayfa_sayisi || k.son < k.bas)) return 'program.kitaplar';
  if (!(gunlukSayfa > 0)) return 'program.gunluk';
  if (!/^[01]{7}$/.test(okumaGunleri) || okumaGunleri === '0000000') return 'program.gunler';
  return null;
}

export async function programOlustur(ad: string, secili: SeciliKitap[], gunlukSayfa: number, okumaGunleri: string) {
  const id = await benimId();
  const program = veri(
    await supabase
      .from('program')
      .insert({
        ad: ad.trim(),
        gunluk_sayfa: gunlukSayfa,
        duzen_modu: okumaGunleri === '1111111' ? 'gunluk' : 'ozel',
        okuma_gunleri: okumaGunleri,
        olusturan_id: id,
        gorunurluk: 'ozel',
      })
      .select('id')
      .single(),
  );
  veri(
    await supabase.from('program_kitaplari').insert(
      secili.map((k, i) => ({
        program_id: program.id,
        kitap_id: k.kitap_id,
        sira: i + 1,
        baslangic_sayfasi: k.bas,
        bitis_sayfasi: k.son === k.sayfa_sayisi ? null : k.son,
      })),
    ),
  );
  return veri(await supabase.rpc('programa_basla', { p_program_id: program.id }));
}
