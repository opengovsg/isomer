import { atom } from "jotai"

import type { RemoveUserModalState } from "./types"

export const DEFAULT_REMOVE_USER_MODAL_STATE = {
  siteId: 0,
  userId: "",
}

export const removeUserModalAtom = atom<RemoveUserModalState>(
  DEFAULT_REMOVE_USER_MODAL_STATE,
)
