---
"@fishaudio/agent-protocol": minor
"@fishaudio/agent-client": minor
---

Session creation gains `context` (`SessionContext`), the per-session overrides of the agent's context switches, with `context.current_time` for the current date and time. The client option is `context: { currentTime }`. `world_context` / `worldContext` stay accepted as deprecated aliases.
