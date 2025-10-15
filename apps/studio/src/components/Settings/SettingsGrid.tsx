import type { GridProps } from "@chakra-ui/react"
import { Grid } from "@chakra-ui/react"

export const SettingsGrid = (props: GridProps) => {
  return (
    <Grid
      h="full"
      w="100%"
      templateColumns="minmax(auto, 1fr) minmax(23rem, 2fr)"
      gap={0}
      {...props}
    />
  )
}
