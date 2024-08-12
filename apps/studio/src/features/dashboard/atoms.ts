import { ResourceType } from "~prisma/generated/generatedEnums"
import { atom } from "jotai"

import { DeleteResourceModalState } from "./types"

export const DEFAULT_RESOURCE_MODAL_STATE = {
  isOpen: false,
  title: "",
  resourceId: "",
  resourceType: ResourceType.Collection,
}
export const deleteResourceModalAtom = atom<DeleteResourceModalState>(
  DEFAULT_RESOURCE_MODAL_STATE,
)
