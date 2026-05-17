import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSyncExternalStore } from 'react';

let tabBarProps: BottomTabBarProps | null = null;
const subscribers = new Set<() => void>();

export function publishTabBarProps(props: BottomTabBarProps) {
  if (tabBarProps === props) return;
  tabBarProps = props;
  subscribers.forEach((listener) => listener());
}

export function useTabBarProps(): BottomTabBarProps | null {
  return useSyncExternalStore(
    (onStoreChange) => {
      subscribers.add(onStoreChange);
      return () => subscribers.delete(onStoreChange);
    },
    () => tabBarProps,
    () => tabBarProps
  );
}
