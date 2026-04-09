import type { ResourceItemContent } from "~/schemas/resource"
import { atom } from "jotai"

export const moveResourceAtom = atom<null | ResourceItemContent>(null)
