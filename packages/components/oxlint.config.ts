import { defineConfig } from "@isomer/oxlint-config"
import base from "@isomer/oxlint-config/base"
import {
  storybookIgnorePattern,
  storybookOverrides,
} from "@isomer/oxlint-config/storybook"
// import { react, vitest } from "@isomer/oxlint-config/presets"

export default defineConfig({
  extends: [
    base,
    // To enable this in following stacked PRs
    // react, vitest
  ],
  ignorePatterns: ["dist", "**/*.config.*", storybookIgnorePattern],
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      rules: {
        "react/react-in-jsx-scope": "off",
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
        "@typescript-eslint/no-unsafe-assignment": "warn",
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-unsafe-call": "warn",
        "@typescript-eslint/no-unsafe-member-access": "warn",
        "@typescript-eslint/no-unsafe-return": "warn",
        "@typescript-eslint/no-unsafe-argument": "warn",
        "@typescript-eslint/no-unnecessary-condition": "warn",
        "@typescript-eslint/prefer-nullish-coalescing": [
          "error",
          {
            ignorePrimitives: true,
          },
        ],
        "no-restricted-imports": [
          "error",
          {
            paths: [
              {
                name: "~/utils",
                message:
                  "Do not import from ~/utils (barrel). Import from the specific file instead (e.g. ~/utils/getWordsFromPermalink).",
              },
              {
                name: "tailwind-variants",
                importNames: ["tv"],
                message:
                  "Please use export from ~/lib/tv instead of the node module",
              },
              {
                name: "tailwind-merge",
                importNames: ["twMerge"],
                message:
                  "Please use export from ~/lib/twMerge instead of the node module",
              },
              {
                name: "next/navigation",
                message:
                  "Please use export from next instead of next/navigation",
              },
            ],
            patterns: [
              {
                group: ["lodash-es/*"],
                message:
                  "Import from `lodash-es` entrypoint only to preserve tree shaking.",
              },
            ],
          },
        ],
        "no-unused-vars": "warn",
      },
      globals: {
        React: "writable",
      },
      plugins: ["react", "typescript"],
    },
    ...storybookOverrides,
  ],
})
