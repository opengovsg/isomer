import { trpcMsw } from "../mockTrpc"
import { DEFAULT_PAGE_ITEMS } from "./page"

export const resourceHandlers = {
  getChildrenOf: {
    default: () => {
      return trpcMsw.resource.getChildrenOf.query(({ resourceId }) => {
        const items = DEFAULT_PAGE_ITEMS.map((item) => ({
          title: item.title,
          permalink: item.permalink,
          type: item.type as
            | "Page"
            | "Folder"
            | "Collection"
            | "CollectionPage",
          // ID must be unique so infinite loop won't occur
          id: `${resourceId}-${item.title}-${item.id}`,
        }))
        return {
          items,
          nextOffset: null,
        }
      })
    },
  },
  getRolesFor: {
    default: () => {
      return trpcMsw.resource.getRolesFor.query(() => {
        return [{ role: "Admin" }]
      })
    },
  },
  getParentOf: {
    collection: () => {
      return trpcMsw.resource.getParentOf.query(() => {
        return {
          type: "Collection",
          id: "1",
          parentId: null,
          parent: null,
          title: "a collection",
        }
      })
    },
  },
  getAncestryOf: {
    collectionLink: () => {
      return trpcMsw.resource.getAncestryOf.query(() => {
        return [
          {
            parentId: null,
            id: "1",
            title: "Homepage",
            permalink: "/",
          },
        ]
      })
    },
  },
  getWithFullPermalink: {
    default: () => {
      return trpcMsw.resource.getWithFullPermalink.query(() => {
        return {
          id: "1",
          title: "Homepage",
          fullPermalink: "folder/page",
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
