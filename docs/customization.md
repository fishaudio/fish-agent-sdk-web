# Customization

Customize a published agent per session at creation time with **overrides** and **dynamic variables**:

```js
const session = await AgentSession.start({
  agentId: "your-agent-id",
  overrides: { first_message: "Welcome back, {{user_name}}!" }, // whole-field replacement
  dynamicVariables: { user_name: "Ada", plan: "Pro" },          // fills {{placeholders}}
});
```

## Overrides

`overrides` replaces config fields for this session: `first_message`, `system_prompt`, `voice_profile_id`, `language`. Each field must be explicitly allow-listed on the agent (`overrides_allowed` in the agent settings); unauthorized fields fail session creation with HTTP 400 rather than being silently dropped.

`language` is common enough that `start()` accepts it as a top-level option — it's sugar for `overrides.language` and gated by the same allowlist.

## Language

`language` accepts an ISO 639-1 code from the supported set — `en`, `ja`, `zh`, `ko`, `es`, `fr`, `de`. Anything else (language names like `"Chinese"`, endonyms like `"中文"`, region variants like `"zh-CN"`) fails session creation with HTTP 422; values are never best-effort-mapped. Omit it to use the agent's configured behavior, including automatic language detection when the agent enables it.

Pinning a language sets the agent's default reply language, routes the speech recognizer to a model that covers it, and selects a matching built-in voice where one exists. An explicit user request mid-conversation ("please speak English") still wins over the pinned default.

**Pair `language` with a matching voice.** Fish TTS has no language parameter — the voice itself biases pronunciation toward the language it was recorded in. If you override `language` on an agent whose configured voice speaks another language, also pass `overrides.voice_profile_id` with a voice recorded in the target language; otherwise pronunciation and accent are undefined.

## Dynamic variables

`dynamicVariables` fill `{{name}}` placeholders in the agent's prompt and first message (and in override values). No allow-listing needed — the agent author opts in by writing placeholders. Unknown placeholders stay visible in the text.

## Where to pass them

Both apply when the session is created:

- **`agentId` mode** — pass them to `AgentSession.start()` as above.
- **`sessionToken` mode** — pass them from **your backend's** create request (`POST /v1/agent/sessions`); the SDK options only take effect in `agentId` mode.
