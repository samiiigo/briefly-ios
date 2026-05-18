import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { SearchFilterId } from '@/constants/search';
import { SearchFilterPills } from './SearchFilterPills';
import { SEARCH_FILTER_ROW_HEIGHT } from './searchLayout';

interface Props {
  progress: SharedValue<number>;
  selected: SearchFilterId;
  onSelect: (id: SearchFilterId) => void;
}

export function ScrollRevealSearchFilters({ progress, selected, onSelect }: Props) {
  const animatedStyle = useAnimatedStyle(() => ({
    height: interpolate(
      progress.value,
      [0, 1],
      [0, SEARCH_FILTER_ROW_HEIGHT],
      Extrapolation.CLAMP
    ),
    opacity: interpolate(progress.value, [0, 0.45, 1], [0, 0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(progress.value, [0, 1], [-6, 0], Extrapolation.CLAMP),
      },
    ],
  }));

  return (
    <Animated.View style={[styles.clip, animatedStyle]}>
      <SearchFilterPills selected={selected} onSelect={onSelect} compact />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
});
