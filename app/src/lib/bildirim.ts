import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { cihazKaydet } from '@/src/api/ayarlar';
import { webPushYenile } from '@/src/lib/webPush';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

// Push token'ı cihazlar tablosuna yazar. İzin yoksa veya EAS projectId tanımlı değilse sessizce geçer.
export async function pushKaydet() {
  try {
    if (Platform.OS === 'web') return await webPushYenile();
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    await cihazKaydet(data, Platform.OS === 'ios' ? 'ios' : 'android');
  } catch (e) {
    console.warn('push kaydı yapılamadı', e);
  }
}

// Bildirime dokununca ilgili ekran açılır (webde sw.js yapar). Soğuk açılışta son yanıt bir kez işlenip silinir.
export function useBildirimYonlendir(oturumVar: boolean) {
  useEffect(() => {
    if (Platform.OS === 'web' || !oturumVar) return;
    const git = (y: Notifications.NotificationResponse | null) => {
      const v = y?.notification.request.content.data as { ekran?: string; kp?: string } | undefined;
      if (!v?.ekran) return;
      Notifications.clearLastNotificationResponseAsync();
      router.navigate({ pathname: `/${v.ekran}` as never, params: v.kp ? { kp: v.kp } : {} });
    };
    Notifications.getLastNotificationResponseAsync().then(git);
    const abonelik = Notifications.addNotificationResponseReceivedListener(git);
    return () => abonelik.remove();
  }, [oturumVar]);
}
