import type { StorybookConfig } from "@storybook/react-vite"

const config: StorybookConfig = {
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-themes",
    "@storybook/addon-a11y",
    "storybook-addon-pseudo-states",
    "@storybook/addon-docs",
  ],

  framework: {
    name: "@storybook/react-vite",
    options: {},
  },

  staticDirs: ["../public", "./assets"],

  stories: ["../src/**/*.stories.tsx"],
}

export default config
