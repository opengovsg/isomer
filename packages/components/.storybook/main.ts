import type { StorybookConfig } from "@storybook/react-vite"

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.tsx"],

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
}

export default config
