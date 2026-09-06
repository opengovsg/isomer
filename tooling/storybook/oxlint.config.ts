import { defineConfig } from "@isomer/oxlint-config"
import base from "@isomer/oxlint-config/base"
import { antiSlop, core } from "@isomer/oxlint-config/presets"

export default defineConfig({
  extends: [base, core, antiSlop],
  ignorePatterns: [...core.ignorePatterns, "dist", "**/*.config.*"],
})
