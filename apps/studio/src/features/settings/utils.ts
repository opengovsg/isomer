import { CSSProperties } from "react"
import { IsomerSiteThemeProps } from "@opengovsg/isomer-components"
import { flatten } from "flat"
import chunk from "lodash/chunk"

// NOTE: refer to this article for conversion from gamma compressed rgb values
// to a linear rgb scale
// Ref: https://en.wikipedia.org/wiki/Relative_luminance
const LINEAR_RGB_FACTORS = {
  red: 0.2126,
  green: 0.7152,
  blue: 0.0722,
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
    return Math.pow((value + 0.055) / 1.055, 2.4)
  }
}

export const calculateRelativeLuminance = (color: string) => {
  // NOTE: strip leading #
  const rgb = convertHexToRgb(color).map((value) => value / 255)
  const [r, g, b] = rgb.map((value) => normaliseRsRgb(value))

  if (!r || !g || !b) {
    return 0
  }

  return (
    LINEAR_RGB_FACTORS.red * r +
    LINEAR_RGB_FACTORS.green * g +
    LINEAR_RGB_FACTORS.blue * b
  )
}

export const generateTheme = ({
  tints: originalTints,
  colour,
  shades,
}: {
  tints: string[]
  colour: string
  shades: string[]
}) => {
  const tints = originalTints.reverse()

  // TODO: add in implementation
  return {
    "colors.brand.canvas.default": tints[2],
    "colors.brand.canvas.alt": tints[1],
    "colors.brand.canvas.backdrop": tints[0],
    "colors.brand.canvas.inverse": colour,
    "colors.brand.interaction.default": shades[0],
    "colors.brand.interaction.hover": shades[1],
    "colors.brand.interaction.pressed": shades[2],
  }
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
