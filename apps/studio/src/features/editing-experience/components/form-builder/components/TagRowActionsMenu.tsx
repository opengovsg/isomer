import { MenuButton, MenuList, Portal } from "@chakra-ui/react"
import { IconButton, Menu } from "@opengovsg/design-system-react"
import { upperFirst } from "lodash-es"
import { BiDotsHorizontalRounded, BiTrash } from "react-icons/bi"
import { MenuItem } from "~/components/Menu"

import { ROW_ACTION_ICON_BUTTON_PROPS } from "./constants"

const ROW_ACTIONS_MENU_BUTTON_PROPS = {
  ...ROW_ACTION_ICON_BUTTON_PROPS,
  colorScheme: "neutral",
} as const

interface TagRowActionsMenuProps {
  noun: string
  index: number
  isDisabled: boolean
  isDragDisabled?: boolean
  onDelete: () => void
}

export function TagRowActionsMenu({
  noun,
  index,
  isDisabled,
  isDragDisabled = false,
  onDelete,
}: TagRowActionsMenuProps) {
  return (
    <Menu isLazy>
      <MenuButton
        as={IconButton}
        icon={<BiDotsHorizontalRounded fontSize="1.5rem" />}
        {...ROW_ACTIONS_MENU_BUTTON_PROPS}
        color={isDragDisabled ? "interaction.support.disabled" : undefined}
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
