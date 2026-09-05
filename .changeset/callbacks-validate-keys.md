---
"@fishaudio/agent-client": patch
---

`AgentSession.start()` now throws a `TypeError` for unknown `callbacks` keys (for example a bare event name such as `userTranscript` instead of `onUserTranscript`) and for values that are not functions. Previously such entries were silently subscribed to a non-existent event and never fired. The check runs before the microphone prompt or any server request.
