// Demo stand-in for @fishaudio/agent-client (aliased in demo/vite.config.ts):
// scripted conversation, animated FFT, no network. Never shipped.

export const DEFAULT_SERVER_URL = "https://api.fish.audio";

export class FishAgentError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

type Handler = (payload: unknown) => void;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class MockSession {
  #handlers = new Map<string, Set<Handler>>();
  #speaking = false;
  #segment = 0;
  micMuted: boolean;
  status = "connected";
  sessionId = "sess_demo";

  constructor(options: { microphone?: boolean }) {
    this.micMuted = options.microphone === false;
  }

  on(event: string, handler: Handler) {
    let set = this.#handlers.get(event);
    if (!set) {
      set = new Set();
      this.#handlers.set(event, set);
    }
    set.add(handler);
    return this;
  }

  off(event: string, handler: Handler) {
    this.#handlers.get(event)?.delete(handler);
    return this;
  }

  emit(event: string, payload: unknown) {
    for (const handler of [...(this.#handlers.get(event) ?? [])]) {
      handler(payload);
    }
  }

  async speak(text: string) {
    const segmentId = `a${++this.#segment}`;
    this.emit("modeChange", "speaking");
    this.#speaking = true;
    const words = text.split(" ");
    let spoken = "";
    for (const word of words) {
      spoken = spoken ? `${spoken} ${word}` : word;
      this.emit("agentResponseDelta", { segmentId, delta: word, text: spoken });
      await delay(110);
    }
    this.emit("agentResponse", { segmentId, text });
    this.#speaking = false;
    this.emit("modeChange", "listening");
  }

  async greet() {
    await this.speak("Hi, this is Aria from Fish Audio. How can I help you today?");
  }

  userSpeech(text: string) {
    const segmentId = `u${++this.#segment}`;
    const words = text.split(" ");
    let heard = "";
    void (async () => {
      for (const word of words) {
        heard = heard ? `${heard} ${word}` : word;
        this.emit("userTranscript", { segmentId, text: heard, final: false });
        await delay(90);
      }
      this.emit("userTranscript", { segmentId, text, final: true });
      await this.#respond(text);
    })();
  }

  sendUserMessage(text: string) {
    this.emit("userTranscript", { segmentId: `t${++this.#segment}`, text, final: true });
    void this.#respond(text);
  }

  async #respond(text: string) {
    this.emit("modeChange", "thinking");
    await delay(650);
    if (/book|appoint|reschedule/i.test(text)) {
      const callId = `tc${this.#segment}`;
      this.emit("toolCallStarted", {
        callId,
        toolName: "check_availability",
        source: "webhook",
        input: '{"week":"this","service":"consultation"}',
        inputTruncated: false,
      });
      await delay(900);
      this.emit("toolCallCompleted", {
        callId,
        toolName: "check_availability",
        source: "webhook",
        output: '{"slot":"Friday 14:30","alternatives":["Mon 10:00"]}',
        outputTruncated: false,
      });
      await this.speak("Friday 2:30 PM is available — want me to book it?");
    } else {
      await this.speak("Absolutely — I can help with that. Anything else you want to know?");
    }
  }

  sendUserActivity() {}

  async setMicMuted(muted: boolean) {
    this.micMuted = muted;
  }

  async startAudio() {}

  async end() {
    this.emit("disconnect", { reason: "user_hangup" });
  }

  getOutputVolume(): number {
    return this.#speaking ? 0.45 + 0.4 * Math.abs(Math.sin(Date.now() / 180)) : 0.05;
  }

  getOutputFrequencyData(): Uint8Array {
    const data = new Uint8Array(32);
    const t = Date.now() / 150;
    for (let i = 0; i < data.length; i++) {
      const wave = this.#speaking
        ? 90 + 120 * Math.abs(Math.sin(t + i * 0.6)) * (1 - i / 48)
        : 12 + 10 * Math.abs(Math.sin(t / 3 + i));
      data[i] = Math.min(255, Math.round(wave));
    }
    return data;
  }
}

declare global {
  interface Window {
    __mockSession?: MockSession;
  }
}

export const AgentSession = {
  async start(options: { microphone?: boolean }) {
    await delay(700);
    const session = new MockSession(options);
    window.__mockSession = session;
    setTimeout(() => void session.greet(), 500);
    return session;
  },
};
