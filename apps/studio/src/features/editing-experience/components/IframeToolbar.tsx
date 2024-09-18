import { useMemo, useState } from "react"
import {
  MenuButton,
  MenuItemOption,
  MenuOptionGroup,
  Portal,
  Spacer,
} from "@chakra-ui/react"
import {
  Button,
  Menu,
  Toolbar,
  ToolbarGroup,
  TouchableTooltip,
} from "@opengovsg/design-system-react"
import { RxDimensions } from "react-icons/rx"

type ViewportOptions = "desktop" | "mobile" | "tablet" | "unset"

export const IframeToolbar = (): JSX.Element => {
  const [selectedViewport, setSelectedViewport] =
    useState<ViewportOptions>("unset")

  const viewportLabel = useMemo(() => {
    switch (selectedViewport) {
      case "desktop":
        return "(Desktop)"
      case "mobile":
        return "(Mobile)"
      case "tablet":
        return "(Tablet)"
      default:
        return null
    }
  }, [selectedViewport])

  return (
    <Toolbar size="xs" px="2rem">
      <Spacer />
      <ToolbarGroup>
        <Menu size="sm" placement="bottom-end">
          <TouchableTooltip label="Change preview viewport">
            <MenuButton
              as={Button}
              leftIcon={<RxDimensions size="1rem" />}
              variant="clear"
              size="xs"
              colorScheme="inverse"
              bg={
                selectedViewport !== "unset"
                  ? "interaction.tinted.inverse.active"
                  : undefined
              }
              layerStyle="focusRing.inverse"
              iconSpacing={viewportLabel ? undefined : 0}
            >
              {viewportLabel}
            </MenuButton>
          </TouchableTooltip>
          <Portal>
            <Menu.List>
              <MenuOptionGroup
                value={selectedViewport}
                title="Viewport"
                type="radio"
                onChange={(nextValue) =>
                  setSelectedViewport(nextValue as ViewportOptions)
                }
              >
                <MenuItemOption value="unset">Unset</MenuItemOption>
                <MenuItemOption value="desktop">Desktop</MenuItemOption>
                <MenuItemOption value="mobile">Mobile</MenuItemOption>
              </MenuOptionGroup>
            </Menu.List>
          </Portal>
        </Menu>
      </ToolbarGroup>
    </Toolbar>
  )
}
