import type { Selection } from "react-aria-components"
import { Flex, Icon, Text } from "@chakra-ui/react"
import {
  Button,
  Menu,
  MenuItem,
  MenuSection,
  MenuTrigger,
} from "@opengovsg/oui"
import { useMemo } from "react"
import { BiChevronDown, BiShow, BiX } from "react-icons/bi"

export type ViewportOptions = "mobile" | "tablet" | "responsive" | "fullscreen"

const VIEWPORT_MENU_OPTIONS: {
  id: ViewportOptions
  title: string
  description: string
}[] = [
  {
    id: "responsive",
    title: "Fit to screen (default)",
    description: "Editing mode",
  },
  {
    id: "fullscreen",
    title: "Full screen",
    description: "View this page in full-screen mode",
  },
  {
    id: "tablet",
    title: "Tablet",
    description: "View how page would look like on a tablet screen",
  },
  {
    id: "mobile",
    title: "Mobile",
    description: "View how page would look like on a mobile screen",
  },
]

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
          onPress={() => setViewport("responsive")}
          variant="outline"
          color="neutral"
          size="xs"
          startContent={<BiX fontSize="1.25rem" />}
        >
          Back to editing
        </Button>
      ) : (
        <MenuTrigger>
          <Button
            variant="clear"
            size="xs"
            className="h-6 min-h-0 min-w-0 p-0"
            endContent={
              <BiChevronDown className="size-5 transition-transform group-aria-expanded:rotate-180" />
            }
          >
            {toolbarTextLabels.viewport}
          </Button>
          <Menu size="sm">
            <MenuSection
              aria-label="Preview mode"
              selectionMode="single"
              selectedKeys={new Set([viewport])}
              onSelectionChange={(keys) => {
                if (keys === "all") return
                const next = [...keys][0]
                if (next) setViewport(next as ViewportOptions)
              }}
            >
              {VIEWPORT_MENU_OPTIONS.map(({ id, title, description }) => (
                <MenuItem
                  key={id}
                  id={id}
                  textValue={title}
                  classNames={{
                    label: "flex flex-col items-start gap-0.5 line-clamp-none",
                  }}
                >
                  <span className="prose-body-1 text-base-content-strong">
                    {title}
                  </span>
                  <span className="prose-body-2 text-base-content-medium">
                    {description}
                  </span>
                </MenuItem>
              ))}
            </MenuSection>
          </Menu>
        </MenuTrigger>
      )}
    </Flex>
  )
}
