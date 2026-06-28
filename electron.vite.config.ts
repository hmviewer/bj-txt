import { defineConfig } from "electron-vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  main: {
    build: {
      lib: {
        entry: resolve(__dirname, "electron/main.ts")
      }
    }
  },
  preload: {
    build: {
      lib: {
        entry: resolve(__dirname, "electron/preload.ts")
      }
    }
  },
  renderer: {
    plugins: [react()],
    root: ".",
    build: {
      rollupOptions: {
        input: resolve(__dirname, "index.html")
      }
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "src")
      }
    }
  }
});
