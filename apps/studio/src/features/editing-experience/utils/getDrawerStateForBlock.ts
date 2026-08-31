import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { DrawerState } from "~/types/editorDrawer"

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
