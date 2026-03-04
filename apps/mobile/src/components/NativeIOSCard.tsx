import React from 'react';
import {Platform, Text, View, requireNativeComponent} from 'react-native';

const NativeCardView =
  Platform.OS === 'ios'
    ? requireNativeComponent<{title: string}>('BrieflyNativeCardView')
    : null;

export function NativeIOSCard({title}: {title: string}) {
  if (!NativeCardView) {
    return (
      <View>
        <Text>{title}</Text>
      </View>
    );
  }

  return <NativeCardView style={{height: 72}} title={title} />;
}
