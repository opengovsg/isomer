import type { ButtonProps } from "@chakra-ui/react"
import { useContext } from "react"
import { Button, Tooltip } from "@chakra-ui/react"
import { BiPlus } from "react-icons/bi"

import { UserManagementContext } from "~/features/users"

interface AddNewUserButtonProps extends Omit<ButtonProps, "onClick"> {
  siteId: number
}

export const AddNewUserButton = ({
  siteId,
  ...buttonProps
}: AddNewUserButtonProps) => {
  const ability = useContext(UserManagementContext)
  const canManageUsers = ability.can("manage", "UserManagement")

  const button = (
    <Button
      variant="solid"
      leftIcon={<BiPlus />}
      onClick={() => console.log(`TODO: add new user for site ${siteId}`)}
      isDisabled={!canManageUsers}
      {...buttonProps}
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
