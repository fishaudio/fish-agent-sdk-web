# Quickstart

Embed a [Fish Audio](https://fish.audio) voice agent into any website or web app: realtime voice over WebRTC, live transcripts, text chat, and client tools — behind one small, event-driven API.

## Prerequisites

- An agent created and **published** in the [Fish Audio dashboard](https://fish.audio).
- A Fish Audio API key (for private agents), or an agent with public access enabled (for keyless embedding).

```bash
npm install @fishaudio/agent-client
```

Using React? Install [`@fishaudio/agent-react`](react/README.md) instead — it wraps this SDK in hooks and components.

## Authenticated agents

The session is created on your server (which holds your API key) and joined from the browser.

**1. Server** — create a short-lived session token and return it to the browser:

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

## Public agents

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

## Next steps

- [Authentication](authentication.md) — the two modes in detail, with server snippets.
- [Sessions](sessions.md) — everything `start()` accepts and the session's full API.
- [Events](events.md) — transcripts, agent mode, and the chat-log `message` event.
- [React overview](react/README.md) — the same flow with hooks.

## Browser support

Modern evergreen browsers with WebRTC and WebAudio. The SDK is SSR-safe: importing it on the server is fine; only `start()` touches browser APIs.
