import { atom } from "jotai"

import type { PendingMoveResource } from "./types"

export const moveResourceAtom = atom<null | PendingMoveResource>(null)

export interface CollectionLinkProps {
  ref: string
  description?: string
}
export const linkAtom = atom<CollectionLinkProps>({
  ref: "",
  description: "",
})
