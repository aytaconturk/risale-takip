import { benimId, supabase, veri } from '@/src/lib/supabase';

// RLS: kendi notları + üyesi olunan grupla paylaşılanlar
export async function notlar() {
  return veri(
    await supabase
      .from('notlar')
      .select('id, kullanici_id, sayfa, metin, grupla_paylas, olusturma, kitaplar(ad), grup(ad)')
      .order('olusturma', { ascending: false }),
  );
}

export async function notEkle(n: { kitap_id: string; sayfa: number | null; metin: string; grupla_paylas: string | null }) {
  if (!n.metin.trim()) throw new Error('metin boş');
  veri(await supabase.from('notlar').insert({ ...n, metin: n.metin.trim(), kullanici_id: await benimId() }));
}

export async function notSil(id: string) {
  veri(await supabase.from('notlar').delete().eq('id', id));
}
