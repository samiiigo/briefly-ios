import type { User } from '@supabase/supabase-js';
import type { AuthUserProfile } from './types';

export function mapUser(user: User | null): AuthUserProfile | null {
  if (!user) return null;
  const metadata = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? undefined,
    fullName:
      (typeof metadata.full_name === 'string' && metadata.full_name) ||
      (typeof metadata.name === 'string' && metadata.name) ||
      undefined,
    avatarUrl:
      (typeof metadata.avatar_url === 'string' && metadata.avatar_url) ||
      (typeof metadata.picture === 'string' && metadata.picture) ||
      undefined,
  };
}
