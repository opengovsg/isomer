import { extendTheme } from "@chakra-ui/react";
import { theme as ogpDsTheme } from "@opengovsg/design-system-react";

import { components } from "./components";
import { shadows } from "./foundations/shadows";
import { textStyles } from "./foundations/textStyles";
import { layerStyles } from "./layerStyles";

export const theme = extendTheme(ogpDsTheme, {
  shadows,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  components: {
    ...ogpDsTheme.components,
    ...components,
  },
  textStyles,
  layerStyles,
});
