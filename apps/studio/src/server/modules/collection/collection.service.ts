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
        summary: [],
      },
    },
    content: [],
    version: "0.1.0",
  } satisfies PrismaJson.BlobJsonContent
}

export const createCollectionPdfJson = ({
  url: _url,
}: {
  type: "pdf" // Act as soft typeguard
  url: string
}) => {
  return {
    layout: "content",
    page: {
      contentPageHeader: {
        summary: "",
      },
    },
    // TODO: Add pdf blob to content
    content: [],
    version: "0.1.0",
  } satisfies PrismaJson.BlobJsonContent
}
