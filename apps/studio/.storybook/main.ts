import { dirname, join } from "path"
import type { StorybookConfig } from "@storybook/nextjs"

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],

  addons: [getAbsolutePath("@storybook/addon-themes")],

  framework: {
    name: getAbsolutePath("@storybook/nextjs"),
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
