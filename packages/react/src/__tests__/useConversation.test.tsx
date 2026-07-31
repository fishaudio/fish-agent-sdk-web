// @vitest-environment jsdom
import { act, render, renderHook, waitFor } from "@testing-library/react";
import { createElement, StrictMode, type PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

type Listener = (...args: unknown[]) => void;

interface FakeTranscriptSegment {
  segmentId: string;
  role: "user" | "agent";
  text: string;
  final: boolean;
}

class FakeAgentSession {
  status = "connected";
  mode: string = "listening";
  sessionId = "sess-1";
  micMuted = false;
  ended = false;
  endError?: unknown;
  endGate?: Promise<void>;
  endCalls = 0;
  sent: Array<[string, unknown?]> = [];
  transcript: FakeTranscriptSegment[] = [];
  private typedCount = 0;
  private listeners = new Map<string, Set<Listener>>();
  private ending?: Promise<void>;

  on(event: string, listener: Listener): this {
    const set = this.listeners.get(event) ?? new Set();
    set.add(listener);
    this.listeners.set(event, set);
    return this;
  }

  off(event: string, listener: Listener): this {
    this.listeners.get(event)?.delete(listener);
    return this;
  }

  emit(event: string, ...args: unknown[]): void {
    for (const listener of this.listeners.get(event) ?? []) {
      listener(...args);
    }
  }

  listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  end(): Promise<void> {
    if (this.ending) {
      return this.ending;
    }
    if (this.ended) {
      return Promise.resolve();
    }
    this.endCalls += 1;
    const ending = (async () => {
      if (this.endError) {
        throw this.endError;
      }
      this.ended = true;
      this.status = "ended";
      this.emit("statusChange", "ended");
      this.emit("disconnect", { reason: "user_hangup" });
      await this.endGate;
    })();
    this.ending = ending;
    void ending.catch(() => {
      if (this.ending === ending) {
        this.ending = undefined;
      }
    });
    return ending;
  }

  async setMicMuted(muted: boolean): Promise<void> {
    this.micMuted = muted;
  }

  // Mirrors AgentSession: a typed message is recorded and echoed synchronously.
  sendUserMessage(text: string): void {
    this.sent.push(["user.message", text]);
    const segmentId = `typed_${++this.typedCount}`;
    this.transcript.push({ segmentId, role: "user", text, final: true });
    this.emit("userTranscript", { segmentId, text, final: true });
  }

  getTranscript(): FakeTranscriptSegment[] {
    return this.transcript.map((segment) => ({ ...segment }));
  }

  sendUserActivity(): void {
    this.sent.push(["user.activity"]);
  }

  interrupt(): void {
    this.sent.push(["user.interrupt"]);
  }

  async startAudio(): Promise<void> {}
  setOutputVolume(_volume: number): void {}
  getInputVolume(): number {
    return 0.25;
  }
  getOutputVolume(): number {
    return 0.5;
  }
  getOutputFrequencyData(): Uint8Array {
    return new Uint8Array(0);
  }
  get isSpeaking(): boolean {
    return this.mode === "speaking";
  }
}

let currentFake: FakeAgentSession;
const startMock = vi.fn(async () => currentFake);

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

vi.mock("@fishaudio/agent-client", () => ({
  AgentSession: { start: (...args: unknown[]) => startMock(...(args as [])) },
  FishAgentError: class FishAgentError extends Error {},
}));

import { AgentSessionProvider, useAgentSessionContext } from "../provider.js";
import { useAgentMessages } from "../useAgentMessages.js";
import { useAudioLevels } from "../useAudioLevels.js";
import { useConversation } from "../useConversation.js";

beforeEach(() => {
  currentFake = new FakeAgentSession();
  startMock.mockClear();
});

describe("useConversation", () => {
  it("starts a session and mirrors its state", async () => {
    const { result } = renderHook(() => useConversation({ agentId: "a1" }));
    expect(result.current.status).toBe("idle");

    let sessionId = "";
    await act(async () => {
      sessionId = await result.current.startSession();
    });
    expect(sessionId).toBe("sess-1");
    expect(result.current.status).toBe("connected");
    expect(startMock).toHaveBeenCalledWith(expect.objectContaining({ agentId: "a1" }));

    act(() => currentFake.emit("modeChange", "speaking"));
    expect(result.current.mode).toBe("speaking");
    expect(result.current.isSpeaking).toBe(true);

    result.current.sendUserMessage("hi");
    result.current.interrupt();
    expect(currentFake.sent).toEqual([
      ["user.message", "hi"],
      ["user.interrupt"],
    ]);
  });

  it("reuses a live session instead of double-starting", async () => {
    const { result } = renderHook(() => useConversation());
    await act(async () => {
      await result.current.startSession({ agentId: "a1" });
      await result.current.startSession({ agentId: "a1" });
    });
    expect(startMock).toHaveBeenCalledTimes(1);
  });

  it("joins concurrent startSession calls to one session request", async () => {
    const { result } = renderHook(() => useConversation());
    let ids: string[] = [];
    await act(async () => {
      ids = await Promise.all([
        result.current.startSession({ agentId: "a1" }),
        result.current.startSession({ agentId: "a1" }),
      ]);
    });
    expect(ids).toEqual(["sess-1", "sess-1"]);
    expect(startMock).toHaveBeenCalledTimes(1);
  });

  it("ends the session and reflects ended status", async () => {
    const { result } = renderHook(() => useConversation());
    await act(async () => {
      await result.current.startSession({ agentId: "a1" });
    });
    await act(async () => {
      await result.current.endSession();
    });
    expect(currentFake.ended).toBe(true);
    expect(result.current.status).toBe("ended");
  });

  it("waits for an ended session's teardown before starting the next one", async () => {
    const firstSession = currentFake;
    let releaseEnd!: () => void;
    firstSession.endGate = new Promise<void>((resolve) => {
      releaseEnd = resolve;
    });
    const { result } = renderHook(() => useConversation());
    await act(async () => {
      await result.current.startSession({ agentId: "a1" });
    });

    let endPromise!: Promise<void>;
    act(() => {
      endPromise = result.current.endSession();
    });
    expect(result.current.status).toBe("ended");
    const secondEnd = result.current.endSession();
    let secondEndSettled = false;
    void secondEnd.then(() => {
      secondEndSettled = true;
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(secondEndSettled).toBe(false);

    const nextSession = new FakeAgentSession();
    currentFake = nextSession;
    let nextStart!: Promise<string>;
    act(() => {
      nextStart = result.current.startSession({ agentId: "a1" });
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(startMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      releaseEnd();
      await Promise.all([endPromise, secondEnd, nextStart]);
    });
    expect(firstSession.endCalls).toBe(1);
    expect(startMock).toHaveBeenCalledTimes(2);
    expect(result.current.session).toBe(nextSession);
    expect(result.current.status).toBe("connected");
  });

  it("ends a session that resolves after endSession was requested", async () => {
    const pending = createDeferred<FakeAgentSession>();
    const lateSession = currentFake;
    startMock.mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useConversation());

    let startPromise!: Promise<string>;
    act(() => {
      startPromise = result.current.startSession({ agentId: "a1" });
    });
    expect(result.current.status).toBe("connecting");

    let endPromise!: Promise<void>;
    act(() => {
      endPromise = result.current.endSession();
    });
    expect(result.current.status).toBe("ended");
    expect(result.current.session).toBeNull();

    let endSettled = false;
    void endPromise.then(() => {
      endSettled = true;
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(endSettled).toBe(false);

    await act(async () => {
      pending.resolve(lateSession);
      await Promise.all([startPromise, endPromise]);
    });
    expect(lateSession.ended).toBe(true);
    expect(lateSession.listenerCount("statusChange")).toBe(0);
    expect(lateSession.listenerCount("modeChange")).toBe(0);
    expect(result.current.session).toBeNull();
    expect(result.current.status).toBe("ended");

    const retrySession = new FakeAgentSession();
    currentFake = retrySession;
    await act(async () => {
      await result.current.startSession({ agentId: "a1" });
    });
    expect(startMock).toHaveBeenCalledTimes(2);
    expect(retrySession.ended).toBe(false);
    expect(result.current.session).toBe(retrySession);
    expect(result.current.status).toBe("connected");
  });

  it("queues a new start behind a cancelled pending start", async () => {
    const pending = createDeferred<FakeAgentSession>();
    const cancelledSession = currentFake;
    const nextSession = new FakeAgentSession();
    startMock.mockReturnValueOnce(pending.promise).mockResolvedValueOnce(nextSession);
    const { result } = renderHook(() => useConversation());

    let firstStart!: Promise<string>;
    act(() => {
      firstStart = result.current.startSession({ agentId: "a1" });
    });
    let endPromise!: Promise<void>;
    act(() => {
      endPromise = result.current.endSession();
    });
    let nextStart!: Promise<string>;
    act(() => {
      nextStart = result.current.startSession({ agentId: "a1" });
    });
    expect(startMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      pending.resolve(cancelledSession);
      await Promise.all([firstStart, endPromise, nextStart]);
    });

    expect(cancelledSession.ended).toBe(true);
    expect(startMock).toHaveBeenCalledTimes(2);
    expect(nextSession.ended).toBe(false);
    expect(result.current.session).toBe(nextSession);
    expect(result.current.status).toBe("connected");
  });

  it("cancels a queued restart when a later endSession is requested", async () => {
    const pending = createDeferred<FakeAgentSession>();
    const cancelledSession = currentFake;
    startMock.mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useConversation());

    let firstStart!: Promise<string>;
    act(() => {
      firstStart = result.current.startSession({ agentId: "a1" });
    });
    let firstEnd!: Promise<void>;
    act(() => {
      firstEnd = result.current.endSession();
    });
    let queuedStart!: Promise<string>;
    act(() => {
      queuedStart = result.current.startSession({ agentId: "a1" });
    });
    const queuedOutcome = queuedStart.catch((reason: unknown) => reason);
    let secondEnd!: Promise<void>;
    act(() => {
      secondEnd = result.current.endSession();
    });

    await act(async () => {
      pending.resolve(cancelledSession);
      await Promise.all([firstStart, firstEnd, secondEnd, queuedOutcome]);
    });

    expect(await queuedOutcome).toMatchObject({ name: "AbortError" });
    expect(cancelledSession.ended).toBe(true);
    expect(startMock).toHaveBeenCalledTimes(1);
    expect(result.current.session).toBeNull();
    expect(result.current.status).toBe("ended");
  });

  it("propagates failure to release a late cancelled session", async () => {
    const pending = createDeferred<FakeAgentSession>();
    const lateSession = currentFake;
    const error = new Error("disconnect failed");
    lateSession.endError = error;
    startMock.mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useConversation());

    let startPromise!: Promise<string>;
    act(() => {
      startPromise = result.current.startSession({ agentId: "a1" });
    });
    const observedStart = startPromise.catch((reason: unknown) => reason);
    let endPromise!: Promise<void>;
    act(() => {
      endPromise = result.current.endSession();
    });
    const observedEnd = endPromise.catch((reason: unknown) => reason);

    await act(async () => {
      pending.resolve(lateSession);
      await Promise.all([observedStart, observedEnd]);
    });

    expect(await observedStart).toBe(error);
    expect(await observedEnd).toBe(error);
    expect(lateSession.ended).toBe(false);
    expect(result.current.status).toBe("ended");

    await act(async () => {
      await expect(result.current.endSession()).rejects.toBe(error);
    });
    expect(lateSession.ended).toBe(false);

    lateSession.endError = undefined;
    const nextSession = new FakeAgentSession();
    currentFake = nextSession;
    await act(async () => {
      await result.current.startSession({ agentId: "a1" });
    });
    expect(lateSession.ended).toBe(true);
    expect(startMock).toHaveBeenCalledTimes(2);
    expect(result.current.session).toBe(nextSession);
    expect(result.current.status).toBe("connected");
  });

  it("keeps ended status when a cancelled pending start fails", async () => {
    const pending = createDeferred<FakeAgentSession>();
    const error = new Error("session request failed");
    startMock.mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useConversation());

    let startPromise!: Promise<string>;
    act(() => {
      startPromise = result.current.startSession({ agentId: "a1" });
    });
    const observedStart = startPromise.catch((reason: unknown) => reason);

    let endPromise!: Promise<void>;
    act(() => {
      endPromise = result.current.endSession();
    });
    await act(async () => {
      pending.reject(error);
      await endPromise;
    });

    expect(await observedStart).toBe(error);
    expect(result.current.status).toBe("ended");
  });

  it("returns to idle when start fails", async () => {
    startMock.mockRejectedValueOnce(new Error("session request failed"));
    const { result } = renderHook(() => useConversation());
    await expect(
      act(async () => {
        await result.current.startSession({ agentId: "a1" });
      }),
    ).rejects.toThrow("session request failed");
    expect(result.current.status).toBe("idle");
  });

  it("releases the session on unmount", async () => {
    const { result, unmount } = renderHook(() => useConversation());
    await act(async () => {
      await result.current.startSession({ agentId: "a1" });
    });
    unmount();
    await waitFor(() => expect(currentFake.ended).toBe(true));
  });

  it("ends a session whose start resolves after unmount", async () => {
    const pending = createDeferred<FakeAgentSession>();
    const lateSession = currentFake;
    startMock.mockReturnValueOnce(pending.promise);
    const { result, unmount } = renderHook(() => useConversation());

    let startPromise!: Promise<string>;
    act(() => {
      startPromise = result.current.startSession({ agentId: "a1" });
    });
    expect(result.current.status).toBe("connecting");

    unmount();
    await act(async () => {
      pending.resolve(lateSession);
      await startPromise;
    });

    expect(lateSession.ended).toBe(true);
    expect(lateSession.listenerCount("statusChange")).toBe(0);
    expect(lateSession.listenerCount("modeChange")).toBe(0);
  });

  it("does not start a new session through a stale callback after unmount", async () => {
    const { result, unmount } = renderHook(() => useConversation());
    const staleStart = result.current.startSession;
    unmount();

    await expect(staleStart({ agentId: "a1" })).rejects.toThrow(/unmounted/);
    expect(startMock).not.toHaveBeenCalled();
  });

  it("starts normally from a user action after StrictMode effect replay", async () => {
    const wrapper = ({ children }: PropsWithChildren) =>
      createElement(StrictMode, null, children);
    const { result, unmount } = renderHook(() => useConversation({ agentId: "a1" }), {
      wrapper,
    });

    await act(async () => {
      await result.current.startSession();
    });
    expect(result.current.status).toBe("connected");
    expect(startMock).toHaveBeenCalledTimes(1);
    expect(currentFake.ended).toBe(false);

    unmount();
    await waitFor(() => expect(currentFake.ended).toBe(true));
  });

  it("toggles mic mute through the session", async () => {
    const { result } = renderHook(() => useConversation());
    await act(async () => {
      await result.current.startSession({ agentId: "a1" });
      await result.current.setMicMuted(true);
    });
    expect(result.current.micMuted).toBe(true);
    expect(currentFake.micMuted).toBe(true);
  });

  it("reports the session's muted state after a microphone: false start", async () => {
    currentFake.micMuted = true; // AgentSession joins muted when microphone: false
    const { result } = renderHook(() => useConversation());
    await act(async () => {
      await result.current.startSession({ agentId: "a1", microphone: false });
    });
    expect(result.current.micMuted).toBe(true);
  });

  it("reports micMuted false after a normal voice start", async () => {
    const { result } = renderHook(() => useConversation());
    await act(async () => {
      await result.current.startSession({ agentId: "a1" });
    });
    expect(result.current.micMuted).toBe(false);
  });
});

describe("provider + messages", () => {
  function Consumer() {
    const conversation = useAgentSessionContext();
    const messages = useAgentMessages();
    return createElement(
      "div",
      {},
      createElement("span", { "data-testid": "status" }, conversation.status),
      createElement(
        "ul",
        {},
        ...messages.map((message) =>
          createElement(
            "li",
            { key: message.key, "data-final": message.final },
            `${message.role}: ${message.text}`,
          ),
        ),
      ),
      createElement(
        "button",
        { onClick: () => void conversation.startSession(), "data-testid": "start" },
        "start",
      ),
    );
  }

  it("shares one conversation and streams messages", async () => {
    const view = render(
      createElement(AgentSessionProvider, { options: { agentId: "a1" } }, createElement(Consumer)),
    );

    await act(async () => {
      view.getByTestId("start").click();
    });
    expect(view.getByTestId("status").textContent).toBe("connected");

    act(() => {
      currentFake.emit("userTranscript", { segmentId: "SG_1", text: "hel", final: false });
      currentFake.emit("userTranscript", { segmentId: "SG_1", text: "hello", final: true });
      currentFake.emit("agentResponseDelta", { segmentId: "SG_a1", text: "Wel", delta: "Wel" });
      currentFake.emit("agentResponse", { segmentId: "SG_a1", text: "Welcome!" });
    });

    const items = view.container.querySelectorAll("li");
    expect([...items].map((item) => item.textContent)).toEqual([
      "user: hello",
      "agent: Welcome!",
    ]);
    expect([...items].map((item) => item.getAttribute("data-final"))).toEqual(["true", "true"]);
  });

  it("throws when the context hook is used outside the provider", () => {
    expect(() => renderHook(() => useAgentSessionContext())).toThrow(
      /within <AgentSessionProvider>/,
    );
  });

  it("keeps interleaved turns ordered and pins agent turns that had no deltas", () => {
    const { result } = renderHook(() => useAgentMessages(currentFake as never));
    act(() => {
      currentFake.emit("userTranscript", { segmentId: "SG_1", text: "book a", final: false });
      currentFake.emit("agentResponseDelta", { segmentId: "SG_a1", text: "Sure", delta: "Sure" });
      currentFake.emit("userTranscript", { segmentId: "SG_2", text: "wait", final: true });
      currentFake.emit("agentResponse", { segmentId: "SG_a1", text: "Sure, which date?" });
      // A turn whose text only arrives on completion (no streaming deltas).
      currentFake.emit("agentResponse", { segmentId: "SG_a2", text: "Done." });
      // Late refinement of an earlier user turn updates in place, not at the end.
      currentFake.emit("userTranscript", { segmentId: "SG_1", text: "book a flight", final: true });
    });
    expect(result.current).toEqual([
      { key: "user-SG_1", role: "user", text: "book a flight", final: true },
      { key: "agent-SG_a1", role: "agent", text: "Sure, which date?", final: true },
      { key: "user-SG_2", role: "user", text: "wait", final: true },
      { key: "agent-SG_a2", role: "agent", text: "Done.", final: true },
    ]);
  });

  it("shows a message sent immediately after await startSession()", async () => {
    const { result } = renderHook(() => {
      const conversation = useConversation({ agentId: "a1" });
      const messages = useAgentMessages(conversation.session);
      return { conversation, messages };
    });
    // The send lands before React commits the session, so the local echo fires
    // with no subscriber attached yet — the hook must backfill it.
    await act(async () => {
      await result.current.conversation.startSession();
      result.current.conversation.sendUserMessage("hi");
    });
    expect(result.current.messages).toEqual([
      { key: "user-typed_1", role: "user", text: "hi", final: true },
    ]);
  });

  it("does not duplicate backfilled segments once live events arrive", () => {
    currentFake.transcript = [{ segmentId: "SG_1", role: "user", text: "hel", final: false }];
    const { result } = renderHook(() => useAgentMessages(currentFake as never));
    expect(result.current).toEqual([
      { key: "user-SG_1", role: "user", text: "hel", final: false },
    ]);
    act(() => {
      currentFake.emit("userTranscript", { segmentId: "SG_1", text: "hello", final: true });
      currentFake.emit("agentResponse", { segmentId: "SG_a1", text: "Hi!" });
    });
    expect(result.current).toEqual([
      { key: "user-SG_1", role: "user", text: "hello", final: true },
      { key: "agent-SG_a1", role: "agent", text: "Hi!", final: true },
    ]);
  });
});

describe("useAudioLevels", () => {
  it("polls the session's volumes at the requested rate", () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useAudioLevels(currentFake as never, 20));
      expect(result.current).toEqual({ input: 0, output: 0 });
      act(() => {
        vi.advanceTimersByTime(60);
      });
      expect(result.current).toEqual({ input: 0.25, output: 0.5 });
    } finally {
      vi.useRealTimers();
    }
  });
});
