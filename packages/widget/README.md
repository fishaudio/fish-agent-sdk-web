# @fishaudio/agent-widget

Embeddable `<fish-agent>` voice-agent widget for [Fish Audio](https://fish.audio) agents: a floating launcher that expands into a voice-first chat card — live transcript, text input, client-tool chips, consent gate. A custom element rendering into shadow DOM, built on [`@fishaudio/agent-client`](https://github.com/fishaudio/fish-agent-sdk-web/tree/main/packages/client).

Just want a script tag? [`@fishaudio/agent-widget-embed`](https://github.com/fishaudio/fish-agent-sdk-web/tree/main/packages/widget-embed) is the same widget pre-bundled as one CDN file that registers `<fish-agent>` on load — no install, no build step:

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

Exactly one of `agent-id` (public agent, Origin-allowlisted) or `token-endpoint` (private agent — a URL on your backend that returns a session-token JSON) is required. Everything else is attributes: `agent-name`, `greeting`, `proactive-message`, `proactive-delay`, `position`, the `transcript` / `text-input` / `mic-muting` / `consent` switches, `language`, `user-id`, `dynamic-variables` (JSON) and `text-contents` (JSON overriding any UI string) — see the [attribute reference](https://github.com/fishaudio/fish-agent-sdk-web/blob/main/docs/widget.md#attributes). Theming is CSS custom properties (`--fish-accent`, …) on the element.

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

- [Widget](https://github.com/fishaudio/fish-agent-sdk-web/blob/main/docs/widget.md) — behavior, attributes, theming, page API, private agents.
- [Authentication](https://github.com/fishaudio/fish-agent-sdk-web/blob/main/docs/authentication.md) — public agents vs. server-created session tokens.
- [Client tools](https://github.com/fishaudio/fish-agent-sdk-web/blob/main/docs/client-tools.md) — let the agent call functions in the browser.

## License

MIT. Icon path data from [lucide](https://lucide.dev) (ISC) — see [THIRD-PARTY-NOTICES.txt](https://github.com/fishaudio/fish-agent-sdk-web/blob/main/packages/widget/THIRD-PARTY-NOTICES.txt) (also shipped in this npm package).
