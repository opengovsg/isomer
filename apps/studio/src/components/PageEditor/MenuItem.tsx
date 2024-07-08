import { MouseEventHandler } from "react"
import { Divider, Icon, Tooltip } from "@chakra-ui/react"
import { IconButton } from "@opengovsg/design-system-react"
import { IconType } from "react-icons/lib"

interface MenuItemProps {
  icon?: IconType
  title?: string
  action?: MouseEventHandler<HTMLButtonElement>
  isActive?: null | (() => boolean)
  isRound?: boolean
  color?: string
  type?: string
}

export const MenuItem = ({
  icon,
  title,
  action,
  isRound,
  isActive = null,
  color = "",
  type = "item",
}: MenuItemProps) => (
  <Tooltip label={title || "divider"} hasArrow openDelay={500}>
    {type === "divider" ? (
      <IconButton
        _hover={{ bg: "transparent" }}
        _active={{ bg: "gray.200" }}
        bgColor="transparent"
        border="none"
        h="1.75rem"
        w="1rem"
        minH="1.75rem"
        minW="1rem"
        aria-label={title || "divider"}
        isRound={isRound}
      >
        <Divider
          orientation="vertical"
          border="px solid"
          borderColor="base.divider.strong"
          h="1.25rem"
        />
      </IconButton>
    ) : (
      <IconButton
        _hover={{ bg: "gray.100" }}
        _active={{ bg: "gray.200" }}
        onClick={action}
        bgColor={isActive && isActive() ? "gray.200" : "transparent"}
        border="none"
        h="1.75rem"
        w="1.75rem"
        minH="1.75rem"
        minW="1.75rem"
        p="0.25rem"
        aria-label={title || "divider"}
        isRound={isRound}
      >
        <Icon
          as={icon}
          fontSize="1.25rem"
          color={color || "base.content.medium"}
        />
      </IconButton>
    )}
  </Tooltip>
)
