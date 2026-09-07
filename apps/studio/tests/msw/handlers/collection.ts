import { ResourceState, ResourceType } from "~prisma/generated/generatedEnums"

import { MOCK_STORY_DATE } from "../constants"
import { asBlobJsonContent } from "../helpers"
import { trpcMsw } from "../mockTrpc"

export const DEFAULT_COLLECTION_ITEMS = [
  {
    createdAt: new Date("2024-09-12T07:00:30.000Z"),
    draftBlobId: null,
    id: "8",
    parentId: "2",
    permalink: "mock-link",
    publishedVersionId: null,
    scheduledAt: null,
    scheduledBy: null,
    siteId: 1,
    state: ResourceState.Draft,
    title: "Test link 1",
    type: ResourceType.CollectionLink,
    updatedAt: new Date("2024-09-12T07:00:30.000Z"),
  },
  {
    createdAt: new Date("2024-09-12T07:00:30.000Z"),
    draftBlobId: "4",
    id: "5",
    parentId: "2",
    permalink: "test-page-1",
    publishedVersionId: null,
    scheduledAt: null,
    scheduledBy: null,
    siteId: 1,
    state: ResourceState.Draft,
    title: "Test page 1",
    type: ResourceType.CollectionPage,
    updatedAt: new Date("2024-09-12T07:00:20.000Z"),
  },
]
export const collectionHandlers = {
  countTagOptionsUsage: {
    default: () =>
      trpcMsw.collection.countTagOptionsUsage.query(() => ({ count: 3 })),
    zero: () =>
      trpcMsw.collection.countTagOptionsUsage.query(() => ({ count: 0 })),
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
        scheduledAt: null,
        scheduledBy: null,
        draftBlobId: "1",
      })),
  },
  list: {
    default: () =>
      trpcMsw.collection.list.query(() => DEFAULT_COLLECTION_ITEMS),
  },
  readCollectionLink: {
    default: () =>
      trpcMsw.collection.readCollectionLink.query(() => ({
        content: asBlobJsonContent({
          page: {
            ref: "",
            date: "24-10-2024",
            summary: "",
            category: "Others",
          },
          layout: "link",
          content: [],
          version: "0.1.0",
        }),
        title: "yet another link",
      })),
    thumbnail: () =>
      trpcMsw.collection.readCollectionLink.query(() => ({
        content: asBlobJsonContent({
          page: {
            ref: "",
            date: "24-10-2024",
            summary: "",
            category: "Others",
            image: { src: "www.google.com", alt: "fake news" },
          },
          layout: "link",
          content: [],
          version: "0.1.0",
        }),
        title: "Link with image",
      })),
  },
}
