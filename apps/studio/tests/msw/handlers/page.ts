import type { DelayMode } from "msw"
import { delay } from "msw"

import type { RouterOutput } from "~/utils/trpc"
import { trpcMsw } from "../mockTrpc"

const getRootPageQuery = (wait?: DelayMode | number) => {
  return trpcMsw.page.getRootPage.query(async () => {
    if (wait !== undefined) {
      await delay(wait)
    }
    return { title: "A mock page", id: "1", draftBlobId: "1" }
  })
}
const DEFAULT_PAGE_ITEMS: RouterOutput["resource"]["listWithoutRoot"] = [
  {
    id: "1",
    permalink: "newsroom",
    title: "Press Releases",
    publishedVersionId: null,
    draftBlobId: null,
    type: "Collection",
  },
  {
    id: "4",
    permalink: "test-page-1",
    title: "Test page 1",
    publishedVersionId: null,
    draftBlobId: "3",
    type: "Page",
  },
  {
    id: "5",
    permalink: "test-page-2",
    title: "Test page 2",
    publishedVersionId: null,
    draftBlobId: "4",
    type: "Page",
  },
  {
    id: "6",
    permalink: "folder",
    title: "Test folder 1",
    publishedVersionId: null,
    draftBlobId: null,
    type: "Folder",
  },
]

const pageListQuery = (wait?: DelayMode | number) => {
  return trpcMsw.resource.listWithoutRoot.query(async () => {
    if (wait !== undefined) {
      await delay(wait)
    }
    return DEFAULT_PAGE_ITEMS
  })
}

export const pageHandlers = {
  countWithoutRoot: {
    default: () =>
      trpcMsw.resource.countWithoutRoot.query(() => {
        return DEFAULT_PAGE_ITEMS.length
      }),
  },
  listWithoutRoot: {
    default: pageListQuery,
    loading: () => pageListQuery("infinite"),
  },
  getRootPage: {
    default: getRootPageQuery,
    loading: () => getRootPageQuery("infinite"),
  },
}
