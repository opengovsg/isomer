import { defineConfig } from "@isomer/oxlint-config"
import base from "@isomer/oxlint-config/base"
import { antiSlop, core } from "@isomer/oxlint-config/presets"
// import { vitest } from "@isomer/oxlint-config/presets"

export default defineConfig({
  extends: [
    base,
    core,
    antiSlop,
    // To enable this in following stacked PRs
    // vitest
  ],
  ignorePatterns: [...core.ignorePatterns, "dist", "**/*.config.*"],
})
