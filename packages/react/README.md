# @fishaudio/agent-react

React hooks and components for [Fish Audio](https://fish.audio) voice agents, built on [`@fishaudio/agent-client`](https://github.com/fishaudio/fish-agent-sdk-web/tree/main/packages/client).

## Installation

```bash
npm install @fishaudio/agent-react
```

Requires React 18+.

## Quickstart

```tsx
"use client";

import { useConversation } from "@fishaudio/agent-react";

export function VoiceWidget() {
  const conversation = useConversation();

  const start = async () => {
    const sessionToken = await fetch("/api/voice-session", { method: "POST" }).then((r) => r.json());
    await conversation.startSession({ sessionToken });
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

The hook ends the session automatically when the component unmounts. Start calls made from the required user interaction path are safe under React StrictMode's effect replay.

## Documentation

- [React overview](https://github.com/fishaudio/fish-agent-sdk-web/blob/main/docs/react/README.md) — quickstart, Next.js.
- [`useConversation`](https://github.com/fishaudio/fish-agent-sdk-web/blob/main/docs/react/useConversation.md) — session lifecycle as a hook.
- [Provider](https://github.com/fishaudio/fish-agent-sdk-web/blob/main/docs/react/provider.md) — share one conversation across a component tree.
- [`useAgentMessages`](https://github.com/fishaudio/fish-agent-sdk-web/blob/main/docs/react/useAgentMessages.md) — build a streaming chat UI.
- [Audio visualization](https://github.com/fishaudio/fish-agent-sdk-web/blob/main/docs/react/audio-visualization.md) — `useAudioLevels` and `<AgentAudioVisualizer />`.

Authentication, events, client tools, and errors are documented with the [client SDK](https://github.com/fishaudio/fish-agent-sdk-web/blob/main/docs/README.md) — everything there applies here.
