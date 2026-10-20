import { fireEvent, render, screen } from '@testing-library/react-native';

import { GirisFormu } from '@/src/components/GirisFormu';

jest.mock('@/src/lib/supabase', () => require('@/src/test/sahteSupabase').modul);

test('kayıt: telefon yazarken biçimlenir, geçerli numara olmadan hesap açılamaz', async () => {
  await render(<GirisFormu />);
  expect(screen.getByRole('button', { name: 'Giriş yap' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Yeni hesap oluştur' }));

  await fireEvent.changeText(screen.getByLabelText('Ad'), 'Ali');
  await fireEvent.changeText(screen.getByLabelText('E-posta'), 'ali@test.com');
  await fireEvent.changeText(screen.getByLabelText('Şifre'), 'gizli12');
  await fireEvent.changeText(screen.getByLabelText('Telefon numarası'), '0555555555');
  expect(screen.getByRole('button', { name: 'Hesap oluştur' })).toBeDisabled();

  await fireEvent.changeText(screen.getByLabelText('Telefon numarası'), '05555555554');
  expect(screen.getByLabelText('Telefon numarası').props.value).toBe('0555 555 55 54');
  expect(screen.getByRole('button', { name: 'Hesap oluştur' })).toBeEnabled();
});
