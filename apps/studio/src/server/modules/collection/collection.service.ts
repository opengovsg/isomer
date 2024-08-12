import { format } from "date-fns"

export const createCollectionPageJson = ({
  title,
}: {
  type: "page" // Act as soft typeguard
  title: string
}) => {
  return {
    layout: "article",
    page: {
      title,
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
  title,
  url: _url,
}: {
  type: "pdf" // Act as soft typeguard
  title: string
  url: string
}) => {
  return {
    layout: "content",
    page: {
      title,
      contentPageHeader: {
        summary: "",
      },
    },
    // TODO: Add pdf blob to content
    content: [],
    version: "0.1.0",
  } satisfies PrismaJson.BlobJsonContent
}
