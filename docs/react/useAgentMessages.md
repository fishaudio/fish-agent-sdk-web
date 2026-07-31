# `useAgentMessages(session?)`

A live chat log, aggregated from the session's [transcript events](../events.md) so you don't have to reduce them yourself. Returns `ChatMessage[]` in conversation order:

| Field | Type | Description |
|---|---|---|
| `key` | `string` | Stable per-turn key — use it as the React list key. |
| `role` | `"user" \| "agent"` | Who is speaking. |
| `text` | `string` | The whole turn so far (not a delta). |
| `final` | `boolean` | `false` while the turn is still streaming. |

## Streaming semantics

- A **user** turn appears as soon as transcription starts and its `text` is *refined in place* — interim recognition may reword earlier text, so always re-render from `text`, never append.
- An **agent** turn grows with each response delta and flips to `final: true` when the turn completes.
- Both directions update the existing entry (matched by `key`), so the array's order and identity are stable for React reconciliation.
- **Mounting mid-session backfills.** The hook seeds from `session.getTranscript()`, so turns that streamed before the component subscribed — including a `sendUserMessage` issued right after `await startSession()` — still appear, without duplicates.
- The log **resets when a new session starts** — persist it yourself (e.g. into app state on `disconnect`) if you need history across calls.
- Across a [reconnection](../sessions.md#reconnection) gap, events are dropped, not replayed — the log may skip turns lost to the outage.

## Example: a voice + text chat panel

```tsx
function ChatPanel() {
  const { status, sendUserMessage, sendUserActivity } = useAgentSessionContext();
  const messages = useAgentMessages();
  const [draft, setDraft] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    sendUserMessage(draft); // shows up in `messages` like a spoken turn
    setDraft("");
  };

  return (
    <div>
      <ul>
        {messages.map((message) => (
          <li key={message.key} style={{ opacity: message.final ? 1 : 0.6 }}>
            <b>{message.role}:</b> {message.text}
          </li>
        ))}
      </ul>
      <form onSubmit={submit}>
        <input
          value={draft}
          disabled={status !== "connected"}
          onChange={(event) => {
            setDraft(event.target.value);
            sendUserActivity(); // hold the agent back while the user types
          }}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

If you only want finalized messages in order (no streaming updates), skip the hook and subscribe to the session's [`message` event](../events.md) directly.
