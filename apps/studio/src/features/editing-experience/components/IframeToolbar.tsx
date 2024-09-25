import { useMemo } from "react"
import {
  Box,
  Flex,
  Icon,
  MenuButton,
  MenuItemOption,
  MenuOptionGroup,
  Portal,
  Text,
} from "@chakra-ui/react"
import { Button, Menu } from "@opengovsg/design-system-react"
import { BiPencil, BiShow, BiX } from "react-icons/bi"

export type ViewportOptions = "mobile" | "tablet" | "responsive" | "fullscreen"

interface IframeToolbarProps {
  viewport: ViewportOptions
  setViewport: (viewport: ViewportOptions) => void
}

export const IframeToolbar = ({
  viewport,
  setViewport,
}: IframeToolbarProps): JSX.Element => {
  const toolbarTextLabels = useMemo(() => {
    switch (viewport) {
      case "mobile":
        return {
          mode: "You’re in editing mode.",
          caption:
            "Use the dropdown to see what the page might look like for various devices.",
          viewport: "Mobile",
        }
      case "tablet":
        return {
          mode: "You’re in editing mode.",
          caption:
            "Use the dropdown to see what the page might look like for various devices.",
          viewport: "Tablet",
        }
      case "responsive":
        return {
          mode: "You’re in editing mode.",
          caption:
            "Use the dropdown to see what the page might look like for various devices.",
          viewport: "Default mode",
        }
      case "fullscreen":
        return {
          mode: "You’re in full screen preview mode.",
          caption:
            "If you adjust the size of this browser, you can see what the page looks like in different sizes.",
          viewport: "Full screen",
        }
    }
  }, [viewport])

  return (
    <>
      <Flex
        bg="utility.feedback.info-subtle"
        py="0.5rem"
        px="1rem"
        align="center"
        justify="space-between"
        gap="1rem"
        flexWrap="wrap"
      >
        <Box color="base.content.brand">
          <Icon mr="0.25rem" aria-hidden as={BiShow} />
          <Text as="span" mr="0.5rem" textStyle="caption-1">
            {toolbarTextLabels.mode}
          </Text>
          <Text as="span" textStyle="caption-2">
            {toolbarTextLabels.caption}
          </Text>
        </Box>
        {viewport === "fullscreen" ? (
          <Button
            onClick={() => setViewport("responsive")}
            variant="outline"
            colorScheme="neutral"
            size="sm"
            leftIcon={<BiX fontSize="1.5rem" />}
          >
            Back to editing
          </Button>
        ) : (
          <Menu size="sm" placement="bottom-end">
            <MenuButton
              as={Button}
              leftIcon={<BiPencil size="1rem" />}
              variant="outline"
              size="xs"
            >
              {toolbarTextLabels.viewport}
            </MenuButton>
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
                  <MenuItemOption value="responsive">
                    <Text color="base.content.strong" textStyle="body-1">
                      Fit to screen (default)
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
    </>
  )
}
