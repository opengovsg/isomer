import { atom } from "jotai"
import { RoleType } from "~prisma/generated/generatedEnums"

import type {
  AddUserModalState,
  ExportAccessLogsModalState,
  RemoveUserModalState,
  UpdateUserModalState,
} from "./types"

export const DEFAULT_UPDATE_USER_MODAL_STATE = {
  email: "",
  role: RoleType.Editor,
  siteId: 0,
  userId: "",
}

export const updateUserModalAtom = atom<UpdateUserModalState>(
  DEFAULT_UPDATE_USER_MODAL_STATE,
)

export const DEFAULT_ADD_USER_MODAL_STATE = {
  hasWhitelistError: false,
  siteId: 0,
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

export const DEFAULT_EXPORT_ACCESS_LOGS_MODAL_STATE = {
  isOpen: false,
  siteId: 0,
} as const

export const exportAccessLogsModalAtom = atom<ExportAccessLogsModalState>(
  DEFAULT_EXPORT_ACCESS_LOGS_MODAL_STATE,
)
