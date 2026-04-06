/* @vitest-environment jsdom */

import { act } from "react-dom/test-utils"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { useQueryParams } from "../useQueryParams"

interface HookSnapshot {
  queryParams: Record<string, string>
  updateQueryParams: (params: {
    newParams: Record<string, string | undefined>
  }) => void
}

const HookConsumer = ({
  onRender,
}: {
  onRender: (snapshot: HookSnapshot) => void
}) => {
  const [queryParams, updateQueryParams] = useQueryParams()
  onRender({ queryParams, updateQueryParams })
  return null
}

describe("useQueryParams", () => {
  let container: HTMLDivElement
  let root: ReturnType<typeof createRoot>
  let latestSnapshot: HookSnapshot | undefined
  let originalPushState: History["pushState"]

  beforeEach(() => {
    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)
    latestSnapshot = undefined
    originalPushState = window.history.pushState
    window.history.replaceState({}, "", "/")
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
    window.history.pushState = originalPushState
    window.history.replaceState({}, "", "/")
  })

  it("should initialise query params from the current URL", () => {
    // Arrange
    window.history.replaceState({}, "", "/?category=guides&page=2")

    // Act
    act(() => {
      root.render(
        <HookConsumer
          onRender={(snapshot) => {
            latestSnapshot = snapshot
          }}
        />,
      )
    })

    // Assert
    expect(latestSnapshot?.queryParams).toEqual({
      category: "guides",
      page: "2",
    })
  })

  it("should update query params when pushState changes the URL", () => {
    // Arrange
    act(() => {
      root.render(
        <HookConsumer
          onRender={(snapshot) => {
            latestSnapshot = snapshot
          }}
        />,
      )
    })

    // Act
    act(() => {
      window.history.pushState({}, "", "/?page=3&search=budget")
    })

    // Assert
    expect(latestSnapshot?.queryParams).toEqual({
      page: "3",
      search: "budget",
    })
  })

  it("should update query params when popstate is dispatched", () => {
    // Arrange
    act(() => {
      root.render(
        <HookConsumer
          onRender={(snapshot) => {
            latestSnapshot = snapshot
          }}
        />,
      )
    })

    // Act
    act(() => {
      window.history.replaceState({}, "", "/?filters=%5B%5D")
      window.dispatchEvent(new PopStateEvent("popstate"))
    })

    // Assert
    expect(latestSnapshot?.queryParams).toEqual({
      filters: "[]",
    })
  })

  it("should restore the original pushState implementation on unmount", () => {
    // Arrange
    const initialPushState = window.history.pushState
    act(() => {
      root.render(
        <HookConsumer
          onRender={(snapshot) => {
            latestSnapshot = snapshot
          }}
        />,
      )
    })

    // Assert
    expect(window.history.pushState).not.toBe(initialPushState)

    // Act
    act(() => {
      root.unmount()
    })

    // Assert
    expect(window.history.pushState).toBe(initialPushState)

    // Re-create root for afterEach cleanup.
    root = createRoot(container)
  })
})
