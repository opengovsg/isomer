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
          lastModified: new Date().toLocaleDateString(undefined, {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
          title,
          contentPageHeader: {
            summary: "",
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
          title,
          date: format(new Date(), "dd-MM-yyyy"),
          category: "Feature Articles",
          articlePageHeader: {
            summary: [],
          },
        },
        content: [],
        version: "0.1.0",
      } satisfies PrismaJson.BlobJsonContent

      return articleDefaultPage
    }
  }
}
