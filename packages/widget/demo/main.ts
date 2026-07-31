import { registerWidget } from "../src/index.js";

registerWidget();

document.getElementById("drive-user-speech")?.addEventListener("click", () => {
  window.__mockSession?.userSpeech("I need to reschedule my appointment.");
});

document.getElementById("drive-expand")?.addEventListener("click", () => {
  document.dispatchEvent(new CustomEvent("fish-agent:expand"));
});

document.querySelector("fish-agent")?.addEventListener("fish-agent:call", (event) => {
  console.log("[demo] fish-agent:call", (event as CustomEvent).detail);
});
