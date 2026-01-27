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

  const collectionIndex = await getFileContents({
    site,
    path: `${parentPath}/index.html`,
    octokit,
    useStagingBranch,
  });

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
  layout: any
): Promise<{
  content: any[];
  reviewItems: string[];
}> => {
  const reviewItems: string[] = [];
  const stringifiedContent = JSON.stringify(content);
  const stringifiedOriginalContent = JSON.stringify(originalContent);

  // Images with missing alt text
  if (
    content.some(
      (block) =>
        (block.type === "image" || block.type === "contentpic") &&
        (!block.alt || block.alt === PLACEHOLDER_ALT_TEXT)
    )
  ) {
    reviewItems.push("Images with missing alt text");
  }

  // Images inside tables
  if (stringifiedContent.includes(PLACEHOLDER_IMAGE_IN_TABLE_TEXT)) {
    // Already replaced in the converter script, but highlighting for manual review
    reviewItems.push("Images inside tables were moved out");
  }

  // Flag table usages to add captions
  if (
    stringifiedContent.includes(`"type":"table"`) ||
    stringifiedContent.includes('"Table caption"') ||
    stringifiedContent.includes("tableHeader") ||
    stringifiedContent.includes("tableRow")
  ) {
    reviewItems.push("Tables were used");
  }

  // InfoCards were used
  if (content.some((block) => block.type === "infocards")) {
    reviewItems.push("InfoCards were used");
  }

  // InfoCards with more than 12 cards were used
  if (
    content.some(
      (block) => block.type === "infocards" && block.cards.length > 12
    )
  ) {
    reviewItems.push("InfoCards with more than 12 cards were used");
  }

  // InfoCards with titles that breach the character limit
  if (
    content.some(
      (block) =>
        block.type === "infocards" &&
        block.cards.some((card: any) => card.title.length > 100)
    )
  ) {
    reviewItems.push(
      "InfoCards with titles that are longer than 100 characters"
    );
  }

  // InfoCards with descriptions that breach the character limit
  if (
    content.some(
      (block) =>
        block.type === "infocards" &&
        block.cards.some(
          (card: any) => card.description && card.description.length > 150
        )
    )
  ) {
    reviewItems.push(
      "InfoCards with descriptions that are longer than 150 characters"
    );
  }

  // InfoCards with image alt texts that breach the character limit
  if (
    content.some(
      (block) =>
        block.type === "infocards" &&
        block.cards.some(
          (card: any) => card.imageAlt && card.imageAlt.length > 120
        )
    )
  ) {
    reviewItems.push(
      "InfoCards with image alt texts that are longer than 120 characters"
    );
  }

  // Accordions
  if (
    (stringifiedOriginalContent.includes("<summary>") &&
      stringifiedOriginalContent.includes("<details")) ||
    stringifiedOriginalContent.includes("jekyllcodex_accordion")
  ) {
    reviewItems.push("Contains accordions");
  }

  // Google Slides
  if (stringifiedContent.includes(PLACEHOLDER_GOOGLE_SLIDES_TEXT)) {
    // Already replaced in the converter script, but highlighting for manual review
    reviewItems.push("Contains Google Slides embeds");
  }

  // Remove Instagram embeds
  if (stringifiedContent.includes(PLACEHOLDER_INSTAGRAM_LINK_TEXT)) {
    // Already replaced in the converter script, but highlighting for manual review
    reviewItems.push("Contains Instagram embeds");
  }

  // Flag Iframe usages (with special exception for FormSG)
  if (
    content.some(
      (block) =>
        block.type === "iframe" &&
        block.content.includes("https://form.gov.sg/")
    )
  ) {
    reviewItems.push("Contains FormSG embeds");
  } else if (content.some((block) => block.type === "iframe")) {
    reviewItems.push("Contains Iframes");
  }

  // Flag pages with descriptions that are too long
  // For content pages, 500 characters
  if (
    description &&
    layout &&
    !NON_CONTENT_LAYOUTS.includes(layout) &&
    description.length > 500
  ) {
    reviewItems.push("Page summary is longer than 500 characters");
  }

  // For article pages, 500 characters
  if (description && layout && layout === "post" && description.length > 500) {
    reviewItems.push("Article summary is longer than 500 characters");
  }

  if (!description || description.length === 0) {
    reviewItems.push("Page summary is missing");
  }

  // Flag pages that have images that used to be links
  if (
    stringifiedContent.includes('"text": "Image link"') ||
    originalContent.includes('<a class="isomer-image-wrapper" href="')
  ) {
    reviewItems.push("Contains images that were used as links");
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
