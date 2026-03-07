// NOTE: expo-av is deprecated in SDK 54 but still works.
// Migrate to expo-audio when building a native development build (expo run:ios).
// expo-audio requires a native build and will NOT work in Expo Go.
import { Audio } from 'expo-av';
import { getInfoAsync, deleteAsync, copyAsync, documentDirectory } from 'expo-file-system/legacy';
import { Platform, NativeModules, NativeEventEmitter } from 'react-native';

export interface AudioRecordingResult {
  uri: string;
  duration: number;
  fileSize: number;
}

interface LiveTranscriptionCallbacks {
  onPartial: (text: string) => void;
  onFinal: (text: string) => void;
}

class AudioServiceClass {
  private recording: Audio.Recording | null = null;
  private _recordingPaused = false;
  private sound: Audio.Sound | null = null;
  private startTime: number = 0;

  // Live transcription event subscriptions (iOS native module)
  private partialSub: any = null;
  private finalSub: any = null;

  // ─── Capability check ─────────────────────────────────────────────────────

  /**
   * True on iOS when the BrieflyTranscriber native module is compiled in
   * (i.e. running a development build, NOT Expo Go).
   * In this mode AVAudioEngine handles recording + real-time transcription together.
   */
  get supportsLiveTranscription(): boolean {
    return Platform.OS === 'ios' && !!NativeModules.BrieflyTranscriber;
  }

  // ─── Live transcription (iOS native module, development build only) ────────

  async startLiveTranscription(callbacks: LiveTranscriptionCallbacks): Promise<void> {
    const { BrieflyTranscriber } = NativeModules;
    const emitter = new NativeEventEmitter(BrieflyTranscriber);

    this.partialSub = emitter.addListener('onPartialTranscript', (e: { text: string }) => {
      callbacks.onPartial(e.text);
    });

    this.finalSub = emitter.addListener('onFinalTranscript', (e: { text: string }) => {
      callbacks.onFinal(e.text);
    });

    await BrieflyTranscriber.startLiveTranscription();
    this.startTime = Date.now();
  }

  async pauseLiveTranscription(): Promise<void> {
    await NativeModules.BrieflyTranscriber.pauseLiveTranscription();
  }

  async resumeLiveTranscription(): Promise<void> {
    await NativeModules.BrieflyTranscriber.resumeLiveTranscription();
  }

  async stopLiveTranscription(): Promise<AudioRecordingResult> {
    this.partialSub?.remove();
    this.finalSub?.remove();
    this.partialSub = null;
    this.finalSub = null;

    const result: { uri: string; duration: number } =
      await NativeModules.BrieflyTranscriber.stopLiveTranscription();

    let fileSize = 0;
    try {
      const info = await getInfoAsync(result.uri);
      fileSize = info.exists ? ((info as any).size ?? 0) : 0;
    } catch {}

    return { uri: result.uri, duration: result.duration, fileSize };
  }

  // ─── Standard recording (expo-av, Expo Go compatible) ─────────────────────

  async requestPermissions(): Promise<boolean> {
    const { granted } = await Audio.requestPermissionsAsync();
    return granted;
  }

  async startRecording(): Promise<void> {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync({
      ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
      isMeteringEnabled: true,
    });

    this.recording = recording;
    this._recordingPaused = false;
    this.startTime = Date.now();
  }

  async pauseRecording(): Promise<void> {
    if (this.recording) {
      await this.recording.pauseAsync();
      this._recordingPaused = true;
    }
  }

  async resumeRecording(): Promise<void> {
    if (!this.recording) return;
    // Re-assert the audio session recording mode. After a pause, iOS may
    // release the recording session, causing startAsync() to silently fail.
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    await this.recording.startAsync();
    this._recordingPaused = false;
  }

  async stopRecording(): Promise<AudioRecordingResult> {
    if (!this.recording) {
      throw new Error('No active recording');
    }

    let durationMillis = 0;
    try {
      const status = await this.recording.getStatusAsync();
      durationMillis = status.durationMillis ?? 0;
      // On iOS, the AAC encoder buffers audio frames internally. Calling
      // stopAndUnloadAsync() while actively recording can lose those buffered
      // frames, resulting in a file shorter than the actual recording duration.
      // Pausing first forces the encoder to flush all pending frames to disk.
      if (status.isRecording) {
        await this.recording.pauseAsync();
      }
    } catch {}

    await this.recording.stopAndUnloadAsync();
    const uri = this.recording.getURI()!;

    let fileSize = 0;
    try {
      const info = await getInfoAsync(uri);
      fileSize = info.exists ? ((info as any).size ?? 0) : 0;
    } catch {}

    const duration = durationMillis / 1000;
    this.recording = null;
    this._recordingPaused = false;

    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

    return { uri, duration, fileSize };
  }

  async getMetering(): Promise<number> {
    if (!this.recording) return 0;
    try {
      const status = await this.recording.getStatusAsync();
      if (!status.isRecording || status.metering === undefined) return 0;
      // dBFS: map -60..0 → 0..1  (speech peaks typically -30 to -6 dBFS)
      return Math.max(0, Math.min(1, (status.metering + 60) / 60));
    } catch {
      return 0;
    }
  }

  // ─── Playback ─────────────────────────────────────────────────────────────

  async playRecording(
    uri: string,
    onPlaybackStatusUpdate?: (position: number, duration: number, isPlaying: boolean) => void
  ): Promise<void> {
    await this.stopPlayback();

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });

    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true },
      (status) => {
        if (status.isLoaded && onPlaybackStatusUpdate) {
          onPlaybackStatusUpdate(
            status.positionMillis / 1000,
            (status.durationMillis ?? 0) / 1000,
            status.isPlaying
          );
        }
      }
    );

    this.sound = sound;
  }

  async pausePlayback(): Promise<void> {
    if (this.sound) await this.sound.pauseAsync();
  }

  async resumePlayback(): Promise<void> {
    if (this.sound) await this.sound.playAsync();
  }

  async seekTo(seconds: number): Promise<void> {
    if (this.sound) await this.sound.setPositionAsync(seconds * 1000);
  }

  async stopPlayback(): Promise<void> {
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    }
  }

  async setPlaybackSpeed(rate: number): Promise<void> {
    if (this.sound) await this.sound.setRateAsync(rate, true);
  }

  async deleteFile(uri: string): Promise<void> {
    try {
      await deleteAsync(uri, { idempotent: true });
    } catch {}
  }

  async copyToDocuments(uri: string, filename: string): Promise<string> {
    const dest = documentDirectory + filename;
    await copyAsync({ from: uri, to: dest });
    return dest;
  }
}

export const AudioService = new AudioServiceClass();
