export type FishAgentErrorCode =
  | "session_request_failed"
  | "agent_not_public"
  | "origin_forbidden"
  | "unsupported_transport"
  | "mic_permission_denied"
  /** A requested audio device could not be activated, or the browser does not support selecting it. */
  | "device_change_failed"
  | "connection_failed"
  | "session_expired"
  | "tool_failed"
  | "tool_timeout"
  /** An upstream model/speech provider failed during the session. */
  | "provider_error"
  /** The agent runtime hit an internal error. */
  | "internal_error";

export class FishAgentError extends Error {
  readonly code: FishAgentErrorCode;
  /** HTTP status of the failing session request, when the error originated there. */
  readonly statusCode?: number;

  constructor(
    code: FishAgentErrorCode,
    message: string,
    options?: { statusCode?: number; cause?: unknown },
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "FishAgentError";
    this.code = code;
    this.statusCode = options?.statusCode;
  }
}
