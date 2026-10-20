import { cors, yanit } from "../_shared/ortak.ts";
import { kullaniciIstemcisi } from "../_shared/istemci.ts";

// Durum kodları davet_kabul() içinde: 200, 401, 404, 409 (zaten üye), 410 (süresi doldu/iptal/dolu)
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const { token } = await req.json();
  if (!token) return yanit({ hata: "token gerekli" }, 400);

  const { data, error } = await kullaniciIstemcisi(req).rpc("davet_kabul", { p_token: token });
  if (error) return yanit({ hata: error.message }, 500);
  return yanit(data, data.durum);
});
