import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRecordingStore } from '../store/useRecordingStore';
import { useUserFolderStore } from '../store/useUserFolderStore';
import { RootStackParamList } from '../types';
import { resolveRecordingFolder } from '../utils/recordingFolder';
import { Colors, Spacing } from '../utils/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const BUILT_IN_FOLDERS = [
  // Only Archived and Recently Deleted are exposed as built-in folders.
  { id: 'archived', name: 'Archived', icon: 'archive' as const, color: '#BF5AF2' },
  { id: 'recently-deleted', name: 'Recently Deleted', icon: 'trash' as const, color: 'rgba(255,255,255,0.6)' },
] as const;

export function FolderListScreen() {
  const navigation = useNavigation<Nav>();
  const recordings = useRecordingStore((s) => s.recordings);
  const { folders, loadFolders, addFolder } = useUserFolderStore();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  const handleAddFolder = useCallback(() => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'New Folder',
        'Enter a name for the folder',
        (name) => {
          const trimmed = name?.trim();
          if (!trimmed) return;
          addFolder(trimmed).catch((err) => Alert.alert('Error', err.message));
        },
        'plain-text',
        ''
      );
    } else {
      setNewFolderName('');
      setAddModalVisible(true);
    }
  }, [addFolder]);

  const confirmAddFolder = useCallback(() => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    addFolder(trimmed)
      .then(() => {
        setAddModalVisible(false);
        setNewFolderName('');
      })
      .catch((err) => Alert.alert('Error', err.message));
  }, [addFolder, newFolderName]);

  const countForBuiltIn = (id: string) => {
    if (id === 'archived') {
      return recordings.filter((r) => r.deletedAt == null && r.isArchived).length;
    }
    if (id === 'recently-deleted') {
      return recordings.filter((r) => r.deletedAt != null).length;
    }
    return 0;
  };

  const countForUserFolder = (id: string) =>
    recordings.filter((r) => r.userFolderId === id).length;

  const openFolder = (folderId: string, folderName: string, folderType: 'built-in' | 'user') => {
    navigation.navigate('FolderRecordings', { folderId, folderName, folderType });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Folders</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddFolder}>
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>BUILT-IN</Text>
        {BUILT_IN_FOLDERS.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={styles.folderRow}
            onPress={() => openFolder(f.id, f.name, 'built-in')}
          >
            <View style={[styles.folderIconWrap, { backgroundColor: `${f.color}20` }]}>
              <Ionicons name={f.icon} size={22} color={f.color} />
            </View>
            <View style={styles.folderInfo}>
              <Text style={styles.folderName}>{f.name}</Text>
              <Text style={styles.folderCount}>{countForBuiltIn(f.id)} recordings</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        ))}

        {folders.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: Spacing.xl }]}>USER FOLDERS</Text>
            {folders.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={styles.folderRow}
                onPress={() => openFolder(f.id, f.name, 'user')}
              >
                <View style={[styles.folderIconWrap, styles.folderIconUser]}>
                  <Ionicons name="folder" size={22} color="rgba(255,255,255,0.7)" />
                </View>
                <View style={styles.folderInfo}>
                  <Text style={styles.folderName}>{f.name}</Text>
                  <Text style={styles.folderCount}>{countForUserFolder(f.id)} recordings</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>

      <Modal
        visible={addModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAddModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContentWrap}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View style={styles.addFolderModal}>
                <Text style={styles.addFolderModalTitle}>New Folder</Text>
                <TextInput
                  style={styles.addFolderInput}
                  value={newFolderName}
                  onChangeText={setNewFolderName}
                  placeholder="Folder name"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  autoFocus
                  onSubmitEditing={confirmAddFolder}
                />
                <View style={styles.addFolderModalActions}>
                  <TouchableOpacity
                    style={styles.addFolderModalBtn}
                    onPress={() => setAddModalVisible(false)}
                  >
                    <Text style={styles.addFolderModalBtnCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.addFolderModalBtn, styles.addFolderModalBtnPrimary]}
                    onPress={confirmAddFolder}
                    disabled={!newFolderName.trim()}
                  >
                    <Text style={styles.addFolderModalBtnPrimaryText}>Create</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  addBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: { flex: 1 },
  content: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: Spacing.md,
  },
  folderIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderIconUser: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  folderInfo: { flex: 1 },
  folderName: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  folderCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContentWrap: {
    width: '100%',
    maxWidth: 340,
  },
  addFolderModal: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  addFolderModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  addFolderInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  addFolderModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  addFolderModalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  addFolderModalBtnCancel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  addFolderModalBtnPrimary: {
    backgroundColor: '#0A84FF',
    borderRadius: 10,
  },
  addFolderModalBtnPrimaryText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
