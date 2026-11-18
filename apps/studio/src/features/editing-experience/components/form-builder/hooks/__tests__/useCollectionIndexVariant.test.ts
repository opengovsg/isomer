// @vitest-environment jsdom

import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useCollectionIndexVariant } from "../useCollectionIndexVariant"

const mockIndexPage = vi.hoisted(() => vi.fn())

vi.mock("~/features/editing-experience/hooks/useCollectionIndexPage", () => ({
  useCollectionIndexPage: () => mockIndexPage() as unknown,
}))

const variantFor = (data: unknown) => {
  mockIndexPage.mockReturnValue({ data, isError: false })
  return renderHook(() =>
    useCollectionIndexVariant({ siteId: 1, pageId: 1, enabled: true }),
  ).result.current
}

describe("useCollectionIndexVariant", () => {
  it("is pending until the index page loads", () => {
    expect(variantFor(undefined)).toBe("pending")
  })

  it("returns the saved layout", () => {
    expect(variantFor({ variant: "blog" })).toBe("blog")
  })

  // A new collection's index page saves no layout.
  it("falls back to the site's default layout when none is saved", () => {
    expect(variantFor({ title: "News" })).toBe("collection")
  })
})
