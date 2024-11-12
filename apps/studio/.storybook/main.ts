import { dirname, join } from "path"
import type { StorybookConfig } from "@storybook/nextjs"
import webpack from "webpack"

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],

  addons: [
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-interactions"),
    getAbsolutePath("@storybook/addon-themes"),
    getAbsolutePath("@storybook/addon-a11y"),
  ],

  framework: {
    name: getAbsolutePath("@storybook/nextjs"),
    options: {},
  },

  docs: {},

  staticDirs: ["../public"],

  core: {
    disableTelemetry: true,
  },

  // https://github.com/vercel/next.js/issues/28774#issuecomment-1264555395
  webpack: (config) => {
    config.plugins?.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, "")
      }),
    )
    return config
  },

  env: (config) => ({
    ...config,
    SKIP_ENV_VALIDATION: "true",
    // eslint-disable-next-line no-restricted-properties
    STORYBOOK_ENVIRONMENT: JSON.stringify(process.env),
  }),

  typescript: {
    check: false,
    skipCompiler: false,
    reactDocgen: "react-docgen-typescript",
  },
}
export default config

function getAbsolutePath(value: string) {
  return dirname(require.resolve(join(value, "package.json")))
}
