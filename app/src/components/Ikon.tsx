import {
  Bell, BookOpen, Bookmark, Calendar, ChartColumn, Check, ChevronLeft, ChevronRight,
  Flame, MessageCircle, Minus, Moon, Plus, Sun, Timer, Users, X,
} from 'lucide-react-native';

const IKONLAR = {
  kitap: BookOpen, takvim: Calendar, grafik: ChartColumn, kisiler: Users, yerimi: Bookmark, zil: Bell,
  gunes: Sun, ay: Moon, tik: Check, sag: ChevronRight, sol: ChevronLeft, alev: Flame, arti: Plus,
  eksi: Minus, kapat: X, mesaj: MessageCircle, zamanlayici: Timer,
};

export type IkonAdi = keyof typeof IKONLAR;

export function Ikon({ ad, renk, boyut = 20, kalinlik }: { ad: IkonAdi; renk: string; boyut?: number; kalinlik?: number }) {
  const Bilesen = IKONLAR[ad];
  return <Bilesen color={renk} size={boyut} strokeWidth={kalinlik ?? (ad === 'tik' ? 2.5 : 2)} />;
}
