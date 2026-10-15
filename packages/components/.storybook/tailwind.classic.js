import { createThemePreset } from "../src/presets/theme"
import config from "../tailwind.config"

export default {
  ...config,
  theme: {},
  presets: [createThemePreset("isomer-classic")],
}
