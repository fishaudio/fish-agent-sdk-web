import {
  AgentSession,
  type AgentMode,
  type AgentSessionOptions,
  type SessionStatus,
} from "@fishaudio/agent-client";
import { useCallback, useEffect, useRef, useState } from "react";

/** "idle" = no session yet (or a failed start); the rest mirror the session. */
export type ConversationStatus = SessionStatus | "idle";

export interface UseConversationReturn {
  /** Live session object for event access; null before the first start. */
  session: AgentSession | null;
  status: ConversationStatus;
  mode: AgentMode;
  isSpeaking: boolean;
  micMuted: boolean;
  startSession: (overrides?: Partial<AgentSessionOptions>) => Promise<string>;
  endSession: () => Promise<void>;
  setMicMuted: (muted: boolean) => Promise<void>;
  sendUserMessage: (text: string, options?: { audio?: boolean }) => void;
  sendUserActivity: () => void;
  interrupt: () => void;
  startAudio: () => Promise<void>;
  setOutputVolume: (volume: number) => void;
  setInputDevice: (deviceId: string) => Promise<void>;
  setOutputDevice: (deviceId: string) => Promise<void>;
}

interface PendingStart {
  state: { cancelled: boolean; sessionCreated: boolean };
  promise: Promise<string>;
}

function startCancelledError(): Error {
  const error = new Error("Conversation start was cancelled by endSession");
  error.name = "AbortError";
  return error;
}

