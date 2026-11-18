import type { ImageAdjustment } from "~/interfaces/complex/Image"
import { describe, expect, it } from "vitest"

import { getEffectiveImageAdjustment } from "../getEffectiveImageAdjustment"

const adjustment = { focal: { x: 0.5, y: 0.5 } } as ImageAdjustment

describe("getEffectiveImageAdjustment", () => {
  it("drops the adjustment when contain fit is needed", () => {
    expect(getEffectiveImageAdjustment(adjustment, true)).toBeUndefined()
  })

  it("keeps the adjustment when contain fit is not needed", () => {
    expect(getEffectiveImageAdjustment(adjustment, false)).toBe(adjustment)
  })

  it("keeps the adjustment when isContainNeeded is undefined", () => {
    expect(getEffectiveImageAdjustment(adjustment, undefined)).toBe(adjustment)
  })

  it("returns undefined when there is no adjustment to begin with", () => {
    expect(getEffectiveImageAdjustment(undefined, false)).toBeUndefined()
  })
})
