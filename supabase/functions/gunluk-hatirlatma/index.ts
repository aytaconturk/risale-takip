import { gunlukMesaj, yanit } from "../_shared/ortak.ts";
import { kullaniciyaPush, servisIstemcisi } from "../_shared/istemci.ts";

type Aday = { kullanici_id: string; kullanici_program_id: string; gun_no: number };

// pg_cron her 15 dakikada çağırır (0004_cron.sql). Yalnızca service_role anahtarı kabul edilir.
Deno.serve(async (req) => {
  if (req.headers.get("Authorization") !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) {
    return yanit({ hata: "yetkisiz" }, 401);
  }
  const sb = servisIstemcisi();
  const { data, error } = await sb.rpc("gunluk_hatirlatma_adaylari");
  if (error) return yanit({ hata: error.message }, 500);
  const adaylar = data as Aday[];
  if (!adaylar.length) return yanit({ gonderilen: 0 });

  // Uygulamadaki gibi: grup adı, yoksa program adı
  const { data: adlar } = await sb.from("kullanici_program").select("id, program(ad), grup(ad)")
    .in("id", adaylar.map((a) => a.kullanici_program_id));
  const ad = (id: string) => {
    const k = (adlar ?? []).find((x) => x.id === id) as { grup?: { ad: string } | null; program?: { ad: string } | null } | undefined;
    return k?.grup?.ad ?? k?.program?.ad ?? "Okuma programı";
  };

  const kisiler = Map.groupBy(adaylar, (a) => a.kullanici_id);
  for (const [kullaniciId, liste] of kisiler) {
    await kullaniciyaPush(sb, kullaniciId,
      gunlukMesaj(liste.map((a) => ({ kp: a.kullanici_program_id, ad: ad(a.kullanici_program_id), gun_no: a.gun_no }))));
  }
  return yanit({ gonderilen: kisiler.size });
});
