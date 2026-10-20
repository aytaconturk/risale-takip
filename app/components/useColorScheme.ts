import { useColorScheme as useColorSchemeCore } from 'react-native';

import { useUi } from '@/src/store';

export const useColorScheme = () => {
  const sistem = useColorSchemeCore();
  const tercih = useUi((s) => s.tema);
  if (tercih !== 'sistem') return tercih === 'koyu' ? 'dark' : 'light';
  return sistem === 'dark' ? 'dark' : 'light';
};
