import type { IsomerSiteThemeProps } from "@opengovsg/isomer-components"
import type { CSSProperties } from "react"
import { flatten } from "flat"
import chunk from "lodash/chunk"
import twColors from "tailwindcss/colors"

// NOTE: refer to this article for conversion from gamma compressed rgb values
// to a linear rgb scale
// Ref: https://en.wikipedia.org/wiki/Relative_luminance
const LINEAR_RGB_FACTORS = {
  red: 0.2126,
  green: 0.7152,
  blue: 0.0722,
}

// NOTE: This is used to check relative contrast.
// Refer to https://www.notion.so/opengov/Internal-use-only-Updating-colours-on-your-Isomer-Next-site-15277dbba78880d798bce51ae626d6ae
// The dark colour there is twColors.gray["700"].
// This can also be referenced from
// /isomer/packages/components/src/presets/next/colors.ts
export const TEXT_COLOURS = {
  light: "#FFFFFF",
  dark: twColors.gray["700"],
} as const

export const BACKGROUND_COLOURS = {
  dark: [
    "colors.brand.canvas.inverse",
    "colors.brand.interaction.default",
    "colors.brand.interaction.hover",
    "colors.brand.interaction.pressed",
  ] as const,
  light: ["colors.brand.canvas.default", "colors.brand.canvas.alt"] as const,
}

export const normalizeHex = (color: string): string => {
  let normalizedColor = color
  if (normalizedColor.startsWith("#")) {
    normalizedColor = normalizedColor.slice(1)
  }

  if (normalizedColor.length === 3) {
    normalizedColor = normalizedColor
      .split("")
      .map((char) => char + char)
      .join("")
  }

  return normalizedColor.padStart(6, "0")
}

export const convertHexToRgb = (color: string): [number, number, number] => {
  const rgb = normalizeHex(color)
  return chunk(rgb, 2).map((hex) => parseInt(hex.join(""), 16)) as [
    number,
    number,
    number,
  ]
}

export const calculateRelativeContrast = (
  lum1: number,
  lum2: number,
): number => {
  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)

  return (lighter + 0.05) / (darker + 0.05)
}

const normaliseRsRgb = (value: number) => {
  if (value <= 0.03928) {
    return value / 12.92
  } else {
    return ((value + 0.055) / 1.055) ** 2.4
  }
}

export const calculateRelativeLuminance = (color: string) => {
  // NOTE: strip leading #
  const rgb = convertHexToRgb(color).map((value) => value / 255)
  const [r, g, b] = rgb.map((value) => normaliseRsRgb(value))

  return (
    LINEAR_RGB_FACTORS.red * (r ?? 0) +
    LINEAR_RGB_FACTORS.green * (g ?? 0) +
    LINEAR_RGB_FACTORS.blue * (b ?? 0)
  )
}

export interface Theme {
  "colors.brand.canvas.default": string
  "colors.brand.canvas.alt": string
  "colors.brand.canvas.inverse": string
  "colors.brand.interaction.default": string
  "colors.brand.interaction.hover": string
  "colors.brand.interaction.pressed": string
}

export const generateTheme = ({
  tints,
  colour,
  shades,
}: {
  tints: string[]
  colour: string
  shades: string[]
}) => {
  const simpleTheme = {
    // 90% tint
    "colors.brand.canvas.default": tints[0],
    // 50% tint
    "colors.brand.canvas.alt": tints[4],
    "colors.brand.canvas.inverse": colour,
    // 20% shade
    "colors.brand.interaction.default": shades[1],
    // 50% shade
    "colors.brand.interaction.hover": shades[4],
    // 70% shade
    "colors.brand.interaction.pressed": shades[6],
  } as Theme

  if (passesContrastCheck(simpleTheme)) return simpleTheme

  // NOTE: This is from light to dark
  const range = [...tints, colour, ...shades]
  const dark = pickColorsFromRange(range, TEXT_COLOURS.light, 4)
  const light = pickColorsFromRange(range.reverse(), TEXT_COLOURS.dark, 2)

  return {
    "colors.brand.canvas.default": light[0],
    "colors.brand.canvas.alt": light[1],
    "colors.brand.canvas.inverse": dark[3],
    "colors.brand.interaction.default": dark[2],
    "colors.brand.interaction.hover": dark[1],
    "colors.brand.interaction.pressed": dark[0],
  }
}

