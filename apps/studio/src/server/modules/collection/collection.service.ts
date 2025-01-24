import type { UnwrapTagged } from "type-fest"
import { format } from "date-fns"

import type { ResourceType } from "../database"

export const createCollectionIndexPageJson = ({
  title,
}: {
  type: typeof ResourceType.IndexPage // Act as soft typeguard
  title: string
}) => {
  return {
    layout: "collection",
    page: {
      title,
      defaultSortBy: "date",
      defaultSortDirection: "asc",
      subtitle: "Read all our articles here.",
    },
    content: [],
    version: "0.1.0",
  } satisfies UnwrapTagged<PrismaJson.BlobJsonContent>
}

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
