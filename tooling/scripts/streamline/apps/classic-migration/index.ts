import { Octokit } from "@octokit/rest";
import {
  getAllFolders,
  getFileContents,
  getOrphanPages,
  getRecursiveTree,
  getResourceRoomName,
} from "./github";
import type { MigrationRequest, ReportRow, StudiofyRequest } from "./types";
import {
  getCollectionFolderName,
  getLegalPermalink,
  getPathsToMigrate,
  getResourceTitleName,
} from "./utils";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

import * as dotenv from "dotenv";
import { getIsomerSchemaFromJekyll } from "./page";
import { getOnboardingBatch } from "../../utils/csv";
import { CONVERSION_OUTPUT_DIR } from "./constants";
import { studiofySite } from "./studiofier";

dotenv.config({
  path: path.join(__dirname, "..", ".env"),
});

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
  domain?: string;
  path: string;
  isResourceRoomPage: boolean;
  useStagingBranch?: boolean;
}

const migratePage = async ({
  site,
  domain,
  path,
  isResourceRoomPage = false,
  useStagingBranch = false,
}: PageMigrationParams) => {
  console.log("Migrating page", path);
  const content = await getFileContents({
    site,
    path,
    octokit,
    useStagingBranch,
  });

  // Arbitrary length check to avoid empty files
  if (!content || content.length < 5) {
    console.error(`Error reading file contents at ${path}`);
    return;
  }

  const conversionResponse = await getIsomerSchemaFromJekyll({
    content,
    path,
    isResourceRoomPage,
    site,
    domain,
    useStagingBranch,
  });
  return conversionResponse;
};

