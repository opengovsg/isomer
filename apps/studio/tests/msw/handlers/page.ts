import type { DelayMode } from "msw"
import { delay } from "msw"

import { trpcMsw } from "../mockTrpc"

const pageListQuery = (wait?: DelayMode | number) => {
  return trpcMsw.page.list.query(async () => {
    if (wait !== undefined) {
      await delay(wait)
    }
    return [
      {
        id: 4,
        permalink: "test-page-1",
        title: "Test page 1",
        blobId: 3,
      },
      {
        id: 5,
        permalink: "test-page-2",
        title: "Test page 2",
        blobId: 4,
      },
      {
        id: 6,
        permalink: "folder",
        title: "Test folder 1",
        blobId: null,
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
