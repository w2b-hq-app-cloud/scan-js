import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const scanJsRoot = path.resolve(appDir, "../..");
const monorepoRoot = path.resolve(appDir, "../../..");

export default defineConfig({
  server: {
    port: 5175,
    fs: {
      allow: [scanJsRoot, appDir, monorepoRoot],
    },
  },
  resolve: {
    // Prefer a single React when nested under sphere-io (hoisted root node_modules).
    // Avoid absolute react aliases — they break Nitro SSR hosts that embed this pattern.
    dedupe: ["react", "react-dom"],
    alias: {
      "@spherescan/board": path.resolve(scanJsRoot, "packages/board/src/index.ts"),
    },
  },
  plugins: [react(), tailwindcss()],
});
