import { defineConfig } from "@isomer/oxlint-config"
import base from "@isomer/oxlint-config/base"

export default defineConfig({
  extends: [base],
  ignorePatterns: ["dist", "**/*.config.*", "!.storybook"],
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
        // Base disables categories.correctness, so plugin rules must be listed explicitly.
        // TODO: Replace with categories.correctness once base stops setting correctness to "off".
        "jsx-a11y/alt-text": "error",
        "jsx-a11y/anchor-ambiguous-text": "error",
        "jsx-a11y/anchor-has-content": "error",
        "jsx-a11y/anchor-is-valid": "error",
        "jsx-a11y/aria-activedescendant-has-tabindex": "error",
        "jsx-a11y/aria-props": "error",
        "jsx-a11y/aria-proptypes": "error",
        "jsx-a11y/aria-role": "error",
        "jsx-a11y/aria-unsupported-elements": "error",
        "jsx-a11y/autocomplete-valid": "error",
        "jsx-a11y/click-events-have-key-events": "error",
        "jsx-a11y/control-has-associated-label": "error",
        "jsx-a11y/heading-has-content": "error",
        "jsx-a11y/html-has-lang": "error",
        "jsx-a11y/iframe-has-title": "error",
        "jsx-a11y/img-redundant-alt": "error",
        "jsx-a11y/interactive-supports-focus": "error",
        "jsx-a11y/label-has-associated-control": "error",
        "jsx-a11y/lang": "error",
        "jsx-a11y/media-has-caption": "error",
        "jsx-a11y/mouse-events-have-key-events": "error",
        "jsx-a11y/no-access-key": "error",
        "jsx-a11y/no-autofocus": "error",
        "jsx-a11y/no-distracting-elements": "error",
        "jsx-a11y/no-interactive-element-to-noninteractive-role": "error",
        "jsx-a11y/no-noninteractive-element-interactions": "error",
        "jsx-a11y/no-noninteractive-element-to-interactive-role": "error",
        "jsx-a11y/no-noninteractive-tabindex": "error",
        "jsx-a11y/no-redundant-roles": "error",
        "jsx-a11y/no-static-element-interactions": "error",
        "jsx-a11y/prefer-tag-over-role": "error",
        "jsx-a11y/role-has-required-aria-props": "error",
        "jsx-a11y/role-supports-aria-props": "error",
        "jsx-a11y/scope": "error",
        "jsx-a11y/tabindex-no-positive": "error",
      },
      globals: {
        React: "writable",
      },
      plugins: ["react", "typescript", "jsx-a11y"],
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
