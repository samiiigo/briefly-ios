import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import {
  FolderListLayoutMode,
  folderListLayoutDescription,
  folderListLayoutTitle,
  useFolderListLayoutStore,
} from '@/context/useFolderListLayoutStore';
import { StackScreenHeader } from '@/components/navigation/StackScreenHeader';
import { TopBlurFade } from '@/components/navigation/TopBlurFade';
import { useTopChromeLayout } from '@/components/navigation/useTopChromeLayout';
import {
  modePickerStyles as mp,
  screenLayoutStyles as sl,
} from '@/components/navigation/screenLayout';

const LAYOUT_OPTIONS: FolderListLayoutMode[] = ['list', 'grid'];

export default function FolderLayoutPickerScreen() {
  const router = useRouter();
  const { scrollPaddingTop, topInset } = useTopChromeLayout();
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

      <TopBlurFade />
      <View style={[sl.headerOverlay, { paddingTop: topInset }]} pointerEvents="box-none">
        <StackScreenHeader
          title="Folder layout"
          showBack
          onBack={() => router.back()}
        />
      </View>
    </View>
  );
}
