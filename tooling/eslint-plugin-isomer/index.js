import oneHookPerFile from "./rules/one-hook-per-file.js"

/** @type {import("eslint").ESLint.Plugin} */
const plugin = {
  meta: {
    name: "eslint-plugin-isomer",
    version: "0.1.0",
  },
  rules: {
    "one-hook-per-file": oneHookPerFile,
  },
}

export default plugin
