import { ResourceState, ResourceType } from "~prisma/generated/generatedEnums"

import { MOCK_STORY_DATE } from "../constants"
import { trpcMsw } from "../mockTrpc"

const DEFAULT_COLLECTION_ITEMS = [
  {
    id: "8",
    permalink: "mock-link",
    title: "Test link 1",
    publishedVersionId: null,
    draftBlobId: null,
    type: ResourceType.CollectionLink,
    parentId: "2",
    updatedAt: new Date("2024-09-12T07:00:30.000Z"),
    state: ResourceState.Draft,
    siteId: 1,
    createdAt: new Date("2024-09-12T07:00:30.000Z"),
  },
  {
    id: "5",
    permalink: "test-page-1",
    title: "Test page 1",
    publishedVersionId: null,
    draftBlobId: "4",
    type: ResourceType.CollectionPage,
    parentId: "2",
    updatedAt: new Date("2024-09-12T07:00:20.000Z"),
    state: ResourceState.Draft,
    siteId: 1,
    createdAt: new Date("2024-09-12T07:00:30.000Z"),
  },
]
export const collectionHandlers = {
  list: {
    default: () =>
      trpcMsw.collection.list.query(() => DEFAULT_COLLECTION_ITEMS),
  },
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
