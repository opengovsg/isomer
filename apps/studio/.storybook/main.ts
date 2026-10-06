import type { StorybookConfig } from "@storybook/nextjs-vite"
import type { Alias, Plugin } from "vite"

// Next's Storybook Vite plugin aliases react and react-dom to
// next/dist/compiled/react*, which is React 19. The app is React 18 because
// react-input-mask (used by the OGP design system) calls findDOMNode, removed
// in React 19. Drop those aliases so the preview resolves the app's React.
// Ref: https://github.com/storybookjs/storybook/issues/30646
const NEXT_COMPILED_REACT =
  /[/\\]next[/\\]dist[/\\]compiled[/\\]react(?:[/\\-]|$)/

function isAlias(entry: unknown): entry is Alias {
  return (
    typeof entry === "object" &&
    entry !== null &&
    "find" in entry &&
    "replacement" in entry
  )
}

function preferAppReactPlugin(): Plugin {
  return {
    name: "storybook-prefer-app-react",
    enforce: "post",
    config(config) {
      const alias = config.resolve?.alias
      if (!Array.isArray(alias) || !config.resolve) return

      config.resolve.alias = alias.filter(
        (entry) =>
          !isAlias(entry) || !NEXT_COMPILED_REACT.test(entry.replacement),
      )
    },
  }
}

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],

  addons: [
    "@storybook/addon-links",
    "@storybook/addon-themes",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
  ],

  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
  },

  docs: {},

  staticDirs: ["../public"],

  core: {
    disableTelemetry: true,
  },

  env: (config) => ({
    ...config,
    SKIP_ENV_VALIDATION: "true",
    STORYBOOK_ENVIRONMENT: JSON.stringify(process.env),
  }),

  typescript: {
    check: false,
    skipCompiler: false,
    reactDocgen: "react-docgen-typescript",
  },

  viteFinal: (config) => {
    config.plugins = [...(config.plugins ?? []), preferAppReactPlugin()]
    return config
  },
}
export default config
