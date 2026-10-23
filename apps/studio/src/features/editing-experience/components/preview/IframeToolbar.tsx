import {
  Flex,
  Icon,
  MenuItemOption,
  MenuOptionGroup,
  Portal,
  Text,
} from "@chakra-ui/react"
import { Button, Menu } from "@opengovsg/design-system-react"
import { useMemo } from "react"
import { BiShow, BiX } from "react-icons/bi"

export type ViewportOptions = "mobile" | "tablet" | "responsive" | "fullscreen"

interface IframeToolbarProps {
  viewport: ViewportOptions
  setViewport: (viewport: ViewportOptions) => void
  // Measured px width of the responsive preview pane, so the "Fit to screen"
  // label can name the device bucket it's actually simulating. 0 until measured.
  responsiveWidthPx?: number
}

export const IframeToolbar = ({
  viewport,
  setViewport,
  responsiveWidthPx = 0,
}: IframeToolbarProps): JSX.Element => {
  // Bucket the ACTUAL responsive-pane width (not the window) against the shared
  // md/lg breakpoints; defaults to desktop before the first measurement lands.
  const defaultModeDeviceLabel =
    responsiveWidthPx >= 1024
      ? "desktop"
      : responsiveWidthPx >= 768
        ? "tablet"
        : responsiveWidthPx > 0
          ? "mobile"
          : "desktop"

  const toolbarTextLabels = useMemo(() => {
    switch (viewport) {
      case "mobile":
        return {
          mode: "Preview in different screen sizes before you publish",
          viewport: "Mobile",
        }
      case "tablet":
        return {
          mode: "Preview in different screen sizes before you publish",
          viewport: "Tablet",
        }
      case "responsive":
        return {
          mode: "Preview in different screen sizes before you publish",
          viewport: `Fit to screen (${defaultModeDeviceLabel})`,
        }
      case "fullscreen":
        return {
          mode: "Preview in different screen sizes before you publish",
          viewport: "Full screen",
        }
    }
  }, [viewport, defaultModeDeviceLabel])

  const containerStyles = useMemo(() => {
    if (viewport === "fullscreen") {
      return {
        borderBottom: "1px solid",
        borderColor: "base.divider.medium",
      }
    }
    return {
      mx: "2rem",
      mt: "1rem",
      borderRadius: "8px",
      border: "1px solid",
      borderColor: "interaction.main-subtle.default",
    }
  }, [viewport])

  return (
    <Flex
      bg="utility.feedback.info-subtle"
      py="0.5rem"
      px="1rem"
      align="center"
      justify="space-between"
      columnGap="1rem"
      flexWrap="wrap"
      {...containerStyles}
    >
      <Flex flexWrap="wrap">
        <Flex>
          <Icon mr="0.25rem" aria-hidden as={BiShow} />
          <Text as="span" mr="0.5rem" textStyle="caption-1">
            {toolbarTextLabels.mode}
          </Text>
        </Flex>
      </Flex>
      {viewport === "fullscreen" ? (
        <Button
          onClick={() => setViewport("responsive")}
          variant="outline"
          colorScheme="neutral"
          size="xs"
          leftIcon={<BiX fontSize="1.25rem" />}
        >
          Back to editing
        </Button>
      ) : (
        <Menu size="sm" placement="bottom-end">
          <Menu.Button variant="clear" size="xs" p="0" minH="auto">
            {toolbarTextLabels.viewport}
          </Menu.Button>
          <Portal>
            <Menu.List>
              <MenuOptionGroup
                value={viewport}
                type="radio"
                onChange={(nextValue) =>
                  setViewport(nextValue as ViewportOptions)
                }
              >
                <MenuItemOption value="responsive">
                  <Text color="base.content.strong" textStyle="body-1">
                    Fit to screen ({defaultModeDeviceLabel})
                  </Text>
                  <Text color="base.content.medium" textStyle="body-2">
                    Editing mode
                  </Text>
                </MenuItemOption>
                <MenuItemOption value="fullscreen">
                  <Text color="base.content.strong" textStyle="body-1">
                    Full screen
                  </Text>
                  <Text color="base.content.medium" textStyle="body-2">
                    View this page in full-screen mode
                  </Text>
                </MenuItemOption>
                <MenuItemOption value="tablet">
                  <Text color="base.content.strong" textStyle="body-1">
                    Tablet
                  </Text>
                  <Text color="base.content.medium" textStyle="body-2">
                    View how page would look like on a tablet screen
                  </Text>
                </MenuItemOption>
                <MenuItemOption value="mobile">
                  <Text color="base.content.strong" textStyle="body-1">
                    Mobile
                  </Text>
                  <Text color="base.content.medium" textStyle="body-2">
                    View how page would look like on a mobile screen
                  </Text>
                </MenuItemOption>
              </MenuOptionGroup>
            </Menu.List>
          </Portal>
        </Menu>
      )}
    </Flex>
  )
}
