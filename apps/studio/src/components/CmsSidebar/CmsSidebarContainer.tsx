import type { ReactElement, ReactNode } from "react"
import { Box, Grid, GridItem } from "@chakra-ui/react"

export interface CmsSidebarContainerProps {
  children: ReactNode
  sidebar: ReactElement
  sidenav: ReactElement
}

export function CmsSidebarContainer({
  children,
  sidebar,
  sidenav,
}: CmsSidebarContainerProps) {
  return (
    <Grid
      templateAreas={`'sidebar sidenav main'`}
      templateColumns="auto 18.75rem 1fr"
      width="100%"
    >
      <GridItem area="sidebar" as="aside" w="full" p={0}>
        <Box
          pos="sticky"
          top={0}
          borderRight="1px solid"
          borderColor="base.divider.medium"
          py={{ base: 0, md: "0.75rem" }}
          px={{ base: 0, md: "0.5rem" }}
          height="100vh"
          overflow="auto"
          css={{
            "&::-webkit-scrollbar": {
              height: "var(--chakra-sizes-1)",
              width: "var(--chakra-sizes-1)",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "var(--chakra-colors-gray-400)",
            },
          }}
        >
          {sidebar}
        </Box>
      </GridItem>
      <GridItem as="aside" area="sidenav" overflow="hidden">
        <Box
          pos="sticky"
          top={0}
          borderRight="1px solid"
          borderColor="base.divider.medium"
          height="100vh"
          overflow="auto"
          css={{
            "&::-webkit-scrollbar": {
              height: "var(--chakra-sizes-1)",
              width: "var(--chakra-sizes-1)",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "var(--chakra-colors-gray-400)",
            },
          }}
        >
          {sidenav}
        </Box>
      </GridItem>
      <GridItem as="main" area="main" overflow="hidden">
        {children}
      </GridItem>
    </Grid>
  )
}
