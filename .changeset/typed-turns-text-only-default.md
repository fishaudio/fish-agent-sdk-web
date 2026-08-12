---
"@fishaudio/agent-client": minor
"@fishaudio/agent-widget": minor
---

Typed turns now default to a text-only reply. `sendUserMessage(text)` sends `audio: false` unless called with `{ audio: true }`, so the agent answers typed input as streaming transcript text without synthesizing speech. Previously the default was a spoken reply and `{ audio: false }` was the opt-out. The widget follows the new default: typed messages in the widget also get a text-only reply. The wire protocol is unchanged — an absent `audio` field still means a spoken reply for raw-protocol clients.
