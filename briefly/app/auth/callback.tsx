import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { handleIncomingAuthUrl } from '@/features/auth/services/authService';

export default function AuthCallbackScreen() {
  useEffect(() => {
    void Linking.getInitialURL().then((url) => handleIncomingAuthUrl(url));
  }, []);

  return null;
}
