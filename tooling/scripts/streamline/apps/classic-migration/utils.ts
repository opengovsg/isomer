import type { Octokit } from "@octokit/rest";
import { getFileContents, getRecursiveTree } from "./github";
import fm from "front-matter";
import {
  NON_CONTENT_LAYOUTS,
  PLACEHOLDER_ALT_TEXT,
  PLACEHOLDER_GOOGLE_SLIDES_TEXT,
  PLACEHOLDER_IMAGE_IN_TABLE_TEXT,
  PLACEHOLDER_INSTAGRAM_LINK_TEXT,
} from "./constants";
import path from "path";
import { getIsHtmlContainingRedundantDivs } from "./converters/main";
import type { ReviewItem } from "./types";

interface GetPathsToMigrateParams {
  octokit: Octokit;
  site: string;
  folders: string[];
  orphanPages: string[];
  useStagingBranch?: boolean;
}

export const getPathsToMigrate = async ({
  octokit,
  site,
  folders,
  orphanPages,
  useStagingBranch = false,
}: GetPathsToMigrateParams) => {
  const allFolderPages = await Promise.all(
    folders.map((folder) =>
      getRecursiveTree({ site, path: folder, octokit, useStagingBranch })
    )
  ).then((results) => results.flat());

  return [...allFolderPages, ...orphanPages];
};

interface GetCollectionFolderNameParams {
  site: string;
  octokit: Octokit;
  path: string;
  useStagingBranch?: boolean;
}

export const getCollectionFolderName = async ({
  octokit,
  site,
  path,
  useStagingBranch = false,
}: GetCollectionFolderNameParams) => {
  if (!path.includes("_posts")) {
    return path;
  }

  const parentPath = path.split("/_posts")[0];

  let collectionIndex = await getFileContents({
    site,
    path: `${parentPath}/index.html`,
    octokit,
    useStagingBranch,
  });

  if (!collectionIndex) {
    collectionIndex = await getFileContents({
      site,
      path: `${parentPath}/index.md`,
      octokit,
      useStagingBranch,
    });
  }

  if (!collectionIndex) {
    return path;
  }

  const frontmatter = fm(collectionIndex).attributes as any;

  return frontmatter.breadcrumb || frontmatter.title || path;
};

interface GetResourceRoomTitleParams {
  site: string;
  octokit: Octokit;
  resourceRoomName: string;
  useStagingBranch?: boolean;
}

export const getResourceTitleName = async ({
  octokit,
  site,
  resourceRoomName,
  useStagingBranch = false,
}: GetResourceRoomTitleParams) => {
  const resourceRoomIndex = await getFileContents({
    site,
    path: `${resourceRoomName}/index.html`,
    octokit,
    useStagingBranch,
  });

  if (!resourceRoomIndex) {
    return resourceRoomName;
  }

  const frontmatter = fm(resourceRoomIndex).attributes as any;

  return frontmatter.title || resourceRoomName;
};

export const getLegalPermalink = (permalink: string) => {
  // NOTE: We will fully respect the permalink that the site already has, as it
  // would result in a broken link if we change it for them
  // Remove all characters that are not alphanumeric or hyphens
  const cleanedPermalink = permalink
    .toLocaleLowerCase()
    .replace(/[^a-z0-9\-/]/gi, "");

  // Check if only hyphens are left
  if (cleanedPermalink.replace(/-/g, "").length === 0) {
    // Preserve the number of hyphens, ideally there is no conflicts later
    return cleanedPermalink;
  }

  // Replace all hyphens with a single hyphen
  return cleanedPermalink.replace(/-+/g, "-");
};

export const getResourceRoomFileType = (filePath: string) => {
  const fileName = path.basename(path.join("/", filePath));
  // Check if the file name is in the format of YYYY-MM-DD-type-title
  const regex = /^\d{4}-\d{2}-\d{2}-(.*)/;
  const match = regex.exec(fileName);

  if (!match) {
    return undefined;
  }

  const matchedPart = match[1];

  if (!matchedPart) {
    return undefined;
  }

  const potentialType = matchedPart.split("-")[0];

  if (!potentialType || !["post", "file", "link"].includes(potentialType)) {
    return undefined;
  }

  return potentialType;
};

