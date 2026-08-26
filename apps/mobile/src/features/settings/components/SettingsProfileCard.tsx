import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useCreateStyles, Spacing, BorderRadius, withAppFont } from '@briefly/theme/native';
import type { ColorPalette } from '@briefly/theme';
import type { SettingsProfile } from '@/features/settings/hooks/useSettingsProfile';

type Props = {
  profile: SettingsProfile;
};

export function SettingsProfileCard({ profile }: Props) {
  const styles = useCreateStyles(createStyles);
  const name = profile.displayName?.trim() || profile.email.split('@')[0] || 'You';
  const initial = useMemo(() => name.charAt(0).toUpperCase() || '?', [name]);
  const planLabel = profile.plan === 'plus' ? 'Plus' : 'Free';

  return (
    <View style={styles.card}>
      {profile.avatarUrl ? (
        <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarInitial}>{initial}</Text>
        </View>
      )}
      <View style={styles.meta}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.email} numberOfLines={1}>
          {profile.email}
        </Text>
        <View style={styles.planBadge}>
          <Text style={styles.planLabel}>{planLabel}</Text>
        </View>
      </View>
    </View>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: c.surfaceElevated,
      borderRadius: BorderRadius.cardXL,
      paddingHorizontal: Spacing.md,
      paddingVertical: 20,
      minHeight: 88,
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: c.headerButtonMuted,
    },
    avatarFallback: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: c.headerButtonMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: withAppFont({
      fontSize: 24,
      fontWeight: '600',
      color: c.textPrimary,
    }),
    meta: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    name: withAppFont({
      fontSize: 17,
      fontWeight: '600',
      color: c.textPrimary,
    }),
    email: withAppFont({
      fontSize: 14,
      color: c.subtext,
    }),
    planBadge: {
      alignSelf: 'flex-start',
      marginTop: 6,
      backgroundColor: c.background,
      borderRadius: BorderRadius.full,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    planLabel: withAppFont({
      fontSize: 12,
      fontWeight: '600',
      color: c.textPrimary,
    }),
  });
}
