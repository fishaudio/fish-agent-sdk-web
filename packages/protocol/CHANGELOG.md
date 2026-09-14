# @fishaudio/agent-protocol

## 0.3.0

### Minor Changes

- 4e2d043: Sessions now end with the reason the server announces instead of one inferred from the disconnect. The protocol gains a `session.ended` message on the agent-event topic, sent just before the server tears the call down, and `EndReason` grows `conversation_timeout` (the session hit its duration limit) and `escalated` (the call was handed off to a human). Previously every server-side end, including the duration limit and a backend-initiated end, surfaced as `agent_hangup`. A backend-initiated end now reports `user_hangup` when that is the reason the server records. Against a server that does not announce, the disconnect-based inference still applies.
- c64b6b1: `SessionLanguage` accepts `ar`, `hi`, `id`, and `tr` (Arabic, Hindi, Indonesian, Turkish) for the `language` option and `overrides.language`.
- `SessionLanguage` accepts `pt`, `it`, and `nl` (Portuguese, Italian, Dutch) for the `language` option and `overrides.language`. The 0.2.1 release shipped only `en`, `ja`, `zh`, `ko`, `es`, `fr`, and `de`.
- d69af1f: `SessionLanguage` grows to 52 codes: `ru`, `bg`, `sr`, `hr`, `cs`, `sk`, `pl`, `uk`, `ro`, `hu`, `el`, `sv`, `da`, `no`, `fi`, `et`, `lv`, `lt`, `ca`, `he`, `fa`, `ur`, `kk`, `ka`, `hy`, `bn`, `ta`, `te`, `kn`, `mr`, `gu`, `pa`, `ne`, `th`, `vi`, `ms`, `tl`, `af` join the set.

## 0.2.1

### Patch Changes

- b05db7d: Republish with resolved internal dependency ranges. The 0.2.0 tarballs declared their `@fishaudio/*` dependencies with the `workspace:^` protocol, which npm cannot install; packing and publishing now go through pnpm only, and a release-time check verifies the packed manifests.

## 0.2.0

## 0.1.0

### Minor Changes

- Revise `SessionOverrides`: rename `voice_profile_id` to `voice_id`, add `first_message_prompt` (mutually exclusive with `first_message`), and move the language override fully into `overrides.language` — the top-level `language` request field is gone. The `language` start option still works and now folds into overrides client-side; an explicit `overrides.language` wins. Keyless (public) session creation accepts only the `language` and `voice_id` overrides.
