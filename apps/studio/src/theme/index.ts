import { extendTheme } from "@chakra-ui/react"
import { theme as ogpDsTheme } from "@opengovsg/design-system-react"

import { components } from "./components"
import { colours } from "./foundations/colours"
import { shadows } from "./foundations/shadows"
import { textStyles } from "./foundations/textStyles"
import { layerStyles } from "./layerStyles"

export const theme = extendTheme(ogpDsTheme, {
  shadows,
  components: {
    ...ogpDsTheme.components,
    ...components,
  },
  colors: colours,
  textStyles,
  layerStyles,
})
