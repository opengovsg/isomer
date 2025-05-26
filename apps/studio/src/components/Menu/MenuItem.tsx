import type { MenuItemProps as ChakraMenuItemProps } from "@chakra-ui/react"
import { useMemo } from "react"
import { MenuItem as ChakraMenuItem, cssVar, Tooltip } from "@chakra-ui/react"

const $bg = cssVar("menu-bg")

export interface MenuItemProps extends ChakraMenuItemProps {
  colorScheme?: "critical"
  tooltip?: string
}

export const MenuItem = ({
  colorScheme,
  tooltip,
  ...menuItemProps
}: MenuItemProps): JSX.Element => {
  // Unable to use useMultiStyleConfig here because Menu parent still controls
  // other styles such as size and placement
  const extraStyles = useMemo(() => {
    if (!colorScheme) return {}
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
