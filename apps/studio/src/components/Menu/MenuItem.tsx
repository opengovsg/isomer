import type { MenuItemProps as ChakraMenuItemProps } from "@chakra-ui/react"
import { MenuItem as ChakraMenuItem, cssVar, Tooltip } from "@chakra-ui/react"
import { useMemo } from "react"

const $bg = cssVar("menu-bg")

interface MenuItemProps extends ChakraMenuItemProps {
  colorScheme?: "critical"
  tooltip?: string
}

export const MenuItem = ({
  colorScheme,
  tooltip,
  ...menuItemProps
}: MenuItemProps): React.ReactNode => {
  // Unable to use useMultiStyleConfig here because Menu parent still controls
  // other styles such as size and placement
  const extraStyles = useMemo(() => {
    if (!colorScheme) {
      return {}
    }
    return {
      _active: {
        [$bg.variable]: `colors.interaction.muted.critical.active`,
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
      _hover: {
        [$bg.variable]: `colors.interaction.muted.critical.hover`,
      },
      bg: $bg.reference,
      color: "interaction.critical.default",
    }
  }, [colorScheme])

  const menuItem = <ChakraMenuItem {...menuItemProps} sx={extraStyles} />

  return tooltip ? (
    <Tooltip label={tooltip} placement="right">
      {menuItem}
    </Tooltip>
  ) : (
    menuItem
  )
}
