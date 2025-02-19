import type { ReactElement, ReactNode } from "react"
import { Box, Grid, GridItem } from "@chakra-ui/react"

export interface CmsSidebarContainerProps {
  children: ReactNode
  sidebar: ReactElement
  header: ReactElement
}

export function CmsSidebarContainer({
  children,
  sidebar,
  header,
}: CmsSidebarContainerProps) {
  return (
    <Grid
      templateAreas={`'header header'
                      'sidebar main'`}
      gridTemplateColumns="auto 1fr"
      gridTemplateRows="3.75rem 1fr"
      width="100%"
    >
      <GridItem area="header" as="header" w="full" p={0}>
        {header}
      </GridItem>
      <GridItem area="sidebar" as="aside" w="full" p={0}>
        <Box
          pos="sticky"
          top={0}
          borderRight="1px solid"
          borderTop="1px solid"
          borderColor="base.divider.medium"
          py={{ base: 0, md: "0.75rem" }}
          px={{ base: 0, md: "0.5rem" }}
          height={0}
          minH="100%"
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
          bg="utility.ui"
        >
          {sidebar}
        </Box>
      </GridItem>
      <GridItem as="main" area="main" overflow="hidden">
        <Box
          height={0}
          minH="100%"
          borderTop="1px solid"
          borderColor="base.divider.medium"
        >
          {children}
        </Box>
      </GridItem>
    </Grid>
  )
}
