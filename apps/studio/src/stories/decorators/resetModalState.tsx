import { useEffect } from "react"
import { type Decorator } from "@storybook/react"
import { useSetAtom } from "jotai"

import {
  addUserModalAtom,
  addUserModalOpenAtom,
  DEFAULT_ADD_USER_MODAL_STATE,
  DEFAULT_UPDATE_USER_MODAL_STATE,
  updateUserModalAtom,
} from "~/features/users/atom"

/**
 * Decorator that resets the EditUserModal state between story renders
 * Use this to ensure the edit user modal doesn't persist between stories
 */
export const ResetEditUserModalDecorator: Decorator = (Story) => {
  const setUpdateUserModalState = useSetAtom(updateUserModalAtom)

  // Reset modal state when the decorator mounts
  useEffect(() => {
    setUpdateUserModalState(DEFAULT_UPDATE_USER_MODAL_STATE)
  }, [setUpdateUserModalState])

  return <Story />
}

/**
 * Decorator that resets the AddUserModal state between story renders
 * Use this to ensure the add user modal doesn't persist between stories
 */
export const ResetAddUserModalDecorator: Decorator = (Story) => {
  const setAddUserModalOpen = useSetAtom(addUserModalOpenAtom)
  const setAddUserModalState = useSetAtom(addUserModalAtom)

  // Reset modal state when the decorator mounts
  useEffect(() => {
    setAddUserModalOpen(false)
    setAddUserModalState(DEFAULT_ADD_USER_MODAL_STATE)
  }, [setAddUserModalOpen, setAddUserModalState])

  return <Story />
}
