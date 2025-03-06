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
import { removeUserModalAtom, updateUserModalAtom } from "../../atoms"

interface UserTableMenuProps extends Pick<UserTableProps, "siteId"> {
  userId: UserTableData["id"]
  userName: UserTableData["name"]
  email: UserTableData["email"]
  role: UserTableData["role"]
}

export const UserTableMenu = ({
  siteId,
  userId,
  userName,
  email,
  role,
}: UserTableMenuProps) => {
  const ability = useContext(UserManagementContext)

  const setRemoveUserModalState = useSetAtom(removeUserModalAtom)
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
                onClick={() =>
                  setUpdateUserModalState({ siteId, userId, email, role })
                }
                icon={<BiPencil fontSize="1rem" />}
                aria-label={`Edit user ${userName}`}
              >
                Edit user
              </MenuItem>
              <MenuItem
                onClick={() => setRemoveUserModalState({ siteId, userId })}
                colorScheme="critical"
                icon={<BiTrash fontSize="1rem" />}
                aria-label={`Remove user access for ${userName}`}
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
