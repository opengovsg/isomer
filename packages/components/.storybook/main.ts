import type { StorybookConfig } from "@storybook/react-vite"

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.tsx"],

  addons: [
    "@storybook/addon-links",
    "@storybook/addon-themes",
    "@storybook/addon-a11y",
    "storybook-addon-pseudo-states",
    "@storybook/addon-docs",
    "@storybook/addon-mcp",
  ],

  framework: {
    name: "@storybook/react-vite",
    options: {},
  },

  features: {
    componentsManifest: true,
  },

  staticDirs: ["../public", "./assets"],

  typescript: {
    check: false,
    reactDocgen: "react-docgen-typescript",
  },
}

export default config
