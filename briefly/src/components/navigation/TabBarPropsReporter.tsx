import { useLayoutEffect, useRef } from 'react';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { publishTabBarProps } from './tabBarBridge';

/** Forwards tab bar props to the root chrome overlay (blur sits below tab bar + record). */
export function TabBarPropsReporter(props: BottomTabBarProps) {
  const propsRef = useRef(props);
  propsRef.current = props;
  const activeIndex = props.state.index;
  const activeRouteKey = props.state.routes[activeIndex]?.key;

  useLayoutEffect(() => {
    publishTabBarProps(propsRef.current);
  }, [activeIndex, activeRouteKey]);

  return null;
}
