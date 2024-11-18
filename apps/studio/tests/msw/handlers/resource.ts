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
  search: {
    initial: () => {
      return trpcMsw.resource.search.query(() => {
        return {
          totalCount: null,
          resources: [],
          suggestions: {
            recentlyEdited: Array.from({ length: 5 }, (_, i) => {
              const title = `testing ${i}`
              const permalink = title.toLowerCase().replace(/ /g, "-")
              return {
                id: (5 - i).toString(),
                title,
                permalink,
                type: "Page",
                parentId: null,
                lastUpdatedAt: new Date(`2024-01-0${3 - i}`),
                fullPermalink: permalink,
              }
            }),
          },
        }
      })
    },
    results: () => {
      return trpcMsw.resource.search.query(() => {
        return {
          totalCount: 4,
          resources: [
            {
              id: "1",
              title:
                "covid testing collection link (both terms should be highlighted)",
              permalink:
                "covid-testing-collection-link-both-terms-should-be-highlighted",
              type: "CollectionLink",
              parentId: null,
              lastUpdatedAt: new Date("2024-01-01"),
              fullPermalink:
                "covid-testing-collection-link-both-terms-should-be-highlighted",
            },
            {
              id: "2",
              title:
                "super duper unnecessary long title why is this even so long but the matching word covid is near the end",
              permalink:
                "super-duper-unnecessary-long-title-why-is-this-even-so-long-but-the-matching-word-covid-is-near-the-end",
              type: "Page",
              parentId: null,
              lastUpdatedAt: new Date("2024-01-01"),
              fullPermalink:
                "super-duper-unnecessary-long-title-why-is-this-even-so-long-but-the-matching-word-covid-is-near-the-end",
            },
            {
              id: "3",
              title: "covid folder that should not display lastUpdatedAt",
              permalink: "covid-folder-that-should-not-display-lastupdatedat",
              type: "Folder",
              parentId: null,
              lastUpdatedAt: new Date("2024-01-01"),
              fullPermalink:
                "covid-folder-that-should-not-display-lastupdatedat",
            },
            {
              id: "4",
              title: "covid collection that should not display lastUpdatedAt",
              permalink:
                "covid-collection-that-should-not-display-lastupdatedat",
              type: "Collection",
              parentId: null,
              lastUpdatedAt: new Date("2024-01-01"),
              fullPermalink:
                "covid-collection-that-should-not-display-lastupdatedat",
            },
          ],
          suggestions: {
            recentlyEdited: [],
          },
        }
      })
    },
    loading: () => {
      return trpcMsw.resource.search.query(() => {
        return new Promise(() => {
          // Never resolve to simulate infinite loading
        })
      })
    },
  },
}
