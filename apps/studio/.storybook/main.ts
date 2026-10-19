import type { StorybookConfig } from "@storybook/nextjs-vite"

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
    reactDocgen: "react-docgen-typescript",
  },

  // The Vite builder only exposes STORYBOOK_-prefixed `env` values to the
  // preview, so src/env.mjs would otherwise validate the missing NEXT_PUBLIC_*
  // vars and throw on load. The preview supplies its own env (see preview.tsx).
  viteFinal: (config) => ({
    ...config,
    define: {
      ...config.define,
      "process.env.SKIP_ENV_VALIDATION": JSON.stringify("true"),
    },
  }),
}
export default config
