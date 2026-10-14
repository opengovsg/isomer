import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { usePostHogCaptureOncePerKey } from "../usePostHogCaptureOncePerKey"

describe("usePostHogCaptureOncePerKey", () => {
  it("fires once per distinct key but suppresses a revisited key", () => {
    const fn = vi.fn()
    const { rerender } = renderHook(
      ({ key }) => usePostHogCaptureOncePerKey(key, fn),
      { initialProps: { key: "a" } },
    )

    rerender({ key: "b" })
    rerender({ key: "a" }) // revisit — already seen

    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenNthCalledWith(1, "a")
    expect(fn).toHaveBeenNthCalledWith(2, "b")
  })

  it("ignores null/undefined keys", () => {
    const fn = vi.fn()
    renderHook(({ key }) => usePostHogCaptureOncePerKey(key, fn), {
      initialProps: { key: null as string | null },
    })
    expect(fn).not.toHaveBeenCalled()
  })
})
