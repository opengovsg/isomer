import type { MenuItemProps as ChakraMenuItemProps } from "@chakra-ui/react"
import { useMemo } from "react"
import { MenuItem as ChakraMenuItem, cssVar } from "@chakra-ui/react"

const $bg = cssVar("menu-bg")

export interface MenuItemProps extends ChakraMenuItemProps {
  colorScheme?: "critical"
}

export const MenuItem = ({
  colorScheme,
  ...menuItemProps
}: MenuItemProps): JSX.Element => {
  // Unable to use useMultiStyleConfig here because Menu parent still controls
  // other styles such as size and placement
  const extraStyles = useMemo(() => {
    if (!colorScheme) return {}
    switch (colorScheme) {
      case "critical": {
        return {
          bg: $bg.reference,
          color: "interaction.critical.default",
          _hover: {
            [$bg.variable]: `colors.interaction.muted.critical.hover`,
          },
          _focus: {
            [$bg.variable]: `colors.interaction.muted.critical.hover`,
            _active: {
              [$bg.variable]: `colors.interaction.muted.critical.active`,
            },
          },
          _focusVisible: {
            _active: {
              [$bg.variable]: `colors.interaction.muted.critical.active`,
            },
          },
          _active: {
            [$bg.variable]: `colors.interaction.muted.critical.active`,
          },
        }
      }
    }
  }, [colorScheme])

  return <ChakraMenuItem {...menuItemProps} sx={extraStyles} />
}
