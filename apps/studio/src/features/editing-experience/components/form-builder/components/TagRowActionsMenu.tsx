import { MenuButton, MenuList, Portal } from "@chakra-ui/react"
import { IconButton, Menu } from "@opengovsg/design-system-react"
import { upperFirst } from "lodash-es"
import { BiDotsHorizontalRounded, BiTrash } from "react-icons/bi"
import { MenuItem } from "~/components/Menu"

const ROW_ACTIONS_MENU_BUTTON_PROPS = {
  colorScheme: "neutral",
  variant: "clear",
  h: "2.125rem",
  w: "2.125rem",
  minH: "2.125rem",
  minW: "2.125rem",
  p: "0.25rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
} as const

interface TagRowActionsMenuProps {
  noun: string
  index: number
  isDisabled: boolean
  onDelete: () => void
}

export function TagRowActionsMenu({
  noun,
  index,
  isDisabled,
  onDelete,
}: TagRowActionsMenuProps) {
  return (
    <Menu isLazy>
      <MenuButton
        as={IconButton}
        icon={<BiDotsHorizontalRounded fontSize="1.5rem" />}
        {...ROW_ACTIONS_MENU_BUTTON_PROPS}
        isDisabled={isDisabled}
        aria-label={`${upperFirst(noun)} ${index + 1} actions`}
        onClick={(e) => e.stopPropagation()}
      />
      <Portal>
        <MenuList>
          <MenuItem
            colorScheme="critical"
            icon={<BiTrash fontSize="1rem" />}
            isDisabled={isDisabled}
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            Delete {noun}
          </MenuItem>
        </MenuList>
      </Portal>
    </Menu>
  )
}
