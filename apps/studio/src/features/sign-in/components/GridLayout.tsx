import type { GridProps } from "@chakra-ui/react"
import { GridItem } from "@chakra-ui/react"
import { type FC, type PropsWithChildren } from "react"
import { AppGrid } from "~/templates/AppGrid"

// Component that controls the various grid areas according to responsive breakpoints.
export const BaseGridLayout = (props: GridProps) => (
  <AppGrid
    px={{ base: "1.5rem", md: "1.75rem", lg: "2rem" }}
    templateRows={{ base: "1fr auto", lg: "1fr auto" }}
    {...props}
  />
)

// Grid area styling for the login form.
export const LoginGridArea: FC<PropsWithChildren> = ({ children }) => (
  <GridItem
    gridColumn={{ base: "1 / 5", md: "2 / 12", lg: "8 / 12" }}
    py="2rem"
    display="flex"
    justifyContent="center"
    alignItems={{ lg: "center" }}
  >
    {children}
  </GridItem>
)

// Grid area styling for the footer.
export const FooterGridArea: FC<PropsWithChildren> = ({ children }) => (
  <GridItem
    gridColumn={{ base: "1 / 5", md: "2 / 12", lg: "8 / 12" }}
    py="4rem"
    display="flex"
    flexDir="column"
    alignItems={{ base: "center", lg: "flex-start" }}
    gap="1.5rem"
  >
    {children}
  </GridItem>
)

// Spotlight column. Spans both rows so the block sits in the vertical middle.
export const NonMobileSidebarGridArea: FC<PropsWithChildren> = ({
  children,
}) => (
  <GridItem
    display={{ base: "none", lg: "flex" }}
    gridColumn={{ lg: "1 / 7" }}
    gridRow={{ lg: "1 / 3" }}
    alignSelf="stretch"
    py="2.5rem"
    px="2.5rem"
    flexDir="column"
    alignItems="center"
    justifyContent="center"
    bg="base.canvas.brand-subtle"
    ml="-2rem"
  >
    {children}
  </GridItem>
)
