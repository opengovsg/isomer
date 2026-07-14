import type { RouterOutput } from "~/utils/trpc"
import { DEFAULT_TAG_CATEGORY_DISPLAY } from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import {
  GAZETTE_SUBCATEGORY_LABEL,
  governmentGazetteSubcategories,
} from "~/features/gazettes/constants"
import { ResourceState, ResourceType } from "~prisma/generated/generatedEnums"

import { MOCK_STORY_DATE } from "../constants"
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
  ({
    layout: "link",
    page: {
      ref,
      date: "12/09/2024",
      category,
      description,
      tagged,
    },
    content: [],
    version: "0.1.0",
  }) as unknown as PrismaJson.BlobJsonContent

type GazetteItem = RouterOutput["gazette"]["list"][number]

export const createGazetteItem = (
  overrides: Partial<GazetteItem>,
): GazetteItem => ({
  id: "101",
  title: "Limited Liability Partnerships Act 2005 - Section 64",
  permalink: "limited-liability-partnerships-act-2005-section-64",
  siteId: 1,
  parentId: "1",
  publishedVersionId: "101",
  draftBlobId: null,
  type: ResourceType.CollectionLink,
  state: ResourceState.Published,
  createdAt: MOCK_STORY_DATE,
  updatedAt: MOCK_STORY_DATE,
  scheduledAt: MOCK_STORY_DATE,
  scheduledBy: null,
  publishedAt: MOCK_STORY_DATE,
  fileSize: 123456,
  content: createGazetteContent({
    ref: "/gazettes/26gg5734.pdf",
    category: "Government Gazette",
    description: "2145",
    tagged: [governmentGazetteSubcategories.NOTICES_UNDER_OTHER_ACTS],
  }),
  ...overrides,
})

export const DEFAULT_GAZETTE_ITEMS: RouterOutput["gazette"]["list"] = [
  {
    id: "101",
    title: "Limited Liability Partnerships Act 2005 - Section 64",
    permalink: "limited-liability-partnerships-act-2005-section-64",
    siteId: 1,
    parentId: "1",
    publishedVersionId: null,
    draftBlobId: "101",
    type: ResourceType.CollectionLink,
    state: ResourceState.Draft,
    createdAt: MOCK_STORY_DATE,
    updatedAt: MOCK_STORY_DATE,
    scheduledAt: new Date("2024-09-13T09:00:00.000Z"),
    scheduledBy: "cljcnahpn0000xlwynuea40lv",
    publishedAt: null,
    fileSize: 123456,
    content: createGazetteContent({
      ref: "/gazettes/26gg5734.pdf",
      category: "Government Gazette",
      description: "2145",
      tagged: [governmentGazetteSubcategories.NOTICES_UNDER_OTHER_ACTS],
    }),
  },
  {
    id: "102",
    title: "Appointment of Commissioner of Inland Revenue",
    permalink: "appointment-of-commissioner-of-inland-revenue",
    siteId: 1,
    parentId: "1",
    publishedVersionId: "102",
    draftBlobId: null,
    type: ResourceType.CollectionLink,
    state: ResourceState.Published,
    createdAt: MOCK_STORY_DATE,
    updatedAt: MOCK_STORY_DATE,
    scheduledAt: MOCK_STORY_DATE,
    scheduledBy: null,
    publishedAt: MOCK_STORY_DATE,
    fileSize: 654321,
    content: createGazetteContent({
      ref: "/gazettes/26gg5701.pdf",
      category: "Government Gazette",
      description: "2101",
      tagged: [governmentGazetteSubcategories.APPOINTMENTS],
    }),
  },
]

const GAZETTE_TAG_CATEGORIES = [
  {
    label: GAZETTE_SUBCATEGORY_LABEL,
    id: "0e02b2c3-58cc-4372-a567-f47ac10b3d47",
    display: DEFAULT_TAG_CATEGORY_DISPLAY,
    options: Object.values(governmentGazetteSubcategories).map(
      (label, index) => ({
        label,
        id: `6ba7b810-9dad-11d1-80b4-00c04fd430${String(index).padStart(2, "0")}`,
      }),
    ),
  },
]

export const gazetteHandlers = {
  list: {
    default: () => trpcMsw.gazette.list.query(() => DEFAULT_GAZETTE_ITEMS),
    empty: () => trpcMsw.gazette.list.query(() => []),
    withItems: (items: RouterOutput["gazette"]["list"]) =>
      trpcMsw.gazette.list.query(() => items),
  },
  collectionTags: {
    default: () =>
      trpcMsw.collection.getCollectionTags.query(() => GAZETTE_TAG_CATEGORIES),
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
  create: {
    duplicateNotificationNumber: () =>
      trpcMsw.gazette.create.mutation(() => {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A gazette with the same notification number already exists",
        })
      }),
  },
}
