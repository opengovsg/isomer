import { atom } from "jotai"

import type { UpdateUserModalState } from "./types"

export const DEFAULT_UPDATE_USER_MODAL_STATE = {
  userId: "",
}

export const updateUserModalAtom = atom<UpdateUserModalState>(
  DEFAULT_UPDATE_USER_MODAL_STATE,
)
