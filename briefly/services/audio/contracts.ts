export interface PlaybackControls {
  play(
    uri: string,
    onPlaybackStatusUpdate?: (position: number, duration: number, isPlaying: boolean) => void
  ): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  seekTo(seconds: number): Promise<void>;
  stop(): Promise<void>;
  setSpeed(rate: number): Promise<void>;
}

export interface MeteringSource {
  getMetering(): Promise<number>;
}
