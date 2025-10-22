import { useMemo } from "react"
import {
  Flex,
  Icon,
  MenuItemOption,
  MenuOptionGroup,
  Portal,
  Text,
} from "@chakra-ui/react"
import { Button, Menu } from "@opengovsg/design-system-react"
import { BiShow, BiX } from "react-icons/bi"

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
          viewport: "Default mode",
        }
      case "fullscreen":
        return {
          mode: "Preview in different screen sizes before you publish",
          viewport: "Full screen",
        }
    }
  }, [viewport])

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
  )
}
