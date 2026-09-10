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

`start()` also accepts `language` as a top-level option. It is shorthand for `overrides.language` and gated by the same allowlist.

## Language

`language` accepts one of these ISO 639-1 codes: `en`, `ja`, `zh`, `ko`, `es`, `fr`, `de`, `pt`, `it`, `nl`. Anything else fails session creation with HTTP 422. That includes language names like `"Chinese"`, endonyms like `"中文"`, and region variants like `"zh-CN"`. Values are never best-effort-mapped. Omit it to use the agent's configured speaking language.

Pinning a language sets the agent's default reply language, routes the speech recognizer to a model that covers it, and selects a matching built-in voice where one exists. An explicit user request mid-conversation ("please speak English") still wins over the pinned default.

**Pair `language` with a matching voice.** Fish TTS has no language parameter. The voice itself biases pronunciation toward the language it was recorded in. If the agent's configured voice speaks another language, also pass `overrides.voice_profile_id` with a voice recorded in the target language. Otherwise pronunciation and accent are undefined.

## Dynamic variables

`dynamicVariables` fill `{{name}}` placeholders in the agent's prompt, first message, and override values. No allow-listing is needed. The agent author opts in by writing placeholders. Unknown placeholders stay visible in the text.

## Where to pass them

Both apply when the session is created:

- In `agentId` mode, pass them to `AgentSession.start()` as above.
- In `sessionToken` mode, pass them from your backend's create request (`POST /v1/agent/sessions`). The SDK options only take effect in `agentId` mode.
