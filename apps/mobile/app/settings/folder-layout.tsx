import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useStackBack } from '@/navigation/layout/useStackBack';
import { ModePickerOption } from '@/navigation/header/ModePickerOption';
import { StackScreenHeader } from '@/navigation/header/StackScreenHeader';
import { useSettingsTopChromeLayout } from '@/navigation/layout/useSettingsTopChromeLayout';
import {
  useModePickerStyles,
  useSettingsSheetLayoutStyles,
} from '@/navigation/layout/screenLayout';
import { useFolderLayoutSettings } from '@/features/library/hooks/useFolderLayoutSettings';
import { useThemedColors } from '@briefly/theme/native';

export default function FolderLayoutPickerScreen() {
  const goBack = useStackBack('/settings');
  const { scrollPaddingTop } = useSettingsTopChromeLayout();
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
