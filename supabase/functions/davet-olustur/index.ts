import { cors, davetLinkleri, yanit } from "../_shared/ortak.ts";
import { kullaniciIstemcisi } from "../_shared/istemci.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const { grup_id, tip, telefon, maks_kullanim } = await req.json();
  if (!grup_id || !["kisisel", "genel"].includes(tip)) return yanit({ hata: "grup_id ve tip gerekli" }, 400);
  if (tip === "kisisel" && !telefon) return yanit({ hata: "kişisel davette telefon gerekli" }, 400);

  const sb = kullaniciIstemcisi(req);
  const { data: davet, error } = await sb.rpc("davet_olustur", {
    p_grup_id: grup_id,
    p_tip: tip,
    p_telefon: telefon ?? null,
    p_maks_kullanim: maks_kullanim ?? null,
  });
  if (error) return yanit({ hata: error.message }, error.code === "42501" ? 403 : 400);

  const { data: grup } = await sb.from("grup").select("ad").eq("id", grup_id).single();
  // Lokal: supabase/.env.local içinde DAVET_ADRESI=http://<LAN IP>:8081
  const adres = Deno.env.get("DAVET_ADRESI") ?? "https://risale.app";
  return yanit({ davet, ...davetLinkleri(adres, davet.token, davet.telefon, grup?.ad ?? "") });
});
