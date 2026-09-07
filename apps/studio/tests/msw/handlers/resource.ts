/* oxlint-disable promise/avoid-new -- studio lint cleanup */
import type { RouterOutput } from "~/utils/trpc"

import { trpcMsw } from "../mockTrpc"
import { DEFAULT_COLLECTION_ITEMS } from "./collection"
import { DEFAULT_PAGE_ITEMS } from "./page"

export const resourceHandlers = {
  getAncestryStack: {
    default: () => trpcMsw.resource.getAncestryStack.query(() => []),
    // Ancestors of a collection item sitting in `/resources/circulars`, root-first.
    nestedCollection: () =>
      trpcMsw.resource.getAncestryStack.query(() => [
        {
          id: "10",
          parentId: null,
          title: "Resources",
          permalink: "resources",
          type: "Folder",
        },
        {
          id: "11",
          parentId: "10",
          title: "Circulars",
          permalink: "circulars",
          type: "Collection",
        },
      ]),
  },
  getBatchAncestryWithSelf: {
    default: () =>
      trpcMsw.resource.getBatchAncestryWithSelf.query(() => [
        [
          {
            parentId: null,
            id: "1",
            title: "Collection 1",
            permalink: "collection-1",
            type: "Collection",
          },
        ],
        [
          {
            parentId: null,
            id: "2",
            title: "Folder 1",
            permalink: "folder-1",
            type: "Folder",
          },
        ],
        [
          {
            parentId: null,
            id: "3",
            title: "Page 1",
            permalink: "page-1",
            type: "Page",
          },
        ],
      ]),
    foldersOnly: () =>
      trpcMsw.resource.getBatchAncestryWithSelf.query(() => [
        [
          {
            parentId: null,
            id: "1",
            title: "Folder 1",
            permalink: "folder-1",
            type: "Folder",
          },
        ],
        [
          {
            parentId: null,
            id: "2",
            title: "Folder 2",
            permalink: "folder-2",
            type: "Folder",
          },
        ],
      ]),
    noResults: () => trpcMsw.resource.getBatchAncestryWithSelf.query(() => []),
  },
  getChildrenOf: {
    collection: () =>
      trpcMsw.resource.getChildrenOf.query(({ input: { resourceId } }) => {
        const items = DEFAULT_COLLECTION_ITEMS.map((item) => ({
          title: item.title,
          permalink: item.permalink,
          parentId: item.parentId,
          type: item.type,
          // ID must be unique so infinite loop won't occur
          id: `${resourceId}-${item.title}-${item.id}`,
        }))
        return {
          items,
          nextOffset: null,
        }
      }),
    default: () =>
      trpcMsw.resource.getChildrenOf.query(({ input: { resourceId } }) => {
        const items = DEFAULT_PAGE_ITEMS.map((item) => ({
          title: item.title,
          permalink: item.permalink,
          // SAFETY: DEFAULT_PAGE_ITEMS only uses these child resource types.
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
          type: item.type as
            | "Page"
            | "Folder"
            | "Collection"
            | "CollectionPage",
          // ID must be unique so infinite loop won't occur
          id: `${resourceId}-${item.title}-${item.id}`,
          parentId: item.parentId,
        }))
        return {
          items,
          nextOffset: null,
        }
      }),
  },
  getMetadataById: {
    homepage: () =>
      trpcMsw.resource.getMetadataById.query(() => ({
        id: "1",
        type: "RootPage",
        title: "Home",
        permalink: "home",
        parentId: null,
        siteId: 1,
        publishedVersionId: null,
      })),
    content: () =>
      trpcMsw.resource.getMetadataById.query(() => ({
        id: "3",
        type: "Page",
        title: "Page title here",
        permalink: "page-title-here",
        parentId: null,
        siteId: 1,
        publishedVersionId: "1",
      })),
    article: () =>
      trpcMsw.resource.getMetadataById.query(() => ({
        id: "4",
        type: "Page",
        title: "article layout",
        permalink: "article-layout",
        parentId: null,
        siteId: 1,
        publishedVersionId: null,
      })),
    index: () =>
      trpcMsw.resource.getMetadataById.query(() => ({
        id: "3",
        type: "IndexPage",
        title: "Index page",
        permalink: "_index",
        parentId: null,
        siteId: 1,
        publishedVersionId: null,
      })),
    database: () =>
      trpcMsw.resource.getMetadataById.query(() => ({
        id: "4",
        type: "Page",
        title: "database layout",
        permalink: "database-layout",
        parentId: null,
        siteId: 1,
        publishedVersionId: null,
      })),
    // Resolves the mocked metadata by the requested `resourceId`, so a story
    // can give the moved resource and the picked destination distinct types
    // (e.g. a Page moved onto a Collection) to exercise move validation.
    byId: (
      resourcesById: Record<
        string,
        RouterOutput["resource"]["getMetadataById"]
      >,
    ) =>
      trpcMsw.resource.getMetadataById.query(({ input: { resourceId } }) => {
        const resource = resourcesById[resourceId]
        if (!resource) {
          throw new Error(`No mocked resource for id ${resourceId}`)
        }
        return resource
      }),
  },
  getParentOf: {
    collection: () =>
      trpcMsw.resource.getParentOf.query(() => ({
        type: "Collection",
        id: "1",
        parentId: null,
        parent: null,
        title: "a collection",
      })),
    folder: () =>
      trpcMsw.resource.getParentOf.query(() => ({
        type: "Folder",
        id: "1",
        parentId: null,
        parent: null,
        title: "a folder",
      })),
  },
  getRolesFor: {
    admin: () => trpcMsw.resource.getRolesFor.query(() => [{ role: "Admin" }]),
    editor: () =>
      trpcMsw.resource.getRolesFor.query(() => [{ role: "Editor" }]),
    publisher: () =>
      trpcMsw.resource.getRolesFor.query(() => [{ role: "Publisher" }]),
  },
  getWithFullPermalink: {
    default: () =>
      trpcMsw.resource.getWithFullPermalink.query(() => ({
        id: "1",
        title: "Homepage",
        fullPermalink: "folder/page",
      })),
    index: () =>
      trpcMsw.resource.getWithFullPermalink.query(() => ({
        id: "4",
        title: "Index page",
        fullPermalink: "parent/_index",
      })),
  },
  search: {
    initial: () =>
      trpcMsw.resource.search.query(() => ({
        totalCount: null,
        resources: [],
        recentlyEdited: Array.from({ length: 5 }, (_, i) => {
          const title = `testing ${i}`
          const permalink = title.toLowerCase().replaceAll(" ", "-")
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
        nextOffset: null,
      })),
    loading: () =>
      trpcMsw.resource.search.query(
        async () =>
          await new Promise(() => {
            // Never resolve to simulate infinite loading
          }),
      ),
    results: () =>
      trpcMsw.resource.search.query(() => ({
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
            fullPermalink: "covid-folder-that-should-not-display-lastupdatedat",
          },
          {
            id: "4",
            title: "covid collection that should not display lastUpdatedAt",
            permalink: "covid-collection-that-should-not-display-lastupdatedat",
            type: "Collection",
            parentId: null,
            lastUpdatedAt: new Date("2024-01-01"),
            fullPermalink:
              "covid-collection-that-should-not-display-lastupdatedat",
          },
        ],
        recentlyEdited: [],
        nextOffset: null,
      })),
  },
  searchWithResourceIds: {
    default: () =>
      trpcMsw.resource.searchWithResourceIds.query(() => [
        {
          id: "1",
          title: "Recently viewed page",
          permalink: "recently-viewed-page",
          type: "Page",
          parentId: null,
          lastUpdatedAt: new Date("2024-01-01"),
          fullPermalink: "recently-viewed-page",
        },
        {
          id: "2",
          title: "Another recently viewed page",
          permalink: "another-recently-viewed-page",
          type: "Page",
          parentId: null,
          lastUpdatedAt: new Date("2024-01-01"),
          fullPermalink: "another-recently-viewed-page",
        },
        {
          id: "3",
          title: "Third recently viewed page",
          permalink: "third-recently-viewed-page",
          type: "Page",
          parentId: null,
          lastUpdatedAt: new Date("2024-01-01"),
          fullPermalink: "third-recently-viewed-page",
        },
      ]),
  },
}
