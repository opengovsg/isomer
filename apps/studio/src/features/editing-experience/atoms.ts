import { atom } from "jotai"

import type { ResourceItemContent } from "~/schemas/resource"

export const moveResourceAtom = atom<null | ResourceItemContent>(null)
