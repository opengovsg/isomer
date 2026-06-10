/* @vitest-environment jsdom */

import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useQueryParams } from "../useQueryParams"

describe("useQueryParams", () => {
  let originalPushState: History["pushState"]

  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    originalPushState = window.history.pushState
    window.history.replaceState({}, "", "/")
  })

  afterEach(() => {
    window.history.pushState = originalPushState
    window.history.replaceState({}, "", "/")
  })

  it("should initialise query params from the current URL", () => {
    // Arrange
    window.history.replaceState({}, "", "/?category=guides&page=2")

    // Act
    const { result } = renderHook(() => useQueryParams())

    // Assert
    expect(result.current[0]).toEqual({ category: "guides", page: "2" })
  })

  it("should update query params when pushState changes the URL", () => {
    // Arrange
    const { result } = renderHook(() => useQueryParams())

    // Act
    act(() => {
      window.history.pushState({}, "", "/?page=3&search=budget")
    })

    // Assert
    expect(result.current[0]).toEqual({ page: "3", search: "budget" })
  })

  it("should update query params when popstate is dispatched", () => {
    // Arrange
    const { result } = renderHook(() => useQueryParams())

    // Act
    act(() => {
      window.history.replaceState({}, "", "/?filters=%5B%5D")
      window.dispatchEvent(new PopStateEvent("popstate"))
    })

    // Assert
    expect(result.current[0]).toEqual({ filters: "[]" })
  })

  it("should stop emitting pushstate events after unmount", () => {
    // Arrange
    const onPushState = vi.fn()
    window.addEventListener("pushstate", onPushState)
    const { unmount } = renderHook(() => useQueryParams())
    act(() => {
      window.history.pushState({}, "", "/?page=1")
    })
    expect(onPushState).toHaveBeenCalledTimes(1)

    // Act
    unmount()
    window.history.pushState({}, "", "/?page=2")

    // Assert
    expect(onPushState).toHaveBeenCalledTimes(1)
    window.removeEventListener("pushstate", onPushState)
  })
})
