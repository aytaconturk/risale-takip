import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, FunctionsHttpError } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import type { Database } from '@/src/types/database';

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } },
);

AppState.addEventListener('change', (s) =>
  s === 'active' ? supabase.auth.startAutoRefresh() : supabase.auth.stopAutoRefresh(),
);

// Supabase yanıtındaki hatayı fırlatır, veriyi döndürür. Hata yoksa data yalnızca
// maybeSingle() ve select'siz update/delete'te boştur; oralarda dönüş ?. ile okunur ya da kullanılmaz.
export function veri<T>({ data, error }: { data: T; error: unknown }): NonNullable<T> {
  if (error) throw error;
  return data as NonNullable<T>;
}

export async function benimId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error('oturum yok');
  return data.session.user.id;
}

// Edge Function çağrısı; 2xx dışı yanıtlar da gövdesiyle ve durum koduyla döner.
export async function fonksiyon<T = Record<string, unknown>>(ad: string, govde: object): Promise<T & { durum: number }> {
  const { data, error } = await supabase.functions.invoke(ad, { body: govde });
  if (error instanceof FunctionsHttpError) {
    const res = error.context as Response;
    return { ...(await res.json().catch(() => ({}))), durum: res.status };
  }
  if (error) throw error;
  return { ...data, durum: data?.durum ?? 200 };
}
