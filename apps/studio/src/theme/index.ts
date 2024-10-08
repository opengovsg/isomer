import { extendTheme } from "@chakra-ui/react"
import { theme as ogpDsTheme } from "@opengovsg/design-system-react"

import { components } from "./components"
import { colours } from "./foundations/colours"
import { shadows } from "./foundations/shadows"
import { textStyles } from "./foundations/textStyles"
import { layerStyles } from "./layerStyles"

export const theme = extendTheme(ogpDsTheme, {
  shadows,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  components: {
    ...ogpDsTheme.components,
    ...components,
  },
  colors: colours,
  textStyles,
  layerStyles,
  styles: {
    global: {
      // Removes the unnecessary default overflow hidden setting on Collapse components
      // (used in Accordion too)
      '.chakra-collapse[style*="height: auto"]': {
        overflow: "initial !important",
      },
    },
  },
})
