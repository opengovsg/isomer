import { defineConfig } from "@isomer/oxlint-config"
import base from "@isomer/oxlint-config/base"
import { antiSlop, core } from "@isomer/oxlint-config/presets"

export default defineConfig({
  extends: [base, core, antiSlop],
  ignorePatterns: [...core.ignorePatterns, "dist", "**/*.config.*"],
  overrides: [
    {
      env: {
        commonjs: true,
      },
      files: ["**/*.js", "**/*.jsx"],
      globals: {
        Buffer: "readonly",
        Intl: "readonly",
        TextDecoder: "readonly",
        TextEncoder: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        clearImmediate: "readonly",
        clearInterval: "readonly",
        clearTimeout: "readonly",
        console: "readonly",
        performance: "readonly",
        process: "readonly",
        queueMicrotask: "readonly",
        setImmediate: "readonly",
        setInterval: "readonly",
        setTimeout: "readonly",
      },
      rules: {
        "no-useless-escape": "warn",
      },
    },
    {
      files: ["amplify/**/*.js", "github/**/*.js", "1password/**/*.js"],
      rules: {
        "eslint/no-await-in-loop": "off",
        "@typescript-eslint/no-unsafe-assignment": "warn",
        "@typescript-eslint/no-unsafe-argument": "warn",
        "@typescript-eslint/no-unsafe-call": "warn",
        "@typescript-eslint/no-unsafe-member-access": "warn",
        "@typescript-eslint/no-unsafe-return": "warn",
        "@typescript-eslint/return-await": "warn",
      },
    },
    {
      files: [
        "scripts/generate-sitemap.ts",
        "scripts/generate-search-index.ts",
      ],
      rules: {
        "eslint/complexity": "off",
        "eslint/func-style": "off",
        "eslint/no-use-before-define": "off",
        "@typescript-eslint/return-await": "warn",
        "@typescript-eslint/no-unsafe-type-assertion": "warn",
        "typescript/promise-function-async": "warn",
      },
    },
    {
      files: ["**/*.ts", "**/*.tsx"],
      plugins: ["typescript"],
      rules: {
        "@typescript-eslint/await-thenable": "warn",
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-unnecessary-condition": "warn",
        "@typescript-eslint/no-unsafe-argument": "warn",
        "@typescript-eslint/no-unsafe-assignment": "warn",
        "@typescript-eslint/no-unsafe-call": "warn",
        "@typescript-eslint/no-unsafe-member-access": "warn",
        "@typescript-eslint/no-unsafe-return": "warn",
        "@typescript-eslint/prefer-nullish-coalescing": [
          "error",
          {
            ignorePrimitives: true,
          },
        ],
        "no-unused-vars": "warn",
      },
    },
  ],
})
