# @fishaudio/agent-widget

Embeddable `<fish-agent>` voice-agent widget for [Fish Audio](https://fish.audio) agents: a floating launcher that expands into a voice-first chat card — live transcript, text input, client-tool chips, consent gate. A custom element rendering into shadow DOM, built on [`@fishaudio/agent-client`](https://www.npmjs.com/package/@fishaudio/agent-client).

Just want a script tag? [`@fishaudio/agent-widget-embed`](https://www.npmjs.com/package/@fishaudio/agent-widget-embed) is the same widget pre-bundled as one CDN file that registers `<fish-agent>` on load — no install, no build step:

```html
<fish-agent agent-id="your-agent-id"></fish-agent>
<script src="https://unpkg.com/@fishaudio/agent-widget-embed" async type="text/javascript"></script>
```

## Installation

```bash
npm install @fishaudio/agent-widget
```

## Quickstart

Importing the package has no side effects — call `registerWidget()` once to define the element, then drop the tag anywhere:

```js
import { registerWidget } from "@fishaudio/agent-widget";
registerWidget(); // defines <fish-agent>
```

```html
<fish-agent agent-id="your-agent-id"></fish-agent>
```

Exactly one of `agent-id` (public agent, Origin-allowlisted) or `token-endpoint` (private agent — a URL on your backend that returns a session-token JSON) is required. Everything else is attributes: `agent-name`, `greeting`, `proactive-message`, `proactive-delay`, `position`, the `transcript` / `text-input` / `mic-muting` / `consent` switches, `language`, `user-id`, `dynamic-variables` (JSON) and `text-contents` (JSON overriding any UI string) — see the [attribute reference](https://docs.fish.audio/agents/deploy/widget#attributes). Theming is CSS custom properties (`--fish-accent`, …) on the element.

Page API: the element emits bubbling, composed `CustomEvent`s — `fish-agent:call` (`{ options }`, mutable; inject `clientTools` here), `fish-agent:connect` (`{ sessionId }`), `fish-agent:disconnect` (`{ reason }`), `fish-agent:error` (`{ code, message }`). Dispatch `fish-agent:expand` on the element or `document` to open the panel programmatically.

## React

`@fishaudio/agent-widget/react` exports a real `<FishAgentWidget>` component: it registers and renders the element with camelCase props, serializes object props, and surfaces the page events as callback props — `clientTools` is just a prop. Importing the entry also types the raw `<fish-agent>` tag in JSX. Requires React 18+ (optional peer dependency).

```tsx
import { FishAgentWidget } from "@fishaudio/agent-widget/react";

<FishAgentWidget
  agentId="your-agent-id"
  clientTools={{ highlight_product: ({ productId }) => scrollToProduct(productId) }}
  onConnect={({ sessionId }) => console.log(sessionId)}
/>;
```

## Documentation

- [Widget](https://docs.fish.audio/agents/deploy/widget) — behavior, attributes, theming, page events, private agents.
- [Public agents](https://docs.fish.audio/agents/deploy/public-agents) and [authenticated sessions](https://docs.fish.audio/agents/deploy/authenticated-sessions) — a public agent id vs. server-created session tokens.
- [Client tools](https://docs.fish.audio/agents/build/client-tools) — let the agent call functions in the browser.

## License

MIT. Icon path data from [lucide](https://lucide.dev) (ISC) — see [THIRD-PARTY-NOTICES.txt](https://github.com/fishaudio/fish-agent-sdk-web/blob/main/packages/widget/THIRD-PARTY-NOTICES.txt) (also shipped in this npm package).