export const getManualReviewItems = async (
  content: any[],
  originalContent: any,
  description: any,
  layout: any,
  variant: any,
  html: string
): Promise<{
  content: any[];
  reviewItems: ReviewItem[];
}> => {
  const reviewItems: ReviewItem[] = [];
  const stringifiedContent = JSON.stringify(content);
  const stringifiedOriginalContent = JSON.stringify(originalContent);

  // Flag pages with custom HTML
  if (variant === "markdown" && !getIsHtmlContainingRedundantDivs(html)) {
    reviewItems.push({
      type: "must-fix",
      message: "Converted from custom HTML",
      action: "Review layout and content",
    });
  }

  // Images with missing alt text
  // NOTE: Will be flagged out by the AI generation, so removing this for now
  // if (
  //   content.some(
  //     (block) =>
  //       (block.type === "image" || block.type === "contentpic") &&
  //       (!block.alt || block.alt === PLACEHOLDER_ALT_TEXT)
  //   )
  // ) {
  //   reviewItems.push("Images with missing alt text");
  // }

  // Images inside tables
  if (stringifiedContent.includes(PLACEHOLDER_IMAGE_IN_TABLE_TEXT)) {
    // Already replaced in the converter script, but highlighting for manual review
    reviewItems.push({
      type: "must-fix",
      message: "Images inside tables were moved out",
      action: "Restructure content in the table",
    });
  }

  // Flag table usages to add captions
  if (
    stringifiedContent.includes(`"type":"table"`) ||
    stringifiedContent.includes('"Table caption"') ||
    stringifiedContent.includes("tableHeader") ||
    stringifiedContent.includes("tableRow")
  ) {
    reviewItems.push({
      type: "must-fix",
      message: "Tables were used",
      action: "Add a caption to all tables",
    });
  }

  // InfoCards were used
  if (content.some((block) => block.type === "infocards")) {
    reviewItems.push({
      type: "review",
      message: "Cards were used",
      action: "Add a Title to the Cards",
    });
  }

  // InfoCards with more than 30 cards were used
  if (
    content.some(
      (block) => block.type === "infocards" && block.cards.length > 30
    )
  ) {
    reviewItems.push({
      type: "must-fix",
      message: "Cards with more than 30 cards were used",
      action: "Reduce the number of cards to less than 30",
    });
  }

  // Accordions
  if (
    (stringifiedOriginalContent.includes("<summary>") &&
      stringifiedOriginalContent.includes("<details")) ||
    stringifiedOriginalContent.includes("jekyllcodex_accordion")
  ) {
    reviewItems.push({
      type: "must-fix",
      message: "Contains accordions",
      action: "Determine if any content should be placed inside an accordion",
    });
  }

  // Google Slides
  if (stringifiedContent.includes(PLACEHOLDER_GOOGLE_SLIDES_TEXT)) {
    // Already replaced in the converter script, but highlighting for manual review
    reviewItems.push({
      type: "review",
      message: "Contains Google Slides embeds",
      action: `Review the hyperlink "${PLACEHOLDER_GOOGLE_SLIDES_TEXT}"`,
    });
  }

  // Remove Instagram embeds
  if (stringifiedContent.includes(PLACEHOLDER_INSTAGRAM_LINK_TEXT)) {
    // Already replaced in the converter script, but highlighting for manual review
    reviewItems.push({
      type: "review",
      message: "Contains Instagram embeds",
      action: `Review the hyperlink "${PLACEHOLDER_INSTAGRAM_LINK_TEXT}"`,
    });
  }

  // Flag Iframe usages
  if (content.some((block) => block.type === "iframe")) {
    reviewItems.push({
      type: "must-fix",
      message: "Contains Iframes",
      action: "Review if the Iframe displays correctly",
    });
  }

  // Flag pages with descriptions that are too long
  // For content pages, 500 characters
  if (
    description &&
    layout &&
    !NON_CONTENT_LAYOUTS.includes(layout) &&
    description.length > 500
  ) {
    reviewItems.push({
      type: "must-fix",
      message: "Page summary is longer than 500 characters",
      action: "Shorten the page summary to less than 500 characters",
    });
  }

  // For article pages, 500 characters
  if (description && layout && layout === "post" && description.length > 500) {
    reviewItems.push({
      type: "must-fix",
      message: "Article summary is longer than 500 characters",
      action: "Shorten the article summary to less than 500 characters",
    });
  }

  // NOTE: Will be flagged out by the AI generation, so removing this for now
  // if (!description || description.length === 0) {
  //   reviewItems.push({ type: "must-fix", message: "Page summary is missing" });
  // }

  // Flag pages that have images that used to be links
  if (
    stringifiedContent.includes('"text": "Image link"') ||
    originalContent.includes('<a class="isomer-image-wrapper" href="')
  ) {
    reviewItems.push({
      type: "must-fix",
      message: "Contains images that were used as links",
      action: `Replace "Image link" with a descriptive copy`,
    });
  }

  // Flag pages that have div style attributes
  // if (isHtmlContainingDivStyles(originalContent)) {
  //   reviewItems.push("Contains div elements with style attributes");
  // }

  return {
    content,
    reviewItems,
  };
};

interface GetSiteNameAndUrlParams {
  octokit: Octokit;
  site: string;
  useStagingBranch?: boolean;
}

interface GetSiteNameAndUrlOutput {
  siteName: string;
  url: string;
}

export const getSiteNameAndUrl = async ({
  octokit,
  site,
  useStagingBranch = false,
}: GetSiteNameAndUrlParams): Promise<GetSiteNameAndUrlOutput> => {
  let siteName = "Isomer Site";
  let url = "https://www.isomer.gov.sg";

  const siteConfigContent = await getFileContents({
    site,
    path: "_config.yml",
    octokit,
    useStagingBranch,
  });

  if (!siteConfigContent) {
    return { siteName, url };
  }

  const siteConfigLines = siteConfigContent.split("\n");
  for (const line of siteConfigLines) {
    if (line.startsWith("title:")) {
      siteName = line.replace("title:", "").trim();
    } else if (line.startsWith("url:")) {
      url = line.replace("url:", "").trim();
    }
  }

  return { siteName, url };
};
