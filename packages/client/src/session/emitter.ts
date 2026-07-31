/* eslint-disable @typescript-eslint/no-explicit-any */
type Listener = (...args: any[]) => void;

/** Minimal typed emitter; listener errors are isolated so one bad consumer can't break the session. */
export class TypedEmitter<Events extends Record<keyof Events, Listener>> {
  private readonly listeners = new Map<keyof Events, Set<Listener>>();

  on<K extends keyof Events>(event: K, listener: Events[K]): this {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener);
    return this;
  }

  off<K extends keyof Events>(event: K, listener: Events[K]): this {
    this.listeners.get(event)?.delete(listener);
    return this;
  }

  once<K extends keyof Events>(event: K, listener: Events[K]): this {
    const wrapper = ((...args: Parameters<Events[K]>) => {
      this.off(event, wrapper);
      listener(...args);
    }) as Events[K];
    return this.on(event, wrapper);
  }

  protected emit<K extends keyof Events>(event: K, ...args: Parameters<Events[K]>): void {
    const set = this.listeners.get(event);
    if (!set) {
      return;
    }
    for (const listener of [...set]) {
      try {
        listener(...args);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[fish-agent] listener error", error);
      }
    }
  }
}
