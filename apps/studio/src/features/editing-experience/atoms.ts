import type { LinkRefPageSchema } from "@opengovsg/isomer-components"
import type { Static } from "@sinclair/typebox"
import { format } from "date-fns"
import { atom } from "jotai"

import type { ResourceItemContent } from "~/schemas/resource"

export const moveResourceAtom = atom<null | ResourceItemContent>(null)

export type CollectionLinkProps = Static<typeof LinkRefPageSchema> & {
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
