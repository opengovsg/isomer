import { useContext } from "react"
import { Button, Tooltip } from "@chakra-ui/react"
import { useSetAtom } from "jotai"
import { BiPlus } from "react-icons/bi"

import { UserManagementContext } from "~/features/users"
import {
  addUserModalAtom,
  addUserModalOpenAtom,
  DEFAULT_ADD_USER_MODAL_STATE,
} from "~/features/users/atom"

interface AddNewUserButtonProps {
  siteId: number
}

export const AddNewUserButton = ({ siteId }: AddNewUserButtonProps) => {
  const ability = useContext(UserManagementContext)
  const canManageUsers = ability.can("manage", "UserManagement")

  const setAddUserModalOpen = useSetAtom(addUserModalOpenAtom)
  const setAddUserModalState = useSetAtom(addUserModalAtom)

  const button = (
    <Button
      variant="solid"
      leftIcon={<BiPlus />}
      onClick={() => {
        setAddUserModalOpen(true)
        setAddUserModalState({ ...DEFAULT_ADD_USER_MODAL_STATE, siteId })
      }}
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
