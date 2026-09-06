import type { OxlintConfig } from "oxlint"

const storyFiles = [
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
] as const

const storybookMainFiles = [
  ".storybook/main.js",
  ".storybook/main.cjs",
  ".storybook/main.mjs",
  ".storybook/main.ts",
] as const

/** Storybook recommended rules via eslint-plugin-storybook (Oxlint jsPlugins). */
export const storybookOverrides: NonNullable<OxlintConfig["overrides"]> = [
  {
    files: [...storyFiles],
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
    files: [...storybookMainFiles],
    rules: {
      "storybook/no-uninstalled-addons": "error",
    },
    jsPlugins: ["eslint-plugin-storybook"],
  },
]

/** Include `.storybook` when other ignore patterns exclude config files. */
export const storybookIgnorePattern = "!.storybook" as const

export const storybookIgnorePatternGlob = "!.storybook/**" as const
