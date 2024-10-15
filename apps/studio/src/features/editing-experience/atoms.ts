import { atom } from "jotai"

import type { PendingMoveResource } from "./types"

export const moveResourceAtom = atom<null | PendingMoveResource>(null)

interface CollectionLinkProps {
  ref?: string
  summary?: string
}
export const linkAtom = atom<Partial<CollectionLinkProps>>({
  ref: "",
  summary: "",
})
