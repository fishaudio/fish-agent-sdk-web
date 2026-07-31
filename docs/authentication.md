# Authentication

Pick one of two modes:

## 1. Server-created session (recommended)

Your backend exchanges the API key for a short-lived **session token** and hands the token to the browser:

```bash
curl https://api.fish.audio/v1/agent/sessions \
  -H "Authorization: Bearer $FISH_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "your-agent-id",
    "end_user_id": "user-42"
  }'
# 201 → { "session_id", "transport", "livekit_url", "token", "expires_at", ... }
```

`end_user_id` is optional, for attribution in session records. The create body also accepts `language`, `overrides`, `dynamic_variables` (see [Customization](customization.md)), `timezone` / `world_context` (the agent's sense of local time), free-form `metadata`, and `tool_events` — set `tool_events: false` to keep the agent's [tool-call lifecycle](events.md#tool-call-lifecycle) (arguments and results) from streaming to the browser; it defaults to on.

```js
// server (Node / Express)
app.post("/api/voice-session", async (req, res) => {
  const response = await fetch("https://api.fish.audio/v1/agent/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FISH_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agent_id: process.env.FISH_AGENT_ID,
      end_user_id: req.user.id,
    }),
  });
  res.status(response.status).json(await response.json());
});
```

```python
# server (Python — any framework)
import os
import requests

def create_voice_session(end_user_id: str) -> dict:
    response = requests.post(
        "https://api.fish.audio/v1/agent/sessions",
        headers={"Authorization": f"Bearer {os.environ['FISH_API_KEY']}"},
        json={
            "agent_id": os.environ["FISH_AGENT_ID"],
            "end_user_id": end_user_id,
        },
    )
    response.raise_for_status()
    return response.json()
```

```js
// browser — request the token when the user starts the call, then start with it
import { AgentSession } from "@fishaudio/agent-client";

const sessionToken = await fetch("/api/voice-session", { method: "POST" }).then((r) => r.json());
const session = await AgentSession.start({ sessionToken });
```

The session token is a discriminated union on `transport`. Forward it verbatim — the SDK validates it and connects. It is short-lived, so fetch it right before `start()` (in the same click handler), not at page load. To force-end a session from your backend, call `POST /v1/agent/sessions/{session_id}/end` with your API key.

## 2. Public agent (keyless)

For agents with public access enabled in the dashboard (with an Origin allowlist), the browser can create the session directly. Public session creation is rate-limited per agent and per IP:

```js
const session = await AgentSession.start({ agentId: "your-agent-id" });
```

A keyless request against an agent without public access fails with [`agent_not_public`](errors.md); a page origin missing from the allowlist fails with [`origin_forbidden`](errors.md).
