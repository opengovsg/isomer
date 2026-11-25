// @vitest-environment jsdom

import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useCollectionIndexVariant } from "../useCollectionIndexVariant"

const mockIndexPageContent = vi.hoisted(() => vi.fn())

// Stub the three chained tRPC queries so renderHook needs no tRPC provider.
vi.mock("~/utils/trpc", () => ({
  trpc: {
    resource: {
      getParentOf: { useQuery: () => ({ data: { parent: { id: "2" } } }) },
    },
    folder: { getIndexpage: { useQuery: () => ({ data: { id: "3" } }) } },
    page: {
      readPageAndBlob: {
        useQuery: () => ({ data: mockIndexPageContent() as unknown }),
      },
    },
  },
}))

const variantFor = (page: unknown) => {
  mockIndexPageContent.mockReturnValue(page && { content: { page } })
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
