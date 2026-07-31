/**
 * WebAudio analyser over a MediaStream, feeding visualizers (levels + FFT)
 * without exposing any transport object. Browser only; every accessor
 * degrades to silence when WebAudio is unavailable.
 */
export class AudioStreamAnalyser {
  private context?: AudioContext;
  private analyser?: AnalyserNode;
  private source?: MediaStreamAudioSourceNode;

  setStream(stream: MediaStream): void {
    if (typeof AudioContext === "undefined") {
      return;
    }
    this.context ??= new AudioContext();
    this.analyser ??= this.context.createAnalyser();
    this.source?.disconnect();
    this.source = this.context.createMediaStreamSource(stream);
    this.source.connect(this.analyser);
    this.resume();
  }

  /** AudioContexts start suspended under autoplay policies; safe to call any time. */
  resume(): void {
    if (this.context?.state === "suspended") {
      void this.context.resume().catch(() => {});
    }
  }

  /** RMS level in [0, 1]. */
  getVolume(): number {
    if (!this.analyser) {
      return 0;
    }
    const samples = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(samples);
    let sumOfSquares = 0;
    for (const sample of samples) {
      const centered = (sample - 128) / 128;
      sumOfSquares += centered * centered;
    }
    return Math.sqrt(sumOfSquares / samples.length);
  }

  getFrequencyData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(0);
    }
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  dispose(): void {
    this.source?.disconnect();
    this.analyser?.disconnect();
    void this.context?.close().catch(() => {});
    this.source = undefined;
    this.analyser = undefined;
    this.context = undefined;
  }
}
