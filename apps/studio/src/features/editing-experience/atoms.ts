import { format } from "date-fns"
import { atom } from "jotai"

import type { PendingMoveResource } from "./types"

export const moveResourceAtom = atom<null | PendingMoveResource>(null)

export interface CollectionLinkProps {
  ref: string
  description?: string
  date: string
  category: string
  title: string
}
export const linkAtom = atom<CollectionLinkProps>({
  ref: "",
  description: "",
  date: format(new Date(), "dd/mm/yyyy"),
  category: "",
  title: "",
})

// NOTE: We need this because this atom takes in the value
// for the ref when the link itself is saved.
// This is strictly used for validation to see
// if we should allow the `Publish`
export const linkRefAtom = atom("")
