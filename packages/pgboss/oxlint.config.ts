import { defineConfig } from "oxlint"

import base from "@isomer/oxlint-config/base"
import { vitest } from "@isomer/oxlint-config/presets"

export default defineConfig({
  extends: [base, vitest],
})
