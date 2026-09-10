# Vanilla example

A minimal plain-TypeScript page built on [`@fishaudio/agent-client`](../../packages/client), no framework: enter an agent id, start a voice call, watch the live transcript stream in, mute, hang up.

## Run it

From the repo root:

```bash
pnpm install
pnpm build
pnpm --filter example-vanilla dev
```

Then open http://127.0.0.1:5173, paste your agent id, and click **Start voice** (the browser will ask for microphone access).

## Getting an agent id

Create and publish an agent in the [Fish Audio dashboard](https://fish.audio), then enable public access on it with your page's origin (`http://127.0.0.1:5173`) on its Origin allowlist. The agent id is on the agent's page in the dashboard.

This example uses `agentId` mode, which needs no backend. For private agents your server creates a session token instead. See [Authentication](../../docs/authentication.md).
