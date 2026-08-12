// Control-channel wire contract between the agent runtime and end-user clients.
// Every type here has a shipped SDK behavior. Transcripts ride LiveKit's
// `lk.transcription` text streams, agent state its `lk.agent.state`
// participant attribute.
//
// Compatibility is additive-only: published fields never change name, meaning, or
// type; new fields are optional; a semantic change is a new `type`. Consumers must
// ignore unknown `type` values and unknown fields.

export const AGENT_EVENT_TOPIC = "agent-event";
export const CLIENT_EVENT_TOPIC = "client-event";

/**
 * Where a tool call is executed; `background` is a call the agent delegated to a
 * background task, `unknown` a model call the runtime could not resolve (still
 * reported, as a failure).
 */
export type ToolCallSource = "client" | "webhook" | "mcp" | "builtin" | "background" | "unknown";

/**
 * Tool-call lifecycle: one `tool.started` per call, resolved by exactly one
 * `tool.completed`/`tool.failed` with the same `callId`. Terminal messages repeat
 * name/source so a client that missed the start (no data-channel replay) can still
 * render a full item. `input`/`output` are JSON strings truncated at the source.
 * Emission is a session-creation option (`tool_events`, default true); sessions
 * created with `tool_events: false` receive none of the three.
 */
export type ToolCallEventMessage =
  | {
      type: "tool.started";
      callId: string;
      toolName: string;
      toolSource: ToolCallSource;
      nodeId: string;
      input: string;
      inputTruncated?: boolean;
    }
  | {
      type: "tool.completed";
      callId: string;
      toolName: string;
      toolSource: ToolCallSource;
      nodeId: string;
      output: string;
      outputTruncated?: boolean;
    }
  | {
      type: "tool.failed";
      callId: string;
      toolName: string;
      toolSource: ToolCallSource;
      nodeId: string;
      error: string;
    };

/** `agent-event` topic: agent→client, one complete JSON object per message. */
export type AgentSessionMessage =
  | {
      // While `expectsResponse` is true the agent suspends the tool call
      // until a matching `client_tool.result` or timeout.
      type: "client_tool.call";
      callId: string;
      toolName: string;
      params: Record<string, unknown>;
      expectsResponse: boolean;
    }
  | ToolCallEventMessage
  // Category only — raw provider/runtime error text is never sent to clients.
  | { type: "error"; code: "provider_error" | "internal_error" };

/** `client-event` topic: client→agent. `user.message` gets no echo — the sender finalizes its own bubble. */
export type ClientSessionMessage =
  // `audio: false` asks the agent to answer this turn in text only (no TTS);
  // the reply still streams over `lk.transcription`. Absent means audio as usual.
  // (The web SDK's `sendUserMessage` sends `audio: false` unless called with `audio: true`.)
  | { type: "user.message"; text: string; audio?: boolean }
  | { type: "user.activity" }
  | { type: "user.interrupt" }
  | { type: "user.hangup" }
  | { type: "client_tool.result"; callId: string; result?: unknown; isError?: boolean };
