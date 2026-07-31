import type { AgentSession } from "@fishaudio/agent-client";
import { useEffect, useState } from "react";
import { useOptionalAgentSessionContext } from "./provider.js";

export interface ChatMessage {
  /** Stable per-segment key for list rendering. */
  key: string;
  role: "user" | "agent";
  text: string;
  /** False while the segment is still streaming (interim transcript / deltas). */
  final: boolean;
}

/**
 * Streaming chat log: user segments update in place as transcription refines,
 * agent segments grow with each delta and pin on completion. Pass a session or
 * rely on the surrounding <AgentSessionProvider>.
 */
export function useAgentMessages(session?: AgentSession | null): ChatMessage[] {
  const context = useOptionalAgentSessionContext();
  const active = session !== undefined ? session : (context?.session ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!active) {
      return;
    }
    // Backfill events emitted before this effect ran (React commits the session
    // after startSession resolves); live events then update the same keys.
    setMessages(
      active.getTranscript().map((segment) => ({
        key: `${segment.role}-${segment.segmentId}`,
        role: segment.role,
        text: segment.text,
        final: segment.final,
      })),
    );

    const upsert = (key: string, role: "user" | "agent", text: string, final: boolean) => {
      setMessages((previous) => {
        const index = previous.findIndex((message) => message.key === key);
        const entry: ChatMessage = { key, role, text, final };
        if (index === -1) {
          return [...previous, entry];
        }
        const next = [...previous];
        next[index] = entry;
        return next;
      });
    };

    const onUserTranscript = (event: { segmentId: string; text: string; final: boolean }) =>
      upsert(`user-${event.segmentId}`, "user", event.text, event.final);
    const onAgentDelta = (event: { segmentId: string; text: string }) =>
      upsert(`agent-${event.segmentId}`, "agent", event.text, false);
    const onAgentResponse = (event: { segmentId: string; text: string }) =>
      upsert(`agent-${event.segmentId}`, "agent", event.text, true);

    active.on("userTranscript", onUserTranscript);
    active.on("agentResponseDelta", onAgentDelta);
    active.on("agentResponse", onAgentResponse);
    return () => {
      active.off("userTranscript", onUserTranscript);
      active.off("agentResponseDelta", onAgentDelta);
      active.off("agentResponse", onAgentResponse);
    };
  }, [active]);

  return messages;
}
