import type { Static } from "@sinclair/typebox"
import { CSSProperties } from "react"
import {
  IsomerSiteThemeProps,
  SiteThemeSchema,
} from "@opengovsg/isomer-components"
import { flatten } from "flat"
import chunk from "lodash/chunk"
import { Paths } from "type-fest"

const normalizeHex = (color: string): string => {
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

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export const generateTheme = ({
  tints: orignalTints,
  colour,
  shades,
}: {
  tints: string[]
  colour: string
  shades: string[]
}) => {
  const tints = orignalTints.reverse()

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
