import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

// Nested under sphere-io/scan-js/; Vite treats scan-js/ as workspace root, but
// deps are hoisted to sphere-io/node_modules â€” allow that path for Nitro SSR.
const appDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(appDir, "../../..");

export default defineConfig({
  server: {
    port: 3001,
    fs: {
      allow: [monorepoRoot],
    },
  },
  resolve: {
    alias: {
      "@spherescan/board": path.resolve(appDir, "../../packages/board/src/index.ts"),
    },
  },
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart({
      // Use src/server.ts as the SSR entry (error wrapper around Start's server).
      server: { entry: "server" },
    }),
    viteReact(),
    nitro(),
  ],
});
