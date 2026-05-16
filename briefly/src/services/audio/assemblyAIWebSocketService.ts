/**
 * AssemblyAIWebSocketService
 *
 * Pure-JS implementation of the AssemblyAI v3 real-time streaming WebSocket
 * protocol. Audio capture is handled separately (native or expo-audio); this
 * service only manages the connection, auth, message parsing, and reconnection.
 *
 * Matching the reference design from the JS streaming example:
 *   wss://streaming.assemblyai.com/v3/ws?sample_rate=16000&speech_model=u3-rt-pro
 *   Authorization header → Begin → Turn (partial/final) → Termination
 */

export type WSConnectionState =
  | 'idle'
  | 'connecting'
  | 'open'
  | 'reconnecting'
  | 'closed';

export interface WSCallbacks {
  onPartial: (text: string) => void;
  onFinal: (text: string) => void;
  onState: (state: WSConnectionState, reason?: string) => void;
  onError: (message: string) => void;
}

const WS_ENDPOINT = 'wss://streaming.assemblyai.com/v3/ws';
const MAX_RECONNECTS = 3;
const RECONNECT_BASE_MS = 500;

export class AssemblyAIWebSocketService {
  private ws: WebSocket | null = null;
  private callbacks: WSCallbacks | null = null;
  private reconnectAttempts = 0;
  private didRequestClose = false;
  private config: { apiKey: string; sampleRate: number; speechModel: string } | null = null;

  connect(
    apiKey: string,
    sampleRate: number,
    speechModel: string,
    callbacks: WSCallbacks,
  ): void {
    this.config = { apiKey, sampleRate, speechModel };
    this.callbacks = callbacks;
    this.didRequestClose = false;
    this.reconnectAttempts = 0;
    this.openSocket();
  }

  /** Send a raw PCM audio chunk to AssemblyAI. */
  sendPCM(data: ArrayBuffer): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }

  /** Ask AssemblyAI to terminate the session gracefully. */
  terminate(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'Terminate' }));
    }
  }

  /** Close the WebSocket immediately without a graceful termination. */
  disconnect(): void {
    this.didRequestClose = true;
    this.ws?.close(1000);
    this.ws = null;
    this.callbacks?.onState('closed');
    this.callbacks = null;
  }

  private openSocket(): void {
    if (!this.config) return;
    const { apiKey, sampleRate, speechModel } = this.config;

    const url =
      `${WS_ENDPOINT}?sample_rate=${sampleRate}` +
      `&speech_model=${encodeURIComponent(speechModel)}` +
      `&format_turns=true`;

    this.emitState(
      this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting',
    );

    // React Native WebSocket supports custom headers via a third options argument
    // (not part of the standard WebSocket spec, but available in React Native).
    const RNWebSocket = WebSocket as any;
    const ws: WebSocket = new RNWebSocket(url, undefined, {
      headers: { Authorization: apiKey },
    });
    this.ws = ws;

    ws.onopen = () => {
      // State moves to 'open' only when the server sends the Begin message.
    };

    ws.onmessage = (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        this.handleMessage(event.data);
      }
    };

    ws.onerror = () => {
      if (!this.didRequestClose) {
        this.handleRecoverableError('WebSocket connection error');
      }
    };

    ws.onclose = (event: CloseEvent) => {
      this.ws = null;
      if (!this.didRequestClose && event.code !== 1000) {
        this.handleRecoverableError(`WebSocket closed unexpectedly (${event.code})`);
      } else if (this.didRequestClose) {
        this.emitState('closed');
      }
    };
  }

  private handleMessage(raw: string): void {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }

    const type = (payload.type as string | undefined)?.toLowerCase();

    if (type === 'begin') {
      this.reconnectAttempts = 0;
      this.emitState('open');
      return;
    }

    if (type === 'error') {
      const msg =
        (payload.error as string | undefined) ??
        (payload.message as string | undefined) ??
        'AssemblyAI returned an unknown error.';
      this.callbacks?.onError(msg);
      return;
    }

    if (type === 'termination') {
      this.didRequestClose = true;
      this.ws?.close(1000);
      this.ws = null;
      this.emitState('closed', 'terminated');
      return;
    }

    if (type === 'turn') {
      const transcript = ((payload.transcript as string | undefined) ?? '').trim();
      if (!transcript) return;
      if (payload.turn_is_formatted === true) {
        this.callbacks?.onFinal(transcript);
      } else {
        this.callbacks?.onPartial(transcript);
      }
    }
  }

  private handleRecoverableError(message: string): void {
    this.ws = null;
    if (this.reconnectAttempts >= MAX_RECONNECTS) {
      this.callbacks?.onError(message);
      this.emitState('closed', 'reconnect-failed');
      return;
    }
    this.reconnectAttempts++;
    this.emitState('reconnecting', `attempt-${this.reconnectAttempts}`);
    const delay = RECONNECT_BASE_MS * this.reconnectAttempts;
    setTimeout(() => {
      if (!this.didRequestClose) this.openSocket();
    }, delay);
  }

  private emitState(state: WSConnectionState, reason?: string): void {
    this.callbacks?.onState(state, reason);
  }
}
