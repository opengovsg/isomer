/**
 * This file contains tRPC's HTTP response handler
 */
import * as trpcNext from "@trpc/server/adapters/next"

import { createContext } from "~/server/context"
import { appRouter } from "~/server/modules/_app"

export const config = {
  api: {
    bodyParser: {
      // This is the maximum payload size that NextJS is able to accept, set to
      // 50MB to allow users to update a very large SearchableTable page
      sizeLimit: "50MB",
    },
  },
}

export default trpcNext.createNextApiHandler({
  router: appRouter,
  /**
   * @link https://trpc.io/docs/context
   */
  createContext,
  /**
   * @link https://trpc.io/docs/error-handling
   */
  onError({ error, ctx }) {
    if (error.code === "UNAUTHORIZED") {
      ctx?.session?.destroy()
    }
  },
  /**
   * Enable query batching
   */
  batching: {
    enabled: false,
  },
  /**
   * @link https://trpc.io/docs/caching#api-response-caching
   */
  // responseMeta() {
  //   // ...
  // },
})
