// The React adapter renders the real element — assert the attribute mapping
// and the event-props wiring against actual DOM. Plain createElement: this
// package's JSX config is preact, and the adapter is React.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { AgentSessionOptions } from "@fishaudio/agent-client";
import { FishAgentWidget } from "../react.js";

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("{}", { status: 404 })),
  );
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

const host = () => container.querySelector("fish-agent") as HTMLElement;

describe("FishAgentWidget (React adapter)", () => {
  it("maps camelCase props onto the element's attribute face", async () => {
    await act(async () => {
      root.render(
        createElement(FishAgentWidget, {
          agentId: "demo_agent",
          agentName: "Aria",
          transcript: false,
          proactiveDelay: 5,
          dynamicVariables: { plan: "pro" },
          position: "bottom-left",
        }),
      );
    });
    const element = host();
    expect(element).toBeTruthy();
    expect(element.getAttribute("agent-id")).toBe("demo_agent");
    expect(element.getAttribute("agent-name")).toBe("Aria");
    // Explicit string, not attribute absence — absence would mean the default.
    expect(element.getAttribute("transcript")).toBe("false");
    expect(element.getAttribute("proactive-delay")).toBe("5");
    expect(JSON.parse(element.getAttribute("dynamic-variables")!)).toEqual({ plan: "pro" });
    expect(element.getAttribute("position")).toBe("bottom-left");
    expect(customElements.get("fish-agent")).toBeTruthy();
  });

  it("injects clientTools and runs onCall against the mutable options", async () => {
    const clientTools = { highlight: () => "ok" };
    const onCall = vi.fn((options: AgentSessionOptions) => {
      options.endUserId = "visitor-1";
    });
    await act(async () => {
      root.render(createElement(FishAgentWidget, { agentId: "a1", clientTools, onCall }));
    });
    const options: AgentSessionOptions = { agentId: "a1" };
    host().dispatchEvent(
      new CustomEvent("fish-agent:call", { detail: { options }, bubbles: true, composed: true }),
    );
    expect(options.clientTools).toBe(clientTools);
    expect(options.endUserId).toBe("visitor-1");
    expect(onCall).toHaveBeenCalledTimes(1);
  });

  it("mirrors the sessionTokenProvider prop onto the element property", async () => {
    const provider = vi.fn();
    await act(async () => {
      root.render(createElement(FishAgentWidget, { sessionTokenProvider: provider }));
    });
    const element = host() as HTMLElement & { sessionTokenProvider?: unknown };
    expect(element.sessionTokenProvider).toBe(provider);

    await act(async () => {
      root.render(createElement(FishAgentWidget, { agentId: "a1" }));
    });
    expect(element.sessionTokenProvider).toBeUndefined();
  });

  it("forwards page events to callback props", async () => {
    const onConnect = vi.fn();
    const onDisconnect = vi.fn();
    const onError = vi.fn();
    await act(async () => {
      root.render(
        createElement(FishAgentWidget, { agentId: "a1", onConnect, onDisconnect, onError }),
      );
    });
    const element = host();
    element.dispatchEvent(new CustomEvent("fish-agent:connect", { detail: { sessionId: "s1" } }));
    element.dispatchEvent(
      new CustomEvent("fish-agent:disconnect", { detail: { reason: "agent_hangup" } }),
    );
    element.dispatchEvent(
      new CustomEvent("fish-agent:error", { detail: { code: "connection_failed", message: "x" } }),
    );
    expect(onConnect).toHaveBeenCalledWith({ sessionId: "s1" });
    expect(onDisconnect).toHaveBeenCalledWith({ reason: "agent_hangup" });
    expect(onError).toHaveBeenCalledWith({ code: "connection_failed", message: "x" });
  });
});
