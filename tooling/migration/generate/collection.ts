const COLLECTION = {
  page: {
    articlePageHeader: { summary: "" },
  },
  layout: "article",
  version: "0.1.0",
} as const;

interface GenerateCollectionArticlePageProps {
  category: string;
  title: string;
  permalink: string;
  content: unknown;
  lastModified: string;
}

const generateCollectionArticlePage = ({
  category,
  title,
  permalink,
  content,
}: GenerateCollectionArticlePageProps) => {
  return {
    ...COLLECTION,
    page: { ...COLLECTION.page, category, title, permalink },
    content,
  };
};

// NOTE: all non alphanumeric characters at beginning and end
const trimNonAlphaNum = (category: string) => {
  const NON_ALPHA = /[^a-zA-Z0-9]*/g;
  const NO_STARTING_NON_ALPHA = "" + NON_ALPHA.source;
  const NO_ENDING_NON_ALPHA = NON_ALPHA.source + "$";

  return category
    .replaceAll(NO_STARTING_NON_ALPHA, "")
    .replaceAll(NO_ENDING_NON_ALPHA, "");
};

const parseCollectionDateFromFileName = (filename: string) => {
  const year = filename.slice(0, 4);
  const month = filename.slice(5, 7);
  const day = filename.slice(8, 10);

  if (year.length !== 4 || month.length !== 2 || day.length !== 2) {
    throw new Error("Invalid date format");
  }

  return { year, month, day };
};

const extractCollectionFileName = (filename: string) => {
  return filename.slice(12);
};
