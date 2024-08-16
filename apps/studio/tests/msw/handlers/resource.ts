import { trpcMsw } from "../mockTrpc"

export const resourceHandlers = {
  getChildrenOf: {
    default: () => {
      return trpcMsw.resource.getChildrenOf.query(() => {
        return {
          items: [],
          nextOffset: null,
        }
      })
    },
  },
}
