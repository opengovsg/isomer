import { defineConfig } from "@isomer/oxlint-config"
import base from "@isomer/oxlint-config/base"
import {
  antiSlop,
  core,
  jsPluginSettings,
  react,
  reactDoctor,
  reactDoctorJsPluginEntries,
} from "@isomer/oxlint-config/presets"

export default defineConfig({
  extends: [base, core, react, reactDoctor, antiSlop],
  settings: jsPluginSettings,
  jsPlugins: [...reactDoctorJsPluginEntries, ...(antiSlop.jsPlugins ?? [])],
  ignorePatterns: [
    "dist",
    "**/*.config.*",
    "!.storybook",
    "public/mockServiceWorker.js",
  ],
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
        "unicorn/filename-case": [
          "error",
          {
            cases: {
              camelCase: true,
              pascalCase: true,
            },
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
        "eslint/prefer-arrow-callback": "off",
        "no-unused-vars": "warn",
      },
      globals: {
        React: "writable",
      },
      plugins: ["react", "typescript"],
    },
    {
      files: ["src/presets/**/*.ts"],
      rules: {
        "eslint/sort-keys": "off",
      },
    },
    {
      files: [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/__tests__/**",
      ],
      rules: {
        "eslint/no-plusplus": "off",
        "eslint/no-shadow": "off",
        "eslint/no-use-before-define": "off",
        "eslint/sort-keys": "off",
        "unicorn/consistent-function-scoping": "off",
      },
    },
    {
      files: [
        "**/*.stories.ts",
        "**/*.stories.tsx",
        "**/*.stories.js",
        "**/*.stories.jsx",
        "**/*.stories.mjs",
        "**/*.stories.cjs",
        "**/*.story.ts",
        "**/*.story.tsx",
        "**/*.story.js",
        "**/*.story.jsx",
        "**/*.story.mjs",
        "**/*.story.cjs",
      ],
      rules: {
        "eslint/prefer-destructuring": "off",
        "eslint/no-shadow": "off",
        "eslint/sort-keys": "off",
        "promise/avoid-new": "off",
        "react-hooks/rules-of-hooks": "off",
        "import/no-anonymous-default-export": "off",
        "storybook/await-interactions": "error",
        "storybook/context-in-play-function": "error",
        "storybook/default-exports": "error",
        "storybook/hierarchy-separator": "warn",
        "storybook/no-redundant-story-name": "warn",
        "storybook/no-renderer-packages": "error",
        "storybook/prefer-pascal-case": "warn",
        "storybook/story-exports": "error",
        "storybook/use-storybook-expect": "error",
        "storybook/use-storybook-testing-library": "error",
      },
      jsPlugins: ["eslint-plugin-storybook"],
      plugins: ["react", "import"],
    },
    {
      files: [
        ".storybook/main.js",
        ".storybook/main.cjs",
        ".storybook/main.mjs",
        ".storybook/main.ts",
      ],
      rules: {
        "storybook/no-uninstalled-addons": "error",
      },
      jsPlugins: ["eslint-plugin-storybook"],
    },
  ],
})
