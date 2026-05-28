import js from "@eslint/js";
import tseslint from "typescript-eslint";
import formatjs from "eslint-plugin-formatjs";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "coverage",
      "node_modules",
      "src/i18n/compiled-lang/**",
      "src/i18n/lang/**",
      "scripts/**",
    ],
  },
  // Root config files: TS-aware but no formatjs / project-source rules.
  {
    files: ["*.config.{ts,js,mjs}", "*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { formatjs },
    rules: {
      // Catch missing translations at lint time.
      "formatjs/enforce-default-message": ["error", "literal"],
      "formatjs/enforce-description": ["error", "literal"],
      "formatjs/no-multiple-whitespaces": "error",
      "formatjs/no-camel-case": "off",
      // TS niceties — keep low-signal warnings off the hot path.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "formatjs/enforce-id": [
        "error",
        {
          idInterpolationPattern: "[sha512:contenthash:base64:6]",
        },
      ],
      "formatjs/no-offset": "error",
    },
  },
  {
    // Tests are allowed to use looser conventions and skip i18n rules.
    files: ["src/**/*.test.{ts,tsx}", "src/test/**"],
    rules: {
      "formatjs/enforce-default-message": "off",
      "formatjs/enforce-description": "off",
    },
  },
);
