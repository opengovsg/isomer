import { useContext } from "react"
import {
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  Portal,
} from "@chakra-ui/react"
import { useSetAtom } from "jotai"
import { BiDotsVerticalRounded, BiPencil, BiTrash } from "react-icons/bi"

import type { UserTableData } from "./types"
import type { UserTableProps } from "./UserTable"
import { MenuItem } from "~/components/Menu"
import { UserManagementContext } from "~/features/users"
import { updateUserModalAtom } from "../../atom"

interface UserTableMenuProps extends Pick<UserTableProps, "siteId"> {
  userId: UserTableData["id"]
  userName: UserTableData["name"]
}

export const UserTableMenu = ({
  siteId,
  userId,
  userName,
}: UserTableMenuProps) => {
  const ability = useContext(UserManagementContext)

  const setUpdateUserModalState = useSetAtom(updateUserModalAtom)

  return (
    <Menu isLazy size="sm">
      <MenuButton
        as={IconButton}
        colorScheme="neutral"
        icon={<BiDotsVerticalRounded />}
        variant="clear"
        aria-label={`Options for ${userName}`}
      />
      <Portal>
        <MenuList>
          {ability.can("manage", "UserManagement") && (
            <>
              <MenuItem
                onClick={() => setUpdateUserModalState({ userId })}
                icon={<BiPencil fontSize="1rem" />}
                aria-label={`Edit user ${userName}`}
              >
                Edit user
              </MenuItem>
              <MenuItem
                onClick={() => {
                  console.log(`TODO: Remove user access: ${userId} ${siteId}`)
                }}
                colorScheme="critical"
                icon={<BiTrash fontSize="1rem" />}
              >
                Remove user access
              </MenuItem>
            </>
          )}
        </MenuList>
      </Portal>
    </Menu>
  )
}
