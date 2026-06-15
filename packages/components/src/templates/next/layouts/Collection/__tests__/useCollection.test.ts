/* @vitest-environment jsdom */

import { renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { useCollection } from "../useCollection"

describe("useCollection", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/")
  })

  afterEach(() => {
    window.history.replaceState({}, "", "/")
  })

  describe("appliedFilters", () => {
    it("returns empty array when filters param is absent", () => {
      // Arrange — no filters param in URL (set in beforeEach)

      // Act
      const { result } = renderHook(() => useCollection({ items: [] }))

      // Assert
      expect(result.current.appliedFilters).toEqual([])
    })

    it("returns empty array when filters param is an empty string", () => {
      // Arrange
      window.history.replaceState({}, "", "/?filters=")

      // Act
      const { result } = renderHook(() => useCollection({ items: [] }))

      // Assert
      expect(result.current.appliedFilters).toEqual([])
    })

    it("returns empty array when filters param is an empty JSON array", () => {
      // Arrange
      window.history.replaceState({}, "", "/?filters=%5B%5D")

      // Act
      const { result } = renderHook(() => useCollection({ items: [] }))

      // Assert
      expect(result.current.appliedFilters).toEqual([])
    })

    it("parses valid JSON filters from the URL", () => {
      // Arrange
      const filters = [{ id: "category", items: [{ id: "guides" }] }]
      window.history.replaceState(
        {},
        "",
        `/?filters=${encodeURIComponent(JSON.stringify(filters))}`,
      )

      // Act
      const { result } = renderHook(() => useCollection({ items: [] }))

      // Assert
      expect(result.current.appliedFilters).toEqual(filters)
    })

    it("returns empty array instead of crashing when filters param is not valid JSON", () => {
      // Arrange — simulates a user manually typing ?filters=hello in the address bar
      window.history.replaceState({}, "", "/?filters=hello")

      // Act
      const { result } = renderHook(() => useCollection({ items: [] }))

      // Assert
      expect(result.current.appliedFilters).toEqual([])
    })

    it("returns empty array instead of crashing for a partial JSON string", () => {
      // Arrange
      window.history.replaceState({}, "", "/?filters=%7B%22id%22")

      // Act
      const { result } = renderHook(() => useCollection({ items: [] }))

      // Assert
      expect(result.current.appliedFilters).toEqual([])
    })
  })
})
