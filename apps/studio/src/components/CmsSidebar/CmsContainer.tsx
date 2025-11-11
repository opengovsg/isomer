import type { ReactElement, ReactNode } from "react"
import { Box, Grid, GridItem } from "@chakra-ui/react"

export interface CmsContainerProps {
  children: ReactNode
  sidebar: ReactElement
  header: ReactElement
  sidenav?: ReactElement
  variant?: "gsib" | "basic"
}

const getGridTemplateCols = (isGsibVariant: boolean, hasSideNav: boolean) => {
  if (isGsibVariant && hasSideNav) {
    return { base: "auto 14rem 1fr", "2xl": "auto 20rem 1fr" }
  }

  if (hasSideNav) {
    return "auto 18.75rem 1fr"
  }

  return "auto 1fr"
}

export function CmsContainer({
  children,
  sidebar,
  header,
  sidenav,
  variant,
}: CmsContainerProps) {
  const gridTemplateAreas = !!sidenav
    ? `'header header header'
      'sidebar sidenav main'`
    : `'header header'
      'sidebar main'`
  const gridTemplateColumns = getGridTemplateCols(variant === "gsib", !!sidenav)

  return (
    <Grid
      templateAreas={gridTemplateAreas}
      gridTemplateColumns={gridTemplateColumns}
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

      {!!sidenav && (
        <GridItem as="aside" area="sidenav" overflow="hidden">
          <Box
            height={0}
            minH="100%"
            bg="utility.ui"
            pos="sticky"
            top={0}
            borderRight="1px solid"
            borderTop="1px solid"
            borderColor="base.divider.medium"
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
      )}

      <GridItem as="main" area="main" overflow="hidden">
        <Box
          height={0}
          minH="100%"
          overflow="auto"
          borderTop="1px solid"
          borderColor="base.divider.medium"
        >
          {children}
        </Box>
      </GridItem>
    </Grid>
  )
}
