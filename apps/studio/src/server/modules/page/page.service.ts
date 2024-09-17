import { format } from "date-fns"

export const createDefaultPage = ({
  title,
  layout,
}: {
  layout: "content" | "article"
  title: string
}) => {
  switch (layout) {
    case "content": {
      const contentDefaultPage = {
        layout: "content",
        page: {
          noIndex: false,
          contentPageHeader: {
            summary: "This is the page summary",
          },
        },
        content: [],
        version: "0.1.0",
      } satisfies PrismaJson.BlobJsonContent
      return contentDefaultPage
    }

    case "article": {
      const articleDefaultPage = {
        layout: "article",
        page: {
          noIndex: false,
          date: format(new Date(), "dd-MM-yyyy"),
          category: "Feature Articles",
          articlePageHeader: {
            summary: ["This is the page summary"],
          },
        },
        content: [],
        version: "0.1.0",
      } satisfies PrismaJson.BlobJsonContent

      return articleDefaultPage
    }
  }
}
