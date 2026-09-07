import { defineConfig } from "@isomer/oxlint-config"
import antiSlop, {
  antiSlopJsPluginEntries,
} from "@isomer/oxlint-config/anti-slop"
import base from "@isomer/oxlint-config/base"
import { core, react } from "@isomer/oxlint-config/presets"
import reactDoctor, {
  jsPluginSettings,
  reactDoctorJsPluginEntries,
} from "@isomer/oxlint-config/react-doctor"

export default defineConfig({
  extends: [
    base,
    core,
    react,
    antiSlop,
    reactDoctor,
    // To enable this in following stacked PRs
    // next, vitest
  ],
  ignorePatterns: [
    ".next/**",
    "!.storybook/**",
    "./next-env.d.ts",
    "prisma/generated/prisma/**",
  ],
  jsPlugins: [
    ...(reactDoctorJsPluginEntries ?? []),
    ...(antiSlopJsPluginEntries ?? []),
  ],
  overrides: [
    {
      files: ["**/*.js", "**/*.mjs", "**/*.ts", "**/*.tsx"],
      globals: {
        React: "writable",
      },
      plugins: ["react", "nextjs", "node"],
      rules: {
        "react/react-in-jsx-scope": "off",
        // Suppressions are harmless until React Compiler is enabled.
        "react/rule-suppression": "off",
        // Chakra `role="group"` is required for `_groupHover` / `_groupChecked`.
        "jsx-a11y/prefer-tag-over-role": "off",
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
        "@next/next/google-font-display": "warn",
        "@next/next/google-font-preconnect": "warn",
        "@next/next/next-script-for-ga": "warn",
        "@next/next/no-async-client-component": "warn",
        "@next/next/no-before-interactive-script-outside-document": "warn",
        "@next/next/no-css-tags": "warn",
        "@next/next/no-head-element": "warn",
        "@next/next/no-html-link-for-pages": "error",
        "@next/next/no-img-element": "warn",
        "@next/next/no-page-custom-font": "warn",
        "@next/next/no-styled-jsx-in-document": "warn",
        "@next/next/no-sync-scripts": "error",
        "@next/next/no-title-in-document-head": "warn",
        "@next/next/no-typos": "warn",
        "@next/next/no-unwanted-polyfillio": "warn",
        "@next/next/inline-script-id": "error",
        "@next/next/no-assign-module-variable": "error",
        "@next/next/no-document-import-in-page": "error",
        "@next/next/no-duplicate-head": "error",
        "@next/next/no-head-import-in-document": "error",
        "@next/next/no-script-component-in-head": "error",
        "node/no-process-env": "error",
        "@typescript-eslint/no-unsafe-assignment": "warn",
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-unsafe-call": "warn",
        "@typescript-eslint/no-unsafe-member-access": "warn",
        "@typescript-eslint/no-unsafe-return": "warn",
        "@typescript-eslint/no-unsafe-argument": "warn",
        "@typescript-eslint/no-unnecessary-condition": "warn",
        "unicorn/filename-case": [
          "error",
          {
            cases: {
              camelCase: true,
              pascalCase: true,
            },
          },
        ],
        "eslint/prefer-arrow-callback": "off",
        "no-unused-vars": "warn",
        "no-restricted-imports": [
          "error",
          {
            paths: [
              {
                importNames: ["env"],
                message:
                  "Use `import { env } from '~/env'` instead to ensure validated types.",
                name: "process",
              },
              {
                importNames: ["useToast"],
                message:
                  "Please use useToast from @opengovsg/design-system-react instead.",
                name: "@chakra-ui/react",
              },
              {
                importNames: [
                  "FormLabel",
                  "FormErrorMessage",
                  "FormHelperText",
                ],
                message:
                  "Please use FormLabel, FormErrorMessage, and FormHelperText from @opengovsg/design-system-react instead.",
                name: "@chakra-ui/react",
              },
              {
                message:
                  "Use `~/lib/intercom` instead so calls fall back to a console.log when NEXT_PUBLIC_INTERCOM_APP_ID is absent (e.g. on staging).",
                name: "@intercom/messenger-js-sdk",
              },
            ],
          },
        ],
      },
    },
    {
      files: ["src/env.mjs"],
      plugins: ["node"],
      rules: {
        "anti-slop/no-shape-in-symbol-names": "off",
        "import/no-mutable-exports": "off",
        "node/no-process-env": "off",
      },
    },
    {
      files: ["src/schemas/**/*.ts"],
      rules: {
        "anti-slop/no-shape-in-symbol-names": "off",
      },
    },
    {
      files: ["tests/mocks/db.ts"],
      rules: {
        // Vitest setup must mock the DB singleton before app modules load.
        "anti-slop/no-module-mocking": "off",
      },
    },
    {
      files: [
        "src/features/settings/AuditLogExport/__tests__/auditSettingsPage.test.tsx",
        "src/features/settings/AuditLogExport/__tests__/AuditLogExportSection.test.tsx",
        "src/features/users/components/__tests__/ExportAccessLogsModal.test.tsx",
        "src/features/editing-experience/components/__tests__/PublishButton.browser.test.tsx",
        "src/features/editing-experience/__tests__/useContentEditSurvey.browser.test.tsx",
        "src/features/settings/Redirects/__tests__/RedirectsSettings.browser.test.tsx",
        "src/features/editing-experience/components/Drawer/__tests__/RootStateDrawer.browser.test.tsx",
        "src/server/modules/searchsg/__tests__/searchsg.service.test.ts",
        "src/server/modules/audit/__tests__/auditLogExport.dedupe.test.ts",
      ],
      rules: {
        // vi.mock is required for tRPC proxies, wretch, and partial DB stubs.
        "anti-slop/no-module-mocking": "off",
        "anti-slop/no-unknown-parameters": "off",
        "anti-slop/no-unknown-returns": "off",
        "anti-slop/require-safety-comment-for-type-assertion": "off",
        "anti-slop/no-unsafe-dictionary-type": "off",
        "anti-slop/no-known-value-widening": "off",
      },
    },
    {
      files: [
        "**/*.config.*",
        ".storybook/**",
        "oxlint.config.ts",
        "src/env.mjs",
        "tests/mocks/**",
        "tests/integration/**",
        "prisma/scripts/**",
      ],
      rules: {
        "eslint/sort-keys": "off",
      },
    },
    {
      files: ["tests/msw/**/*.ts"],
      rules: {
        "eslint/sort-keys": "off",
      },
    },
    {
      files: ["**/*.test.ts", "**/*.test.tsx", "**/__tests__/**"],
      rules: {
        "eslint/no-plusplus": "off",
        "eslint/no-shadow": "off",
        "eslint/no-use-before-define": "off",
        "eslint/sort-keys": "off",
        "unicorn/consistent-function-scoping": "off",
        "unicorn/no-array-for-each": "off",
      },
    },
    {
      files: [
        "playwright.config.ts",
        "vitest.config.ts",
        "tests/**/*.ts",
        "tests/**/*.tsx",
        ".storybook/**/*.ts",
        ".storybook/**/*.tsx",
        ".storybook/**/*.js",
        ".storybook/**/*.jsx",
      ],
      plugins: ["node"],
      rules: {
        "node/no-process-env": "off",
      },
    },
    {
      files: ["**/*.ts", "**/*.tsx"],
      plugins: ["typescript"],
      rules: {
        "@typescript-eslint/prefer-nullish-coalescing": [
          "error",
          {
            ignorePrimitives: true,
          },
        ],
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
      jsPlugins: ["eslint-plugin-storybook"],
      plugins: ["react", "import"],
      rules: {
        "eslint/no-shadow": "off",
        "eslint/prefer-destructuring": "off",
        "eslint/sort-keys": "off",
        "import/no-anonymous-default-export": "off",
        "promise/avoid-new": "off",
        "react-hooks/rules-of-hooks": "off",
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
    },
    {
      files: [
        ".storybook/main.js",
        ".storybook/main.cjs",
        ".storybook/main.mjs",
        ".storybook/main.ts",
      ],
      jsPlugins: ["eslint-plugin-storybook"],
      rules: {
        "storybook/no-uninstalled-addons": "error",
      },
    },
  ],
  settings: jsPluginSettings,
})
