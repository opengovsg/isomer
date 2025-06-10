import type { StorybookConfig } from "@storybook/react-vite"
import { mergeConfig } from "vite"

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.tsx"],
  addons: ["@storybook/addon-themes", "storybook-addon-pseudo-states"],
  viteFinal(config) {
    // Merge custom configuration into the default config
    return mergeConfig(config, {
      // Add dependencies to pre-optimization
      optimizeDeps: {
        include: ["storybook-dark-mode"],
      },
    })
  },

  framework: {
    name: "@storybook/react-vite",
    options: {},
  },

  staticDirs: ["../public", "./assets"],
}

export default config
