import { useContext } from "react"
import {
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  Portal,
} from "@chakra-ui/react"
import { useSetAtom } from "jotai"
import {
  BiDotsVerticalRounded,
  BiMailSend,
  BiPencil,
  BiTrash,
} from "react-icons/bi"

import type { UserTableData } from "./types"
import type { UserTableProps } from "./UserTable"
import { MenuItem } from "~/components/Menu"
import { UserManagementContext } from "~/features/users"
import { removeUserModalAtom } from "../../atoms"
import { canResendInviteToUser } from "../../utils"

interface UserTableMenuProps
  extends Pick<UserTableProps, "siteId">,
    Pick<UserTableData, "createdAt" | "lastLoginAt"> {
  userId: UserTableData["id"]
  userName: UserTableData["name"]
}

export const UserTableMenu = ({
  siteId,
  userId,
  userName,
  createdAt,
  lastLoginAt,
}: UserTableMenuProps) => {
  const ability = useContext(UserManagementContext)

  const setRemoveUserModalState = useSetAtom(removeUserModalAtom)

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
                onClick={() => {
                  console.log(`TODO: Edit user: ${userId} ${siteId}`)
                }}
                icon={<BiPencil fontSize="1rem" />}
              >
                Edit user
              </MenuItem>
              {canResendInviteToUser({ createdAt, lastLoginAt }) && (
                <MenuItem
                  onClick={() => {
                    console.log(`TODO: Resend invite: ${userId} ${siteId}`)
                  }}
                  icon={<BiMailSend fontSize="1rem" />}
                >
                  Resend invite
                </MenuItem>
              )}
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
