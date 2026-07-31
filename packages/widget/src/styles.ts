// Shadow-root stylesheet as a plain string: no bundler CSS loaders involved,
// so tsup, vite and vitest all handle it identically.
const styles = String.raw`
/* All custom properties are overridable from the host page on the <fish-agent>
   element — the public theming surface. Internals use .fa-* classes inside the
   shadow root. Bubble geometry: asymmetric 24px radii, black agent bubble /
   neutral user bubble. */

:host {
  --fish-accent: #0f0e0d;
  --fish-accent-text: #ffffff;
  --fish-orb-color-1: #7cc4ff;
  --fish-orb-color-2: #0a3f8f;
  --fish-bg: #ffffff;
  --fish-text: #141414;
  --fish-text-secondary: #8a8a86;
  --fish-border: #ebeae8;
  --fish-bubble-agent-bg: #0f0e0d;
  --fish-bubble-agent-text: #ffffff;
  --fish-bubble-user-bg: #f4f3f1;
  --fish-bubble-user-text: #141414;
  --fish-danger: #e5484d;
  --fish-live: #30a46c;
  --fish-radius: 20px;
  --fish-fab-size: 60px;
  --fish-offset-x: 24px;
  --fish-offset-y: 24px;
  --fish-z-index: 2147483000;
  --fish-font:
    ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial,
    "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;

  position: fixed;
  z-index: var(--fish-z-index);
  right: var(--fish-offset-x);
  bottom: var(--fish-offset-y);
}

:host([position="bottom-left"]) {
  right: auto;
  left: var(--fish-offset-x);
}

:host([position="top-right"]) {
  bottom: auto;
  top: var(--fish-offset-y);
}

:host([position="top-left"]) {
  right: auto;
  bottom: auto;
  left: var(--fish-offset-x);
  top: var(--fish-offset-y);
}

.fa-root {
  font-family: var(--fish-font);
  color: var(--fish-text);
  font-size: 14px;
  line-height: 1.45;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

:host([position="bottom-left"]) .fa-root,
:host([position="top-left"]) .fa-root {
  align-items: flex-start;
}

.fa-root *,
.fa-root *::before,
.fa-root *::after {
  box-sizing: border-box;
}

.fa-root button {
  font-family: inherit;
  font-size: inherit;
  cursor: pointer;
}

.fa-root button:focus-visible,
.fa-root input:focus-visible,
.fa-root a:focus-visible {
  outline: 2px solid var(--fish-orb-color-1);
  outline-offset: 2px;
}

.fa-visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

/* ---- FAB + proactive bubble ---- */

/* The bubble is wider than the FAB; keep the FAB on the panel corner's
   column (right edges aligned, mirrored for left positions). */
.fa-collapsed {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

:host([position="bottom-left"]) .fa-collapsed,
:host([position="top-left"]) .fa-collapsed {
  align-items: flex-start;
}

.fa-fab {
  width: var(--fish-fab-size);
  height: var(--fish-fab-size);
  border: none;
  border-radius: 50%;
  background: var(--fish-accent);
  color: var(--fish-accent-text);
  display: grid;
  place-items: center;
  box-shadow: 0 8px 24px rgba(15, 14, 13, 0.22);
  transition: transform 0.15s ease;
}

.fa-fab:hover {
  transform: scale(1.05);
}

.fa-proactive {
  position: relative;
  max-width: 260px;
  margin-bottom: 12px;
  background: var(--fish-bg);
  color: var(--fish-text);
  border: 1px solid var(--fish-border);
  border-radius: 14px;
  padding: 12px 16px;
  font-size: 13px;
  box-shadow: 0 8px 20px rgba(15, 14, 13, 0.14);
}

.fa-proactive-dismiss {
  position: absolute;
  top: -9px;
  right: -9px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid var(--fish-border);
  background: var(--fish-bg);
  color: var(--fish-text-secondary);
  display: grid;
  place-items: center;
  padding: 0;
}

/* ---- Panel shell ---- */

.fa-panel {
  width: 380px;
  max-height: min(560px, calc(100dvh - 2 * var(--fish-offset-y)));
  background: var(--fish-bg);
  border: 1px solid var(--fish-border);
  border-radius: var(--fish-radius);
  box-shadow: 0 16px 48px rgba(15, 14, 13, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.fa-panel--call {
  height: min(560px, calc(100dvh - 2 * var(--fish-offset-y)));
}

.fa-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--fish-border);
  flex-shrink: 0;
}

.fa-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.fa-header-names {
  min-width: 0;
}

.fa-header-title {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fa-header-status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  color: var(--fish-text-secondary);
}

.fa-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--fish-live);
  flex-shrink: 0;
}

.fa-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.fa-icon-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--fish-text-secondary);
  border-radius: 8px;
  display: grid;
  place-items: center;
  padding: 0;
}

.fa-icon-btn:hover {
  background: var(--fish-bubble-user-bg);
  color: var(--fish-text);
}

.fa-header-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border: none;
  border-radius: 999px;
  /* Theme-neutral grey: host themes recolor bubbles, but the pill must stay
     visually distinct from the danger hang-up button next to it. */
  background: rgba(15, 14, 13, 0.06);
  color: var(--fish-text);
  font-size: 12px;
  cursor: pointer;
}

.fa-header-pill--muted {
  background: var(--fish-accent);
  color: var(--fish-accent-text);
}

.fa-header-pill:disabled {
  opacity: 0.5;
  cursor: default;
}

.fa-header-end {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border: none;
  border-radius: 999px;
  background: var(--fish-danger);
  color: #ffffff;
  display: grid;
  place-items: center;
  padding: 0;
  cursor: pointer;
}

.fa-header-end:disabled {
  opacity: 0.5;
  cursor: default;
}

.fa-mode-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px 4px;
  border-top: 1px solid var(--fish-border);
  color: var(--fish-text-secondary);
  font-size: 12px;
  flex-shrink: 0;
}

.fa-footer {
  padding: 6px 0 10px;
  text-align: center;
  font-size: 11.5px;
  color: var(--fish-text-secondary);
  flex-shrink: 0;
}

.fa-footer a {
  color: inherit;
  text-decoration: none;
}

.fa-footer a:hover {
  text-decoration: underline;
}

.fa-error {
  color: var(--fish-danger);
  font-size: 12.5px;
  text-align: center;
  padding: 8px 16px 0;
}

/* ---- Home ---- */

.fa-home {
  padding: 36px 24px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
}

.fa-home-greeting {
  margin-top: 14px;
  font-size: 15px;
  font-weight: 600;
}

.fa-home-hint {
  font-size: 13px;
  color: var(--fish-text-secondary);
}

.fa-cta {
  margin-top: 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 20px;
  border: none;
  border-radius: 999px;
  background: var(--fish-accent);
  color: var(--fish-accent-text);
  font-size: 14px;
  font-weight: 500;
}

/* ---- Consent ---- */

.fa-consent {
  padding: 24px 28px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
}

.fa-consent-title {
  font-size: 15px;
  font-weight: 600;
}

.fa-consent-terms {
  background: var(--fish-bubble-user-bg);
  border-radius: 12px;
  padding: 14px;
  font-size: 12.5px;
  line-height: 1.55;
  color: var(--fish-text);
  text-align: left;
}

.fa-consent-links {
  display: flex;
  gap: 12px;
  font-size: 12.5px;
}

.fa-consent-links a {
  color: var(--fish-text);
  text-decoration: underline;
}

.fa-consent-buttons {
  display: flex;
  gap: 10px;
}

.fa-btn-secondary {
  height: 38px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid var(--fish-border);
  background: var(--fish-bg);
  color: var(--fish-text);
  font-size: 14px;
}

.fa-btn-primary {
  height: 38px;
  padding: 0 18px;
  border-radius: 999px;
  border: none;
  background: var(--fish-accent);
  color: var(--fish-accent-text);
  font-size: 14px;
  font-weight: 500;
}

/* ---- Transcript ---- */

.fa-transcript {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fa-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 6px 0;
  color: var(--fish-text-secondary);
  font-size: 12px;
  white-space: nowrap;
}

.fa-divider::before,
.fa-divider::after {
  content: "";
  flex: 1;
  border-top: 1px solid var(--fish-border);
}

.fa-ended {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 16px 14px;
  border-top: 1px solid var(--fish-border);
}

.fa-cta--wide {
  margin-top: 0;
  width: 100%;
  justify-content: center;
}

.fa-link {
  border: none;
  background: none;
  padding: 6px 8px;
  color: var(--fish-text-secondary);
  font-size: 13px;
  cursor: pointer;
}

.fa-link:hover {
  color: var(--fish-text);
}

.fa-bubble {
  max-width: 244px;
  padding: 10px 14px;
  font-size: 14px;
  line-height: 20px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.fa-bubble--agent {
  align-self: flex-start;
  background: var(--fish-bubble-agent-bg);
  color: var(--fish-bubble-agent-text);
  border-radius: 6px 24px 24px 24px;
}

.fa-bubble--user {
  align-self: flex-end;
  background: var(--fish-bubble-user-bg);
  color: var(--fish-bubble-user-text);
  border-radius: 24px 6px 24px 24px;
}

.fa-tool {
  align-self: flex-start;
  max-width: 100%;
}

.fa-tool-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--fish-border);
  background: var(--fish-bg);
  color: var(--fish-text);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12.5px;
}

.fa-tool-name {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}

.fa-tool-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.fa-tool-dot--running {
  background: #f5a623;
  animation: fa-pulse-dot 1.1s ease-in-out infinite;
}

.fa-tool-dot--done {
  background: var(--fish-live);
}

.fa-tool-dot--error {
  background: var(--fish-danger);
}

.fa-tool-chevron {
  display: grid;
  place-items: center;
  color: var(--fish-text-secondary);
  transition: transform 0.15s ease;
}

.fa-tool-chip[aria-expanded="true"] .fa-tool-chevron {
  transform: rotate(180deg);
}

.fa-tool-detail {
  margin-top: 6px;
  max-width: 100%;
  background: var(--fish-bubble-user-bg);
  border-radius: 12px;
  padding: 10px 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11.5px;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  max-height: 140px;
  overflow-y: auto;
  color: var(--fish-text);
}

.fa-tool-detail-label {
  color: var(--fish-text-secondary);
  font-family: var(--fish-font);
  font-size: 11px;
}

/* ---- Composer ---- */

.fa-composer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  flex-shrink: 0;
}

.fa-composer--divided {
  border-top: 1px solid var(--fish-border);
}

.fa-input {
  flex: 1;
  min-width: 0;
  height: 38px;
  border: 1px solid var(--fish-border);
  border-radius: 999px;
  padding: 0 16px;
  font-family: inherit;
  font-size: 14px;
  color: var(--fish-text);
  background: var(--fish-bg);
}

.fa-input::placeholder {
  color: var(--fish-text-secondary);
}

.fa-send {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border: none;
  border-radius: 50%;
  background: var(--fish-accent);
  color: var(--fish-accent-text);
  display: grid;
  place-items: center;
}

.fa-send:disabled {
  opacity: 0.4;
  cursor: default;
}

/* ---- In-call controls (minimized pill; panel controls live in the header) ---- */

.fa-wave {
  flex: none;
  color: var(--fish-text);
}

.fa-mode-status .fa-wave {
  color: var(--fish-text-secondary);
}

.fa-btn-round {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border: 1px solid var(--fish-border);
  border-radius: 50%;
  background: var(--fish-bg);
  color: var(--fish-text);
  display: grid;
  place-items: center;
}

.fa-btn-round--muted {
  background: var(--fish-bubble-user-bg);
  color: var(--fish-danger);
}

.fa-btn-round--danger {
  background: var(--fish-danger);
  border-color: var(--fish-danger);
  color: #ffffff;
}

/* ---- Minimized pill ---- */

.fa-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--fish-bg);
  border: 1px solid var(--fish-border);
  border-radius: 999px;
  padding: 10px 10px 10px 10px;
  box-shadow: 0 8px 24px rgba(15, 14, 13, 0.18);
}

.fa-pill-expand {
  display: flex;
  align-items: center;
  gap: 10px;
  border: none;
  background: transparent;
  padding: 0;
  color: var(--fish-text);
}

.fa-pill-timer {
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.fa-pill .fa-btn-round {
  width: 32px;
  height: 32px;
}

/* ---- Orb ---- */

.fa-orb {
  position: relative;
  border-radius: 50%;
  background: radial-gradient(
    circle at 32% 30%,
    var(--fish-orb-color-1),
    var(--fish-orb-color-2) 72%
  );
  flex-shrink: 0;
}

.fa-orb::after {
  content: "";
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  border: 2px solid transparent;
  pointer-events: none;
}

.fa-orb[data-mode="listening"]::after {
  border-color: color-mix(in srgb, var(--fish-orb-color-1) 70%, transparent);
  animation: fa-pulse-ring 1.8s ease-out infinite;
}

.fa-orb[data-mode="thinking"]::after {
  border-top-color: var(--fish-orb-color-2);
  animation: fa-spin 0.9s linear infinite;
}

.fa-orb[data-mode="speaking"] {
  box-shadow: 0 0 calc(6px + var(--fa-orb-glow, 0) * 26px)
    color-mix(in srgb, var(--fish-orb-color-1) 65%, transparent);
}

@keyframes fa-pulse-ring {
  0% {
    transform: scale(0.92);
    opacity: 0.9;
  }
  70% {
    transform: scale(1.14);
    opacity: 0;
  }
  100% {
    transform: scale(1.14);
    opacity: 0;
  }
}

@keyframes fa-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fa-pulse-dot {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

/* ---- Mobile: full-screen sheet ---- */

@media (max-width: 480px) {
  .fa-panel {
    position: fixed;
    inset: 0;
    width: auto;
    height: 100dvh;
    max-height: none;
    border-radius: 0;
    border: none;
  }
}

/* ---- Reduced motion: static visuals, text labels carry the state ---- */

@media (prefers-reduced-motion: reduce) {
  .fa-root *,
  .fa-root *::before,
  .fa-root *::after {
    animation: none !important;
    transition: none !important;
  }

  .fa-orb[data-mode="speaking"] {
    box-shadow: 0 0 10px color-mix(in srgb, var(--fish-orb-color-1) 65%, transparent);
  }
}
`;

export default styles;
