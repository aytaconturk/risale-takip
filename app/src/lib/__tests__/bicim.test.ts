import { SAAT, saatBicimle } from '@/src/lib/bicim';

test('saatBicimle iki nokta koyar', () => {
  expect(['0', '09', '091', '0915', '09155', '09:15', '9:1'].map(saatBicimle)).toEqual(['0', '09', '09:1', '09:15', '09:15', '09:15', '91']);
  expect(SAAT.test(saatBicimle('2130'))).toBe(true);
  expect(SAAT.test(saatBicimle('2460'))).toBe(false);
});
