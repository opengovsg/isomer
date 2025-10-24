import type { GridProps } from "@chakra-ui/react"
import { Grid } from "@chakra-ui/react"

export const SettingsGrid = (props: GridProps) => {
  return (
    <Grid
      h="full"
      w="100%"
      templateColumns="minmax(auto, 2fr) minmax(23rem, 3fr)"
      gap={0}
      {...props}
    />
  )
}
