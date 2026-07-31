# @fishaudio/agent-client

Framework-agnostic JavaScript/TypeScript SDK for embedding [Fish Audio](https://fish.audio) voice agents into any website or web app: realtime voice over WebRTC, live transcripts, text input, and client tools — behind one small, event-driven API.

Using React? [`@fishaudio/agent-react`](https://github.com/fishaudio/fish-agent-sdk-web/tree/main/packages/react) wraps this SDK in hooks and components.

## Installation

```bash
npm install @fishaudio/agent-client
```

## Quickstart

```js
import { AgentSession } from "@fishaudio/agent-client";

// Session token from your backend — or { agentId } for a public agent.
const sessionToken = await fetch("/api/voice-session", { method: "POST" }).then((r) => r.json());

const session = await AgentSession.start({
  sessionToken,
  callbacks: {
    onModeChange: (mode) => setOrbState(mode), // "listening" | "thinking" | "speaking"
    onMessage: ({ role, text }) => renderChatBubble(role, text),
    onDisconnect: ({ reason }) => showCallEnded(reason),
  },
});

// Later:
session.sendUserMessage("Can you summarize that?");
await session.end();
```

Starting a session requests microphone access; call `start()` from a user gesture (button click) for the best permission and autoplay behavior.

## Documentation

- [Quickstart](https://github.com/fishaudio/fish-agent-sdk-web/blob/main/docs/quickstart.md) — first call, with or without a backend.
- [Authentication](https://github.com/fishaudio/fish-agent-sdk-web/blob/main/docs/authentication.md) — server-created session tokens vs. public agents.
- [Sessions](https://github.com/fishaudio/fish-agent-sdk-web/blob/main/docs/sessions.md) — `start()` options, the session API, lifecycle and reconnection.
- [Events](https://github.com/fishaudio/fish-agent-sdk-web/blob/main/docs/events.md) — event reference and live transcripts.
- [Client tools](https://github.com/fishaudio/fish-agent-sdk-web/blob/main/docs/client-tools.md) — let the agent call functions in the browser.
- [Customization](https://github.com/fishaudio/fish-agent-sdk-web/blob/main/docs/customization.md) — per-session overrides and dynamic variables.
- [Errors](https://github.com/fishaudio/fish-agent-sdk-web/blob/main/docs/errors.md) — `FishAgentError` codes.
