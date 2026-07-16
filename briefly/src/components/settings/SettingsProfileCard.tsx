import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCreateStyles, Spacing, BorderRadius, withAppFont } from '@/theme';
import type { ColorPalette } from '@/theme/colorPalettes';
import type { SettingsProfile } from '@/hooks/settings/useSettingsProfile';

type Props = {
  profile: SettingsProfile;
};

export function SettingsProfileCard({ profile }: Props) {
  const styles = useCreateStyles(createStyles);
  const initial = useMemo(() => {
    const source = profile.displayName?.trim() || profile.email.trim();
    return source.charAt(0).toUpperCase() || '?';
  }, [profile.displayName, profile.email]);
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
        <Text style={styles.email} numberOfLines={1}>
          {profile.email}
        </Text>
        <View style={styles.planBadge}>
          {profile.plan === 'plus' ? (
            <Ionicons name="add" size={12} color={styles.planLabel.color} />
          ) : null}
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
      paddingVertical: Spacing.md,
      marginBottom: Spacing.sm,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.headerButtonMuted,
    },
    avatarFallback: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.headerButtonMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: withAppFont({
      fontSize: 20,
      fontWeight: '600',
      color: c.textPrimary,
    }),
    meta: {
      flex: 1,
      minWidth: 0,
      gap: 6,
    },
    email: withAppFont({
      fontSize: 17,
      fontWeight: '500',
      color: c.textPrimary,
    }),
    planBadge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
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
