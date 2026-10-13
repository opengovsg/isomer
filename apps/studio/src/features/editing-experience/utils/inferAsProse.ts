import type { IsomerComponent, ProseProps } from "@opengovsg/isomer-components"

export const inferAsProse = (component?: IsomerComponent): ProseProps => {
  if (!component) {
    throw new Error("Expected component of type prose but got undefined")
  }

  if (component.type !== "prose") {
    throw new Error(
      `Expected component of type prose but got type ${component.type}`,
    )
  }

  // ProseProps includes render-time `site`; TipTap only reads content fields.
  return component as ProseProps
}
