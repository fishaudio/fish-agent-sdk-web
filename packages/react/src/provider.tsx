import type { AgentSessionOptions } from "@fishaudio/agent-client";
import { createContext, useContext, type PropsWithChildren, type ReactElement } from "react";
import { useConversation, type UseConversationReturn } from "./useConversation.js";

const ConversationContext = createContext<UseConversationReturn | null>(null);

export type AgentSessionProviderProps = PropsWithChildren<{
  options?: Partial<AgentSessionOptions>;
}>;

/** Hosts one conversation for a component tree. */
export function AgentSessionProvider({
  options,
  children,
}: AgentSessionProviderProps): ReactElement {
  const conversation = useConversation(options ?? {});
  return (
    <ConversationContext.Provider value={conversation}>{children}</ConversationContext.Provider>
  );
}

export function useAgentSessionContext(): UseConversationReturn {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error("useAgentSessionContext must be used within <AgentSessionProvider>");
  }
  return context;
}

/** Nullable variant for components that also accept an explicit session prop. */
export function useOptionalAgentSessionContext(): UseConversationReturn | null {
  return useContext(ConversationContext);
}
