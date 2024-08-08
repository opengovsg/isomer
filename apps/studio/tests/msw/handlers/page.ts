import type { DelayMode } from "msw"
import { delay } from "msw"

import { trpcMsw } from "../mockTrpc"

const pageListQuery = (wait?: DelayMode | number) => {
  return trpcMsw.resource.list.query(async () => {
    if (wait !== undefined) {
      await delay(wait)
    }
    return [
      {
        id: "1",
        permalink: "",
        title: "Homepage",
        publishedVersionId: null,
        draftBlobId: null,
        type: "RootPage",
      },
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
  })
}

export const pageHandlers = {
  list: {
    default: pageListQuery,
    loading: () => pageListQuery("infinite"),
  },
}
