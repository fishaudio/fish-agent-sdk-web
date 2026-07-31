export { useConversation, type ConversationStatus, type UseConversationReturn } from "./useConversation.js";
export {
  AgentSessionProvider,
  useAgentSessionContext,
  useOptionalAgentSessionContext,
  type AgentSessionProviderProps,
} from "./provider.js";
export { useAgentMessages, type ChatMessage } from "./useAgentMessages.js";
export { useAudioLevels, type AudioLevels } from "./useAudioLevels.js";
export {
  AgentAudioVisualizer,
  type AgentAudioVisualizerProps,
} from "./AgentAudioVisualizer.js";
// Convenience re-exports so app code can stay on one import.
export {
  AgentSession,
  FishAgentError,
  type AgentMode,
  type AgentSessionOptions,
  type ConversationMessage,
  type EndReason,
  type SessionStatus,
  type SessionToken,
  type TranscriptSegment,
} from "@fishaudio/agent-client";
