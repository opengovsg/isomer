import { useMemo } from "react"
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

export type ViewportOptions = "desktop" | "mobile" | "tablet" | "responsive"

interface IframeToolbarProps {
  viewport: ViewportOptions
  setViewport: (viewport: ViewportOptions) => void
}

export const IframeToolbar = ({
  viewport,
  setViewport,
}: IframeToolbarProps): JSX.Element => {
  const viewportLabel = useMemo(() => {
    switch (viewport) {
      case "desktop":
        return "(Desktop)"
      case "mobile":
        return "(Mobile)"
      case "tablet":
        return "(Tablet)"
      default:
        return null
    }
  }, [viewport])

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
                viewport !== "responsive"
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
                value={viewport}
                title="Viewport"
                type="radio"
                onChange={(nextValue) =>
                  setViewport(nextValue as ViewportOptions)
                }
              >
                <MenuItemOption value="responsive">Responsive</MenuItemOption>
                <MenuItemOption value="desktop">Desktop</MenuItemOption>
                <MenuItemOption value="tablet">Tablet</MenuItemOption>
                <MenuItemOption value="mobile">Mobile</MenuItemOption>
              </MenuOptionGroup>
            </Menu.List>
          </Portal>
        </Menu>
      </ToolbarGroup>
    </Toolbar>
  )
}
