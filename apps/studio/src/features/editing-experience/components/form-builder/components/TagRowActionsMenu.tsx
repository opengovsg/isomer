import { Menu, MenuItem, MenuTrigger } from "@opengovsg/oui"
import { upperFirst } from "lodash-es"
import { BiDotsHorizontalRounded, BiTrash } from "react-icons/bi"
import { CRITICAL_MENU_ITEM_CLASSNAMES } from "~/components/Menu"
import { IconButton } from "~/components/oui-bridge/IconButton"

import { useFormBuilderBoundary } from "../hooks/useFormBuilderBoundary"

const ROW_ACTIONS_MENU_BUTTON_CLASS =
  "size-[2.125rem] min-h-[2.125rem] min-w-[2.125rem] p-1"

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
  const menuBoundary = useFormBuilderBoundary()
  return (
    <MenuTrigger>
      <IconButton
        icon={<BiDotsHorizontalRounded className="size-6" />}
        color="neutral"
        variant="clear"
        className={ROW_ACTIONS_MENU_BUTTON_CLASS}
        isDisabled={isDisabled}
        aria-label={`${upperFirst(noun)} ${index + 1} actions`}
        onClick={(e) => e.stopPropagation()}
      />
      <Menu {...menuBoundary}>
        <MenuItem
          classNames={CRITICAL_MENU_ITEM_CLASSNAMES}
          startContent={<BiTrash className="size-4" />}
          isDisabled={isDisabled}
          onAction={onDelete}
        >
          Delete {noun}
        </MenuItem>
      </Menu>
    </MenuTrigger>
  )
}
