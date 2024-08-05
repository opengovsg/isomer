export const createCollectionPageJson = ({
  title,
}: {
  type: "page" // Act as soft typeguard
  title: string
}) => {
  return {
    layout: "content",
    page: {
      title,
      contentPageHeader: {
        summary: "",
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
