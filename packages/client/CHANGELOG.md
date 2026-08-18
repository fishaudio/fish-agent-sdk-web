# @fishaudio/agent-client

## 0.2.0

### Minor Changes

- d64ffb4: Typed turns now default to a text-only reply. `sendUserMessage(text)` sends `audio: false` unless called with `{ audio: true }`, so the agent answers typed input as streaming transcript text without synthesizing speech. Previously the default was a spoken reply and `{ audio: false }` was the opt-out. The widget follows the new default: typed messages in the widget also get a text-only reply. The wire protocol is unchanged — an absent `audio` field still means a spoken reply for raw-protocol clients.

### Patch Changes

- 80d5489: Start microphone capture inside the user gesture that calls `AgentSession.start`. Previously getUserMedia ran only after the session-token exchange and the realtime connect, and browsers that gate the permission prompt on the gesture's transient activation (Safari, in-app WebViews) rejected it without ever prompting — every start then failed with `mic_permission_denied` on those devices. A denied microphone now also rejects before the realtime session connects, and a capture that never got published is released on teardown.
  - @fishaudio/agent-protocol@0.2.0

## 0.1.0

### Minor Changes

- Revise `SessionOverrides`: rename `voice_profile_id` to `voice_id`, add `first_message_prompt` (mutually exclusive with `first_message`), and move the language override fully into `overrides.language` — the top-level `language` request field is gone. The `language` start option still works and now folds into overrides client-side; an explicit `overrides.language` wins. Keyless (public) session creation accepts only the `language` and `voice_id` overrides.

### Patch Changes

- Updated dependencies
  - @fishaudio/agent-protocol@0.1.0
