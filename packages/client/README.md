# @fishaudio/agent-client

Framework-agnostic JavaScript/TypeScript SDK for embedding [Fish Audio](https://fish.audio) voice agents into any website or web app: realtime voice over WebRTC, live transcripts, text input, and client tools — behind one small, event-driven API.

Using React? [`@fishaudio/agent-react`](https://www.npmjs.com/package/@fishaudio/agent-react) wraps this SDK in hooks and components.

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

- [Quickstart](https://docs.fish.audio/agents/quickstart) — first call, with or without a backend.
- [Authenticated sessions](https://docs.fish.audio/agents/deploy/authenticated-sessions) and [public agents](https://docs.fish.audio/agents/deploy/public-agents) — server-created session tokens vs. a public agent id.
- [Web SDK reference](https://docs.fish.audio/agents/deploy/web-sdk) — `start()` options, the session API, lifecycle and reconnection.
- [Events](https://docs.fish.audio/agents/deploy/web-sdk#events) — event reference and live transcripts.
- [Client tools](https://docs.fish.audio/agents/build/client-tools) — let the agent call functions in the browser.
- [Overrides](https://docs.fish.audio/agents/deploy/authenticated-sessions#overrides) and [dynamic variables](https://docs.fish.audio/agents/build/dynamic-variables) — per-session customization.
- [Errors](https://docs.fish.audio/agents/deploy/web-sdk#errors) — `FishAgentError` codes.
