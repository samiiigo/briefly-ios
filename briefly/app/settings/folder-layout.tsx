import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useStackBack } from '@/components/navigation/layout/useStackBack';
import { ModePickerOption } from '@/components/navigation/header/ModePickerOption';
import { StackScreenHeader } from '@/components/navigation/header/StackScreenHeader';
import { useTopChromeLayout } from '@/components/navigation/layout/useTopChromeLayout';
import {
  useModePickerStyles,
  useSettingsSheetLayoutStyles,
} from '@/components/navigation/layout/screenLayout';
import { useFolderLayoutSettings } from '@/hooks/library/useFolderLayoutSettings';
import { useThemedColors } from '@/theme';

export default function FolderLayoutPickerScreen() {
  const goBack = useStackBack('/settings');
  const { scrollPaddingTop } = useTopChromeLayout();
  const colors = useThemedColors();
  const sl = useSettingsSheetLayoutStyles();
  const mp = useModePickerStyles();
  const { options, selectLayout } = useFolderLayoutSettings();

  return (
    <View style={sl.container}>
      <ScrollView
        contentContainerStyle={[sl.scrollContent, { paddingTop: scrollPaddingTop }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={sl.sectionLabel}>Library layout</Text>
        <View style={sl.card}>
          {options.map((option, index) => (
            <React.Fragment key={option.mode}>
              <ModePickerOption
                selected={option.selected}
                title={option.title}
                subtitle={option.subtitle}
                onPress={() => selectLayout(option.mode)}
              />
              {index !== options.length - 1 ? <View style={mp.optionDivider} /> : null}
            </React.Fragment>
          ))}
        </View>
        <Text style={sl.sectionDescription}>
          Choose how folders appear throughout your library.
        </Text>
      </ScrollView>
      <StackScreenHeader
        title="Folder layout"
        showBack
        onBack={goBack}
        leadingIcon="chevron-back"
        centerTitle
        titleSize="nav"
        buttonStyle={{ backgroundColor: colors.surfaceElevated }}
      />
    </View>
  );
}
