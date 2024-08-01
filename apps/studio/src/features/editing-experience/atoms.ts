import { atom } from "jotai"

import type { PendingMoveResource } from "./types"

export const moveResourceAtom = atom<null | PendingMoveResource>(null)
