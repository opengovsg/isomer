import type { ButtonProps } from "@chakra-ui/react"
import { useContext } from "react"
import { Button, Tooltip } from "@chakra-ui/react"
import { useSetAtom } from "jotai"
import { BiPlus } from "react-icons/bi"

import { SINGPASS_DISABLED_ERROR_MESSAGE } from "~/constants/customErrorMessage"
import { UserManagementContext } from "~/features/users"
import {
  addUserModalAtom,
  DEFAULT_ADD_USER_MODAL_STATE,
} from "~/features/users/atoms"
import { useIsSingpassEnabled } from "~/hooks/useIsSingpassEnabled"

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

  let tooltipLabel: string | undefined
  if (!canManageUsers) {
    tooltipLabel = "Only admins can add users."
  } else if (!isSingpassEnabled) {
    tooltipLabel = SINGPASS_DISABLED_ERROR_MESSAGE
  }

  return tooltipLabel ? (
    <Tooltip label={tooltipLabel} placement="bottom">
      {button}
    </Tooltip>
  ) : (
    button
  )
}
