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
    skipCompiler: false,
    reactDocgen: "react-docgen-typescript",
  },
}
export default config
