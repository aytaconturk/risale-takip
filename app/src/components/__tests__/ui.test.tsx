import { render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GunDairesi } from '@/src/components/GunDairesi';
import {
  AltSayfa, Anahtar, Bildirim, BolumBasligi, BosDurum, Buton, Cip, Cubuk, Ekran, Girdi, IkonDugme, Kart, Kolon,
  SegmentSecici, Stepper, TelefonGirdi,
} from '@/src/components/ui';
import { useUi } from '@/src/store';

let mockGenis = false;
jest.mock('@/src/lib/duzen', () => ({
  useDuzen: () => ({ genis: mockGenis, dil: mockGenis ? 'klasik' : 'modernist', bugunVaryant: mockGenis ? 'oturum' : 'kart' }),
}));
jest.mock('@/src/lib/supabase', () => require('@/src/test/sahteSupabase').modul);

const olcu = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } };
const ciz = (el: ReactElement) => render(<SafeAreaProvider initialMetrics={olcu}>{el}</SafeAreaProvider>);
const bos = () => {};

const ornekler: [string, () => ReactElement][] = [
  ['Ekran', () => (
    <Ekran ust="Gün 30 / 300" baslik="20 Ekim" alt="Salı" sag={null}>
      <Kolon><Kart cizgili><BolumBasligi baslik="Bu hafta" sag="3 / 4 gün okundu" /></Kart></Kolon>
    </Ekran>
  )],
  ['Butonlar', () => (
    <>
      <Buton baslik="Ana" ikon="tik" buyuk onPress={bos} />
      <Buton tur="ikincil" baslik="İkincil" onPress={bos} />
      <Buton tur="hayalet" baslik="Hayalet" onPress={bos} />
      <Buton tur="beyaz" baslik="Beyaz" pasif onPress={bos} />
    </>
  )],
  ['SegmentSecici', () => (
    <SegmentSecici secenekler={[{ deger: 'a', etiket: 'Açık' }, { deger: 'k', etiket: 'Koyu' }]} deger="a" degistir={bos} />
  )],
  ['Cip, Anahtar, Cubuk, Stepper, IkonDugme', () => (
    <>
      <Cip baslik="10" secili onPress={bos} />
      <Anahtar etiket="Günlük" deger degistir={bos} />
      <Cubuk oran={0.4} />
      <Stepper etiket="Sayfa" deger={12} azalt={bos} artir={bos} buyuk />
      <IkonDugme ad="zil" etiket="Ayarlar" onPress={bos} />
    </>
  )],
  ['AltSayfa', () => <AltSayfa acik kapat={bos}><Text>İçerik</Text></AltSayfa>],
  ['BosDurum', () => <BosDurum ikon="yerimi" baslik="Henüz not eklemediniz" alt="Açıklama" />],
  ['GunDairesi', () => (
    <>
      {(['okundu', 'telafi', 'kismi', 'kacirildi', 'bugun', 'gelecek', 'duraklatma', 'bos'] as const).map((d) => (
        <GunDairesi key={d} durum={d} metin="12" boyut={32} secili={d === 'bugun'} />
      ))}
    </>
  )],
];

describe.each([['modernist', false], ['klasik', true]])('%s', (_, genis) => {
  beforeEach(() => { mockGenis = genis; });

  test.each(ornekler)('%s', async (_ad, el) => {
    const { toJSON } = await ciz(el());
    expect(toJSON()).toMatchSnapshot();
  });

  test('Bildirim', async () => {
    useUi.setState({ bildirim: 'Gün 30 tamamlandı' });
    await ciz(<Bildirim />);
    expect(screen.getByText('Gün 30 tamamlandı')).toBeTruthy();
    useUi.setState({ bildirim: null });
  });

  // iOS 16 px altındaki girdilerde odakta sayfayı büyütür
  test('tüm girdiler en az 16 px', async () => {
    await ciz(
      <>
        <Girdi etiket="Ad" />
        <Girdi etiket="Not" multiline />
        <TelefonGirdi etiket="Telefon" value="" onChangeText={bos} />
      </>,
    );
    const girdiler = ['Ad', 'Not', 'Telefon'].map((e) => screen.getByLabelText(e));
    for (const g of girdiler) expect(StyleSheet.flatten(g.props.style).fontSize).toBeGreaterThanOrEqual(16);
  });
});
