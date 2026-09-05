# Events

Subscribe with `session.on(event, listener)` / `off` / `once`, or via `callbacks` at start (each `onXxx` key subscribes the `xxx` event, so `onUserTranscript` for `userTranscript`; an unknown key throws a `TypeError` from `start()`).

| Event | Payload | Fired when |
|---|---|---|
| `connect` | `{ sessionId }` | The realtime session is established. |
| `disconnect` | `{ reason: EndReason }` | The session ended, by anyone. Terminal. |
| `statusChange` | `SessionStatus` | `"connecting" → "connected" ⇄ "reconnecting" → "ended"` |
| `modeChange` | `AgentMode` | `"listening" \| "thinking" \| "speaking"` — drive your talking-orb UI with this. |
| `userTranscript` | `{ segmentId, text, final }` | Live transcription of the user. |
| `agentResponseDelta` | `{ segmentId, delta, text }` | Streaming agent speech text (playout-synced). |
| `agentResponse` | `{ segmentId, text }` | Agent speech segment finalized. |
| `message` | `{ role, text }` | Finalized messages only, in order — a ready-made chat log. |
| `toolCallStarted` | `{ callId, toolName, source, input, inputTruncated }` | The agent started running a tool. |
| `toolCallCompleted` | `{ callId, toolName, source, output, outputTruncated }` | The tool returned a result. |
| `toolCallFailed` | `{ callId, toolName, source, error }` | The tool errored. |
| `error` | `FishAgentError` | A recoverable error occurred (the session may still be live). |

## Live transcripts

Both transcript streams send the **whole segment so far** — replace the segment's text on each event, don't append:

- `userTranscript` — interim recognition may reword earlier text; `final: true` pins the segment. `segmentId` identifies which segment to update.
- `agentResponseDelta` — `delta` is the new fragment, `text` the accumulated segment; `agentResponse` fires once when the segment completes. Agent text is paced with audio playout, so an interrupted reply finalizes containing only what was actually spoken. A reply that spans multiple speech segments (e.g. around a tool call) arrives as multiple segments.

If you only need finalized messages in order (no streaming updates), subscribe to `message` instead. In React, [`useAgentMessages`](react/useAgentMessages.md) does this aggregation for you.

A listener attached late misses events fired before it subscribed — `session.getTranscript()` returns every segment so far (`{ segmentId, role, text, final }`, in conversation order) so you can backfill, then keep applying live events by `segmentId`.

## Tool call lifecycle

Every tool the agent runs — webhook, MCP, built-in, or [client tool](client-tools.md) — emits one `toolCallStarted`, resolved by exactly one `toolCallCompleted` or `toolCallFailed` with the same `callId`. Terminal events repeat `toolName`/`source` so a listener attached mid-call can still render a complete item. `input`/`output` are JSON strings truncated at 4 KB — parse them only when the matching `*Truncated` flag is `false`.

These events stream by default. They carry tool arguments and results into the end user's browser; to keep tool data hidden, create the session with `toolEvents: false` (public-agent path) or `tool_events: false` on your backend's session-creation call (`sessionToken` path) — see [Sessions](sessions.md).

## Delivery notes

- Events emitted during a [reconnection](sessions.md#reconnection) gap are dropped, not replayed — a transcript may skip turns lost to the outage.
- Unknown server events are ignored by design — old SDK versions keep working as the protocol grows.
