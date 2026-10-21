import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root,
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    allowedHosts: ["satellite-passage.ddev.site", "ddev-satellite-passage-web"],
    hmr: {
      host: "satellite-passage.ddev.site",
      protocol: "wss",
      clientPort: 5173,
    },
    cors: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: resolve(root, "map-app/main.js"),
    },
  },
});
