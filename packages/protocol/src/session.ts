// Session-creation wire contract for `POST /v1/agent/sessions` (snake_case is the Fish API
// convention; clients consume responses verbatim). `SessionToken.transport` is a discriminated
// union: clients that don't recognize the negotiated arm must fail with an explicit upgrade
// error, never silently.

export const SESSION_TRANSPORT_LIVEKIT = "livekit";

export interface LiveKitSessionToken {
  transport: typeof SESSION_TRANSPORT_LIVEKIT;
  session_id: string;
  /** Join deadline (ISO 8601); the session token is unusable afterwards. */
  expires_at: string;
  max_duration_seconds: number;
  livekit_url: string;
  token: string;
}

/** Future transports extend this union; `session_id`/`expires_at` semantics stay per-arm. */
export type SessionToken = LiveKitSessionToken;

/**
 * ISO 639-1 code from the supported set; the server rejects anything else
 * (names, endonyms, region variants). Pins STT routing, TTS voice, and the
 * default reply language. Omit to use the agent's configured speaking
 * language.
 */
export type SessionLanguage = "en" | "ja" | "zh" | "ko" | "es" | "fr" | "de";

/**
 * Per-session config overrides; each field must be enabled on the agent.
 * Keyless (public) creation accepts only `language` and `voice_id`.
 */
export interface SessionOverrides {
  /** Verbatim opener; mutually exclusive with `first_message_prompt`. */
  first_message?: string;
  /** Instructions the agent generates its opener from. */
  first_message_prompt?: string;
  system_prompt?: string;
  /** TTS voice model id. Voices bias pronunciation toward their own language — pair with `language`. */
  voice_id?: string;
  language?: SessionLanguage;
}

export interface AgentSessionCreateRequest {
  agent_id: string;
  /**
   * Display name for this session in the dashboard's Conversations list
   * (max 128 characters). API-key sessions only — keyless (public) creation
   * rejects it, so anonymous visitors cannot control dashboard titles.
   */
  name?: string;
  /**
   * IANA timezone (e.g. "Asia/Shanghai") anchoring the agent's sense of local
   * time — "today", "now", relative dates. Top of the resolution chain; the
   * server rejects names it cannot resolve. Omit to let the platform resolve
   * one (client hint, then UTC).
   */
  timezone?: string;
  /**
   * Browser-reported timezone hint, auto-filled by the SDK from
   * `Intl.DateTimeFormat().resolvedOptions().timeZone`. A hint, not a demand:
   * values the server cannot resolve are dropped silently.
   */
  client_timezone?: string;
  /**
   * The agent knows the current date and time by default (world context).
   * Pass false to withhold both from this session's prompt.
   */
  world_context?: boolean;
  overrides?: SessionOverrides;
  dynamic_variables?: Record<string, string | number | boolean>;
  /** Host-side end-user identifier, for attribution in session records. */
  end_user_id?: string;
  /**
   * Stream `tool.started/completed/failed` (with truncated input/output) to this
   * session on `agent-event`. Default true; pass false when tool payloads must
   * stay hidden from the client.
   */
  tool_events?: boolean;
  /**
   * Caller-owned key-values (Stripe-metadata semantics): the platform stores
   * them verbatim and returns them verbatim on read surfaces, and never reads,
   * writes or interprets them. Platform attribution lives in dedicated
   * session-record fields, never in here.
   */
  metadata?: Record<string, unknown>;
}
