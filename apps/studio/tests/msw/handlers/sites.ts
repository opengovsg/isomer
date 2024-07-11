import { trpcMsw } from "../mockTrpc"

const siteListQuery = () => {
  return trpcMsw.site.list.query(() => {
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
  },
}
