import { cors, waLink, yanit } from "../_shared/ortak.ts";
import { kullaniciIstemcisi, kullaniciyaPush, servisIstemcisi } from "../_shared/istemci.ts";

// Kurallar hatirlatma_gonder() içinde: 403 aynı grupta değil, 409 geride değil, 429 bugün zaten hatırlatıldı.
// hatirlatma_kabul=false ise kayıt 'engellendi' olur ve bildirim gitmez.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const { grup_id, alan_id, kanal } = await req.json();
  if (!grup_id || !alan_id || !["push", "whatsapp"].includes(kanal)) {
    return yanit({ hata: "grup_id, alan_id ve kanal gerekli" }, 400);
  }

  const { data: s, error } = await kullaniciIstemcisi(req).rpc("hatirlatma_gonder", {
    p_grup_id: grup_id,
    p_alan_id: alan_id,
    p_kanal: kanal,
  });
  if (error) return yanit({ hata: error.message }, 500);
  if (s.durum !== 200 || s.kayit_durumu === "engellendi") return yanit(s, s.durum);

  const metin = `${s.alan_ad}, okuma programınızda ${s.geride_gun} gün geridesiniz. Bugün telafi etmeyi deneyebilirsiniz.`;
  if (kanal === "whatsapp") return yanit({ ...s, whatsapp: waLink(s.telefon, metin) });

  // Dokununca Bugün, bu grubun programı seçili açılır
  const sb = servisIstemcisi();
  const { data: kp } = await sb.from("kullanici_program").select("id")
    .eq("kullanici_id", alan_id).eq("grup_id", grup_id).eq("durum", "aktif").maybeSingle();
  await kullaniciyaPush(sb, alan_id, { baslik: "Okuma hatırlatması", govde: metin, veri: { ekran: "bugun", kp: kp?.id } });
  return yanit(s);
});
