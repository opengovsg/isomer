import { useEffect } from "react"
import { type Decorator } from "@storybook/react"
import { useSetAtom } from "jotai"

import {
  DEFAULT_REMOVE_USER_MODAL_STATE,
  DEFAULT_UPDATE_PROFILE_MODAL_STATE,
  removeUserModalAtom,
  updateProfileModalOpenAtom,
} from "~/features/users/atoms"

/**
 * Decorator that resets the RemoveUserModal state between story renders
 * Use this to ensure the remove user modal doesn't persist between stories
 */
export const ResetRemoveUserModalDecorator: Decorator = (Story) => {
  const setRemoveUserModalState = useSetAtom(removeUserModalAtom)

  // Reset modal state when the decorator mounts
  useEffect(() => {
    setRemoveUserModalState(DEFAULT_REMOVE_USER_MODAL_STATE)
  }, [setRemoveUserModalState])

  return <Story />
}

/**
 * Decorator that resets the UpdateProfileModal state between story renders
 * Use this to ensure the update profile modal doesn't persist between stories
 */
export const ResetUpdateProfileModalDecorator: Decorator = (Story) => {
  const setUpdateProfileModalState = useSetAtom(updateProfileModalOpenAtom)

  // Reset modal state when the decorator mounts
  useEffect(() => {
    setUpdateProfileModalState(DEFAULT_UPDATE_PROFILE_MODAL_STATE)
  }, [setUpdateProfileModalState])

  return <Story />
}
