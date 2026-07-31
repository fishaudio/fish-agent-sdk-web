import type {
  AgentSessionMessage,
  ClientSessionMessage,
  SessionToken,
} from "@fishaudio/agent-protocol";

// Internal seam: the session layer speaks only this interface, so transport
// vocabulary stops at the implementation file and tests run against a mock.
// Not part of the public API surface.

export type TransportConnectionState = "connected" | "reconnecting" | "disconnected";

/**
 * One update of a transcription segment (`lk.transcription`). `text` is the
 * segment's full text so far — updates for the same id replace, never append.
 */
export interface TranscriptionSegmentUpdate {
  segmentId: string;
  role: "user" | "agent";
  text: string;
  final: boolean;
}

export interface TransportCallbacks {
  onAgentEvent(message: AgentSessionMessage): void;
  /**
   * Agent pipeline state as published by the agent framework (`lk.agent.state`
   * participant attribute): "initializing" | "idle" | "listening" | "thinking" |
   * "speaking". Sticky — late joiners receive the current value on connect.
   */
  onAgentState(state: string): void;
  onTranscription(update: TranscriptionSegmentUpdate): void;
  /** Remote (agent) audio; the session routes it to playback + analysis. */
  onOutputStream(stream: MediaStream): void;
  /** Local microphone audio, for input level/FFT reporting. */
  onInputStream(stream: MediaStream): void;
  onConnectionState(state: TransportConnectionState, reason?: string): void;
}

export interface TransportConnectOptions {
  callbacks: TransportCallbacks;
  inputDeviceId?: string;
  /** Capture and publish the microphone during connect. Default true. */
  microphone?: boolean;
}

export interface Transport {
  connect(sessionToken: SessionToken, options: TransportConnectOptions): Promise<void>;
  disconnect(): Promise<void>;
  setMicEnabled(enabled: boolean): Promise<void>;
  /**
   * Switch the capture device. While the microphone is not captured yet
   * (`microphone: false` start, still muted) this records the preference for
   * the next capture. Rejects when the device cannot be activated.
   */
  setInputDevice(deviceId: string): Promise<void>;
  sendClientEvent(message: ClientSessionMessage): Promise<void>;
  /**
   * The transport's underlying connection object (a LiveKit `Room` for the
   * production transport), backing the session's `getRoom()` escape hatch.
   * `unknown` here so this seam stays free of transport vocabulary.
   */
  getRoom?(): unknown;
}

export type TransportFactory = (sessionToken: SessionToken) => Transport;
