import chunk from "lodash/chunk"

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
  tints,
  colour,
  shades,
}: {
  tints: string[]
  colour: string
  shades: string[]
}) => {
  // TODO: add in implementation
  return [tints[2], tints[1], tints[0], colour, shades[0], shades[1], shades[2]]
}
