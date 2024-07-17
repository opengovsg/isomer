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
          date: "15 Feb 2024",
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
