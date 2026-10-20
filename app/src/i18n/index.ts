import tr from './tr.json';

export type Anahtar = keyof typeof tr;

export function t(anahtar: Anahtar, degiskenler: Record<string, string | number> = {}): string {
  return tr[anahtar].replace(/\{(\w+)\}/g, (_, k) => String(degiskenler[k] ?? ''));
}
