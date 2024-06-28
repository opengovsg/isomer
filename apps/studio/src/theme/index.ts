import { extendTheme } from '@chakra-ui/react'
import { theme as ogpDsTheme } from '@opengovsg/design-system-react'
import { colours } from './foundations/colours'
import { shadows } from './foundations/shadows'
import { layerStyles } from './layerStyles'
import { components } from './components'
import { textStyles } from './foundations/textStyles'

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
