import type { Config } from "tailwindcss"

import { getTheme, type IsomerTheme } from "../themes"
import { ClassicPreset } from "./classic"
import { createNextPreset } from "./next"
import { isomerSiteTheme } from "./next/site-theme"

/** Default branding for previews; site-specific colours override these variables. */
export const DEFAULT_BRAND_COLORS = {
  canvas: {
    default: "#e6ecef",
    alt: "#bfcfd7",
    backdrop: "#80a0af",
    inverse: "#00405f",
  },
  interaction: { default: "#00405f", hover: "#002e44", pressed: "#00283b" },
}

const presets: Record<IsomerTheme, typeof createNextPreset> = {
  "isomer-next": createNextPreset,
  "isomer-classic": () => ClassicPreset,
}

export function createThemePreset(
  theme: IsomerTheme,
  options: { includeFonts?: boolean } = {},
): Config {
  const preset = presets[getTheme(theme)](options)
  return {
    ...preset,
    plugins: [
      ...(preset.plugins ?? []),
      isomerSiteTheme({ colors: DEFAULT_BRAND_COLORS }),
    ],
  }
}
