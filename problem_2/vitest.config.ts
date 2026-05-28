import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Mirror Vite's babel config so test renders see the same auto-ids
// as the dev / prod bundles.
// Keep defaultMessage as a plain string in tests so assertions can read it
// directly. Production sets ast:true so react-intl skips re-parsing.
const formatjsBabel: [string, Record<string, unknown>] = [
  "formatjs",
  {
    idInterpolationPattern: "[sha512:contenthash:base64:6]",
    ast: false,
  },
];

export default defineConfig({
  plugins: [react({ babel: { plugins: [formatjsBabel] } })],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/test/**", "src/main.tsx"],
    },
  },
});
