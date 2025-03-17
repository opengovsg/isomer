import { Octokit } from "@octokit/rest";
import { getFileContents, getRecursiveTree } from "./github";
import fm from "front-matter";
import {
  PLACEHOLDER_ALT_TEXT,
  PLACEHOLDER_GOOGLE_SLIDES_TEXT,
  PLACEHOLDER_IMAGE_IN_TABLE_TEXT,
} from "./constants";

interface GetPathsToMigrateParams {
  octokit: Octokit;
  site: string;
  folders: string[];
  orphanPages: string[];
}

export const getPathsToMigrate = async ({
  octokit,
  site,
  folders,
  orphanPages,
}: GetPathsToMigrateParams) => {
  const allFolderPages = await Promise.all(
    folders.map((folder) => getRecursiveTree({ site, path: folder, octokit }))
  ).then((results) => results.flat());

  return [...allFolderPages, ...orphanPages];
};

interface GetCollectionFolderNameParams {
  site: string;
  octokit: Octokit;
  path: string;
}

export const getCollectionFolderName = async ({
  octokit,
  site,
  path,
}: GetCollectionFolderNameParams) => {
  if (!path.includes("_posts")) {
    return path;
  }

  const parentPath = path.split("/_posts")[0];

  const collectionIndex = await getFileContents({
    site,
    path: `${parentPath}/index.html`,
    octokit,
  });

  if (!collectionIndex) {
    return path;
  }

  const frontmatter = fm(collectionIndex).attributes as any;

  return frontmatter.title || path;
};

interface GetResourceRoomTitleParams {
  site: string;
  octokit: Octokit;
  resourceRoomName: string;
}

export const getResourceTitleName = async ({
  octokit,
  site,
  resourceRoomName,
}: GetResourceRoomTitleParams) => {
  const resourceRoomIndex = await getFileContents({
    site,
    path: `${resourceRoomName}/index.html`,
    octokit,
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

export const getManualReviewItems = (
  content: any[],
  originalContent: any
): {
  content: any[];
  reviewItems: string[];
} => {
  let updatedContent = content;
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

  // Images with alt text that is too long
  if (
    content.some(
      (block) =>
        (block.type === "image" || block.type === "contentpic") &&
        block.alt.length > 120
    )
  ) {
    reviewItems.push("Images with alt text that is too long");
  }

  // Images inside tables
  if (stringifiedContent.includes(PLACEHOLDER_IMAGE_IN_TABLE_TEXT)) {
    // Already replaced in the converter script, but highlighting for manual review
    reviewItems.push("Images inside tables were moved out");
  }

  // Flag table usages to add captions
  if (
    stringifiedContent.includes("tableHeader") &&
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
    stringifiedOriginalContent.includes("<summary>") &&
    stringifiedOriginalContent.includes("<details")
  ) {
    reviewItems.push("Contains accordions");
  }

  // Google Slides
  if (stringifiedContent.includes(PLACEHOLDER_GOOGLE_SLIDES_TEXT)) {
    // Already replaced in the converter script, but highlighting for manual review
    reviewItems.push("Contains Google Slides embeds");
  }

  // Remove Instagram embeds
  if (stringifiedContent.includes("View post on Instagram.")) {
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

  return {
    content: updatedContent,
    reviewItems,
  };
};
