import { Octokit } from "@octokit/rest";
import {
  getAllFolders,
  getFileContents,
  getOrphanPages,
  getRecursiveTree,
  getResourceRoomName,
} from "./github";
import { MigrationRequest } from "./types";
import { config } from "./config";
import {
  getCollectionFolderName,
  getLegalPermalink,
  getPathsToMigrate,
  getResourceTitleName,
} from "./utils";
import fs from "fs";
import path from "path";

import * as dotenv from "dotenv";
import { getIsomerSchemaFromJekyll } from "./page";

dotenv.config();

const EXCLUDED_PATHS = [
  "index.md", // Home page
  "contact-us.md", // Contact us page
];

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const getStatusName = (
  status: "converted" | "manual_review" | "not_converted"
) => {
  switch (status) {
    case "converted":
      return "Converted";
    case "manual_review":
      return "Requires Manual Review";
    case "not_converted":
      return "Not Converted";
    default:
      const _: never = status;
      return "Unknown";
  }
};

interface PageMigrationParams {
  site: string;
  path: string;
}

const migratePage = async ({ site, path }: PageMigrationParams) => {
  console.log("Migrating page", path);
  const content = await getFileContents({ site, path, octokit });

  if (!content) {
    console.error(`Error reading file contents at ${path}`);
    return;
  }

  const conversionResponse = await getIsomerSchemaFromJekyll({ content, path });
  return conversionResponse;
};

const migrateCollectionPage = async ({ site, path }: PageMigrationParams) => {
  const migrationResponse = await migratePage({ site, path });

  if (!migrationResponse) {
    return null;
  }

  // Get the collection folder name
  const collectionFolderName = await getCollectionFolderName({
    site,
    octokit,
    path,
  });

  if (migrationResponse.status === "not_converted") {
    return migrationResponse;
  }

  const { content, ...rest } = migrationResponse;
  content.page.category = collectionFolderName;

  return {
    content,
    ...rest,
  };
};

interface SaveContentsToFileParams {
  site: string;
  content: any;
  permalink: string;
}

const saveContentsToFile = async ({
  site,
  content,
  permalink,
}: SaveContentsToFileParams) => {
  const schema = JSON.stringify(content, null, 2);

  // Create the parent folders to the permalink
  const filePath = path.join(__dirname, site, permalink.toLocaleLowerCase());
  const fileName = `${path.basename(filePath)}.json`;
  const folderPath = path.dirname(filePath);
  const isFolderExists = fs.existsSync(folderPath);

  if (!isFolderExists) {
    await fs.promises.mkdir(folderPath, { recursive: true });
  }

  // Write the schema to the file
  await fs.promises.writeFile(path.join(folderPath, fileName), schema);
};

const createIndexIfNotExists = async (
  site: string,
  permalink: string,
  title: string
) => {
  const indexPage = {
    page: {
      title,
      contentPageHeader: {
        summary: `Pages in ${title}`,
      },
    },
    layout: "index",
    content: [],
    version: "0.1.0",
  };

  if (fs.existsSync(path.join(__dirname, site, `${permalink}.json`))) {
    return;
  }

  await saveContentsToFile({
    site,
    content: indexPage,
    permalink,
  });
};

const createCollectionIndex = async (
  site: string,
  resourceRoomName: string
) => {
  const title = await getResourceTitleName({
    site,
    octokit,
    resourceRoomName,
  });

  const indexPage = {
    page: {
      title,
      subtitle: `Read more on ${title} here.`,
      defaultSortBy: "date",
      defaultSortDirection: "asc",
    },
    layout: "collection",
    content: [],
    version: "0.1.0",
  };

  await saveContentsToFile({
    site,
    content: indexPage,
    permalink: resourceRoomName,
  });
};

const migrate = async ({
  site,
  id,
  folders,
  isResourceRoomIncluded,
  isOrphansIncluded,
}: MigrationRequest) => {
  console.log(
    "Migrating site contents from",
    site,
    `(https://github.com/isomerpages/${site})`
  );

  const migrationFolders = folders ?? (await getAllFolders({ site, octokit }));
  const resourceRoomName = isResourceRoomIncluded
    ? await getResourceRoomName({ site, octokit })
    : null;
  const orphanPages = isOrphansIncluded
    ? await getOrphanPages({ site, octokit })
    : [];

  console.log("Folders to migrate:", migrationFolders.join(", "));

  if (resourceRoomName) {
    console.log("Resource room name:", resourceRoomName);
  }

  if (orphanPages.length > 0) {
    console.log("Orphan pages:", orphanPages.join(", "));
  }

  const allPages = (
    await getPathsToMigrate({
      octokit,
      site,
      folders: migrationFolders,
      orphanPages,
    })
  ).filter((path) => !EXCLUDED_PATHS.includes(path));

  const allResourceRoomPages = !!resourceRoomName
    ? await getRecursiveTree({
        site,
        path: resourceRoomName,
        octokit,
      })
    : [];

  console.log(
    "Total pages to migrate:",
    allPages.length + allResourceRoomPages.length
  );

  // Migrate all non-resource room pages
  const finishedPages: any[] = [];
  const finishedResourceRoomPages: any[] = [];

  // NOTE: We are doing it slowly here to avoid the secondary GitHub rate limit
  for (const path of allPages) {
    const content = await migratePage({ site, path });

    if (!content) {
      continue;
    }

    if (content.status === "not_converted") {
      finishedPages.push(content);
      continue;
    }

    saveContentsToFile({
      site,
      content: content.content,
      permalink: getLegalPermalink(content.permalink),
    });

    if (content.third_nav_title) {
      const parentPermalink = content.permalink
        .split("/")
        .filter((slug: string) => slug !== "")
        .slice(0, -1)
        .join("/");
      await createIndexIfNotExists(
        site,
        getLegalPermalink(parentPermalink),
        content.third_nav_title
      );
    }

    finishedPages.push(content);
  }

  for (const path of allResourceRoomPages) {
    const content = await migrateCollectionPage({ site, path });

    if (!content) {
      continue;
    }

    if (content.status === "not_converted") {
      finishedResourceRoomPages.push(content);
      continue;
    }

    const tempPermalink = Math.random()
      .toString(36)
      .split(".")
      .pop()
      ?.substring(0, 8);

    const resourceCategorySlug = path.split("/_posts")[0];

    const permalinkToUse =
      content.content.layout === "article"
        ? content.permalink
        : `${resourceCategorySlug}/${tempPermalink}`;

    saveContentsToFile({
      site,
      content: content.content,
      permalink: getLegalPermalink(permalinkToUse),
    });

    finishedResourceRoomPages.push(content);
  }

  if (resourceRoomName) {
    await createCollectionIndex(site, resourceRoomName);
  }

  // Save the migrated pages information into a CSV file
  console.log(
    `Saving migrated pages information into a CSV file (migrated-pages-${site}.csv)`
  );
  const csvHeaders = "Permalink,Status,Review items\n";
  const csvRows = [...finishedPages, ...finishedResourceRoomPages]
    .filter((pages) => pages?.permalink !== undefined)
    .map(
      (content) =>
        `${content?.permalink},${getStatusName(content?.status)},${content?.reviewItems ? '"' + content?.reviewItems.join(", ") + '"' : ""}\n`
    );

  const csvString = csvHeaders + csvRows.join("");

  await fs.promises.writeFile(
    path.join(__dirname, `migrated-pages-${site}.csv`),
    csvString
  );
};

const main = async () => {
  for (const request of config) {
    await migrate(request);
  }
};

main().catch((error) => console.error(error));
