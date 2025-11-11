import type { GridItemProps } from "@chakra-ui/react"
import { GridItem } from "@chakra-ui/react"

export const SettingsEditorGridItem = (props: GridItemProps) => {
  return <GridItem colSpan={1} overflow="auto" minW="30rem" {...props} />
}
