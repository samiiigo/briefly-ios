import { useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useRecordingStore } from '@/features/recording/state/useRecordingStore';
import { usePlayback } from '@/features/recording/hooks/usePlayback';
import { useRecordingAudioAvailability } from '@/features/recording/hooks/useRecordingAudioAvailability';
import { useRecordingManualRerun } from '@/features/recording/hooks/useRecordingManualRerun';
import { TRANSCRIPT_SCREEN_RERUN_FROM_AUDIO_LABEL } from '@/features/recording/utils/recordingRerunCapabilities';
export function useTranscriptScreen(recordingIdParam: string | string[] | undefined) {
  const router = useRouter();
  const recordingId = useMemo(
    () => (Array.isArray(recordingIdParam) ? recordingIdParam[0] : recordingIdParam),
    [recordingIdParam],
  );
  const recording = useRecordingStore((s) =>
    recordingId ? s.recordings.find((r) => r.id === recordingId) : undefined,
  );
  const audioAvailability = useRecordingAudioAvailability(recording);
  const rerun = useRecordingManualRerun(recording, audioAvailability);
  const playback = usePlayback({
    filePath: audioAvailability.filePath,
    transcript: recording?.transcript,
  });
  const rerunDisabled = rerun.manualRerunButtonDisabled || !rerun.hasAudio;
  const handleRerun = useCallback(() => {
    if (rerunDisabled || !recording) return;
    const result = rerun.runTranscriptAudioRerun();
    if (result === 'none') {
      Alert.alert(
        'No audio',
        'No recording file is available on this device to transcribe.',
      );
    }
  }, [recording, rerun, rerunDisabled]);
  return {
    router,
    recording,
    recordingId,
    playback,
    rerun,
    rerunDisabled,
    handleRerun,
    rerunAccessibilityLabel: TRANSCRIPT_SCREEN_RERUN_FROM_AUDIO_LABEL,
  };
}
