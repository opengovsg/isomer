import type { GridItemProps } from "@chakra-ui/react"
import { GridItem } from "@chakra-ui/react"

export const SettingsPreviewGridItem = (props: GridItemProps) => (
  <GridItem colSpan={1} overflowX="scroll" {...props} />
)
