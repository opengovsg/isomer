import { RoleType } from "~prisma/generated/generatedEnums"
import { atom } from "jotai"

import type { AddUserModalState, UpdateUserModalState } from "./types"

export const DEFAULT_UPDATE_USER_MODAL_STATE = {
  siteId: 0,
  userId: "",
  email: "",
  role: RoleType.Editor,
}

export const updateUserModalAtom = atom<UpdateUserModalState>(
  DEFAULT_UPDATE_USER_MODAL_STATE,
)

export const DEFAULT_ADD_USER_MODAL_STATE = {
  siteId: 0,
  hasWhitelistError: false,
}

export const addUserModalAtom = atom<AddUserModalState>(
  DEFAULT_ADD_USER_MODAL_STATE,
)
