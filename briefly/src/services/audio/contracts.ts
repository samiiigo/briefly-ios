export interface PlaybackStatusUpdate {
  position: number;
  duration: number;
  playing: boolean;
  didJustFinish: boolean;
}

export interface PlaybackControls {
  play(
    uri: string,
    onPlaybackStatusUpdate?: (status: PlaybackStatusUpdate) => void
  ): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  seekTo(seconds: number): Promise<void>;
  stop(): Promise<void>;
  setSpeed(rate: number): Promise<void>;
}

export interface MeteringSource {
  getMetering(): number;
}
