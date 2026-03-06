import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface AudioRecordingResult {
  uri: string;
  duration: number;
  fileSize: number;
}

class AudioServiceClass {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private startTime: number = 0;

  async requestPermissions(): Promise<boolean> {
    const { granted } = await Audio.requestPermissionsAsync();
    return granted;
  }

  async startRecording(): Promise<void> {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    this.recording = recording;
    this.startTime = Date.now();
  }

  async pauseRecording(): Promise<void> {
    if (this.recording) {
      await this.recording.pauseAsync();
    }
  }

  async resumeRecording(): Promise<void> {
    if (this.recording) {
      await this.recording.startAsync();
    }
  }

  async stopRecording(): Promise<AudioRecordingResult> {
    if (!this.recording) {
      throw new Error('No active recording');
    }

    await this.recording.stopAndUnloadAsync();
    const status = await this.recording.getStatusAsync();
    const uri = this.recording.getURI()!;

    const fileInfo = await FileSystem.getInfoAsync(uri);
    const fileSize = fileInfo.exists ? ((fileInfo as any).size ?? 0) : 0;
    const duration = status.durationMillis ? status.durationMillis / 1000 : 0;

    this.recording = null;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    return { uri, duration, fileSize };
  }

  async getRecordingDuration(): Promise<number> {
    if (!this.recording) return 0;
    const status = await this.recording.getStatusAsync();
    return status.durationMillis ? status.durationMillis / 1000 : 0;
  }

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
    if (this.sound) {
      await this.sound.pauseAsync();
    }
  }

  async resumePlayback(): Promise<void> {
    if (this.sound) {
      await this.sound.playAsync();
    }
  }

  async seekTo(seconds: number): Promise<void> {
    if (this.sound) {
      await this.sound.setPositionAsync(seconds * 1000);
    }
  }

  async stopPlayback(): Promise<void> {
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    }
  }

  async setPlaybackSpeed(rate: number): Promise<void> {
    if (this.sound) {
      await this.sound.setRateAsync(rate, true);
    }
  }

  async deleteFile(uri: string): Promise<void> {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch {
      // ignore
    }
  }

  async copyToDocuments(uri: string, filename: string): Promise<string> {
    const dest = (FileSystem as any).documentDirectory + filename;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  }
}

export const AudioService = new AudioServiceClass();
