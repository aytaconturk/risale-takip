-- PWA Web Push: expo_push_token alanında aboneliğin endpoint'i, abonelik'te tarayıcının PushSubscription JSON'u tutulur
alter table cihazlar drop constraint cihazlar_platform_check;
alter table cihazlar add constraint cihazlar_platform_check check (platform in ('ios', 'android', 'web'));
alter table cihazlar add column abonelik jsonb;
