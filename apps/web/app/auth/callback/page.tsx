'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Text } from '@briefly/ui';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Completing sign-in…');

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    void (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      if (error) {
        setMessage(error.message);
        return;
      }
      router.replace('/');
      router.refresh();
    })();
  }, [router]);

  return (
    <div className="auth-card">
      <Text as="p" variant="body">
        {message}
      </Text>
    </div>
  );
}
