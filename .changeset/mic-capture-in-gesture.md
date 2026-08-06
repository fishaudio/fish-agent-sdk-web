---
"@fishaudio/agent-client": patch
---

Start microphone capture inside the user gesture that calls `AgentSession.start`. Previously getUserMedia ran only after the session-token exchange and the realtime connect, and browsers that gate the permission prompt on the gesture's transient activation (Safari, in-app WebViews) rejected it without ever prompting — every start then failed with `mic_permission_denied` on those devices. A denied microphone now also rejects before the realtime session connects, and a capture that never got published is released on teardown.
