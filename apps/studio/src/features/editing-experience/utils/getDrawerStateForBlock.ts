import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { DrawerState } from "~/types/editorDrawer"

// Mirrors the block-type -> editor-drawer-state mapping every "click a block"
// entry point needs (sidebar row click, preview edit button, ...).
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
