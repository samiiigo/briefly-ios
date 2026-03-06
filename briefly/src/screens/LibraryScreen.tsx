import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRecordingStore } from '../store/useRecordingStore';
import { RecordingCard } from '../components/RecordingCard';
import { Colors, Spacing, BorderRadius } from '../utils/theme';
import { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FILTER_TABS = ['All', 'Meetings', 'Lectures', 'Voice Memos'];

export function LibraryScreen() {
  const navigation = useNavigation<Nav>();
  const { recordings, deleteRecording } = useRecordingStore();
  const [activeTab, setActiveTab] = useState('All');

  // Simple keyword filter per tab (can be extended with recording tags)
  const filtered = recordings.filter((r) => {
    if (activeTab === 'All') return true;
    return r.title.toLowerCase().includes(activeTab.toLowerCase().slice(0, 5));
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="folder" size={22} color={Colors.primary} style={{ marginRight: 6 }} />
        <Text style={styles.headerTitle}>Library</Text>
        <TouchableOpacity style={styles.searchIcon}>
          <Ionicons name="search" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Folder grid — static in v1 */}
        <Text style={styles.sectionLabel}>FOLDERS</Text>
        <View style={styles.folderGrid}>
          <View style={[styles.folderCard, { backgroundColor: '#1A1200' }]}>
            <Ionicons name="star" size={22} color="#FFD60A" />
            <Text style={styles.folderName}>Favorites</Text>
            <Text style={styles.folderCount}>0 items</Text>
          </View>
          <View style={[styles.folderCard, { backgroundColor: '#001836' }]}>
            <Ionicons name="briefcase" size={22} color={Colors.primary} />
            <Text style={styles.folderName}>Work</Text>
            <Text style={styles.folderCount}>{recordings.length} items</Text>
          </View>
          <View style={[styles.folderCard, { backgroundColor: '#1A0020' }]}>
            <Ionicons name="person" size={22} color="#AF52DE" />
            <Text style={styles.folderName}>Personal</Text>
            <Text style={styles.folderCount}>0 items</Text>
          </View>
          <View style={[styles.folderCard, { backgroundColor: '#1C1C1E' }]}>
            <Ionicons name="archive" size={22} color={Colors.textSecondary} />
            <Text style={styles.folderName}>Archive</Text>
            <Text style={styles.folderCount}>0 items</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>RECENT RECORDINGS</Text>
        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>No recordings in this category.</Text>
        ) : (
          filtered.map((recording) => (
            <RecordingCard
              key={recording.id}
              recording={recording}
              onPress={() => navigation.navigate('Transcript', { recordingId: recording.id })}
              onDelete={() => deleteRecording(recording.id)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  searchIcon: { padding: 4 },
  tabsContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    marginRight: Spacing.sm,
  },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  content: { padding: Spacing.md, paddingBottom: 100 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  folderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  folderCard: {
    width: '48%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    minHeight: 90,
    justifyContent: 'flex-end',
  },
  folderName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginTop: Spacing.sm },
  folderCount: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  emptyText: { color: Colors.textSecondary, fontSize: 15, textAlign: 'center', marginTop: 40 },
});
