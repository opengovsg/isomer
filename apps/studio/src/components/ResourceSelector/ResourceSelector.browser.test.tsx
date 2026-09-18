import type { AppRouter } from "~/server/modules/_app"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { TRPCClientError } from "@trpc/client"
import { observable } from "@trpc/server/observable"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  getBatchAncestryWithSelfSchema,
  getChildrenSchema,
  MAX_BATCH_RESOURCE_IDS,
} from "~/schemas/resource"
import { theme } from "~/theme"
import { ResourceType } from "~prisma/generated/generatedEnums"

import { ResourceSelector } from "./ResourceSelector"

vi.mock("~/env.mjs", () => ({
  env: { NEXT_PUBLIC_APP_URL: "http://localhost:3000" },
}))

// Keep the real tRPC/React Query lifecycle, with an in-memory transport.
const trpc = await vi.hoisted(async () => {
  const { createTRPCReact } = await import("@trpc/react-query")
  return createTRPCReact<AppRouter>()
})
vi.mock("~/utils/trpc", () => ({ trpc }))

describe("ResourceSelector ancestry recovery", () => {
  afterEach(cleanup)

  it.each(["link", "move"] as const)(
    "retries a failed page of %s destinations and restores the complete list",
    async (interactionType) => {
      const items = Array.from(
        { length: MAX_BATCH_RESOURCE_IDS + 1 },
        (_, i) => ({
          id: String(i + 1),
          title: `Folder ${i + 1}`,
          permalink: `folder-${i + 1}`,
          type: ResourceType.Folder,
          parentId: null,
        }),
      )
      const failedId = String(items.length)
      const ancestryRequests: string[][] = []
      let shouldFail = true
      const retryResponse = Promise.withResolvers<void>()
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, staleTime: Infinity } },
      })
      const client = trpc.createClient({
        links: [
          () =>
            ({ op }) =>
              observable((observer) => {
                const respond = (data: unknown) => {
                  observer.next({ result: { data } })
                  observer.complete()
                }
                switch (op.path) {
                  case "page.getRootPage":
                    respond({ id: "root" })
                    break
                  case "resource.getAncestryStack":
                    respond([])
                    break
                  case "resource.getNestedFolderChildrenOf":
                    respond({ items: [] })
                    break
                  case "resource.search":
                    respond({
                      resources: [],
                      recentlyEdited: [],
                      totalCount: 0,
                      nextOffset: null,
                    })
                    break
                  case "resource.getChildrenOf":
                  case "resource.getFolderChildrenOf": {
                    const { cursor, limit } = getChildrenSchema.parse(op.input)
                    respond({
                      items: items.slice(cursor, cursor + limit),
                      nextOffset:
                        cursor + limit < items.length ? cursor + limit : null,
                    })
                    break
                  }
                  case "resource.getBatchAncestryWithSelf": {
                    const { resourceIds } =
                      getBatchAncestryWithSelfSchema.parse(op.input)
                    ancestryRequests.push(resourceIds)
                    const stacks = items
                      .filter((item) => resourceIds.includes(item.id))
                      .map((item) => [item])
                    if (!resourceIds.includes(failedId)) {
                      respond(stacks)
                    } else if (shouldFail) {
                      observer.error(
                        new TRPCClientError("Ancestry request failed"),
                      )
                    } else {
                      void retryResponse.promise.then(() => respond(stacks))
                    }
                    break
                  }
                  default:
                    observer.error(
                      new TRPCClientError(`Unexpected query: ${op.path}`),
                    )
                }
              }),
        ],
      })

      const { container, unmount } = render(
        <QueryClientProvider client={queryClient}>
          <trpc.Provider client={client} queryClient={queryClient}>
            <ThemeProvider theme={theme}>
              <ResourceSelector
                siteId={1}
                interactionType={interactionType}
                onChange={vi.fn()}
              />
            </ThemeProvider>
          </trpc.Provider>
        </QueryClientProvider>,
      )

      await screen.findByRole("button", { name: "Folder 1 /folder-1" })
      fireEvent.click(screen.getByRole("button", { name: "Load more" }))

      const alert = await screen.findByRole("alert")
      expect(alert.textContent).toContain(
        "We couldn't load your pages and folders.",
      )
      expect(container.querySelector(".chakra-skeleton")).toBeNull()
      expect(
        screen.queryByRole("button", { name: "Folder 1 /folder-1" }),
      ).toBeNull()
      expect(screen.queryByRole("button", { name: "Load more" })).toBeNull()

      shouldFail = false
      fireEvent.click(screen.getByRole("button", { name: "Retry" }))
      await waitFor(() =>
        expect(
          ancestryRequests.filter((ids) => ids.includes(failedId)),
        ).toHaveLength(2),
      )
      expect(
        screen.queryByRole("button", {
          name: `Folder ${failedId} /folder-${failedId}`,
        }),
      ).toBeNull()

      retryResponse.resolve()
      await screen.findByRole("button", {
        name: `Folder ${failedId} /folder-${failedId}`,
      })
      expect(screen.getAllByRole("button", { name: /^Folder / })).toHaveLength(
        items.length,
      )
      expect(screen.queryByRole("alert")).toBeNull()
      expect(screen.queryByRole("button", { name: "Retry" })).toBeNull()
      expect(ancestryRequests.filter((ids) => ids.includes("1"))).toHaveLength(
        1,
      )

      unmount()
      queryClient.clear()
    },
  )
})
