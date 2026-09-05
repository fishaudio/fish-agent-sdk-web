---
"@fishaudio/agent-client": patch
---

Client tool results that cannot be delivered no longer leave the agent waiting on its server-side tool timeout. A result larger than about 60 KB serialized (`MAX_CLIENT_TOOL_RESULT_BYTES`), a non-JSON-serializable value, or a transport error on send is replaced by an error result that tells the agent what happened, alongside the existing `tool_failed` error event.
