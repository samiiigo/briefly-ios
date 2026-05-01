/**
 * PlaybackService (SRP + ISP)
 *
 * Single responsibility: audio playback control.
 * Consumers that only need playback (e.g. TranscriptScreen) depend on
 * this small interface instead of the entire AudioService (ISP).
 */

import { Audio } from 'expo-av';
import { logger } from '../../utils/logger';
import { PlaybackControls } from './contracts';

class PlaybackServiceClass implements PlaybackControls {
  private sound: Audio.Sound | null = null;

  async play(
    uri: string,
    onPlaybackStatusUpdate?: (position: number, duration: number, isPlaying: boolean) => void
  ): Promise<void> {
    logger.info('AUDIO', 'Starting playback', { uri });
    await this.stop();

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

  async pause(): Promise<void> {
    if (this.sound) await this.sound.pauseAsync();
  }

  async resume(): Promise<void> {
    if (this.sound) await this.sound.playAsync();
  }

  async seekTo(seconds: number): Promise<void> {
    if (this.sound) await this.sound.setPositionAsync(seconds * 1000);
  }

  async stop(): Promise<void> {
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
      logger.info('AUDIO', 'Playback stopped');
    }
  }

  async setSpeed(rate: number): Promise<void> {
    if (this.sound) await this.sound.setRateAsync(rate, true);
  }
}

export const PlaybackService = new PlaybackServiceClass();
