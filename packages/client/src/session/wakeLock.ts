/**
 * Holds a screen wake lock while a session is live (browser only; inert
 * elsewhere). The platform releases the lock whenever the page is hidden, so
 * visibility returns re-request it. Failures are silent by design: a session
 * works fine without the lock, the screen just may sleep mid-call.
 */
export class WakeLockHolder {
  #sentinel?: WakeLockSentinel;
  #active = false;

  readonly #onVisibilityChange = (): void => {
    if (document.visibilityState === "visible") {
      void this.#request();
    }
  };

  acquire(): void {
    if (
      this.#active ||
      typeof document === "undefined" ||
      typeof navigator === "undefined" ||
      !navigator.wakeLock
    ) {
      return;
    }
    this.#active = true;
    document.addEventListener("visibilitychange", this.#onVisibilityChange);
    void this.#request();
  }

  async #request(): Promise<void> {
    if (!this.#active) {
      return;
    }
    try {
      const sentinel = await navigator.wakeLock.request("screen");
      if (!this.#active) {
        void sentinel.release().catch(() => undefined);
        return;
      }
      // Concurrent requests (acquire + visibility return) may both resolve;
      // drop the earlier sentinel so exactly one is held.
      const previous = this.#sentinel;
      this.#sentinel = sentinel;
      if (previous && previous !== sentinel) {
        void previous.release().catch(() => undefined);
      }
    } catch {
      // Denied (battery saver, hidden tab, permissions policy) — run without it.
    }
  }

  release(): void {
    if (!this.#active) {
      return;
    }
    this.#active = false;
    document.removeEventListener("visibilitychange", this.#onVisibilityChange);
    void this.#sentinel?.release().catch(() => undefined);
    this.#sentinel = undefined;
  }
}
