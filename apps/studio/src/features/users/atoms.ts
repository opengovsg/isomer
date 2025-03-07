import { atom } from "jotai"

export const DEFAULT_UPDATE_PROFILE_MODAL_STATE = false

export const updateProfileModalOpenAtom = atom<boolean>(
  DEFAULT_UPDATE_PROFILE_MODAL_STATE,
)
