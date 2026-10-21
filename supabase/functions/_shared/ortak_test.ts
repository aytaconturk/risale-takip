import { davetLinkleri, gunlukMesaj, pushGonder, waLink } from "./ortak.ts";

function esit(a: unknown, b: unknown) {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`beklenen ${JSON.stringify(b)}, gelen ${JSON.stringify(a)}`);
}

Deno.test("kişisel davet: telefonlu wa.me linki", () => {
  const { link, whatsapp } = davetLinkleri("https://risale.app", "a7f3k9", "+90 555 555 55 54", "Perşembe Dersi");
  esit(link, "https://risale.app/d/a7f3k9");
  esit(whatsapp.startsWith("https://wa.me/905555555554?text="), true);
  esit(decodeURIComponent(whatsapp.split("text=")[1]).includes(link), true);
});

Deno.test("genel davet: telefonsuz wa.me linki", () => {
  esit(waLink(null, "a b").startsWith("https://wa.me/?text=a%20b"), true);
});

Deno.test("push: DeviceNotRegistered token'ları döner", async () => {
  let govde: unknown[] = [];
  const sahteFetch = (async (_url: string, init: RequestInit) => {
    govde = JSON.parse(init.body as string);
    return new Response(JSON.stringify({
      data: [{ status: "ok" }, { status: "error", details: { error: "DeviceNotRegistered" } }],
    }));
  }) as typeof fetch;
  const s = await pushGonder(["ExponentPushToken[a]", "ExponentPushToken[b]"], { baslik: "x", govde: "y" }, sahteFetch);
  esit(s, { gonderilen: 1, gecersiz: ["ExponentPushToken[b]"] });
  esit(govde.length, 2);
});

Deno.test("push: token yoksa istek atılmaz", async () => {
  const s = await pushGonder([], { baslik: "x", govde: "y" }, (() => { throw new Error("çağrılmamalı"); }) as typeof fetch);
  esit(s, { gonderilen: 0, gecersiz: [] });
});

Deno.test("günlük hatırlatma: tek program", () => {
  esit(gunlukMesaj([{ kp: "a", ad: "Lahikalar", gun_no: 2 }]), {
    baslik: "Günlük okuma",
    govde: "Lahikalar: bugünkü 2. gün okumanızı henüz işaretlemediniz.",
    veri: { ekran: "bugun", kp: "a" },
  });
});

Deno.test("günlük hatırlatma: iki program tek bildirim", () => {
  const m = gunlukMesaj([{ kp: "a", ad: "Lahikalar", gun_no: 2 }, { kp: "b", ad: "Perşembe dersi", gun_no: 5 }]);
  esit(m.govde, "Bugünkü okumanızı henüz işaretlemediniz: Lahikalar (2. gün), Perşembe dersi (5. gün).");
  esit(m.veri, { ekran: "bugun", kp: "a" });
});
