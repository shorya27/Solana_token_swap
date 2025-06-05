// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 1) This plugin will polyfill Node built‐ins for the browser,
//    including `buffer`, `process`, and so on.
import {nodePolyfills} from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // By default this polyfills `buffer`, `process`, etc. 
      // You can set `protocolImports: true` to polyfill *all* node modules automatically,
      // but usually the default is fine if you just need `Buffer`.
      // protocolImports: true
    }),
  ],
  resolve: {
    alias: {
      // If any code does “import { Buffer } from 'buffer'” it will use the browser polyfill:
      buffer: "buffer",
    },
  },
  define: {
    // Some libraries expect `process.env` or `global`.
    // We’re telling Vite to replace any `process.env` usage with an empty object,
    // and `global` with `globalThis`.
    "process.env": {},
    global: "globalThis",
  },
});
