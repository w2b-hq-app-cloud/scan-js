import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const scanJsRoot = path.resolve(appDir, "../..");
const monorepoRoot = path.resolve(appDir, "../../..");
const reactRoot = existsSync(path.join(monorepoRoot, "node_modules/react"))
  ? monorepoRoot
  : scanJsRoot;
const reactPkg = path.resolve(reactRoot, "node_modules/react");
const reactDomPkg = path.resolve(reactRoot, "node_modules/react-dom");

export default defineConfig({
  server: {
    port: 5175,
    fs: {
      allow: [scanJsRoot, appDir, monorepoRoot],
    },
  },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@spherescan/board": path.resolve(scanJsRoot, "packages/board/src/index.ts"),
      react: reactPkg,
      "react-dom": reactDomPkg,
      "react/jsx-runtime": path.resolve(reactPkg, "jsx-runtime.js"),
      "react/jsx-dev-runtime": path.resolve(reactPkg, "jsx-dev-runtime.js"),
    },
  },
  plugins: [react(), tailwindcss()],
});
