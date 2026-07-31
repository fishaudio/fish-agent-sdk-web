import { describe, expect, it } from "vitest";
import { DEFAULT_TEXTS, parseAttributes, resolveSettings } from "../config.js";

function source(attrs: Record<string, string>) {
  return { getAttribute: (name: string) => attrs[name] ?? null };
}

describe("parseAttributes", () => {
  it("parses booleans, JSON and enums, leaving absent attributes undefined", () => {
    const attrs = parseAttributes(
      source({
        "agent-id": "agent_1",
        transcript: "false",
        consent: "",
        "dynamic-variables": '{"plan":"pro"}',
        position: "top-left",
        "proactive-delay": "7",
      }),
    );
    expect(attrs.agentId).toBe("agent_1");
    expect(attrs.transcript).toBe(false);
    expect(attrs.consent).toBe(true); // bare attribute enables, HTML boolean convention
    expect(attrs.textInput).toBeUndefined();
    expect(attrs.dynamicVariables).toEqual({ plan: "pro" });
    expect(attrs.position).toBe("top-left");
    expect(attrs.proactiveDelaySeconds).toBe(7);
  });

  it("drops invalid JSON and invalid positions", () => {
    const attrs = parseAttributes(
      source({ "dynamic-variables": "{oops", position: "middle", "proactive-delay": "soon" }),
    );
    expect(attrs.dynamicVariables).toBeUndefined();
    expect(attrs.position).toBeUndefined();
    expect(attrs.proactiveDelaySeconds).toBeUndefined();
  });
});

describe("resolveSettings", () => {
  it("applies defaults when nothing is configured", () => {
    const settings = resolveSettings(parseAttributes(source({})), null);
    expect(settings.agentName).toBe("Agent");
    expect(settings.transcript).toBe(true);
    expect(settings.textInput).toBe(true);
    expect(settings.micMuting).toBe(true);
    expect(settings.consent).toBe(false);
    expect(settings.position).toBe("bottom-right");
    expect(settings.texts).toEqual(DEFAULT_TEXTS);
  });

  it("lets attributes win over remote config, which wins over defaults", () => {
    const settings = resolveSettings(
      parseAttributes(source({ "agent-name": "Aria", transcript: "true" })),
      {
        agent_name: "Remote",
        transcript_enabled: false,
        text_input_enabled: false,
        consent_required: true,
        greeting: "Hello from the dashboard",
      },
    );
    expect(settings.agentName).toBe("Aria"); // attribute wins
    expect(settings.transcript).toBe(true); // attribute wins
    expect(settings.textInput).toBe(false); // remote applies
    expect(settings.consent).toBe(true); // remote applies
    expect(settings.texts.greeting).toBe("Hello from the dashboard");
  });

  it("merges text contents with shortcut attributes on top", () => {
    const settings = resolveSettings(
      parseAttributes(
        source({
          greeting: "Hi!",
          "consent-text": "Custom terms",
          "text-contents": '{"startVoice":"Call us","greeting":"Ignored by shortcut"}',
        }),
      ),
      { text_contents: { poweredBy: "Powered by remote" } },
    );
    expect(settings.texts.greeting).toBe("Hi!");
    expect(settings.texts.startVoice).toBe("Call us");
    expect(settings.texts.consentBody).toBe("Custom terms");
    expect(settings.texts.poweredBy).toBe("Powered by remote");
    expect(settings.texts.consentTitle).toBe(DEFAULT_TEXTS.consentTitle);
  });
});
