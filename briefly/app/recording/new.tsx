import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { RecordingService, LiveTranscriptionService } from '@/services/audio';
import { WaveformVisualizer } from '@/components/features/recording/WaveformVisualizer';
import { Colors, Spacing, BorderRadius } from '@/theme';
import { TranscriptionMode } from '@/types';
import { useRecordingStore } from '@/context/useRecordingStore';
import { useSettingsStore } from '@/context/useSettingsStore';
import { normalizeTranscriptionMode, transcriptionModeBadge, transcriptionModeDescription } from '@/utils/transcriptionMode';
import { formatTimestamp } from '@/utils';
import type { AssemblyAIConnectionState } from '@/services/audio/assemblyAILiveTranscription';
import { logger } from '@/utils/logger';
import { useTimer } from '@/hooks/useTimer';
import { useLiveTranscript } from '@/hooks/useLiveTranscript';
import { setTransitData } from '@/utils/navigationTransit';

export default function NewRecordingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ transcriptionModeOverride?: string; targetFolder?: string; targetUserFolderId?: string; markImported?: string }>();
  const { setLiveTranscript } = useRecordingStore();
  const { defaultTranscriptionMode } = useSettingsStore();
  const { elapsed, elapsedRef, start: startTimer, stop: stopTimer } = useTimer();
  const live = useLiveTranscript(setLiveTranscript, elapsedRef);
  const { finalText, partialText, liveSegments, isStopped, onPartial, onFinal, flush, reset, cleanup } = live;
  const [isPaused, setIsPaused] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [transcriptionMode, setTranscriptionMode] = useState<TranscriptionMode>(normalizeTranscriptionMode((params.transcriptionModeOverride as TranscriptionMode) ?? defaultTranscriptionMode));
  const [streamingState, setStreamingState] = useState<AssemblyAIConnectionState>('idle');
  const livePreviewScrollRef = useRef<ScrollView | null>(null);
  const isPausedRef = useRef(false);
  const startedWithLiveRef = useRef(false);
  const effectiveModeAtStartRef = useRef<TranscriptionMode>('post-assemblyai');
  const canCloudLive = LiveTranscriptionService.isSupported;
  const canOnDeviceLive = LiveTranscriptionService.isOnDeviceSupported;
  const selectedMode = normalizeTranscriptionMode(transcriptionMode);
  const isAssemblyAiLiveMode = selectedMode === 'live-assemblyai';
  const isLocalMode = selectedMode === 'local-on-device';
  const liveEngine: 'cloud' | 'on-device' | 'none' = isAssemblyAiLiveMode ? (canCloudLive ? 'cloud' : 'none') : isLocalMode ? (canOnDeviceLive ? 'on-device' : 'none') : 'none';
  const useLive = liveEngine !== 'none';
  const effectiveMode: TranscriptionMode = useLive ? selectedMode : 'post-assemblyai';

  useEffect(() => {
    reset(); setLiveTranscript('');
    (async () => {
      try {
        startedWithLiveRef.current = useLive;
        effectiveModeAtStartRef.current = effectiveMode;
        if (useLive) {
          await LiveTranscriptionService.start(liveEngine as 'cloud' | 'on-device', { onPartial, onFinal, onConnectionState: (s: AssemblyAIConnectionState) => setStreamingState(s), onError: (m: string) => { setStreamingState('reconnecting'); if (liveSegments.current.length === 0) setLiveTranscript('Reconnecting...'); } });
        } else { await RecordingService.start(); }
        setIsStarted(true); startTimer();
      } catch (err: any) {
        Alert.alert('Microphone Error', err?.message ?? 'Could not start recording.', [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]);
      }
    })();
    return () => { stopTimer(); cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePause = async () => {
    try {
      if (isPaused) { startedWithLiveRef.current ? await LiveTranscriptionService.resume() : await RecordingService.resume(); startTimer(); setIsPaused(false); isPausedRef.current = false; }
      else { startedWithLiveRef.current ? await LiveTranscriptionService.pause() : await RecordingService.pause(); stopTimer(); setIsPaused(true); isPausedRef.current = true; }
    } catch (err: any) { Alert.alert('Error', err?.message ?? 'Could not pause or resume.'); }
  };

  const handleStop = async () => {
    if (isStopped.current) return;
    isStopped.current = true; stopTimer(); cleanup();
    let result;
    try { result = startedWithLiveRef.current ? await LiveTranscriptionService.stop() : await RecordingService.stop(); }
    catch { try { await new Promise(r => setTimeout(r, 300)); result = await RecordingService.stop(); } catch (e: any) { isStopped.current = false; if (!isPausedRef.current) startTimer(); Alert.alert('Error', e?.message ?? 'Could not stop.'); return; } }
    flush();
    const pre = liveSegments.current.length > 0 ? liveSegments.current : undefined;
    setTransitData({ preTranscript: pre });
    router.replace({ pathname: '/recording/save', params: { duration: String(result?.duration || elapsed), filePath: result?.uri ?? '', fileSize: String(result?.fileSize ?? 0), transcriptionMode: effectiveModeAtStartRef.current, targetFolder: params.targetFolder, targetUserFolderId: params.targetUserFolderId, markImported: params.markImported } });
  };

  const handleDiscard = () => {
    Alert.alert('Discard Recording', 'This recording will be deleted.', [{ text: 'Keep Recording', style: 'cancel' }, { text: 'Discard', style: 'destructive', onPress: async () => { isStopped.current = true; stopTimer(); cleanup(); startedWithLiveRef.current ? await LiveTranscriptionService.stop().catch(() => {}) : await RecordingService.stop().catch(() => {}); setLiveTranscript(''); router.replace('/(tabs)'); } }]);
  };

  const hrs = Math.floor(elapsed / 3600), min = Math.floor((elapsed % 3600) / 60), sec = elapsed % 60;
  const hasAnyText = finalText.length > 0 || partialText.length > 0;
  const showLivePreview = selectedMode !== 'post-assemblyai';
  const placeholder = useLive ? (isAssemblyAiLiveMode ? 'Listening with AssemblyAI...' : 'Listening on-device...') : 'Transcription after you stop.';

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={handleDiscard} style={s.hBtn}><Ionicons name="close" size={24} color={Colors.textPrimary} /></TouchableOpacity>
        <View style={s.hCenter}><Text style={s.hTitle}>New Recording</Text><View style={s.recInd}><View style={[s.dot, isPaused && s.dotP]} /><Text style={[s.recTxt, isPaused && s.pTxt]}>{isPaused ? 'Paused' : 'Recording'}</Text></View></View>
        <TouchableOpacity style={s.hBtn} onPress={() => Alert.alert('Transcription', transcriptionModeDescription(selectedMode), [{ text: 'Live (AssemblyAI)', onPress: () => setTranscriptionMode('live-assemblyai') }, { text: 'Post (AssemblyAI)', onPress: () => setTranscriptionMode('post-assemblyai') }, { text: 'Local', onPress: () => setTranscriptionMode('local-on-device') }, { text: 'Cancel', style: 'cancel' }])}><Ionicons name="ellipsis-vertical" size={24} color={Colors.textPrimary} /></TouchableOpacity>
      </View>
      <View style={s.timerC}><View style={s.timerCard}><View style={s.tBlk}><Text style={s.tDig}>{String(hrs).padStart(2,'0')}</Text><Text style={s.tLbl}>HRS</Text></View><Text style={s.tSep}>:</Text><View style={s.tBlk}><Text style={s.tDig}>{String(min).padStart(2,'0')}</Text><Text style={s.tLbl}>MIN</Text></View><Text style={s.tSep}>:</Text><View style={s.tBlk}><Text style={s.tDig}>{String(sec).padStart(2,'0')}</Text><Text style={s.tLbl}>SEC</Text></View></View></View>
      <View style={s.wfC}><WaveformVisualizer isActive={isStarted && !isPaused} barCount={24} /></View>
      {showLivePreview && (<View style={s.lpC}><View style={s.lpH}><Ionicons name="document-text" size={14} color={Colors.primary} /><Text style={s.lpLbl}>Live Preview</Text><View style={s.pill}><Text style={s.pillTxt}>{transcriptionModeBadge(selectedMode)}</Text></View></View><ScrollView ref={livePreviewScrollRef} style={s.lpScroll} showsVerticalScrollIndicator={false} onContentSizeChange={() => livePreviewScrollRef.current?.scrollToEnd({ animated: true })}>{hasAnyText ? (<>{liveSegments.current.map(seg => (<View key={seg.id} style={s.segBlk}><Text style={s.segTs}>{formatTimestamp(seg.startTime)}</Text><Text style={s.segTxt}>{seg.text}</Text></View>))}{partialText ? <View style={s.segBlk}><View style={{width:38}} /><Text style={[s.segTxt, s.partTxt]}>{partialText}</Text></View> : null}</>) : (<Text style={s.lpPh}>{placeholder}</Text>)}</ScrollView></View>)}
      <View style={s.ctrls}><View style={s.ctrlItem}><TouchableOpacity style={s.pauseBtn} onPress={handlePause}><Ionicons name={isPaused ? 'play' : 'pause'} size={26} color={Colors.textPrimary} /></TouchableOpacity><Text style={s.ctrlLbl}>{isPaused ? 'RESUME' : 'PAUSE'}</Text></View><View style={s.ctrlItem}><TouchableOpacity style={s.stopBtn} onPress={handleStop}><View style={s.stopSq} /></TouchableOpacity><Text style={[s.ctrlLbl, { color: Colors.recordButton }]}>STOP</Text></View></View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screenHorizontal, paddingVertical: Spacing.sm },
  hBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  hCenter: { alignItems: 'center' }, hTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  recInd: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.green }, dotP: { backgroundColor: Colors.orange },
  recTxt: { fontSize: 12, color: Colors.green, fontWeight: '500' }, pTxt: { color: Colors.orange },
  timerC: { alignItems: 'center', paddingVertical: Spacing.lg },
  timerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  tBlk: { alignItems: 'center', minWidth: 60 }, tDig: { fontSize: 48, fontWeight: '700', color: Colors.textPrimary, fontVariant: ['tabular-nums'] },
  tLbl: { fontSize: 11, fontWeight: '500', color: Colors.textSecondary, letterSpacing: 1, marginTop: 2 },
  tSep: { fontSize: 40, fontWeight: '300', color: Colors.textSecondary, paddingBottom: 8, marginHorizontal: 4 },
  wfC: { alignItems: 'center', paddingVertical: Spacing.lg },
  lpC: { flex: 1, marginHorizontal: Spacing.screenHorizontal, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md },
  lpH: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm }, lpLbl: { fontSize: 13, fontWeight: '600', color: Colors.primary, flex: 1 },
  pill: { backgroundColor: 'rgba(52,199,89,0.15)', borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 2 },
  pillTxt: { fontSize: 10, fontWeight: '700', color: Colors.green, letterSpacing: 0.5 },
  lpScroll: { flex: 1 }, segBlk: { flexDirection: 'row', paddingVertical: 5, gap: 8 },
  segTs: { width: 38, fontSize: 12, color: Colors.textTertiary, paddingTop: 3, fontVariant: ['tabular-nums'] },
  segTxt: { flex: 1, fontSize: 15, color: Colors.textPrimary, lineHeight: 22 }, partTxt: { color: Colors.textSecondary, fontStyle: 'italic' },
  lpPh: { fontSize: 15, color: Colors.textTertiary, lineHeight: 22, fontStyle: 'italic' },
  ctrls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.xxl, paddingBottom: Spacing.xl, paddingTop: Spacing.md },
  ctrlItem: { alignItems: 'center', gap: Spacing.xs },
  pauseBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  stopBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.recordButton, alignItems: 'center', justifyContent: 'center' },
  stopSq: { width: 22, height: 22, borderRadius: 4, backgroundColor: '#fff' },
  ctrlLbl: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, letterSpacing: 1 },
});
