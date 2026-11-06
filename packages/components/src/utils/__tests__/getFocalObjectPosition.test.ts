import type { ImageAdjustment } from "~/interfaces/complex/Image"
import { describe, expect, it } from "vitest"

import { getFocalObjectPosition } from "../getFocalObjectPosition"

const withFocal = (focal: ImageAdjustment["focal"]): ImageAdjustment =>
  ({ focal }) as ImageAdjustment

describe("getFocalObjectPosition", () => {
  it("returns undefined when imageAdjustment is undefined", () => {
    expect(getFocalObjectPosition(undefined)).toBeUndefined()
  })

  it("returns undefined when focal is undefined", () => {
    expect(getFocalObjectPosition({} as ImageAdjustment)).toBeUndefined()
  })

  it("converts a centered focal point to a percentage string", () => {
    expect(getFocalObjectPosition(withFocal({ x: 0.5, y: 0.5 }))).toBe(
      "50% 50%",
    )
  })

  it("converts an off-center focal point to a percentage string", () => {
    expect(getFocalObjectPosition(withFocal({ x: 0.25, y: 0.75 }))).toBe(
      "25% 75%",
    )
  })

  it("treats a focal coordinate of 0 as valid, not missing", () => {
    // `!= null` (not truthiness) is the whole point of this helper: 0 is a
    // legitimate top/left-anchored focal point, not "no focal set".
    expect(getFocalObjectPosition(withFocal({ x: 0, y: 0 }))).toBe("0% 0%")
  })

  it("handles a focal point pinned to the bottom-right corner", () => {
    expect(getFocalObjectPosition(withFocal({ x: 1, y: 1 }))).toBe("100% 100%")
  })
})
