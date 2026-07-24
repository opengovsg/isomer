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
        // Echo each requested id back as a single-item ancestry stack so the
        // combined result mirrors the requested ids.
        return queries.map((query) => ({
          isLoading: false,
          data: query.input.resourceIds.map((id) => [
            {
              id,
              title: id,
              permalink: id,
              type: ResourceType.Page,
              parentId: null,
            } satisfies ResourceItemContent,
          ]),
        }))
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

describe("useResourceQuery", () => {
  beforeEach(() => {
    batchAncestryInputsSpy.mockClear()
    childrenState.pages = []
  })

  it("splits ancestry requests into chunks within MAX_BATCH_RESOURCE_IDS when more children are loaded", () => {
    // Arrange - two loaded pages worth of children exceed the per-request cap
    childrenState.pages = [
      makePage(0, MAX_BATCH_RESOURCE_IDS, MAX_BATCH_RESOURCE_IDS),
      makePage(MAX_BATCH_RESOURCE_IDS, MAX_BATCH_RESOURCE_IDS, null),
    ]

    // Act
    const { result } = renderHook(() =>
      useResourceQuery({
        siteId: 1,
        moveDest: undefined,
        parentDest: undefined,
        isResourceHighlighted: false,
        showOnlyContainers: false,
      }),
    )

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
    const { result } = renderHook(() =>
      useResourceQuery({
        siteId: 1,
        moveDest: undefined,
        parentDest: undefined,
        isResourceHighlighted: false,
        showOnlyContainers: false,
      }),
    )

    // Assert
    expect(batchAncestryInputsSpy).toHaveBeenCalledTimes(1)
    expect(result.current.resourceItemsWithAncestryStack).toHaveLength(10)
  })
})
