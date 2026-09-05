# Client tools

Client tools let the agent call functions in the user's browser — read app state, drive the UI, trigger navigation — and (optionally) continue the conversation with the result.

Declare tools of type `client` in your agent's tool configuration, then provide the matching handlers. When the agent decides to call one, the SDK runs your handler and (if the tool expects a response) returns the result to the agent, which continues the conversation with it.

```js
const session = await AgentSession.start({
  sessionToken,
  clientTools: {
    // Return value is serialized back to the agent.
    get_cart: async () => ({ items: await loadCart() }),
    // Fire-and-forget tools (expectsResponse: false) run without replying.
    highlight_product: ({ productId }) => scrollToProduct(productId),
  },
});
```

Handlers can also be registered after start:

```js
session.registerClientTool("get_cart", async () => ({ items: await loadCart() }));
```

## Failure semantics

- A handler that throws (or times out after `clientToolTimeoutMs`, default 15 s) reports an error result to the agent and emits an `error` event (`tool_failed` / `tool_timeout`).
- A call to a tool with no registered handler is answered with an error result — the conversation continues.
- The serialized result must fit in one realtime message: about 60 KB (`MAX_CLIENT_TOOL_RESULT_BYTES`). A larger or non-JSON-serializable return value is replaced by an error result telling the agent why, and a `tool_failed` error is emitted. Return a summary or a reference (an id, a URL) instead of a large payload.
- If a result cannot be sent at all (transport error), the SDK sends a short error result in its place so the agent does not wait out its server-side tool timeout.

## Observing tool activity

Client tools (like every tool the agent runs) also appear in the [tool-call lifecycle events](events.md#tool-call-lifecycle): `toolCallStarted` fires when the call reaches the agent, and `toolCallCompleted`/`toolCallFailed` once your handler's result is returned — useful for rendering tool activity in a transcript UI without instrumenting each handler.
