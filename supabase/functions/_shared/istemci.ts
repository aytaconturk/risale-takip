import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

import { type PushMesaji, pushGonder } from "./ortak.ts";
import { webPushGonder } from "./webpush.ts";

const url = Deno.env.get("SUPABASE_URL")!;

// İsteği yapan kullanıcı adına (RLS ve auth.uid() geçerli)
export function kullaniciIstemcisi(req: Request): SupabaseClient {
  return createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    auth: { persistSession: false },
  });
}

export function servisIstemcisi(): SupabaseClient {
  return createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
}

// Kullanıcının tüm cihazlarına (Expo + PWA) push gönderir, geçersizleri siler.
export async function kullaniciyaPush(sb: SupabaseClient, kullaniciId: string, mesaj: PushMesaji) {
  const { data } = await sb.from("cihazlar").select("expo_push_token, platform, abonelik").eq("kullanici_id", kullaniciId);
  const cihazlar = data ?? [];
  const [expo, web] = await Promise.all([
    pushGonder(cihazlar.filter((c) => c.platform !== "web").map((c) => c.expo_push_token), mesaj),
    webPushGonder(cihazlar.filter((c) => c.platform === "web" && c.abonelik).map((c) => c.abonelik), mesaj),
  ]);
  const gecersiz = [...expo.gecersiz, ...web.gecersiz];
  if (gecersiz.length) await sb.from("cihazlar").delete().in("expo_push_token", gecersiz);
}
