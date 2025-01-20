import { ResourceType } from "~prisma/generated/generatedEnums"
import { format } from "date-fns"
import { atom } from "jotai"

import type { PendingMoveResource } from "./types"

export const moveResourceAtom = atom<null | PendingMoveResource>(null)
export const moveTypesAtom = atom<keyof typeof ResourceType>([])

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
