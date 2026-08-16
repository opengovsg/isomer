import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { DrawerState } from "~/types/editorDrawer"

// Shared block-type -> editor-drawer-state mapping for every click-a-block entry point.
export const getDrawerStateForBlock = (
  block: IsomerSchema["content"][number],
): DrawerState => {
  if (block.type === "hero") {
    return { state: "heroEditor" }
  }
  if (block.type === "prose") {
    return { state: "nativeEditor" }
  }
  return { state: "complexEditor" }
}
