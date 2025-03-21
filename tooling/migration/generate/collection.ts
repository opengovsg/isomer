import { Tagged } from "type-fest";
import { MIGRATION_CALLOUT } from "../constants";
import _ from "lodash";
import {
  extractContent,
  extractFrontmatter,
  JekyllFile,
} from "~/migrate/jekyll";
import { html2schema } from "~/migrate/html2schema";
import { md2html } from "~/migrate/md2html";
import { ArticlePageSchemaType } from "@opengovsg/isomer-components";

// TODO: figure out how to use the base regex to create these two
const NO_STARTING_NON_ALPHA_NUM = /^[^a-zA-Z0-9]*/g;
const NO_ENDING_NON_ALPHA_NUM = /[^a-zA-Z0-9]*$/g;

const COLLECTION_PAGE = {
  page: {
    articlePageHeader: { summary: "" },
  },
  layout: "article",
  version: "0.1.0",
} as const;
const COLLECTION_LINK = {
  layout: "link",
  content: [],
  version: "0.1.0",
};

interface GenerateCollectionLinkProps {
  ref: string;
  date: string;
  category: string;
}
export const generateCollectionLink = ({
  ref,
  date,
  category,
}: GenerateCollectionLinkProps) => {
  return {
    page: { ref, date, category },
    ...COLLECTION_LINK,
  };
};

export type CollectionPageName = Tagged<string, "CollectionPageName">;
interface GenerateCollectionArticlePageProps {
  category: string;
  title: CollectionPageName;
  permalink: string;
  content: unknown;
  lastModified: string;
}

export const generateCollectionArticlePage = ({
  category,
  title,
  permalink,
  content,
  lastModified,
}: GenerateCollectionArticlePageProps): Omit<ArticlePageSchemaType, "site"> => {
  return {
    ...COLLECTION_PAGE,
    page: {
      ...COLLECTION_PAGE.page,
      category,
      title,
      permalink,
      lastModified,
      date: lastModified,
      articlePageHeader: {
        summary: " ",
      },
    },
    // FIXME: Enforce typing later
    content: [
      MIGRATION_CALLOUT,
      ...(content as ArticlePageSchemaType["content"]),
    ],
  };
};

// NOTE: Don't export this type - this is to ensure that whatever
// we pass to generate the collection name has been cleaned prior
type CleanedString = Tagged<string, "Cleaned">;

// NOTE: all non alphanumeric characters at beginning and end
export const trimNonAlphaNum = (category: string): CleanedString => {
  return category
    .replaceAll(NO_STARTING_NON_ALPHA_NUM, "")
    .replaceAll(NO_ENDING_NON_ALPHA_NUM, "") as CleanedString;
};

// NOTE: A collection post name is the date in YYYY-MM-DD- followed by the page name
type CollectionPostName = Tagged<string, "CollectionPostName">;
export const isCollectionPost = (
  filename: string,
): filename is CollectionPostName => {
  const year = filename.slice(0, 4);
  const month = filename.slice(5, 7);
  const day = filename.slice(8, 10);

  return (
    year.length === 4 &&
    !!parseInt(year) &&
    month.length === 2 &&
    !!parseInt(month) &&
    day.length === 2 &&
    !!parseInt(day)
  );
};

export const parseCollectionDateFromString = (possibleDateString: string) => {
  const date = new Date(possibleDateString);

  const year = date.getFullYear().toString();
  const month = date.getMonth().toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return { year, month, day };
};

// NOTE: used to make sure that whatever we pass to extract the filename
// has already been cleaned of the date
type RawCollectionPostName = Tagged<string, "RawCollectionPostName">;

export const extractCollectionPostName = (
  filename: string,
): RawCollectionPostName => {
  const baseFileName = filename.length < 12 ? filename : filename.slice(11);
  return baseFileName.replaceAll(/\.html$/g, "") as RawCollectionPostName;
};

export const getCollectionPageNameFromPage = (
  filename: string,
): CollectionPageName => {
  return filename
    .replaceAll("-", " ")
    .replaceAll(/\.html$/g, "") as CollectionPageName;
};

export const getCollectionPageNameFromPost = (
  filename: RawCollectionPostName,
): CollectionPageName => {
  return filename.replaceAll("-", " ") as CollectionPageName;
};

export const getCollectionCategory = (category: string) => {
  return _.upperFirst(trimNonAlphaNum(category)).replaceAll(
    /[^a-zA-Z0-9]+/g,
    " ",
  );
};

export const extractMetadataFromName = (name: CollectionPostName) => {
  const { year, month, day } = parseCollectionDateFromString(name);
  const lastModified = `${day}/${month}/${year}`;
  const rawFileName = extractCollectionPostName(name);

  return {
    lastModified,
    rawFileName,
  };
};

export const getValidPermalink = (rawPermalink: string) => {
  return rawPermalink
    .replaceAll(/[_ ]+/g, "-")
    .replaceAll(/[^a-zA-Z0-9-]+/g, "")
    .toLowerCase();
};

const getStudioPermalinkFromJekyll = (rawPermalink: string) => {
  return getValidPermalink(rawPermalink.split("/").filter(Boolean).pop() || "");
};

export const jekyllPost2CollectionPage = async (
  name: CollectionPostName,
  post: JekyllFile,
  category: string,
) => {
  const frontmatter = extractFrontmatter(post);
  const jekyllContent = extractContent(post);

  const html = md2html(jekyllContent);
  const output = await html2schema(html, "");

  const { lastModified, rawFileName } = extractMetadataFromName(name);

  return generateCollectionArticlePage({
    category,
    title:
      (frontmatter.title as CollectionPageName) ??
      getCollectionPageNameFromPost(rawFileName),
    permalink: getStudioPermalinkFromJekyll(frontmatter.permalink || ""),
    content: output,
    lastModified,
  });
};

export const jekyllPage2CollectionPage = async (
  name: string,
  post: JekyllFile,
  category: string,
) => {
  const frontmatter = extractFrontmatter(post);
  const jekyllContent = extractContent(post);

  const html = md2html(jekyllContent);
  const output = await html2schema(html, "");

  const lastModified = new Date().toLocaleDateString("en-GB");
  const title =
    (frontmatter.title as CollectionPageName) ??
    getCollectionPageNameFromPage(name);

  return generateCollectionArticlePage({
    category,
    title,
    permalink: getStudioPermalinkFromJekyll(frontmatter.permalink || ""),
    content: output,
    lastModified,
  });
};
