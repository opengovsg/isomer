const COLLECTION = {
  page: {
    lastModified: "2024-10-17T01:46:20.222Z",
    articlePageHeader: { summary: "" },
  },
  layout: "article",
  content: [],
  version: "0.1.0",
} as const;
const generateCollectionArticlePage = (
  category: string,
  title: string,
  permalink: string,
) => {
  return {
    ...COLLECTION,
    page: { ...COLLECTION.page, category, title, permalink },
  };
};
