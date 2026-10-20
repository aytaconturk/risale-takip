import Constants from 'expo-constants';

import { cihazKaydet } from '@/src/api/ayarlar';

// PWA bildirimleri (Web Push). Hatırlatma saatini sunucu (pg_cron) takip eder; burada yalnızca abonelik yönetilir.
const taban = Constants.expoConfig?.experiments?.baseUrl ?? '';
const anahtar = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY;

export type WebPushDurumu = 'desteklenmiyor' | 'anaEkran' | 'engelli' | 'kapali' | 'acik';

const ios = () => /iPad|iPhone|iPod/.test(navigator.userAgent);

async function kayit() {
  return navigator.serviceWorker.register(`${taban}/sw.js`, { scope: `${taban}/` });
}

export async function webPushDurumu(): Promise<WebPushDurumu> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator) || !anahtar) return 'desteklenmiyor';
  // iOS Safari'de PushManager yalnızca ana ekrana eklenmiş PWA'da vardır
  if (!('PushManager' in window)) return ios() ? 'anaEkran' : 'desteklenmiyor';
  if (Notification.permission === 'denied') return 'engelli';
  const abonelik = await (await kayit()).pushManager.getSubscription();
  return abonelik && Notification.permission === 'granted' ? 'acik' : 'kapali';
}

// Butona basılınca çağrılmalı: iOS izin penceresini yalnızca kullanıcı etkileşiminde açar
export async function webPushAc() {
  const izin = await Notification.requestPermission();
  if (izin !== 'granted') throw new Error('izin verilmedi');
  const sw = await kayit();
  const abonelik = (await sw.pushManager.getSubscription())
    ?? await sw.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64Url(anahtar!) });
  await cihazKaydet(abonelik.endpoint, 'web', abonelik.toJSON());
}

// Açılışta: abonelik varsa son_gorulme'yi tazeler (izin istemez)
export async function webPushYenile() {
  if ((await webPushDurumu()) !== 'acik') return;
  const abonelik = await (await kayit()).pushManager.getSubscription();
  if (abonelik) await cihazKaydet(abonelik.endpoint, 'web', abonelik.toJSON());
}

function base64Url(s: string) {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}
