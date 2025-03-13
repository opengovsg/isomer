import { RoleType } from "~prisma/generated/generatedEnums"
import { atom } from "jotai"

import type {
  AddUserModalState,
  RemoveUserModalState,
  UpdateUserModalState,
} from "./types"

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

export const DEFAULT_UPDATE_PROFILE_MODAL_STATE = false

export const updateProfileModalOpenAtom = atom<boolean>(
  DEFAULT_UPDATE_PROFILE_MODAL_STATE,
)

export const DEFAULT_REMOVE_USER_MODAL_STATE = {
  siteId: 0,
  userId: "",
}

export const removeUserModalAtom = atom<RemoveUserModalState>(
  DEFAULT_REMOVE_USER_MODAL_STATE,
)
