---
"@fishaudio/agent-protocol": minor
"@fishaudio/agent-client": minor
---

Sessions now end with the reason the server announces instead of one inferred from the disconnect. The protocol gains a `session.ended` message on the agent-event topic, sent just before the server tears the call down, and `EndReason` grows `conversation_timeout` (the session hit its duration limit) and `escalated` (the call was handed off to a human). Previously every server-side end, including the duration limit and a backend-initiated end, surfaced as `agent_hangup`. A backend-initiated end now reports `user_hangup` when that is the reason the server records. Against a server that does not announce, the disconnect-based inference still applies.
