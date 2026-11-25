import type { StorybookConfig } from "@storybook/nextjs-vite"

// Only public values may reach the browser bundle.
const publicEnv = Object.fromEntries(
  Object.entries(process.env).filter(
    (entry): entry is [string, string] =>
      entry[0].startsWith("NEXT_PUBLIC_") && entry[1] !== undefined,
  ),
)

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],

  addons: [
    "@storybook/addon-links",
    "@storybook/addon-themes",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-vitest",
  ],

  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
  },

  docs: {},

  staticDirs: ["../public", "./assets"],

  core: {
    disableTelemetry: true,
  },

  env: (config) => ({
    ...config,
    SKIP_ENV_VALIDATION: "true",
    STORYBOOK_ENVIRONMENT: JSON.stringify(publicEnv),
  }),

  typescript: {
    check: false,
    reactDocgen: "react-docgen-typescript",
  },

  // The Vite builder only exposes STORYBOOK_-prefixed `env` values to the
  // preview, so define the browser-safe environment src/env.mjs reads from
  // `process.env` ourselves: the Storybook flag and payload it keys off, plus
  // the public NEXT_PUBLIC_* values (which Next would otherwise inline).
  viteFinal: (config) => ({
    ...config,
    define: {
      ...config.define,
      ...Object.fromEntries(
        Object.entries({
          ...publicEnv,
          SKIP_ENV_VALIDATION: "true",
          STORYBOOK: "true",
          STORYBOOK_ENVIRONMENT: JSON.stringify(publicEnv),
        }).map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)]),
      ),
    },
  }),
}
export default config
