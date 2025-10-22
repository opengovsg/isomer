import { atom } from "jotai"

import type { ResourceItemContent } from "~/schemas/resource"

export const moveResourceAtom = atom<null | ResourceItemContent>(null)

// NOTE: We need this because this atom takes in the value
// for the ref when the link itself is saved.
// This is strictly used for validation to see
// if we should allow the `Publish`
export const linkRefAtom = atom("")
