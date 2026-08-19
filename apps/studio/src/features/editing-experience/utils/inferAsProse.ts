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

  // NOTE: `ProseProps` also carries `site` (a render-time prop from
  // `@opengovsg/isomer-components`), which `IsomerComponent` never has.
  // TipTapProseComponent only reads the content schema fields off this
  // value, so the cast is safe in practice despite being structurally
  // unsound.
  return component as ProseProps
}
