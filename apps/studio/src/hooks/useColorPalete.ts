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

export const useColorPalette = (r: number, g: number, b: number) => {
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

  return { tints: tints.reverse(), colour: rgbToHex(r, g, b), shades }
}
