import webpush from "npm:web-push@3.6.7";

import type { PushMesaji } from "./ortak.ts";

type Abonelik = { endpoint: string; keys: { p256dh: string; auth: string } };

// PWA aboneliklerine Web Push gönderir; süresi dolan (404/410) endpoint'leri döndürür.
// VAPID anahtarları yoksa (ör. yalnızca mobil kurulum) sessizce geçer.
export async function webPushGonder(abonelikler: Abonelik[], mesaj: PushMesaji): Promise<{ gecersiz: string[] }> {
  const pub = Deno.env.get("VAPID_PUBLIC_KEY");
  const priv = Deno.env.get("VAPID_PRIVATE_KEY");
  if (!pub || !priv || abonelikler.length === 0) return { gecersiz: [] };
  // Push servisleri (Apple/Google) sorun olursa bu adresle iletişim kurar; https olmalı
  webpush.setVapidDetails("https://aytaconturk.github.io/risale-takip", pub, priv);
  const gecersiz: string[] = [];
  await Promise.all(abonelikler.map(async (a) => {
    try {
      await webpush.sendNotification(a, JSON.stringify(mesaj));
    } catch (e) {
      const kod = (e as { statusCode?: number }).statusCode;
      if (kod === 404 || kod === 410) gecersiz.push(a.endpoint);
      else console.error("web push", kod, (e as Error).message);
    }
  }));
  return { gecersiz };
}
