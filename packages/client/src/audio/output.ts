import { FishAgentError } from "../errors.js";

/** Throws `device_change_failed` where the browser cannot route audio output (`setSinkId`). */
export function assertOutputSelectionSupported(): void {
  if (typeof HTMLMediaElement === "undefined" || !("setSinkId" in HTMLMediaElement.prototype)) {
    throw new FishAgentError(
      "device_change_failed",
      "This browser does not support selecting an audio output device",
    );
  }
}

/** Agent audio playback via a detached <audio> element (browser only; inert elsewhere). */
export class AudioOutput {
  private element?: HTMLAudioElement;
  private volume = 1;

  private ensureElement(): HTMLAudioElement | undefined {
    if (typeof document === "undefined") {
      return undefined;
    }
    if (!this.element) {
      this.element = document.createElement("audio");
      this.element.autoplay = true;
      // Same-effect attribute as playsInline for iOS Safari without DOM typings noise.
      this.element.setAttribute("playsinline", "");
      this.element.volume = this.volume;
    }
    return this.element;
  }

  setStream(stream: MediaStream): void {
    const element = this.ensureElement();
    if (!element) {
      return;
    }
    element.srcObject = stream;
    void element.play().catch(() => {
      // Autoplay policy: playback stays pending until startAudio() runs in a user gesture.
    });
  }

  /** Call from a user gesture to satisfy browser autoplay policies. */
  async startAudio(): Promise<void> {
    await this.element?.play();
  }

  /**
   * Route playback to an output device. The element is created on demand so
   * the browser validates the device id right here, even before the agent's
   * audio arrives. Rejects with `device_change_failed` where output selection
   * is unsupported or the device cannot be used.
   */
  async setSinkId(sinkId: string): Promise<void> {
    assertOutputSelectionSupported();
    const element = this.ensureElement();
    try {
      await element?.setSinkId(sinkId);
    } catch (error) {
      throw new FishAgentError(
        "device_change_failed",
        "Could not switch to the requested audio output device",
        { cause: error },
      );
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    if (this.element) {
      this.element.volume = this.volume;
    }
  }

  getVolume(): number {
    return this.volume;
  }

  dispose(): void {
    if (this.element) {
      this.element.srcObject = null;
      this.element.remove();
      this.element = undefined;
    }
  }
}
