import type { ResourceItemContent } from "~/schemas/resource"
import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MAX_BATCH_RESOURCE_IDS } from "~/schemas/resource"
import { ResourceType } from "~prisma/generated/generatedEnums"

import { useResourceQuery } from "./useResourceQuery"

// Captures the input passed to each getBatchAncestryWithSelf request so we can
// assert that no single request exceeds the endpoint's MAX_BATCH_RESOURCE_IDS
// cap (the regression behind ISOM-2384).
const batchAncestryInputsSpy = vi.hoisted(() =>
  vi.fn<(input: { siteId: string; resourceIds: string[] }) => void>(),
)

const childrenState = vi.hoisted<{
  pages: { items: { id: string }[]; nextOffset: number | null }[]
}>(() => ({ pages: [] }))

// Ids in this set make their containing chunk's ancestry query report as
// errored (data: undefined, isError: true) instead of echoing success.
const ancestryErrorState = vi.hoisted<{ erroringIds: Set<string> }>(() => ({
  erroringIds: new Set(),
}))

vi.mock("~/utils/trpc", () => {
  const useInfiniteQuery = () => ({
    data: { pages: childrenState.pages },
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    isLoading: false,
  })

  return {
    trpc: {
      resource: {
        getChildrenOf: { useInfiniteQuery },
        getFolderChildrenOf: { useInfiniteQuery },
      },
      useQueries: (
        buildQueries: (t: {
          resource: {
            getBatchAncestryWithSelf: (
              input: { siteId: string; resourceIds: string[] },
              opts: unknown,
            ) => { input: { resourceIds: string[] } }
          }
        }) => { input: { resourceIds: string[] } }[],
      ) => {
        const queries = buildQueries({
          resource: {
            getBatchAncestryWithSelf: (input, _opts) => {
              batchAncestryInputsSpy(input)
              return { input }
            },
          },
        })
        // Echo each requested id back as a root -> self ancestry stack (the
        // real endpoint orders stacks root-first, self-last) so the combined
        // result mirrors the requested ids and tests catch code that
        // incorrectly assumes the requested resource is at index 0, unless
        // the chunk contains an id marked to simulate an error.
        return queries.map((query) => {
          if (
            query.input.resourceIds.some((id) =>
              ancestryErrorState.erroringIds.has(id),
            )
          ) {
            return { isLoading: false, isError: true, data: undefined }
          }
          return {
            isLoading: false,
            isError: false,
            data: query.input.resourceIds.map((id) => [
              {
                id: `root-of-${id}`,
                title: `root-of-${id}`,
                permalink: `root-of-${id}`,
                type: ResourceType.Folder,
                parentId: null,
              } satisfies ResourceItemContent,
              {
                id,
                title: id,
                permalink: id,
                type: ResourceType.Page,
                parentId: `root-of-${id}`,
              } satisfies ResourceItemContent,
            ]),
          }
        })
      },
    },
  }
})

const makePage = (start: number, count: number, nextOffset: number | null) => ({
  items: Array.from({ length: count }, (_, index) => ({
    id: String(start + index),
  })),
  nextOffset,
})

const defaultProps = {
  siteId: 1,
  moveDest: undefined,
  parentDest: undefined,
  isResourceHighlighted: false,
  showOnlyContainers: false,
}

describe("useResourceQuery", () => {
  beforeEach(() => {
    batchAncestryInputsSpy.mockClear()
    childrenState.pages = []
    ancestryErrorState.erroringIds.clear()
  })

  it("splits ancestry requests into chunks within MAX_BATCH_RESOURCE_IDS when more children are loaded", () => {
    // Arrange - two loaded pages worth of children exceed the per-request cap
    childrenState.pages = [
      makePage(0, MAX_BATCH_RESOURCE_IDS, MAX_BATCH_RESOURCE_IDS),
      makePage(MAX_BATCH_RESOURCE_IDS, MAX_BATCH_RESOURCE_IDS, null),
    ]

    // Act
    const { result } = renderHook(() => useResourceQuery(defaultProps))

    // Assert - one request per chunk, none exceeding the cap, all ids kept
    expect(batchAncestryInputsSpy).toHaveBeenCalledTimes(2)
    for (const [input] of batchAncestryInputsSpy.mock.calls) {
      expect(input.resourceIds.length).toBeLessThanOrEqual(
        MAX_BATCH_RESOURCE_IDS,
      )
    }
    expect(result.current.resourceItemsWithAncestryStack).toHaveLength(
      MAX_BATCH_RESOURCE_IDS * 2,
    )
  })

  it("issues a single ancestry request when children fit within the cap", () => {
    // Arrange
    childrenState.pages = [makePage(0, 10, null)]

    // Act
    const { result } = renderHook(() => useResourceQuery(defaultProps))

    // Assert
    expect(batchAncestryInputsSpy).toHaveBeenCalledTimes(1)
    expect(result.current.resourceItemsWithAncestryStack).toHaveLength(10)
    // Each browsed id must resolve to its own stack (keyed by the last,
    // "self" element), not get lost behind its root ancestor's id.
    const ids = result.current.resourceItemsWithAncestryStack?.map(
      (stack) => stack[stack.length - 1]?.id,
    )
    expect(ids).toEqual(Array.from({ length: 10 }, (_, i) => String(i)))
  })

  it("issues exactly one ancestry request per Load-more rather than re-querying all loaded pages", () => {
    // Arrange - initial single page
    childrenState.pages = [
      makePage(0, MAX_BATCH_RESOURCE_IDS, MAX_BATCH_RESOURCE_IDS),
    ]
    const { result, rerender } = renderHook(() =>
      useResourceQuery(defaultProps),
    )

    expect(batchAncestryInputsSpy).toHaveBeenCalledTimes(1)
    batchAncestryInputsSpy.mockClear()

    // Act - simulate Load more (second page added)
    childrenState.pages = [
      makePage(0, MAX_BATCH_RESOURCE_IDS, MAX_BATCH_RESOURCE_IDS),
      makePage(MAX_BATCH_RESOURCE_IDS, MAX_BATCH_RESOURCE_IDS, null),
    ]
    rerender()

    // Assert - only page 2's ids queried, not all accumulated ids
    expect(batchAncestryInputsSpy).toHaveBeenCalledTimes(1)
    expect(result.current.resourceItemsWithAncestryStack).toHaveLength(
      MAX_BATCH_RESOURCE_IDS * 2,
    )
  })

  it("leaves the combined result unresolved rather than silently dropping resources when an ancestry chunk errors", () => {
    // Arrange - two chunks; the second chunk's ids will error out
    childrenState.pages = [
      makePage(0, MAX_BATCH_RESOURCE_IDS, MAX_BATCH_RESOURCE_IDS),
      makePage(MAX_BATCH_RESOURCE_IDS, MAX_BATCH_RESOURCE_IDS, null),
    ]
    ancestryErrorState.erroringIds.add(String(MAX_BATCH_RESOURCE_IDS))

    // Act
    const { result } = renderHook(() => useResourceQuery(defaultProps))

    // Assert - `undefined` (still "loading") rather than a 25-item partial
    // result masquerading as the complete list.
    expect(result.current.resourceItemsWithAncestryStack).toBeUndefined()
  })
})
