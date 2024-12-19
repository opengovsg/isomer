import { format } from "date-fns"
import { atom } from "jotai"

import type { ResourceItemContent } from "~/schemas/resource"

export const moveResourceAtom = atom<null | ResourceItemContent>(null)

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
