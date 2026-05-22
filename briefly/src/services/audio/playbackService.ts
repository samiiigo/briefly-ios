/**
 * PlaybackService
 *
 * Consumers that only need playback (e.g. TranscriptScreen) depend on
 */
import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';
import { logger } from '@/utils/logging/logger';
import { PlaybackControls, PlaybackStatusUpdate } from './contracts';
import { configurePlaybackAudioSession, releasePlaybackAudioSession } from './playbackSession';
class PlaybackServiceClass implements PlaybackControls {
  private player: AudioPlayer | null = null;
  private statusListener: { remove: () => void } | null = null;
  private detachStatusListener(): void {
    this.statusListener?.remove();
    this.statusListener = null;
  }
  async play(
    uri: string,
    onPlaybackStatusUpdate?: (status: PlaybackStatusUpdate) => void,
  ): Promise<void> {
    const trimmed = uri?.trim();
    if (!trimmed) {
      throw new Error('No audio file path for playback');
    }
    logger.info('AUDIO', 'Starting playback', { uri: trimmed });
    await this.stop();
    await configurePlaybackAudioSession();
    const player = createAudioPlayer(trimmed, {
      downloadFirst: Platform.OS === 'ios' || Platform.OS === 'android',
      updateInterval: 250,
    });
    await new Promise<void>((resolve, reject) => {
      let started = false;
      let settled = false;
      const fail = (error: unknown) => {
        if (settled) return;
        settled = true;
        this.detachStatusListener();
        try {
          player.remove();
        } catch {
          // ignore
        }
        reject(error instanceof Error ? error : new Error(String(error)));
      };
      const listener = player.addListener('playbackStatusUpdate', (status) => {
        onPlaybackStatusUpdate?.({
          position: status.currentTime,
          duration: status.duration,
          playing: status.playing,
          didJustFinish: status.didJustFinish,
        });
        if (!started && status.isLoaded) {
          started = true;
          try {
            player.play();
            this.player = player;
            settled = true;
            resolve();
          } catch (error) {
            fail(error);
          }
        }
      });
      this.statusListener = listener;
      setTimeout(() => {
        if (!started && !settled) {
          fail(new Error('Audio failed to load'));
        }
      }, 15_000);
    });
  }
  async pause(): Promise<void> {
    if (this.player) this.player.pause();
  }
  async resume(): Promise<void> {
    if (!this.player) return;
    await configurePlaybackAudioSession();
    this.player.play();
  }
  async seekTo(seconds: number): Promise<void> {
    if (this.player) await this.player.seekTo(seconds);
  }
  async stop(): Promise<void> {
    this.detachStatusListener();
    if (this.player) {
      try {
        this.player.pause();
        this.player.remove();
      } catch (error) {
        logger.warn('AUDIO', 'Error stopping player', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
      this.player = null;
      logger.info('AUDIO', 'Playback stopped');
    }
    await releasePlaybackAudioSession();
  }
  async setSpeed(rate: number): Promise<void> {
    if (this.player) this.player.playbackRate = rate;
  }
}
export const PlaybackService = new PlaybackServiceClass();
