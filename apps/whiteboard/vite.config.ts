import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

// Nested under sphere-io/scan-js/; Vite treats scan-js/ as workspace root, but
// deps are often hoisted to sphere-io/node_modules — allow that path for Nitro SSR.
const appDir = path.dirname(fileURLToPath(import.meta.url));
const scanJsRoot = path.resolve(appDir, "../..");
const monorepoRoot = path.resolve(appDir, "../../..");

export default defineConfig({
  server: {
    port: 3001,
    fs: {
      allow: [monorepoRoot, scanJsRoot],
    },
  },
  resolve: {
    // One React instance — avoids invalid hook call when board/radix resolve a nested copy.
    // Do NOT absolute-alias react: Nitro inlines a second copy into the server-fn
    // resolver chunk and SSR hooks see a null dispatcher.
    dedupe: ["react", "react-dom"],
    alias: {
      "@spherescan/board": path.resolve(appDir, "../../packages/board/src/index.ts"),
    },
  },
  ssr: {
    noExternal: ["@spherescan/board"],
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
