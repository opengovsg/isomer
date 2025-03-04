import { RoleType } from "~prisma/generated/generatedEnums"
import { atom } from "jotai"

import type { UpdateUserModalState } from "./types"

export const DEFAULT_UPDATE_USER_MODAL_STATE = {
  siteId: 0,
  userId: "",
  email: "",
  role: RoleType.Editor,
}

export const updateUserModalAtom = atom<UpdateUserModalState>(
  DEFAULT_UPDATE_USER_MODAL_STATE,
)

export const addUserModalOpenAtom = atom<boolean>(false)
