# Errors

All failures are `FishAgentError` with a stable `code` (plus `statusCode` for session-request HTTP errors). `start()` rejects with one; recoverable in-call failures surface through the `error` event instead.

```js
import { FishAgentError } from "@fishaudio/agent-client";

try {
  await AgentSession.start({ sessionToken });
} catch (error) {
  if (error instanceof FishAgentError && error.code === "mic_permission_denied") {
    showMicHelp();
  }
}
```

| Code | Meaning |
|---|---|
| `session_request_failed` | The session endpoint rejected the request or was unreachable. |
| `agent_not_public` | Keyless session request against an agent without public access. |
| `origin_forbidden` | Page origin is not on the agent's allowlist. |
| `unsupported_transport` | The session uses a transport this SDK version doesn't know — upgrade the package. |
| `mic_permission_denied` | The user declined microphone access. |
| `device_change_failed` | A requested audio device could not be activated, or the browser does not support output selection (`setSinkId`, common on mobile browsers). Output stays on the previous device; a failed mic switch switches back to the previous microphone (best effort). |
| `connection_failed` | The realtime connection could not be (re)established, a send to the agent failed, the agent never joined the session (15 s), or the microphone could not be toggled. |
| `session_expired` | The session token's join deadline passed before connecting. |
| `tool_failed` | A client tool threw, wasn't registered, or its result couldn't be delivered — see [Client tools](client-tools.md). |
| `tool_timeout` | A client tool exceeded `clientToolTimeoutMs` (default 15 s). |
| `provider_error` | An upstream model/speech provider failed during the session — `error` event; the session may recover. |
| `internal_error` | The agent runtime hit an internal error — `error` event; the session may recover. |
