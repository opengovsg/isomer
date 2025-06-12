import type { ButtonProps } from "@chakra-ui/react"
import { useContext } from "react"
import { Button, Tooltip } from "@chakra-ui/react"
import { useSetAtom } from "jotai"
import { BiPlus } from "react-icons/bi"

import { UserManagementContext } from "~/features/users"
import {
  addUserModalAtom,
  DEFAULT_ADD_USER_MODAL_STATE,
} from "~/features/users/atoms"
import { useIsSingpassEnabled } from "~/hooks/useIsSingpassEnabled"
import { SingpassConditionalTooltip } from "./SingpassConditionalTooltip"

interface AddNewUserButtonProps extends Omit<ButtonProps, "onClick"> {
  siteId: number
}

export const AddNewUserButton = ({
  siteId,
  ...buttonProps
}: AddNewUserButtonProps) => {
  const ability = useContext(UserManagementContext)
  const canManageUsers = ability.can("manage", "UserManagement")

  const isSingpassEnabled = useIsSingpassEnabled()

  const setAddUserModalState = useSetAtom(addUserModalAtom)

  const isButtonDisabled = !canManageUsers || !isSingpassEnabled

  const button = (
    <Button
      variant="solid"
      leftIcon={<BiPlus />}
      onClick={() =>
        setAddUserModalState({ ...DEFAULT_ADD_USER_MODAL_STATE, siteId })
      }
      isDisabled={isButtonDisabled}
      {...buttonProps}
    >
      Add new user
    </Button>
  )

  if (!canManageUsers) {
    return (
      <Tooltip label="Only admins can add users." placement="bottom">
        {button}
      </Tooltip>
    )
  }

  return (
    <SingpassConditionalTooltip placement="bottom">
      {button}
    </SingpassConditionalTooltip>
  )
}
