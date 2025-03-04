import { useContext } from "react"
import { Button, Tooltip } from "@chakra-ui/react"
import { BiPlus } from "react-icons/bi"

import { UserManagementContext } from "~/features/users"

export const AddNewUserButton = () => {
  const ability = useContext(UserManagementContext)
  const canManageUsers = ability.can("manage", "UserManagement")

  const button = (
    <Button
      variant="solid"
      leftIcon={<BiPlus />}
      onClick={() => console.log("TODO: add new user")}
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
