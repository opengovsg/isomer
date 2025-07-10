import type { UnwrapTagged } from "type-fest"
import {
  COLLECTION_PAGE_DEFAULT_SORT_BY,
  COLLECTION_PAGE_DEFAULT_SORT_DIRECTION,
  CollectionPagePageProps,
  ISOMER_USABLE_PAGE_LAYOUTS,
} from "@opengovsg/isomer-components"
import { format } from "date-fns"

import type { ResourceType } from "../database"

export const createCollectionPageJson = ({}: {
  type: typeof ResourceType.CollectionPage // Act as soft typeguard
}) => {
  return {
    layout: "article",
    page: {
      date: format(new Date(), "dd/MM/yyyy"),
      // TODO: this is actually supposed to be passed from the frontend
      // which is not done at present
      category: "Feature Articles",
      articlePageHeader: {
        summary: "A concise summary of the main points regarding this article.",
      },
    },
    content: [],
    version: "0.1.0",
  } satisfies UnwrapTagged<PrismaJson.BlobJsonContent>
}

export const createCollectionLinkJson = ({}: {
  type: typeof ResourceType.CollectionLink // Act as soft typeguard
}) => {
  return {
    layout: "link",
    page: {
      ref: "",
      summary: "",
      category: "",
      date: format(new Date(), "dd/MM/yyyy"),
    },
    content: [],
    // TODO: Add pdf blob to content
    version: "0.1.0",
  } satisfies UnwrapTagged<PrismaJson.BlobJsonContent>
}

export const createCollectionIndexJson = (title: string) => {
  return {
    layout: ISOMER_USABLE_PAGE_LAYOUTS.Collection,
    page: {
      title,
      subtitle: `Read more on ${title.toLowerCase()} here.`,
      defaultSortBy: COLLECTION_PAGE_DEFAULT_SORT_BY,
      defaultSortDirection: COLLECTION_PAGE_DEFAULT_SORT_DIRECTION,
    } as CollectionPagePageProps,
    content: [],
    version: "0.1.0",
  }
}
