import type { AgentSessionMessage, ClientSessionMessage } from "@fishaudio/agent-protocol";
import { FishAgentError } from "../errors.js";

export type ClientToolHandler = (
  params: Record<string, unknown>,
  context: { callId: string; toolName: string },
) => unknown | Promise<unknown>;

export const DEFAULT_CLIENT_TOOL_TIMEOUT_MS = 15_000;

type ClientToolCall = Extract<AgentSessionMessage, { type: "client_tool.call" }>;

export class ClientToolDispatcher {
  private readonly tools = new Map<string, ClientToolHandler>();

  constructor(
    tools: Record<string, ClientToolHandler> | undefined,
    private readonly timeoutMs: number,
    private readonly send: (message: ClientSessionMessage) => Promise<void>,
    private readonly onError: (error: FishAgentError) => void,
  ) {
    for (const [name, handler] of Object.entries(tools ?? {})) {
      this.tools.set(name, handler);
    }
  }

  register(name: string, handler: ClientToolHandler): void {
    this.tools.set(name, handler);
  }

  async dispatch(call: ClientToolCall): Promise<void> {
    const handler = this.tools.get(call.toolName);
    if (!handler) {
      this.onError(
        new FishAgentError("tool_failed", `Client tool "${call.toolName}" is not registered`),
      );
      if (call.expectsResponse) {
        await this.reply(call.callId, { isError: true, result: "Tool is not registered" });
      }
      return;
    }

    try {
      const result = await this.withTimeout(
        Promise.resolve(handler(call.params, { callId: call.callId, toolName: call.toolName })),
        call.toolName,
      );
      if (call.expectsResponse) {
        await this.reply(call.callId, result === undefined ? {} : { result });
      }
    } catch (error) {
      this.onError(
        error instanceof FishAgentError
          ? error
          : new FishAgentError("tool_failed", `Client tool "${call.toolName}" threw`, {
              cause: error,
            }),
      );
      if (call.expectsResponse) {
        await this.reply(call.callId, { isError: true, result: String(error) });
      }
    }
  }

  private async reply(
    callId: string,
    body: { result?: unknown; isError?: boolean },
  ): Promise<void> {
    try {
      await this.send({ type: "client_tool.result", callId, ...body });
    } catch (error) {
      this.onError(
        new FishAgentError("tool_failed", "Failed to deliver a client tool result", {
          cause: error,
        }),
      );
    }
  }

  private withTimeout<T>(promise: Promise<T>, toolName: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          new FishAgentError(
            "tool_timeout",
            `Client tool "${toolName}" timed out after ${this.timeoutMs}ms`,
          ),
        );
      }, this.timeoutMs);
      promise.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error: unknown) => {
          clearTimeout(timer);
          reject(error instanceof Error ? error : new Error(String(error)));
        },
      );
    });
  }
}
