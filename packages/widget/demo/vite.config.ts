import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  resolve: {
    alias: {
      "@fishaudio/agent-client": fileURLToPath(new URL("./mock-client.ts", import.meta.url)),
    },
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "preact",
  },
  server: {
    port: 5199,
    strictPort: true,
  },
})
