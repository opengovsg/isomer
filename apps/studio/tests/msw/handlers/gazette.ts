import type { RouterOutput } from "~/utils/trpc"
import { DEFAULT_TAG_CATEGORY_DISPLAY } from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import {
  GAZETTE_SUBCATEGORY_LABEL,
  governmentGazetteSubcategories,
} from "~/features/gazettes/constants"
import { ResourceState, ResourceType } from "~prisma/generated/generatedEnums"

import { MOCK_STORY_DATE } from "../constants"
import { asBlobJsonContent } from "../helpers"
import { trpcMsw } from "../mockTrpc"

interface GazetteContentInputs {
  ref: string
  category: string
  description?: string
  tagged: string[]
}

export const createGazetteContent = ({
  ref,
  category,
  description,
  tagged,
}: GazetteContentInputs) =>
  asBlobJsonContent({
    content: [],
    layout: "link",
    page: {
      category,
      date: "12/09/2024",
      description,
      ref,
      tagged,
    },
    version: "0.1.0",
  })

type GazetteItem = RouterOutput["gazette"]["list"][number]

export const createGazetteItem = (
  overrides: Partial<GazetteItem>,
): GazetteItem => ({
  content: createGazetteContent({
    ref: "/gazettes/26gg5734.pdf",
    category: "Government Gazette",
    description: "2145",
    tagged: [governmentGazetteSubcategories.NOTICES_UNDER_OTHER_ACTS],
  }),
  createdAt: MOCK_STORY_DATE,
  draftBlobId: null,
  fileSize: 123_456,
  id: "101",
  parentId: "1",
  permalink: "limited-liability-partnerships-act-2005-section-64",
  publishedAt: MOCK_STORY_DATE,
  publishedVersionId: "101",
  scheduledAt: MOCK_STORY_DATE,
  scheduledBy: null,
  siteId: 1,
  state: ResourceState.Published,
  title: "Limited Liability Partnerships Act 2005 - Section 64",
  type: ResourceType.CollectionLink,
  updatedAt: MOCK_STORY_DATE,
  ...overrides,
})

export const DEFAULT_GAZETTE_ITEMS: RouterOutput["gazette"]["list"] = [
  {
    content: createGazetteContent({
      ref: "/gazettes/26gg5734.pdf",
      category: "Government Gazette",
      description: "2145",
      tagged: [governmentGazetteSubcategories.NOTICES_UNDER_OTHER_ACTS],
    }),
    createdAt: MOCK_STORY_DATE,
    draftBlobId: "101",
    fileSize: 123_456,
    id: "101",
    parentId: "1",
    permalink: "limited-liability-partnerships-act-2005-section-64",
    publishedAt: null,
    publishedVersionId: null,
    scheduledAt: new Date("2024-09-13T09:00:00.000Z"),
    scheduledBy: "cljcnahpn0000xlwynuea40lv",
    siteId: 1,
    state: ResourceState.Draft,
    title: "Limited Liability Partnerships Act 2005 - Section 64",
    type: ResourceType.CollectionLink,
    updatedAt: MOCK_STORY_DATE,
  },
  {
    content: createGazetteContent({
      ref: "/gazettes/26gg5701.pdf",
      category: "Government Gazette",
      description: "2101",
      tagged: [governmentGazetteSubcategories.APPOINTMENTS],
    }),
    createdAt: MOCK_STORY_DATE,
    draftBlobId: null,
    fileSize: 654_321,
    id: "102",
    parentId: "1",
    permalink: "appointment-of-commissioner-of-inland-revenue",
    publishedAt: MOCK_STORY_DATE,
    publishedVersionId: "102",
    scheduledAt: MOCK_STORY_DATE,
    scheduledBy: null,
    siteId: 1,
    state: ResourceState.Published,
    title: "Appointment of Commissioner of Inland Revenue",
    type: ResourceType.CollectionLink,
    updatedAt: MOCK_STORY_DATE,
  },
]

const GAZETTE_TAG_CATEGORIES = [
  {
    display: DEFAULT_TAG_CATEGORY_DISPLAY,
    id: "0e02b2c3-58cc-4372-a567-f47ac10b3d47",
    label: GAZETTE_SUBCATEGORY_LABEL,
    options: Object.values(governmentGazetteSubcategories).map(
      (label, index) => ({
        label,
        id: `6ba7b810-9dad-11d1-80b4-00c04fd430${String(index).padStart(2, "0")}`,
      }),
    ),
  },
]

export const gazetteHandlers = {
  collectionTags: {
    default: () =>
      trpcMsw.collection.getCollectionTags.query(() => GAZETTE_TAG_CATEGORIES),
  },
  create: {
    duplicateNotificationNumber: () =>
      trpcMsw.gazette.create.mutation(() => {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A gazette with the same notification number already exists",
        })
      }),
  },
  getPresignedPutUrl: {
    // Points the upload at the in-memory "/storybook/upload" PUT handler so the
    // create flow can reach the gazette.create mutation without hitting S3.
    default: () =>
      trpcMsw.gazette.getPresignedPutUrl.mutation(() => ({
        fileKey: "MOCK_STORYBOOK_GAZETTE.pdf",
        presignedPutUrl: "/storybook/upload",
        contentType: "application/pdf",
        contentDisposition:
          "inline; filename*=UTF-8''MOCK_STORYBOOK_GAZETTE.pdf",
      })),
  },
  list: {
    default: () => trpcMsw.gazette.list.query(() => DEFAULT_GAZETTE_ITEMS),
    empty: () => trpcMsw.gazette.list.query(() => []),
    withItems: (items: RouterOutput["gazette"]["list"]) =>
      trpcMsw.gazette.list.query(() => items),
  },
}
