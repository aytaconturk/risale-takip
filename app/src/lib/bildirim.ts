import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
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
