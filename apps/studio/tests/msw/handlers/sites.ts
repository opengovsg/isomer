import type { DelayMode } from "msw"
import { delay } from "msw"

import { trpcMsw } from "../mockTrpc"

const siteListQuery = (wait?: DelayMode | number) => {
  return trpcMsw.site.list.query(async () => {
    if (wait !== undefined) {
      await delay(wait)
    }
    return [
      {
        id: 1,
        name: "Ministry of Trade and Industry",
      },
    ]
  })
}

export const sitesHandlers = {
  list: {
    default: siteListQuery,
    loading: () => siteListQuery("infinite"),
  },
}
