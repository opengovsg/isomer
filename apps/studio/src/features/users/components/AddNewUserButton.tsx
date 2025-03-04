import { useContext } from "react"
import { Button, Tooltip } from "@chakra-ui/react"
import { useSetAtom } from "jotai"
import { BiPlus } from "react-icons/bi"

import { UserManagementContext } from "~/features/users"
import { addUserModalOpenAtom } from "~/features/users/atom"

export const AddNewUserButton = () => {
  const ability = useContext(UserManagementContext)
  const canManageUsers = ability.can("manage", "UserManagement")

  const setAddUserModalOpen = useSetAtom(addUserModalOpenAtom)

  const button = (
    <Button
      variant="solid"
      leftIcon={<BiPlus />}
      onClick={() => setAddUserModalOpen(true)}
      isDisabled={!canManageUsers}
    >
      Add new user
    </Button>
  )

  return canManageUsers ? (
    button
  ) : (
    <Tooltip label="Only admins can add users." placement="bottom">
      {button}
    </Tooltip>
  )
}
