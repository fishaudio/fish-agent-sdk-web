# @fishaudio/agent-protocol

The wire contract for [Fish Audio](https://fish.audio) agent sessions: the realtime room-channel messages exchanged between the agent runtime and end-user clients, and the shapes of the session-creation exchange. TypeScript types and topic constants only — zero runtime dependencies, no code.

**This is a semi-internal package.** It lives in the open so that what travels over the wire is fully auditable, and so the SDK and the agent runtime conform to one published contract — not as an API for applications. Don't depend on it directly: [`@fishaudio/agent-client`](https://www.npmjs.com/package/@fishaudio/agent-client) already re-exports the types application code needs (`SessionToken`, `SessionOverrides`, `AgentSessionCreateRequest`). Reach for this package only when building a custom consumer of the realtime channel or auditing the protocol itself.

## What's inside

### Realtime channel (`realtime.ts`)

One topic constant per channel, plus the payload type that travels on it:

| Topic | Direction | Payload |
|---|---|---|
| `AGENT_EVENT_TOPIC` | agent → client | `AgentSessionMessage` — session control (`client_tool.call`, `error`), one complete JSON object per message |
| `CLIENT_EVENT_TOPIC` | client → agent | `ClientSessionMessage` — text injection, tool results, graceful hangup |

Transcripts (streaming assistant reply and user ASR, interim and final) are not part of this contract: they travel on LiveKit's built-in `lk.transcription` text streams, keyed by the `lk.segment_id` attribute, with `lk.transcription_final` marking finals and the stream's sender identity distinguishing user from agent.

### Session creation (`session.ts`)

The `POST /v1/agent/sessions` exchange:

- `AgentSessionCreateRequest` — request body: agent id, per-session `SessionOverrides`, dynamic variables, attribution fields
- `SessionOverrides` — allow-listed per-session config replacement (first message, system prompt, voice, language)
- `SessionToken` — the response, a discriminated union on `transport`; handed to the client verbatim

## Conventions

- **Casing**: session-creation shapes are `snake_case` (Fish API convention — clients consume responses verbatim); realtime message fields are `camelCase`.
- **Compatibility is additive-only**: published fields never change name, meaning, or type; new fields are optional; a semantic change ships as a new `type`. Consumers must ignore unknown `type` values and unknown fields — old clients keep working as the protocol grows.
- **Transports**: `SessionToken.transport` is a discriminated union. A consumer that doesn't recognize the negotiated arm must fail with an explicit upgrade error, never silently.
