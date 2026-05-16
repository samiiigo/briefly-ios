/**
 * PlaybackService (SRP + ISP)
 *
 * Single responsibility: audio playback control.
 * Consumers that only need playback (e.g. TranscriptScreen) depend on
 * this small interface instead of the entire AudioService (ISP).
 */

import { createAudioPlayer, AudioPlayer, setAudioModeAsync } from 'expo-audio';
import { logger } from '@/utils/logger';
import { PlaybackControls } from './contracts';

class PlaybackServiceClass implements PlaybackControls {
  private player: AudioPlayer | null = null;

  async play(
    uri: string,
    onPlaybackStatusUpdate?: (position: number, duration: number, isPlaying: boolean) => void
  ): Promise<void> {
    logger.info('AUDIO', 'Starting playback', { uri });
    await this.stop();

    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    });

    const player = createAudioPlayer(uri);
    
    player.addListener('playbackStatusUpdate', (status) => {
      if (onPlaybackStatusUpdate) {
        onPlaybackStatusUpdate(
          status.currentTime,
          status.duration,
          status.playing
        );
      }
    });

    player.play();
    this.player = player;
  }

  async pause(): Promise<void> {
    if (this.player) this.player.pause();
  }

  async resume(): Promise<void> {
    if (this.player) this.player.play();
  }

  async seekTo(seconds: number): Promise<void> {
    if (this.player) await this.player.seekTo(seconds);
  }

  async stop(): Promise<void> {
    if (this.player) {
      this.player.pause();
      this.player.remove();
      this.player = null;
      logger.info('AUDIO', 'Playback stopped');
    }
  }

  async setSpeed(rate: number): Promise<void> {
    if (this.player) this.player.playbackRate = rate;
  }
}

export const PlaybackService = new PlaybackServiceClass();
