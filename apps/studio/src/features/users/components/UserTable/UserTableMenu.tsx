import { useContext } from "react"
import {
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  Portal,
} from "@chakra-ui/react"
import { useToast } from "@opengovsg/design-system-react"
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
import { SINGPASS_DISABLED_ERROR_MESSAGE } from "~/constants/customErrorMessage"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { UserManagementContext } from "~/features/users"
import { useIsSingpassEnabledForCriticalActions } from "~/hooks/useIsSingpassEnabled"
import { trpc } from "~/utils/trpc"
import { removeUserModalAtom, updateUserModalAtom } from "../../atoms"
import { canResendInviteToUser } from "../../utils"

interface UserTableMenuProps
  extends Pick<UserTableProps, "siteId">,
    Pick<UserTableData, "createdAt" | "lastLoginAt" | "email" | "role"> {
  userId: UserTableData["id"]
  userName: UserTableData["name"]
}

export const UserTableMenu = ({
  siteId,
  userId,
  userName,
  email,
  role,
  createdAt,
  lastLoginAt,
}: UserTableMenuProps) => {
  const toast = useToast(BRIEF_TOAST_SETTINGS)

  const ability = useContext(UserManagementContext)

  const setUpdateUserModalState = useSetAtom(updateUserModalAtom)
  const setRemoveUserModalState = useSetAtom(removeUserModalAtom)

  const isSingpassEnabled = useIsSingpassEnabledForCriticalActions()

  const { mutate: resendInvite, isLoading: isResendingInvite } =
    trpc.user.resendInvite.useMutation({
      onSuccess: (result) => {
        toast({
          title: `Invite resent to ${result.email}`,
        })
      },
      onError: (err) => {
        toast({
          title: "Failed to resend invite",
          description: err.message,
        })
      },
    })

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
                isDisabled={!isSingpassEnabled}
                tooltip={
                  isSingpassEnabled
                    ? undefined
                    : SINGPASS_DISABLED_ERROR_MESSAGE
                }
              >
                Edit user
              </MenuItem>
              {canResendInviteToUser({ createdAt, lastLoginAt }) && (
                <MenuItem
                  onClick={() => resendInvite({ siteId, userId })}
                  isDisabled={isResendingInvite}
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
                isDisabled={!isSingpassEnabled}
                tooltip={
                  isSingpassEnabled
                    ? undefined
                    : SINGPASS_DISABLED_ERROR_MESSAGE
                }
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
