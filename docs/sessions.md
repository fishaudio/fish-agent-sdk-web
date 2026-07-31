# Sessions

An `AgentSession` is one live call: it owns the realtime connection, the microphone, and playback. Create it with `AgentSession.start(options)`; it resolves once connected.

```js
import { AgentSession } from "@fishaudio/agent-client";

const session = await AgentSession.start({
  sessionToken, // from your backend — see Authentication
  callbacks: {
    onModeChange: (mode) => setOrbState(mode), // "listening" | "thinking" | "speaking"
    onUserTranscript: ({ text, final }) => renderUserBubble(text, final),
    onAgentResponseDelta: ({ text }) => renderAgentBubble(text),
    onDisconnect: ({ reason }) => showCallEnded(reason),
    onError: (error) => console.error(error),
  },
});

// Later:
session.sendUserMessage("Can you summarize that?");
await session.end();
```

Starting a session requests microphone access; call `start()` from a user gesture (button click) for the best permission and autoplay behavior. To join without the microphone (a text-first UI), pass `microphone: false` — no permission prompt at start; the first `setMicMuted(false)` captures the mic instead, so call *that* from a user gesture.

## `AgentSession.start(options)`

| Option | Type | Description |
|---|---|---|
| `agentId` | `string` | Public agent id. Exactly one of `agentId` / `sessionToken` is required. |
| `sessionToken` | `SessionToken` | Server-created session token, passed through verbatim. |
| `serverUrl` | `string` | Fish API base for `agentId` mode. Default `https://api.fish.audio`. |
| `language` | `string` | Sugar for `overrides.language` — gated by the same allowlist (`agentId` mode only). |
| `timezone` | `string` | IANA timezone anchoring the agent's sense of local time. Omit to use the browser's timezone, sent automatically as a hint (`agentId` mode only). |
| `worldContext` | `boolean` | The agent knows the current date and time by default; set `false` to withhold both (`agentId` mode only). |
| `overrides` | `SessionOverrides` | Per-session config replacement; see [Customization](customization.md). |
| `dynamicVariables` | `Record<string, string \| number \| boolean>` | `{{name}}` template values. |
| `endUserId` | `string` | Your user identifier, for attribution (`agentId` mode only). |
| `metadata` | `object` | Free-form key-values stored on the session record (`agentId` mode only). |
| `toolEvents` | `boolean` | Stream the agent's tool-call lifecycle (with payloads) to this session; see [Events](events.md#tool-call-lifecycle). Default `true`; set `false` to keep tool data off the client (`agentId` mode only — with `sessionToken` auth your backend passes `tool_events` when creating the session). |
| `clientTools` | `Record<string, ClientToolHandler>` | Handlers the agent can invoke in the browser. See [Client tools](client-tools.md). |
| `clientToolTimeoutMs` | `number` | Per-tool handler timeout. Default `15000`. |
| `microphone` | `boolean` | Capture the mic on start. Default `true`. `false` joins muted without a permission prompt; the first `setMicMuted(false)` captures it. |
| `audio.inputDeviceId` | `string` | Microphone device to capture from. |
| `audio.outputDeviceId` | `string` | Playback device (`setSinkId`). `start()` rejects with `device_change_failed` where the browser doesn't support output selection (common on mobile; checked before a server session is created) or the device can't be used (checked before connecting). |
| `wakeLock` | `boolean` | Hold a screen wake lock while the session is live, so long calls survive the phone trying to sleep. Default `true`; denial (battery saver, unsupported browser) is silent. |
| `callbacks` | `Partial<AgentSessionCallbacks>` | Sugar for `.on(...)` — each `onXxx` key subscribes the `xxx` event. |

Returns a connected `AgentSession`. Rejects with a [`FishAgentError`](errors.md) if session creation, permissions, or the connection fail.

## Session API

```ts
// Conversation
session.sendUserMessage(text);       // typed user turn, agent responds
session.sendUserMessage(text, { audio: false }); // text-only reply: no TTS, transcript still streams
// Messages typed before the agent finishes joining are held and delivered
// in order once it's ready — safe to call right after start().
session.sendUserActivity();          // "user is typing" — suppresses agent barge-in briefly
session.interrupt();                 // explicitly cut the agent off
session.getTranscript();             // transcript so far: [{ segmentId, role, text, final }] in order —
                                     // seed a late-subscribing UI, then apply live events by segmentId
session.registerClientTool(name, handler);

// Audio
await session.setMicMuted(true);   // after a microphone:false start, the first unmute captures the mic
                                   // (permission prompt — user gesture; denial rejects mic_permission_denied)
await session.startAudio();          // call inside a user gesture if autoplay was blocked
session.setOutputVolume(0.5);        // 0..1 playback volume
await session.setInputDevice(id);    // switch microphone mid-call (device ids from
                                     // navigator.mediaDevices.enumerateDevices());
                                     // on failure switches back to the previous mic (best effort)
await session.setOutputDevice(id);   // route playback elsewhere ("" = default device); rejects
                                     // with device_change_failed where unsupported (common on
                                     // mobile browsers) — playback stays on the previous device
session.getInputVolume();            // mic RMS 0..1 — for level meters
session.getOutputVolume();           // agent RMS 0..1
session.getInputFrequencyData();     // Uint8Array FFT — for visualizers
session.getOutputFrequencyData();

// Lifecycle & state
await session.end();                 // graceful hangup; idempotent
session.sessionId; session.status; session.mode;
session.isSpeaking; session.micMuted; session.endReason;

// Escape hatch — see Transports below before reaching for this
session.getRoom();                   // underlying livekit-client Room; undefined once ended
```

## Lifecycle

`status` moves through `"connecting" → "connected" ⇄ "reconnecting" → "ended"`, surfaced by the `statusChange` event.

`start()` resolves once the realtime connection is up; the agent itself joins moments later. If it never does (within 15 s), the session emits a `connection_failed` error and ends with reason `"connection_lost"` instead of idling on a dead call.

### Reconnection

On network hiccups the SDK reconnects automatically (`"reconnecting"` → `"connected"`); audio resumes on its own. Events emitted during the gap are **dropped, not replayed** — a transcript may skip turns lost to the outage. If recovery fails, the session ends with `disconnect` reason `"connection_lost"`.

### Ending

A session can be ended by anyone; the `disconnect` event carries who/why as an `EndReason`:

| `EndReason` | Cause |
|---|---|
| `user_hangup` | Your code called `session.end()` (or the user left the page). |
| `agent_hangup` | The server ended the call: the agent hung up, the session hit its duration limit, or your backend force-ended it. |
| `connection_lost` | Reconnection failed, or the agent never joined (15 s). |

`session.end()` is idempotent, including concurrent calls while teardown is still in flight, and `endReason` stays readable on the ended session.

## Transports

The public API is transport-neutral. The server picks the transport when creating the session and the session token carries it. Today that is WebRTC (`"livekit"`); if a future server issues a transport your SDK version doesn't know, `start()` fails fast with `unsupported_transport` instead of degrading silently — pin your upgrade path on that code.

The one deliberate exception is `session.getRoom()`: it returns the live [livekit-client `Room`](https://docs.livekit.io/reference/client-sdk-js/) for needs the session API doesn't cover yet — connection-quality telemetry, publishing extra tracks. Prefer the session API where one exists (device switching is covered by `setInputDevice`/`setOutputDevice`): code built on the `Room` couples to this SDK's transport choice and its pinned livekit-client major, with no compatibility promise across SDK versions. It returns `undefined` once the session has ended.
