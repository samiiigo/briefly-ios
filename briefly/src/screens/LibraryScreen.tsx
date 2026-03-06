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
  const filtered = recordings.filter((r) => {
    if (activeTab === 'All') return true;
    return r.title.toLowerCase().includes(activeTab.toLowerCase().slice(0, 5));
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Library</Text>
        <TouchableOpacity style={styles.searchIcon}>
          <Ionicons name="search" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
        style={styles.tabsScrollView}
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

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Folders section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>FOLDERS</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.folderGrid}>
          <View style={styles.folderCard}>
            <View style={[styles.folderCardInner, styles.folderFavorites]}>
              <View style={styles.folderIconRow}>
                <Ionicons name="star" size={24} color="#FF9F0A" />
              </View>
              <View style={styles.folderTextRow}>
                <Text style={styles.folderCount}>12 items</Text>
                <Text style={styles.folderName}>Favorites</Text>
              </View>
            </View>
          </View>

          <View style={styles.folderCard}>
            <View style={[styles.folderCardInner, styles.folderWork]}>
              <View style={styles.folderIconRow}>
                <Ionicons name="briefcase" size={24} color="#0A84FF" />
              </View>
              <View style={styles.folderTextRow}>
                <Text style={styles.folderCount}>48 items</Text>
                <Text style={styles.folderName}>Work</Text>
              </View>
            </View>
          </View>

          <View style={styles.folderCard}>
            <View style={[styles.folderCardInner, styles.folderPersonal]}>
              <View style={styles.folderIconRow}>
                <Ionicons name="person" size={24} color="#BF5AF2" />
              </View>
              <View style={styles.folderTextRow}>
                <Text style={styles.folderCount}>23 items</Text>
                <Text style={styles.folderName}>Personal</Text>
              </View>
            </View>
          </View>

          <View style={styles.folderCard}>
            <View style={[styles.folderCardInner, styles.folderArchive]}>
              <View style={styles.folderIconRow}>
                <Ionicons name="add" size={24} color="rgba(255,255,255,0.5)" />
              </View>
              <View style={styles.folderTextRow}>
                <Text style={styles.folderName}>New Folder</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Recordings */}
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
  container: {
    flex: 1,
    backgroundColor: '#0A0A0C',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  searchIcon: {
    padding: 4,
  },
  tabsScrollView: {
    flexGrow: 0,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    paddingVertical: Spacing.sm,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 18,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
    justifyContent: 'flex-start',
  },
  folderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  folderCard: {
    width: '48.5%',
    marginBottom: 12,
  },
  folderCardInner: {
    borderRadius: 16,
    padding: 16,
    height: 90,
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  folderFavorites: {
    backgroundColor: 'rgba(255,159,10,0.08)',
  },
  folderWork: {
    backgroundColor: 'rgba(10,132,255,0.08)',
  },
  folderPersonal: {
    backgroundColor: 'rgba(191,90,242,0.08)',
  },
  folderArchive: {
    backgroundColor: 'rgba(28,28,30,0.6)',
  },
  folderIconRow: {
    marginBottom: 8,
  },
  folderTextRow: {
    gap: 2,
  },
  folderCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  folderName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0A84FF',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 40,
  },
});
