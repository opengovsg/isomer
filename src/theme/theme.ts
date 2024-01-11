import { extendTheme } from "@chakra-ui/react"

import { breakpoints } from "./foundations/breakpoints"
import { colors } from "./foundations/colors"
import { textStyles } from "./textStyles"

export const theme = extendTheme({
  styles: {
    global: {
      body: {
        fontFeatureSettings: "'tnum' on, 'cv05' on",
      },
    },
  },
  breakpoints,
  colors,
  fonts: {
    heading:
      "Inter,Trebuchet MS,-apple-system,Arial,BlinkMacSystemFont,sans-serif",
    body: "Inter,Trebuchet MS,-apple-system,Arial,BlinkMacSystemFont,sans-serif",
    code: "IBM Plex Mono,Courier,Monaco,Courier New,monospace",
  },
  textStyles,
})
