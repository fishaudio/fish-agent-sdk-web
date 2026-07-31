# Fish Agent Web SDK — developer docs

Source of the developer documentation for embedding [Fish Audio](https://fish.audio) voice agents into websites and web apps. Plain Markdown, one topic per page, ready to be published as a docs site.

## Getting started

- [Quickstart](quickstart.md) — first call in the browser, with or without a backend.
- [Authentication](authentication.md) — server-created session tokens vs. public agents.

## `@fishaudio/agent-client`

Framework-agnostic JavaScript/TypeScript SDK.

- [Sessions](sessions.md) — `AgentSession.start` options, the session API, lifecycle and reconnection, transports.
- [Events](events.md) — event reference and live transcripts.
- [Client tools](client-tools.md) — let the agent call functions in the browser.
- [Customization](customization.md) — per-session overrides and dynamic variables.
- [Errors](errors.md) — `FishAgentError` codes and what to do about each.

## `@fishaudio/agent-widget`

Drop-in `<fish-agent>` custom element — two static lines on any site — plus a
`<FishAgentWidget>` React component under `@fishaudio/agent-widget/react`.

- [Widget](widget.md) — embed snippet, React component, attributes, theming variables, page events, private-agent mode.

## `@fishaudio/agent-react`

React hooks and components on top of the client SDK.

- [React overview](react/README.md) — installation, quickstart, Next.js.
- [`useConversation`](react/useConversation.md) — session lifecycle as a hook.
- [Provider](react/provider.md) — share one conversation across a component tree.
- [`useAgentMessages`](react/useAgentMessages.md) — build a streaming chat UI.
- [Audio visualization](react/audio-visualization.md) — `useAudioLevels` and `<AgentAudioVisualizer />`.
