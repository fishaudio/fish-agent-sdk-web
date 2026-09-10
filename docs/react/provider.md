# Provider

[`useConversation`](useConversation.md) is per-component. To share one conversation across a tree (controls in the header, transcript in a panel, visualizer in a footer), mount an `AgentSessionProvider` and read it from anywhere below:

```tsx
import {
  AgentSessionProvider,
  useAgentSessionContext,
  useAgentMessages,
  AgentAudioVisualizer,
} from "@fishaudio/agent-react";

function App() {
  return (
    <AgentSessionProvider options={{ agentId: "your-public-agent-id" }}>
      <CallControls />
      <Transcript />
      <AgentAudioVisualizer bars={24} />
    </AgentSessionProvider>
  );
}

function CallControls() {
  const { status, startSession, endSession } = useAgentSessionContext();
  // ...
}

function Transcript() {
  const messages = useAgentMessages();
  // ...
}
```

## API

- `<AgentSessionProvider options={...}>` hosts one `useConversation(options)`. `options` are the hook's `defaults`.
- `useAgentSessionContext()` returns the same `UseConversationReturn` from the nearest provider. It throws outside a provider.
- `useOptionalAgentSessionContext()` is the nullable variant, for components that also work standalone.

## Session resolution

The session-consuming hooks and components ([`useAgentMessages`](useAgentMessages.md), [`useAudioLevels`, `<AgentAudioVisualizer />`](audio-visualization.md)) all resolve their session the same way: pass one explicitly (`useAgentMessages(session)`) or omit the argument to use the surrounding provider's. Passing `null` explicitly means "no session", it does not fall back.
