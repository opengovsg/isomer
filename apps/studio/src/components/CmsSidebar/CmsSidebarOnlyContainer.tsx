import type { ReactElement, ReactNode } from "react"
import { Box, Grid, GridItem } from "@chakra-ui/react"

export interface CmsSidebarOnlyContainerProps {
  children: ReactNode
  sidebar: ReactElement
}

export function CmsSidebarOnlyContainer({
  children,
  sidebar,
}: CmsSidebarOnlyContainerProps) {
  return (
    <Grid
      templateAreas={`'sidebar main'`}
      templateColumns="auto 1fr"
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
          bg="utility.ui"
        >
          {sidebar}
        </Box>
      </GridItem>
      <GridItem as="main" area="main" overflow="hidden">
        {children}
      </GridItem>
    </Grid>
  )
}
