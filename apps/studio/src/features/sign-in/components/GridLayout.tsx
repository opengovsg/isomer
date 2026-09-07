import type { GridProps } from "@chakra-ui/react"
import type { FC, PropsWithChildren } from "react"
import { GridItem } from "@chakra-ui/react"
import { AppGrid } from "~/templates/AppGrid"

// Component that controls the various grid areas according to responsive breakpoints.
export const BaseGridLayout = (props: GridProps) => (
  <AppGrid
    px={{ base: "1.5rem", lg: "2rem", md: "1.75rem" }}
    templateRows={{ base: "1fr auto", lg: "1fr auto", md: "auto 1fr auto" }}
    {...props}
  />
)

// Grid area styling for the login form.
export const LoginGridArea: FC<PropsWithChildren> = ({ children }) => (
  <GridItem
    gridColumn={{ base: "1 / 5", lg: "8 / 12", md: "2 / 12" }}
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
    gridColumn={{ base: "1 / 5", lg: "8 / 12", md: "2 / 12" }}
    py="4rem"
    display="flex"
    justifyContent={{ base: "center", lg: "initial" }}
  >
    {children}
  </GridItem>
)

// Grid area styling for the left side of footer area that only displays on tablet and desktop breakpoints.
export const NonMobileFooterLeftGridArea: FC<PropsWithChildren> = ({
  children,
}) => (
  <GridItem
    ml={{ lg: "-2rem", md: "-1.75rem" }}
    mr={{ lg: 0, md: "-1.75rem" }}
    display={{ base: "none", md: "flex" }}
    gridColumn={{ lg: "1 / 7", md: "1 / 13" }}
    background="base.canvas.brand-subtle"
    flexDir="column"
    alignItems="center"
    justifyContent="center"
  >
    {children}
  </GridItem>
)

// Grid area styling for the left sidebar that only displays on tablet and desktop breakpoints.
export const NonMobileSidebarGridArea: FC<PropsWithChildren> = ({
  children,
}) => (
  <GridItem
    display={{ base: "none", md: "flex" }}
    gridColumn={{ lg: "1 / 7", md: "1 / 13" }}
    h={{ lg: "auto", md: "9.5rem" }}
    py="1rem"
    flexDir="column"
    alignItems="center"
    justifyContent="center"
    bg="base.canvas.brand-subtle"
    ml={{ lg: "-2rem", md: "-1.75rem" }}
    mr={{ lg: 0, md: "-1.75rem" }}
  >
    {children}
  </GridItem>
)