export function useConversation(
  defaults: Partial<AgentSessionOptions> = {},
): UseConversationReturn {
  const defaultsRef = useRef(defaults);
  defaultsRef.current = defaults;

  const sessionRef = useRef<AgentSession | null>(null);
  const startingRef = useRef<PendingStart | null>(null);
  const abandonedSessionRef = useRef<AgentSession | null>(null);
  const lifecycleEpochRef = useRef(0);
  const mountedRef = useRef(true);
  const [session, setSession] = useState<AgentSession | null>(null);
  const [status, setStatus] = useState<ConversationStatus>("idle");
  const [mode, setMode] = useState<AgentMode>("listening");
  const [micMuted, setMicMutedState] = useState(false);

  const releaseAbandonedSession = useCallback(async () => {
    const abandoned = abandonedSessionRef.current;
    if (!abandoned) {
      return;
    }
    await abandoned.end();
    if (abandonedSessionRef.current === abandoned) {
      abandonedSessionRef.current = null;
    }
  }, []);

  const startSession = useCallback(
    async (overrides: Partial<AgentSessionOptions> = {}): Promise<string> => {
      const requestEpoch = lifecycleEpochRef.current;

      const startAtEpoch = async (): Promise<string> => {
        if (!mountedRef.current) {
          throw new Error("Cannot start a conversation after useConversation has unmounted");
        }
        if (requestEpoch !== lifecycleEpochRef.current) {
          throw startCancelledError();
        }

        if (abandonedSessionRef.current) {
          await releaseAbandonedSession();
          if (requestEpoch !== lifecycleEpochRef.current) {
            throw startCancelledError();
          }
        }

        const current = sessionRef.current;
        if (current) {
          if (current.status !== "ended") {
            return current.sessionId;
          }
          // status can reach ended before an in-flight transport teardown
          // promise settles. AgentSession.end() joins that promise, so a fresh
          // session never overlaps the old connection's cleanup.
          await current.end();
          if (requestEpoch !== lifecycleEpochRef.current) {
            throw startCancelledError();
          }
        }

        // Double-click guard: a second call while a start is in flight joins
        // the first. A call queued after hangup waits for the cancelled start
        // to release its resources before it creates a fresh session.
        const existing = startingRef.current;
        if (existing) {
          if (!existing.state.cancelled) {
            return existing.promise;
          }
          try {
            await existing.promise;
          } catch (error) {
            // A failed session request leaves nothing to clean up, so a queued
            // restart may continue. A teardown failure means the old session may
            // still own resources and must stop the restart.
            if (existing.state.sessionCreated) {
              throw error;
            }
          }
          if (requestEpoch !== lifecycleEpochRef.current) {
            throw startCancelledError();
          }
          return startAtEpoch();
        }

        setStatus("connecting");
        const state = { cancelled: false, sessionCreated: false };
        const starting = (async () => {
          try {
            const next = await AgentSession.start({
              ...defaultsRef.current,
              ...overrides,
            } as AgentSessionOptions);
            state.sessionCreated = true;
            // endSession or a real unmount may happen while permissions/session
            // creation are still pending. Never publish that late session into
            // the hook; close it before it can leak its microphone or connection.
            if (
              state.cancelled ||
              requestEpoch !== lifecycleEpochRef.current ||
              !mountedRef.current
            ) {
              try {
                await next.end();
              } catch (error) {
                abandonedSessionRef.current = next;
                if (!mountedRef.current) {
                  void releaseAbandonedSession().catch(() => undefined);
                }
                throw error;
              }
              return next.sessionId;
            }
            sessionRef.current = next;
            setSession(next);
            // Mirror, don't assume: a microphone:false start joins muted.
            setMicMutedState(next.micMuted);
            setMode(next.mode);
            setStatus(next.status);
            next.on("statusChange", setStatus);
            next.on("modeChange", setMode);
            return next.sessionId;
          } catch (error) {
            if (!state.cancelled && mountedRef.current) {
              setStatus("idle");
            }
            throw error;
          } finally {
            if (startingRef.current?.state === state) {
              startingRef.current = null;
            }
          }
        })();
        const pending: PendingStart = { state, promise: starting };
        startingRef.current = pending;
        return starting;
      };

      return startAtEpoch();
    },
    [releaseAbandonedSession],
  );

  const endSession = useCallback(async () => {
    lifecycleEpochRef.current += 1;
    const pending = startingRef.current;
    const current = sessionRef.current;
    const abandoned = abandonedSessionRef.current;
    if (!pending && !abandoned && !current) {
      return;
    }

    if (pending) {
      pending.state.cancelled = true;
      if (mountedRef.current) {
        setStatus("ended");
      }
    }
    await current?.end();
    if (abandoned) {
      await releaseAbandonedSession();
    }
    if (pending) {
      try {
        await pending.promise;
      } catch (error) {
        // The original startSession caller still receives a start failure. From
        // endSession's perspective, a failed request means there is nothing to
        // release; a failure after creation is a teardown failure and propagates.
        if (pending.state.sessionCreated) {
          throw error;
        }
      }
    }
  }, [releaseAbandonedSession]);

  const setMicMuted = useCallback(async (muted: boolean) => {
    await sessionRef.current?.setMicMuted(muted);
    setMicMutedState(muted);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      lifecycleEpochRef.current += 1;
      const pending = startingRef.current;
      if (pending) {
        pending.state.cancelled = true;
      }
      const current = sessionRef.current;
      if (current) {
        current.off("statusChange", setStatus);
        current.off("modeChange", setMode);
        void current.end().catch(() => undefined);
      }
      void releaseAbandonedSession().catch(() => undefined);
    };
  }, [releaseAbandonedSession]);

  return {
    session,
    status,
    mode,
    isSpeaking: mode === "speaking",
    micMuted,
    startSession,
    endSession,
    setMicMuted,
    sendUserMessage: useCallback(
      (text: string, options?: { audio?: boolean }) =>
        sessionRef.current?.sendUserMessage(text, options),
      [],
    ),
    sendUserActivity: useCallback(() => sessionRef.current?.sendUserActivity(), []),
    interrupt: useCallback(() => sessionRef.current?.interrupt(), []),
    startAudio: useCallback(async () => sessionRef.current?.startAudio(), []),
    setOutputVolume: useCallback(
      (volume: number) => sessionRef.current?.setOutputVolume(volume),
      [],
    ),
    setInputDevice: useCallback(
      async (deviceId: string) => sessionRef.current?.setInputDevice(deviceId),
      [],
    ),
    setOutputDevice: useCallback(
      async (deviceId: string) => sessionRef.current?.setOutputDevice(deviceId),
      [],
    ),
  };
}
