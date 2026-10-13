import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { usePostHogCaptureOnceReady } from "../usePostHogCaptureOnceReady"

describe("usePostHogCaptureOnceReady", () => {
  it("does not fire while not ready", () => {
    const fn = vi.fn()
    renderHook(({ ready }) => usePostHogCaptureOnceReady(ready, fn), {
      initialProps: { ready: false },
    })
    expect(fn).not.toHaveBeenCalled()
  })

  it("fires exactly once, on the first ready render, and never again", () => {
    const fn = vi.fn()
    const { rerender } = renderHook(
      ({ ready }) => usePostHogCaptureOnceReady(ready, fn),
      { initialProps: { ready: false } },
    )

    rerender({ ready: true })
    rerender({ ready: true })
    rerender({ ready: false })
    rerender({ ready: true })

    expect(fn).toHaveBeenCalledTimes(1)
  })
})
