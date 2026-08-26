'use client';

import { FormEvent, useState } from 'react';
import { Button, Input, Text, Stack } from '@briefly/ui';
import { useAuth } from './AuthProvider';

export function SignInForm() {
  const { signInWithEmail, errorMessage } = useAuth();
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setSent(false);
    try {
      await signInWithEmail(email);
      setSent(true);
    } catch {
      // errorMessage is set in the provider
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="auth-card" onSubmit={onSubmit}>
      <Stack gap="md">
        <Text as="h1" variant="title">
          Sign in to Briefly
        </Text>
        <Text as="p" variant="body">
          Enter your email and we will send a magic link. No password required.
        </Text>
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
        {errorMessage ? (
          <Text as="p" variant="caption" className="auth-error">
            {errorMessage}
          </Text>
        ) : null}
        {sent ? (
          <Text as="p" variant="caption" className="auth-success">
            Check your inbox for the sign-in link.
          </Text>
        ) : null}
        <Button type="submit" variant="primary" disabled={pending || !email.trim()}>
          {pending ? 'Sending…' : 'Send magic link'}
        </Button>
      </Stack>
    </form>
  );
}
