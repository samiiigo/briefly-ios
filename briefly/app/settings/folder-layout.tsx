import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useStackBack } from '@/components/navigation/useStackBack';
import {
  FolderListLayoutMode,
  folderListLayoutDescription,
  folderListLayoutTitle,
  useFolderListLayoutStore,
} from '@/context/useFolderListLayoutStore';
import { StackScreenHeader } from '@/components/navigation/StackScreenHeader';
import { useTopChromeLayout } from '@/components/navigation/useTopChromeLayout';
import {
  useModePickerStyles,
  useScreenLayoutStyles,
} from '@/components/navigation/screenLayout';

const LAYOUT_OPTIONS: FolderListLayoutMode[] = ['list', 'grid'];

export default function FolderLayoutPickerScreen() {
  const goBack = useStackBack('/settings');
  const { scrollPaddingTop } = useTopChromeLayout();
  const sl = useScreenLayoutStyles();
  const mp = useModePickerStyles();
  const layout = useFolderListLayoutStore((s) => s.layout);
  const setLayout = useFolderListLayoutStore((s) => s.setLayout);

  return (
    <View style={sl.container}>
      <ScrollView
        contentContainerStyle={[sl.scrollContent, { paddingTop: scrollPaddingTop }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={sl.sectionDescription}>
          Choose how folders appear in your library. This applies everywhere folders are shown.
        </Text>
        <View style={sl.card}>
          {LAYOUT_OPTIONS.map((mode, index) => {
            const selected = layout === mode;
            return (
              <React.Fragment key={mode}>
                <TouchableOpacity
                  style={mp.optionRow}
                  onPress={() => setLayout(mode)}
                >
                  <View style={[mp.radio, selected && mp.radioSelected]}>
                    {selected ? <View style={mp.radioDot} /> : null}
                  </View>
                  <View style={mp.optionText}>
                    <Text style={mp.optionTitle}>{folderListLayoutTitle(mode)}</Text>
                    <Text style={mp.optionSubtitle}>
                      {folderListLayoutDescription(mode)}
                    </Text>
                  </View>
                </TouchableOpacity>
                {index !== LAYOUT_OPTIONS.length - 1 ? (
                  <View style={mp.optionDivider} />
                ) : null}
              </React.Fragment>
            );
          })}
        </View>
      </ScrollView>

      <StackScreenHeader
        title="Folder layout"
        showBack
        onBack={goBack}
      />
    </View>
  );
}
