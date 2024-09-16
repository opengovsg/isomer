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
  getMetadataById: {
    homepage: () =>
      trpcMsw.resource.getMetadataById.query(() => {
        return {
          id: "1",
          type: "RootPage",
          title: "Home",
          permalink: "home",
          parentId: null,
        }
      }),
    content: () =>
      trpcMsw.resource.getMetadataById.query(() => {
        return {
          id: "3",
          type: "Page",
          title: "Page title here",
          permalink: "page-title-here",
          parentId: null,
        }
      }),
    article: () =>
      trpcMsw.resource.getMetadataById.query(() => {
        return {
          id: "4",
          type: "Page",
          title: "article layout",
          permalink: "article-layout",
          parentId: null,
        }
      }),
  },
}
