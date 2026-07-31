import { defineConfig } from "tsup";

// One self-contained IIFE for <script src> installs: everything (widget,
// client SDK, preact, livekit-client) is bundled in.
export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["iife"],
    outExtension: () => ({ js: ".js" }),
    platform: "browser",
    target: "es2020",
    minify: true,
    sourcemap: true,
    clean: true,
    banner: {
      js: "/*! @fishaudio/agent-widget-embed — bundles third-party software (livekit-client, preact, and others); see THIRD-PARTY-NOTICES.txt in this npm package for the full license notices. */",
    },
    noExternal: [/.*/],
    define: { "process.env.NODE_ENV": '"production"' },
  },
  // Types-only pass so `import "@fishaudio/agent-widget-embed"` typechecks.
  {
    entry: { index: "src/index.ts" },
    dts: { only: true },
  },
])
