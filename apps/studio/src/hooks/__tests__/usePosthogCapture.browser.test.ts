import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  useCaptureOnceReady,
  useCaptureOncePerKey,
  useOptionalStep,
} from "../usePosthogCapture"

const capture = vi.hoisted(() => vi.fn())
vi.mock("posthog-js", () => ({ default: { capture } }))

beforeEach(() => {
  capture.mockClear()
})

describe("useCaptureOnceReady", () => {
  it("does not fire while not ready", () => {
    const fn = vi.fn()
    renderHook(({ ready }) => useCaptureOnceReady(ready, fn), {
      initialProps: { ready: false },
    })
    expect(fn).not.toHaveBeenCalled()
  })

  it("fires exactly once, on the first ready render, and never again", () => {
    const fn = vi.fn()
    const { rerender } = renderHook(
      ({ ready }) => useCaptureOnceReady(ready, fn),
      { initialProps: { ready: false } },
    )

    rerender({ ready: true })
    rerender({ ready: true })
    rerender({ ready: false })
    rerender({ ready: true })

    expect(fn).toHaveBeenCalledTimes(1)
  })
})

describe("useCaptureOncePerKey", () => {
  it("fires once per distinct key but suppresses a revisited key", () => {
    const fn = vi.fn()
    const { rerender } = renderHook(
      ({ key }) => useCaptureOncePerKey(key, fn),
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
    renderHook(({ key }) => useCaptureOncePerKey(key, fn), {
      initialProps: { key: null as string | null },
    })
    expect(fn).not.toHaveBeenCalled()
  })
})

describe("useOptionalStep", () => {
  it("captures with skipped:true when the step is bypassed", () => {
    renderHook(() =>
      useOptionalStep({
        event: "my_step",
        isBypassed: true,
        properties: { site_id: 1 },
      }),
    )
    expect(capture).toHaveBeenCalledWith("my_step", {
      site_id: 1,
      skipped: true,
    })
  })

  it("captures without skipped when the step is taken", () => {
    renderHook(() =>
      useOptionalStep({
        event: "my_step",
        isBypassed: false,
        properties: { site_id: 1 },
      }),
    )
    expect(capture).toHaveBeenCalledWith("my_step", { site_id: 1 })
  })

  it("waits until isReady before capturing", () => {
    const { rerender } = renderHook(
      ({ ready }) =>
        useOptionalStep({
          event: "my_step",
          isReady: ready,
          isBypassed: false,
        }),
      { initialProps: { ready: false } },
    )
    expect(capture).not.toHaveBeenCalled()

    rerender({ ready: true })
    expect(capture).toHaveBeenCalledTimes(1)
  })
})
