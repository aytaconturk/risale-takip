import { yanit } from "../_shared/ortak.ts";
import { kullaniciyaPush, servisIstemcisi } from "../_shared/istemci.ts";

// pg_cron her 15 dakikada çağırır (0004_cron.sql). Yalnızca service_role anahtarı kabul edilir.
Deno.serve(async (req) => {
  if (req.headers.get("Authorization") !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) {
    return yanit({ hata: "yetkisiz" }, 401);
  }
  const sb = servisIstemcisi();
  const { data: adaylar, error } = await sb.rpc("gunluk_hatirlatma_adaylari");
  if (error) return yanit({ hata: error.message }, 500);

  for (const a of adaylar as { kullanici_id: string; gun_no: number }[]) {
    await kullaniciyaPush(sb, a.kullanici_id, {
      baslik: "Günlük okuma",
      govde: `Bugünkü ${a.gun_no}. gün okumanızı henüz işaretlemediniz.`,
      veri: { ekran: "bugun" },
    });
  }
  return yanit({ gonderilen: adaylar.length });
});
