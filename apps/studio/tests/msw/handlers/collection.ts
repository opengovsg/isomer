import { MOCK_STORY_DATE } from "../constants"
import { trpcMsw } from "../mockTrpc"
import { DEFAULT_COLLECTION_ITEMS } from "./page"

export const collectionHandlers = {
  getMetadata: {
    default: () =>
      trpcMsw.collection.getMetadata.query(() => ({
        siteId: 1,
        type: "Collection",
        id: "2",
        createdAt: MOCK_STORY_DATE,
        updatedAt: MOCK_STORY_DATE,
        state: "Draft",
        title: "A mock title",
        permalink: "/mock/title",
        parentId: "1",
        publishedVersionId: null,
        draftBlobId: "1",
      })),
  },
  list: {
    default: () => {
      return trpcMsw.collection.list.query(() => {
        return DEFAULT_COLLECTION_ITEMS.map((item) => ({
          ...item,
          siteId: 1,
          state: "Draft",
          createdAt: MOCK_STORY_DATE,
        }))
      })
    },
  },
  readCollectionLink: {
    default: () => {
      return trpcMsw.collection.readCollectionLink.query(() => ({
        content: {
          page: {
            ref: "",
            date: "24-10-2024",
            summary: "",
            category: "Others",
          },
          layout: "link",
          content: [],
          version: "0.1.0",
          // TODO: not too sure why this error happens
          // but there's a typing issue where we are not satisfying the opaque type
          // oddly enough, this doesn't happen on other handlers
        } as unknown as PrismaJson.BlobJsonContent,
        title: "yet another link",
      }))
    },
  },
}