const migrateCollectionPage = async ({
  site,
  path,
  domain,
  useStagingBranch = false,
}: Omit<PageMigrationParams, "isResourceRoomPage">) => {
  const migrationResponse = await migratePage({
    site,
    path,
    isResourceRoomPage: true,
    domain,
  });

  if (!migrationResponse) {
    return null;
  }

  // Get the collection folder name
  const collectionFolderName = await getCollectionFolderName({
    site,
    octokit,
    path,
    useStagingBranch,
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
  shouldOverwrite?: boolean;
}

const saveContentsToFile = async ({
  site,
  content,
  permalink,
  shouldOverwrite = false,
}: SaveContentsToFileParams) => {
  const schema = JSON.stringify(content, null, 2);

  // Create the parent folders to the permalink
  const filePath = path.join(
    __dirname,
    CONVERSION_OUTPUT_DIR,
    site,
    permalink === "/" ? "index" : permalink.toLocaleLowerCase()
  );
  const fileName = `${path.basename(filePath)}.json`;
  const folderPath = path.dirname(filePath);
  const isFolderExists = fs.existsSync(folderPath);

  if (!isFolderExists) {
    await fs.promises.mkdir(folderPath, { recursive: true });
  }

  // Check if the file already exists, if yes, append a running number until it
  // finds a free name
  let finalFileName = fileName;
  let counter = 1;
  while (
    fs.existsSync(path.join(folderPath, finalFileName)) &&
    !shouldOverwrite
  ) {
    finalFileName = `${path
      .basename(filePath)
      .replace(".json", "")}-${counter}.json`;
    counter += 1;
  }

  // Write the schema to the file
  await fs.promises.writeFile(path.join(folderPath, finalFileName), schema);
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

  if (
    fs.existsSync(
      path.join(__dirname, CONVERSION_OUTPUT_DIR, site, `${permalink}.json`)
    )
  ) {
    return;
  }

  await saveContentsToFile({
    site,
    content: indexPage,
    permalink,
    shouldOverwrite: true,
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
      defaultSortDirection: "desc",
    },
    layout: "collection",
    content: [],
    version: "0.1.0",
  };

  await saveContentsToFile({
    site,
    content: indexPage,
    permalink: resourceRoomName,
    shouldOverwrite: true,
  });
};

export const migrateSite = async ({
  repoName: site,
  isomerDomain: domain,
  folders,
  isResourceRoomIncluded,
  isOrphansIncluded,
  useStagingBranch = false,
}: MigrationRequest) => {
  console.log(
    "Migrating site contents from",
    site,
    `(https://github.com/isomerpages/${site})`
  );

  const migrationFolders =
    folders ?? (await getAllFolders({ site, octokit, useStagingBranch }));
  const resourceRoomName = isResourceRoomIncluded
    ? await getResourceRoomName({ site, octokit, useStagingBranch })
    : null;
  const orphanPages = isOrphansIncluded
    ? await getOrphanPages({ site, octokit, useStagingBranch })
    : [];

  console.log("Folders to migrate:", migrationFolders.join(", "));

  if (resourceRoomName) {
    console.log("Resource room name:", resourceRoomName);
  }

  if (orphanPages.length > 0) {
    console.log("Orphan pages:", orphanPages.join(", "));
  }

  const allPages = await getPathsToMigrate({
    octokit,
    site,
    folders: migrationFolders,
    orphanPages,
  });

  const allResourceRoomPages = !!resourceRoomName
    ? await getRecursiveTree({
        site,
        path: resourceRoomName,
        octokit,
        useStagingBranch,
      })
    : [];

  console.log(
    "Total pages to migrate:",
    allPages.length + allResourceRoomPages.length
  );

  // Migrate all non-resource room pages
  const finishedPages: ReportRow[] = [];
  const finishedResourceRoomPages: ReportRow[] = [];

  // NOTE: We are doing it slowly here to avoid the secondary GitHub rate limit
  for (const path of allPages) {
    const content = await migratePage({
      site,
      path,
      isResourceRoomPage: false,
      domain,
    });

    if (!content) {
      continue;
    }

    if (content.status === "not_converted") {
      finishedPages.push(content);
      continue;
    }

    await saveContentsToFile({
      site,
      content: content.content,
      permalink: getLegalPermalink(
        content.permalink ?? path.split("/").pop()?.split(".")[0]
      ),
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
    const content = await migrateCollectionPage({
      site,
      path,
      domain,
      useStagingBranch,
    });

    if (!content) {
      continue;
    }

    if (content.status === "not_converted") {
      finishedResourceRoomPages.push(content);
      continue;
    }

    const tempPermalink = randomUUID();
    const permalinkToUse =
      content.content.layout === "article" ||
      content.content.layout === "content"
        ? `${resourceRoomName}/${
            content.permalink
              ?.split("/")
              .filter((slug) => !!slug)
              .pop() ?? tempPermalink
          }`
        : `${resourceRoomName}/${tempPermalink}`;

    await saveContentsToFile({
      site,
      content: content.content,
      permalink: getLegalPermalink(permalinkToUse),
    });

    finishedResourceRoomPages.push({
      ...content,
      permalink: content.permalink ?? `/${getLegalPermalink(permalinkToUse)}`,
    });
  }

  if (resourceRoomName) {
    await createCollectionIndex(site, resourceRoomName);
  }

  // Save the migrated pages information into a CSV file
  console.log(
    `Saving migrated pages information into a CSV file (migrated-pages-${site}.csv)`
  );
  const csvHeaders = "Permalink,Title,Status,Review items\n";
  const csvRows = [...finishedPages, ...finishedResourceRoomPages]
    .filter((pages) => pages?.permalink !== undefined)
    .map(
      (content) =>
        `${content?.permalink},"${content.title}",${getStatusName(content?.status)},${content?.reviewItems ? '"' + content?.reviewItems.join(", ") + '"' : ""}\n`
    );

  const csvString = csvHeaders + csvRows.join("");

  await fs.promises.writeFile(
    path.join(__dirname, `migrated-pages-${site}.csv`),
    csvString
  );
};

export const migrateClassicToNext = async () => {
  console.log("Starting automated migration of Classic sites to Next...");
  const onboardingSites = await getOnboardingBatch();
  // NOTE: Change this to true if you wish to use the staging branch instead of
  // the master branch for migration
  const useStagingBranch = false;

  for (const site of onboardingSites) {
    const migrationRequest: MigrationRequest = {
      repoName: site.repoName,
      isomerDomain: site.isomerDomain,
      isOrphansIncluded: true,
      isResourceRoomIncluded: true,
      useStagingBranch,
    };
    await migrateSite(migrationRequest);

    const studiofyRequest: StudiofyRequest = {
      repoName: site.repoName,
      useStagingBranch,
    };
    await studiofySite(studiofyRequest);
  }
};
