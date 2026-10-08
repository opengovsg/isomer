import { eslintCompatPlugin } from "@oxlint/plugins"

import { oneHookPerFileRule } from "./rules/one-hook-per-file.js"

export default eslintCompatPlugin({
  meta: { name: "isomer" },
  rules: {
    "one-hook-per-file": oneHookPerFileRule,
  },
})
