// Node >= 22.4 ships its own global localStorage/sessionStorage (non-functional
// without --localstorage-file). Vitest's jsdom environment only copies window
// globals that are missing from globalThis, so on such Node versions the tests
// (and the widget's consent/proactive persistence) would hit Node's stub
// instead of jsdom's Storage. Force-install jsdom-backed Storage objects,
// sourced from a same-origin iframe of the current jsdom window.
function isUsableStorage(storage: Storage | undefined): boolean {
  try {
    return (
      typeof storage?.getItem === "function" &&
      typeof storage?.setItem === "function" &&
      typeof storage?.removeItem === "function" &&
      typeof storage?.clear === "function"
    );
  } catch {
    return false;
  }
}

// jsdom does not implement canvas: HTMLCanvasElement.prototype.getContext logs
// "Error: Not implemented" to stderr before returning null. Waveform already
// handles a null context (it skips drawing), so stub the method to return null
// silently instead of spamming test output.
function silenceCanvasGetContext(): void {
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    value: () => null,
    configurable: true,
    writable: true,
  });
}

function installJsdomStorage(): void {
  if (isUsableStorage(globalThis.localStorage) && isUsableStorage(globalThis.sessionStorage)) {
    return;
  }
  const iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  const view = iframe.contentWindow;
  if (!view) {
    throw new Error("vitest.setup: could not create a jsdom iframe to source Storage from");
  }
  for (const key of ["localStorage", "sessionStorage"] as const) {
    Object.defineProperty(globalThis, key, {
      value: view[key],
      configurable: true,
      writable: true,
    });
  }
  iframe.remove();
}

silenceCanvasGetContext();
installJsdomStorage();
