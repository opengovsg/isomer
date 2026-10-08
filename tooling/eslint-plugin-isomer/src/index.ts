import type { ESLint } from "eslint"

import oneHookPerFile from "./rules/one-hook-per-file.js"

const plugin: ESLint.Plugin = {
  meta: {
    name: "eslint-plugin-isomer",
    version: "0.1.0",
  },
  rules: {
    "one-hook-per-file": oneHookPerFile,
  },
}

export default plugin
