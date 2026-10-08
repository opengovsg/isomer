import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { usePostHogOptionalStep } from "../usePostHogOptionalStep"

const capture = vi.hoisted(() => vi.fn())
vi.mock("posthog-js", () => ({ default: { capture } }))

beforeEach(() => {
  capture.mockClear()
})

describe("usePostHogOptionalStep", () => {
  it("captures with skipped:true when the step is bypassed", () => {
    renderHook(() =>
      usePostHogOptionalStep({
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
      usePostHogOptionalStep({
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
        usePostHogOptionalStep({
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
