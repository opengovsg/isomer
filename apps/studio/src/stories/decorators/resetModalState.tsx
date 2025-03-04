import { useEffect } from "react"
import { type Decorator } from "@storybook/react"
import { useSetAtom } from "jotai"

import {
  DEFAULT_UPDATE_PROFILE_MODAL_STATE,
  updateProfileModalOpenAtom,
} from "~/features/users/atom"

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
