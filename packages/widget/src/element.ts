import { h, render } from "preact";
import { OBSERVED_ATTRIBUTES, parseAttributes } from "./config.js";
import styles from "./styles.js";
import { FishAgentWidget } from "./widget.js";

// SSR-safe base: server bundles (Next renders "use client" components on the
// server too) evaluate this module without DOM globals; registerWidget() is the
// browser-only gate, the class just has to parse.
const Base = (typeof HTMLElement !== "undefined" ? HTMLElement : class {}) as typeof HTMLElement;

export class FishAgentElement extends Base {
  static observedAttributes = [...OBSERVED_ATTRIBUTES];

  #container?: HTMLElement;

  connectedCallback(): void {
    if (!this.#container) {
      const root = this.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = styles;
      root.append(style);
      this.#container = document.createElement("div");
      root.append(this.#container);
    }
    this.#render();
  }

  attributeChangedCallback(): void {
    if (this.isConnected && this.#container) {
      this.#render();
    }
  }

  disconnectedCallback(): void {
    if (this.#container) {
      render(null, this.#container);
    }
  }

  #render(): void {
    render(
      h(FishAgentWidget, { host: this, attributes: parseAttributes(this) }),
      this.#container!,
    );
  }
}

/**
 * Define the widget's custom element. Importing `@fishaudio/agent-widget` has
 * no side effects — call this once; `@fishaudio/agent-widget-embed` does it on
 * load for script-tag installs.
 */
export function registerWidget(tagName = "fish-agent"): void {
  if (typeof customElements !== "undefined" && !customElements.get(tagName)) {
    customElements.define(tagName, FishAgentElement);
  }
}
