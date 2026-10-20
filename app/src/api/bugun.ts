import { benimId, supabase, veri } from '@/src/lib/supabase';

export type Ilerleme = {
  tamamlanan_gun: number;
  bugunku_gun: number;
  geride_gun: number;
  yuzde: number;
  seri: number;
  okunan_sayfa: number;
  toplam_sayfa: number;
  toplam_gun: number;
  bugun_okundu: boolean;
};

export type KullaniciProgram = Awaited<ReturnType<typeof programlarim>>[number];

// Kendi aktif/duraklatılmış programları (RLS grup arkadaşlarının satırlarını da açar; süzülür)
export async function programlarim() {
  const id = await benimId();
  return veri(
    await supabase
      .from('kullanici_program')
      .select('id, program_id, grup_id, rol, durum, baslangic_tarihi, hatirlatma_kabul, program(ad, gunluk_sayfa), grup(ad)')
      .eq('kullanici_id', id)
      .in('durum', ['aktif', 'duraklatildi'])
      .order('dahil_olma_tarihi'),
  );
}

export async function bugun(): Promise<string> {
  return veri(await supabase.rpc('kullanici_bugun'));
}

export async function acikProgramlar() {
  return veri(await supabase.from('program').select('id, ad, gunluk_sayfa, olusturan_id').order('gunluk_sayfa', { ascending: false }));
}

export async function programaBasla(programId: string) {
  return veri(await supabase.rpc('programa_basla', { p_program_id: programId }));
}

export async function ilerleme(kpId: string): Promise<Ilerleme> {
  return veri(await supabase.rpc('ilerleme', { kp_id: kpId })) as unknown as Ilerleme;
}

export async function gunAraligi(programId: string, gunNo: number) {
  return veri(await supabase.rpc('gun_araligi', { p_program_id: programId, p_gun_no: gunNo }));
}

export async function bugunVerisi(kp: { id: string; program_id: string }) {
  const [i, hafta, geride, tarih] = await Promise.all([
    ilerleme(kp.id),
    supabase.rpc('bu_hafta', { kp_id: kp.id }).then(veri),
    supabase.rpc('geride_gunler', { kp_id: kp.id }).then(veri),
    bugun(),
  ]);
  const [aralik, kismiKayitlar] = await Promise.all([
    i.bugunku_gun > 0 ? gunAraligi(kp.program_id, i.bugunku_gun) : [],
    supabase
      .from('okuma_kayitlari')
      .select('gun_no, okunan_sayfa')
      .eq('kullanici_program_id', kp.id)
      .not('okunan_sayfa', 'is', null)
      .then(veri),
  ]);
  // gun_no → okunan sayfa (yalnızca kısmi günler)
  const kismiler: Record<number, number> = Object.fromEntries((kismiKayitlar ?? []).map((k) => [k.gun_no, k.okunan_sayfa!]));
  return { ilerleme: i, hafta, geride, tarih, aralik, kismiler, kismiSayfa: kismiler[i.bugunku_gun] ?? null };
}

// okunanSayfa boşsa gün tamamlanmış sayılır; kısmi kayıt varsa üzerine yazılır.
export async function gunuIsaretle(kpId: string, gunNo: number, okunanSayfa: number | null = null) {
  veri(
    await supabase
      .from('okuma_kayitlari')
      .upsert({ kullanici_program_id: kpId, gun_no: gunNo, okunan_sayfa: okunanSayfa, kaynak: 'uygulama' } as never, {
        onConflict: 'kullanici_program_id,gun_no',
      }),
  );
}

// Okunan sayfa sayısına göre: günlük sayfaya ulaştıysa tam, 0 ise kayıt silinir, arası kısmi.
export async function sayfaKaydet(kpId: string, gunNo: number, n: number, gunluk: number) {
  if (n >= gunluk) return gunuIsaretle(kpId, gunNo);
  if (n <= 0) return isaretiKaldir(kpId, gunNo);
  return gunuIsaretle(kpId, gunNo, n);
}

// Sayfa cetveli: i. kutuya (0'dan) dokununca o sayfaya kadar okunmuş sayılır; son dolu kutuya dokunmak bir geri alır.
export function cetvelDokunus(mevcut: number, i: number): number {
  return mevcut === i + 1 ? i : i + 1;
}

// Okuma oturumu (Odak modu) sonunda kaydedilecek sayfa: önceki kısmi kayıt + oturumda çevrilen, en fazla günlük sayfa
export function oturumSayfasi(baslangicOkunan: number, okunan: number, gunluk: number): number {
  return Math.min(gunluk, baslangicOkunan + okunan);
}

export async function isaretiKaldir(kpId: string, gunNo: number) {
  veri(await supabase.from('okuma_kayitlari').delete().eq('kullanici_program_id', kpId).eq('gun_no', gunNo));
}

export async function topluTelafi(kpId: string, gunler: number[]) {
  const satirlar = gunler.map((g) => ({ kullanici_program_id: kpId, gun_no: g, okunan_sayfa: null, kaynak: 'toplu' }));
  veri(await supabase.from('okuma_kayitlari').upsert(satirlar as never, { onConflict: 'kullanici_program_id,gun_no' }));
}
