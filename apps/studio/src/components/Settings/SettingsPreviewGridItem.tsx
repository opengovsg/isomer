import { GridItem, GridItemProps } from "@chakra-ui/react"

export const SettingsPreviewGridItem = (props: GridItemProps) => {
  return <GridItem colSpan={1} overflowX="scroll" {...props} />
}