const pickColorsFromRange = (
  colors: string[],
  against: string,
  numToPick: number,
) => {
  const lumArr = colors.map((bgColor) => {
    const bgLuminance = calculateRelativeLuminance(bgColor)
    const textLuminance = calculateRelativeLuminance(against)
    return calculateRelativeContrast(textLuminance, bgLuminance)
  })

  const arr = lumArr.map((rel) => rel >= 4.5)

  // NOTE: pick `numToPick` colors from here in roughly equal intervals
  const firstPassingIndex = arr.findIndex((passes) => passes)
  const passableColorsLength = colors.length - firstPassingIndex + 1 // have to include color at `firstPassingIndex` also
  const interval = Math.floor(passableColorsLength / numToPick)
  const selected: string[] = []

  for (let i = colors.length - 1; i >= firstPassingIndex; i -= interval) {
    // NOTE: shouldn't happen - we are always within range
    // this is guaranteed by the loop condition
    // but we have a default to satisfy ts
    selected.push(colors[i] ?? "#FFFFFF")
  }

  return selected
}

export const convertThemeToCss = (theme: IsomerSiteThemeProps) => {
  const flattenedVars: Record<string, string> = flatten(
    { color: theme.colors },
    { delimiter: "-" },
  )

  return Object.entries(flattenedVars).reduce(
    (acc, [key, value]) => {
      acc[`--${key}`] = value
      return acc
    },
    {} as Record<string, string>,
  ) as CSSProperties
}

const PALETTE_SCALES = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1]

const toHexValue = (value: number) => {
  return Math.min(Math.max(Math.round(value), 0), 255)
    .toString(16)
    .padStart(2, "0")
}
const rgbToHex = (r: number, g: number, b: number) => {
  const rgb = [r, g, b]
  return `#${rgb.map(toHexValue).join("")}`
}

const tint = (value: number, scale: number) => {
  return Math.round(value + (255 - value) * scale)
}

const shade = (value: number, scale: number) => {
  return Math.round(value * scale)
}

export const generateColorPalette = (r: number, g: number, b: number) => {
  const tints = PALETTE_SCALES.map((scale) => {
    const red = tint(r, scale)
    const green = tint(g, scale)
    const blue = tint(b, scale)
    return rgbToHex(red, green, blue)
  })

  const shades = PALETTE_SCALES.map((scale) => {
    const red = shade(r, scale)
    const green = shade(g, scale)
    const blue = shade(b, scale)
    return rgbToHex(red, green, blue)
  })

  return { tints, colour: rgbToHex(r, g, b), shades }
}
export function passesContrastCheck(theme: Theme): boolean {
  const passesDarkContrastCheck = BACKGROUND_COLOURS.light
    .map((path) => {
      const bgColor = theme[path]
      const bgLuminance = calculateRelativeLuminance(bgColor)
      const textLuminance = calculateRelativeLuminance(TEXT_COLOURS.dark)
      const rel = calculateRelativeContrast(bgLuminance, textLuminance)
      return rel
    })
    .every((contrastRatio) => contrastRatio >= 4.5)

  const passesLightContrastCheck = BACKGROUND_COLOURS.dark
    .map((path) => {
      const bgColor = theme[path]
      const bgLuminance = calculateRelativeLuminance(bgColor)
      const textLuminance = calculateRelativeLuminance(TEXT_COLOURS.light)
      const rel = calculateRelativeContrast(textLuminance, bgLuminance)
      return rel
    })
    .every((contrastRatio) => contrastRatio >= 4.5)

  return passesDarkContrastCheck && passesLightContrastCheck
}

export const getPalette = (base: string) => {
  // NOTE: Tint is the colour brightened by 10% successively,
  // shades are the colour darkened by 10% successively
  const { tints, colour, shades } = generateColorPalette(
    ...convertHexToRgb(base),
  )

  return generateTheme({ tints, colour, shades })
}
