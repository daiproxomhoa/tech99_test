import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { codeInspectorPlugin } from "code-inspector-plugin";
import path from "node:path";

/**
 * Shared babel plugin chain so dev, prod and test all hash the same ids.
 * `idInterpolationPattern` generates a stable 10-char base64 hash from
 * `defaultMessage + description`. `removeDefaultMessage` strips the literal
 * defaultMessage from the production bundle (the compiled JSON catalog
 * carries it instead), saving ~bytes per message.
 */
const formatjsBabel: [string, Record<string, unknown>] = [
  "formatjs",
  {
    idInterpolationPattern: "[sha512:contenthash:base64:6]",
    ast: true,
    removeDefaultMessage: process.env.NODE_ENV === "production",
  },
];

export default defineConfig({
  plugins: [
    react({ babel: { plugins: [formatjsBabel] } }),
    codeInspectorPlugin({ bundler: "vite", editor: "code" }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: { port: 5173, open: true },
  build: {
    target: "es2020",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          motion: ["framer-motion"],
          query: ["@tanstack/react-query"],
        },
      },
    },
  },
});
