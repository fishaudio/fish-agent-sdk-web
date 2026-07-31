# Fish Agent Web SDK

Embed [Fish Audio](https://fish.audio) voice agents into any website or web app: realtime voice over WebRTC, live transcripts, text chat, and client tools — behind one small, event-driven API.

Developer documentation lives in [`docs/`](docs/README.md).

| Package | Docs | Description |
|---|---|---|
| `@fishaudio/agent-client` | [docs](docs/README.md#fishaudioagent-client) | Framework-agnostic JS SDK — sessions, realtime audio, transcripts, client tools. |
| `@fishaudio/agent-react` | [docs](docs/react/README.md) | React hooks (`useConversation`), provider, chat-log and visualizer components. |
| `@fishaudio/agent-widget` | [docs](docs/widget.md) | `<fish-agent>` custom element (plus a `<FishAgentWidget>` React component): voice-first chat card with transcript, tool chips, consent, theming. |
| `@fishaudio/agent-widget-embed` | [docs](docs/widget.md) | The widget as one CDN script — loading it registers `<fish-agent>`. |
| `@fishaudio/agent-protocol` | [README](packages/protocol/README.md) | Semi-internal wire contract — realtime messages and session-creation shapes. Dependency-free; apps consume it via `agent-client`. |

### Widget (no build step)

```html
<fish-agent agent-id="your-agent-id"></fish-agent>
<script src="https://unpkg.com/@fishaudio/agent-widget-embed" async type="text/javascript"></script>
```

## Quickstart

Two ways to start a call, depending on whether the agent is public.

### Authenticated agents

The session is created on your server (which holds your API key) and joined from the browser.

**1. Server** — create a short-lived session token and return it to the browser.

```js
// e.g. POST /api/voice-session
app.post("/api/voice-session", async (req, res) => {
  const response = await fetch("https://api.fish.audio/v1/agent/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FISH_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ agent_id: process.env.FISH_AGENT_ID }),
  });
  res.status(response.status).json(await response.json());
});
```

**2. Browser** — fetch the token from your server (do it when the call starts, since it's short-lived), then join. `AgentSession.start` requests microphone access, streams the mic to the agent, and plays the agent's voice back through the speakers — so call it from a user gesture (a click), which browsers require to grant the mic and start audio playback.

```js
import { AgentSession } from "@fishaudio/agent-client";

const sessionToken = await fetch("/api/voice-session", { method: "POST" }).then((r) => r.json());

const session = await AgentSession.start({
  sessionToken,
  callbacks: {
    onModeChange: (mode) => console.log(mode), // listening | thinking | speaking
    onMessage: ({ role, text }) => console.log(role, text),
  },
});
```

### Public agents

To deploy an agent that needs no authentication, start the session directly in the browser with its `agentId` — no server involved. Enable public access on the agent in the dashboard (with an Origin allowlist). `start` works as above — it uses the mic and speaker, so call it from a click.

```js
import { AgentSession } from "@fishaudio/agent-client";

const session = await AgentSession.start({
  agentId: "your-agent-id",
  callbacks: {
    onModeChange: (mode) => console.log(mode), // listening | thinking | speaking
    onMessage: ({ role, text }) => console.log(role, text),
  },
});
```

See [Sessions](docs/sessions.md), [Events](docs/events.md), [Client tools](docs/client-tools.md) and [Errors](docs/errors.md) for the full reference.

## React Integration

[`@fishaudio/agent-react`](docs/react/README.md) wraps the client SDK in a `useConversation` hook (plus a provider, a chat-log hook, and an audio-visualizer component). The hook owns the session lifecycle, re-renders on state changes, and ends the call automatically when the component unmounts.

```tsx
"use client";

import { useConversation } from "@fishaudio/agent-react";

export function CallButton() {
  const conversation = useConversation();

  const start = async () => {
    const sessionToken = await fetch("/api/voice-session", { method: "POST" }).then((r) => r.json());
    await conversation.startSession({ sessionToken }); // or { agentId } for a public agent
  };

  return conversation.status === "connected" ? (
    <button onClick={() => conversation.endSession()}>
      End call{conversation.isSpeaking ? " · speaking" : ""}
    </button>
  ) : (
    <button onClick={start}>Start call</button>
  );
}
```

See the [react docs](docs/react/README.md) for the full hook API, the [provider pattern](docs/react/provider.md), and the ready-made components.

## License

MIT
