// Dış bağımlılığı olmayan yardımcılar (Deno testleri bunları doğrudan içe aktarır).

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function yanit(govde: unknown, durum = 200): Response {
  return new Response(JSON.stringify(govde), {
    status: durum,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

export function waLink(telefon: string | null | undefined, metin: string): string {
  const numara = (telefon ?? "").replace(/\D/g, "");
  return `https://wa.me/${numara}?text=${encodeURIComponent(metin)}`;
}

export function davetLinkleri(adres: string, token: string, telefon: string | null, grupAd: string) {
  const link = `${adres}/d/${token}`;
  const metin = `${grupAd} Risale-i Nur okuma grubuna davetlisiniz. Katılmak için: ${link}`;
  return { link, whatsapp: waLink(telefon, metin) };
}

export type PushMesaji = { baslik: string; govde: string; veri?: Record<string, unknown> };

// Expo Push API'ye gönderir; geçersizleşen (DeviceNotRegistered) token'ları döndürür.
export async function pushGonder(
  tokenlar: string[],
  mesaj: PushMesaji,
  fetchFn: typeof fetch = fetch,
): Promise<{ gonderilen: number; gecersiz: string[] }> {
  if (tokenlar.length === 0) return { gonderilen: 0, gecersiz: [] };
  const res = await fetchFn("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(tokenlar.map((to) => ({ to, title: mesaj.baslik, body: mesaj.govde, data: mesaj.veri, sound: "default" }))),
  });
  if (!res.ok) throw new Error(`Expo Push ${res.status}`);
  const { data } = await res.json() as { data: { status: string; details?: { error?: string } }[] };
  const gecersiz = tokenlar.filter((_, i) => data[i]?.details?.error === "DeviceNotRegistered");
  return { gonderilen: data.filter((d) => d.status === "ok").length, gecersiz };
}
