import type { UnwrapTagged } from "type-fest"
import { format } from "date-fns"

export const createCollectionPageJson = ({}: {
  type: "page" // Act as soft typeguard
}) => {
  return {
    layout: "article",
    page: {
      date: format(new Date(), "dd-MM-yyyy"),
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
  type: "link" // Act as soft typeguard
}) => {
  return {
    layout: "link",
    page: {
      ref: "",
      summary: "",
    },
    content: [],
    // TODO: Add pdf blob to content
    version: "0.1.0",
  } satisfies UnwrapTagged<PrismaJson.BlobJsonContent>
}
