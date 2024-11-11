import type { UnwrapTagged } from "type-fest"
import { ISOMER_PAGE_LAYOUTS } from "@opengovsg/isomer-components"
import { format } from "date-fns"

import type { ResourceType } from "../database"

export const createCollectionPageJson = ({}: {
  type: typeof ResourceType.CollectionPage // Act as soft typeguard
}) => {
  return {
    layout: ISOMER_PAGE_LAYOUTS.Article,
    page: {
      date: format(new Date(), "dd/MM/yyyy"),
      // TODO: this is actually supposed to be passed from the frontend
      // which is not done at present
      category: "Feature Articles",
      articlePageHeader: {
        summary: "",
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
    layout: ISOMER_PAGE_LAYOUTS.Link,
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
