import { ResourceType } from "~prisma/generated/generatedEnums"
import { atom } from "jotai"

import { DeleteCollectionModalState } from "./types"

export const DEFAULT_COLLECTION_MODAL_STATE = {
  isOpen: false,
  title: "",
  resourceId: "",
  resourceType: ResourceType.Collection,
}
export const deleteCollectionModalAtom = atom<DeleteCollectionModalState>(
  DEFAULT_COLLECTION_MODAL_STATE,
)
