/* @vitest-environment jsdom */

import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("usehooks-ts", () => ({
  useMediaQuery: vi.fn(() => false),
}))

import { useMediaQuery } from "usehooks-ts"

import { useBreakpoint } from "../useBreakpoint"

describe("useBreakpoint", () => {
  beforeEach(() => {
    vi.mocked(useMediaQuery).mockClear()
  })

  it("passes the min-width media query for the requested breakpoint", () => {
    renderHook(() => useBreakpoint("md"))

    expect(useMediaQuery).toHaveBeenCalledWith("(min-width: 768px)", {
      initializeWithValue: false,
    })
  })

  it("passes initializeWithValue: false to prevent SSR hydration mismatch", () => {
    renderHook(() => useBreakpoint("lg"))

    expect(useMediaQuery).toHaveBeenCalledWith(expect.any(String), {
      initializeWithValue: false,
    })
  })
})
