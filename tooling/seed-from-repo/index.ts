import * as crypto from "node:crypto";
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { Client } from "pg";

import { Octokit } from "@octokit/rest";
import { GET_ALL_RESOURCES_WITH_FULL_PERMALINKS } from "./constants";

const moduleDir = import.meta.dirname;

// Do not touch below this line
interface Resource {
  id: number;
  title: string;
  permalink: string;
  parentId: number | null;
  type: string;
  fullPermalink: string;
  blobId: number | null;
}

interface PageHeader {
  summary?: string;
}

interface PageSection {
  title?: string;
  permalink?: string;
  lastModified?: string;
  contentPageHeader?: PageHeader;
  category?: string;
  defaultSortBy?: string;
  defaultSortDirection?: string;
  showThumbnail?: boolean;
  sortOrder?: string;
}

interface ChildrenPagesBlock {
  showSummary: boolean;
  showThumbnail: boolean;
  type: string;
  variant: string;
}

interface PageJson {
  layout?: string;
  page?: PageSection;
  content?: ChildrenPagesBlock[];
  version?: string;
}

interface IdRow {
  id: number;
}

interface BlobContentRow {
  content: unknown;
}

interface SiteConfigFile {
  colors: {
    brand: string;
  };
  site: Record<string, string | number | boolean | null>;
}

interface SiteConfigRow {
  config: Record<string, string | number | boolean | null>;
}

type ResourceType =
  | "Page"
  | "Folder"
  | "IndexPage"
  | "RootPage"
  | "Collection"
  | "CollectionPage"
  | "CollectionLink"
  | "FolderMeta";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const getProperTitle = (slug: string): string =>
  slug[0]?.toUpperCase() + slug.slice(1).replaceAll("-", " ");

const getIndexPageContent = (title: string) => ({
  content: [
    {
      showSummary: true,
      showThumbnail: false,
      type: "childrenpages",
      variant: "rows",
    },
  ],
  layout: "index",
  page: {
    contentPageHeader: {
      summary: `Pages in ${title}`,
    },
    title,
  },
  version: "0.1.0",
});

const getFiles = (directory: string): string[] =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((file) => {
    const fullPath = path.join(directory, file.name);

    if (file.isDirectory()) {
      return getFiles(fullPath);
    }

    if (file.name === ".keep") {
      return [];
    }

    return [fullPath];
  });

const runSequentially = async <T>(
  items: readonly T[],
  handler: (item: T) => Promise<void>,
  index = 0,
): Promise<void> => {
  if (index >= items.length) {
    return;
  }

  await handler(items[index]);
  await runSequentially(items, handler, index + 1);
};

const parsePageJson = (filePath: string): PageJson => {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  if (
    raw === null ||
    Array.isArray(raw) ||
    Object.getPrototypeOf(raw) !== Object.prototype
  ) {
    throw new TypeError("Expected page JSON object");
  }

  return raw;
};

const getPageTitle = (content: PageJson, fallback: string): string =>
  content.page?.title ?? fallback;

const getResourceType = (
  isRootPage: boolean,
  isParentCollection: boolean | undefined,
  isCollectionLink: boolean,
  isPageOrder: boolean,
): ResourceType => {
  if (isRootPage) {
    return "RootPage";
  }
  if (isParentCollection === true) {
    return isCollectionLink ? "CollectionLink" : "CollectionPage";
  }
  if (isPageOrder) {
    return "FolderMeta";
  }
  return "Page";
};

export const createBlob = async (
  client: Client,
  content: PageJson,
): Promise<number> => {
  if (content.page === undefined) {
    // For _meta.json
    const result = await client.query<{ id: number }>(
      `INSERT INTO public."Blob" (content) VALUES ($1) RETURNING id`,
      [JSON.stringify(content)],
    );
    return result.rows[0]?.id ?? 0;
  }

  const {
    permalink: _permalink,
    lastModified: _lastModified,
    ...rest
  } = content.page;
  const newContent = {
    ...content,
    page: rest,
  };

  const result = await client.query<IdRow>(
    `INSERT INTO public."Blob" (content) VALUES ($1) RETURNING id`,
    [JSON.stringify(newContent)],
  );
  return result.rows[0]?.id ?? 0;
};

export const createResource = async (
  client: Client,
  {
    title,
    permalink,
    parentId,
    type,
    siteId,
  }: {
    title: string;
    permalink: string;
    parentId: number | null;
    type: ResourceType;
    siteId: number;
  },
): Promise<number> => {
  const result = await client.query<IdRow>(
    `INSERT INTO public."Resource" (title, permalink, "parentId", type, state, "publishedVersionId", "siteId") VALUES ($1, $2, $3, $4, $5, NULL, $6) RETURNING id`,
    [title, permalink, parentId, type, "Published", siteId],
  );
  return result.rows[0]?.id ?? 0;
};

export const createFirstVersion = async (
  client: Client,
  resourceId: number,
  blobId: number,
) => {
  const result = await client.query<IdRow>(
    `INSERT INTO public."Version" ("resourceId", "blobId", "versionNum", "publishedBy") VALUES ($1, $2, $3, $4) RETURNING id`,
    [resourceId, blobId, 1, process.env.PUBLISHER_USER_ID],
  );
  const versionId = result.rows[0]?.id ?? 0;

  // Update the resource with the new publishedVersionId
  await client.query(
    `UPDATE public."Resource" SET "publishedVersionId" = $1 WHERE id = $2`,
    [versionId, resourceId],
  );
};

const getSitemapArray = async (
  client: Client,
  siteId: number,
): Promise<Resource[]> => {
  const result = await client.query<Resource>(
    GET_ALL_RESOURCES_WITH_FULL_PERMALINKS,
    [siteId],
  );
  return result.rows;
};

const getResourceMapping = async (client: Client, siteId: number) => {
  const sitemapArray = await getSitemapArray(client, siteId);
  const resourcesMap: Record<string, Resource> = {};

  for (const resource of sitemapArray) {
    resourcesMap[path.join("/", resource.fullPermalink)] = resource;
  }

  return resourcesMap;
};

const getBlob = async (client: Client, blobId: number): Promise<string> => {
  const result = await client.query<BlobContentRow>(
    `SELECT content FROM public."Blob" WHERE id = $1`,
    [blobId],
  );
  return JSON.stringify(result.rows[0]?.content);
};

const updateBlob = async (client: Client, blobId: number, content: string) => {
  try {
    await client.query(`UPDATE public."Blob" SET content = $1 WHERE id = $2`, [
      content,
      blobId,
    ]);
  } catch (error) {
    console.error(content);
    console.error(error);
    throw new Error("Failed to update blob", { cause: error });
  }
};

const getNavbar = async (client: Client, siteId: number): Promise<string> => {
  const result = await client.query<BlobContentRow>(
    `SELECT content FROM public."Navbar" WHERE "siteId" = $1`,
    [siteId],
  );
  return JSON.stringify(result.rows[0]?.content);
};

const updateNavbar = async (client: Client, siteId: number, content: string) => {
  try {
    await client.query(
      `UPDATE public."Navbar" SET content = $1 WHERE "siteId" = $2`,
      [content, siteId],
    );
  } catch (error) {
    console.error(content);
    console.error(error);
    throw new Error("Failed to update navbar", { cause: error });
  }
};

const getFooter = async (client: Client, siteId: number): Promise<string> => {
  const result = await client.query<BlobContentRow>(
    `SELECT content FROM public."Footer" WHERE "siteId" = $1`,
    [siteId],
  );
  return JSON.stringify(result.rows[0]?.content);
};

const updateFooter = async (client: Client, siteId: number, content: string) => {
  try {
    await client.query(
      `UPDATE public."Footer" SET content = $1 WHERE "siteId" = $2`,
      [content, siteId],
    );
  } catch (error) {
    console.error(content);
    console.error(error);
    throw new Error("Failed to update footer", { cause: error });
  }
};

const getSiteConfig = async (client: Client, siteId: number): Promise<string> => {
  const result = await client.query<SiteConfigRow>(
    `SELECT config FROM public."Site" WHERE id = $1`,
    [siteId],
  );
  return JSON.stringify(result.rows[0]?.config);
};

const updateSiteConfig = async (
  client: Client,
  siteId: number,
  config: string,
) => {
  try {
    await client.query(`UPDATE public."Site" SET config = $1 WHERE id = $2`, [
      config,
      siteId,
    ]);
  } catch (error) {
    console.error(config);
    console.error(error);
    throw new Error("Failed to update site config", { cause: error });
  }
};

const studioifyContent = (
  content: string,
  siteId: number,
  assetsMap: Record<string, string>,
  resourcesMap: Record<string, Resource>,
): string => {
  let newContent = content;

  for (const asset of Object.keys(assetsMap)) {
    newContent = newContent
      .replaceAll(`"${asset}"`, `"${assetsMap[asset]}"`)
      .replaceAll(`"${asset}"`, `"${assetsMap[asset.replaceAll("%20", " ")]}"`)
      .replaceAll(`'${asset}'`, `'${assetsMap[asset]}'`)
      .replaceAll(`'${asset}'`, `'${assetsMap[asset.replaceAll("%20", " ")]}'`);
  }

  for (const page of Object.keys(resourcesMap)) {
    newContent = newContent
      .replaceAll(
        `"${page}"`,
        `"[resource:${String(siteId)}:${String(resourcesMap[page]?.id)}]"`,
      )
      .replaceAll(
        `"${page}/"`,
        `"[resource:${String(siteId)}:${String(resourcesMap[page]?.id)}]"`,
      )
      .replaceAll(
        `'${page}'`,
        `'[resource:${String(siteId)}:${String(resourcesMap[page]?.id)}]'`,
      )
      .replaceAll(
        `'${page}/'`,
        `'[resource:${String(siteId)}:${String(resourcesMap[page]?.id)}]'`,
      );
  }

  return newContent;
};

const getAssetsMapping = (siteId: number, siteName: string) => {
  // Get the list of images and files in the site
  const siteDir = path.join(moduleDir, "repos", siteName);
  const publicDir = path.join(siteDir, "public");
  const imagesDir = path.join(publicDir, "images");
  const filesDir = path.join(publicDir, "files");
  const assetsDir = path.join(moduleDir, "assets");

  const images = getFiles(imagesDir).map((file) =>
    path.relative(publicDir, file),
  );
  const files = getFiles(filesDir).map((file) =>
    path.relative(publicDir, file),
  );
  const allAssets = [...images, ...files];

  // Create the assets directory for the site
  const siteAssetsDir = path.join(assetsDir, String(siteId));
  if (!fs.existsSync(siteAssetsDir)) {
    fs.mkdirSync(siteAssetsDir, { recursive: true });
  }

  // Generate the new paths for the images and files and store as a mapping
  const assetsMap: Record<string, string> = {};

  for (const asset of allAssets) {
    const assetName = path.basename(asset);
    const newAssetFolder = path.join(siteAssetsDir, crypto.randomUUID());

    const newAssetPath = path.join(newAssetFolder, assetName);

    // Create the folder at the new location
    if (!fs.existsSync(newAssetFolder)) {
      fs.mkdirSync(newAssetFolder, { recursive: true });
    }

    // Copy the file to the new location
    fs.copyFileSync(path.join(publicDir, asset), newAssetPath);

    // Store the mapping
    assetsMap[path.join("/", asset)] = path.join(
      "/",
      path.relative(assetsDir, newAssetPath),
    );
  }

  return assetsMap;
};

const importSiteConfig = async (
  client: Client,
  siteId: number,
  siteName: string,
) => {
  console.log("Importing site config");
  const siteConfigPath = path.join(
    moduleDir,
    "repos",
    siteName,
    "data",
    "config.json",
  );

  // Split config and theme
  const config: SiteConfigFile = (() => {
    const raw = JSON.parse(fs.readFileSync(siteConfigPath, "utf-8"));
    if (
      raw === null ||
      Array.isArray(raw) ||
      Object.getPrototypeOf(raw) !== Object.prototype
    ) {
      throw new TypeError("Expected site config JSON object");
    }

    return raw;
  })();
  const theme = {
    colors: {
      brand: config.colors.brand,
    },
  };
  const siteConfig = config.site;

  await client.query(
    `UPDATE public."Site" SET config = $1, theme = $2 WHERE id = $3`,
    [siteConfig, theme, siteId],
  );
};

const importNavbar = async (client: Client, siteId: number, siteName: string) => {
  console.log("Importing navbar");
  const navbarPath = path.join(
    moduleDir,
    "repos",
    siteName,
    "data",
    "navbar.json",
  );
  const navbar = fs.readFileSync(navbarPath, "utf-8");

  await client.query(
    `INSERT INTO public."Navbar" ("siteId", content) VALUES ($1, $2)`,
    [siteId, navbar],
  );
};

const importFooter = async (client: Client, siteId: number, siteName: string) => {
  console.log("Importing footer");
  const footerPath = path.join(
    moduleDir,
    "repos",
    siteName,
    "data",
    "footer.json",
  );
  const footer = fs.readFileSync(footerPath, "utf-8");

  await client.query(
    `INSERT INTO public."Footer" ("siteId", content) VALUES ($1, $2)`,
    [siteId, footer],
  );
};

const ensureSiteExists = async (
  client: Client,
  siteId: number,
  siteName: string,
): Promise<boolean> => {
  try {
    // Ensure that the GitHub repository exists
    await octokit.repos.get({
      owner: "isomerpages",
      repo: siteName,
    });

    // Git clone the repository
    const cloneDir = path.join(moduleDir, "repos");
    // NOTE: Do not touch this directly! This should be invoked as part of site migration
    execSync(
      `git clone https://oauth2:${process.env.GITHUB_TOKEN}@github.com/isomerpages/${siteName}.git ${cloneDir}/${siteName}`,
    );

    const result = await client.query<IdRow>(
      `SELECT id FROM public."Site" WHERE id = $1`,
      [siteId],
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error(`Pre-flight checks failed for ${siteName}`);
    console.error(error);
    return false;
  }
};

const seedDatabase = async (client: Client, siteId: number, siteName: string) => {
  const processDirectory = async (
    dirPath: string,
    parentId: number | null,
    isParentCollection?: boolean,
  ) => {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const folders = entries.filter((entry) => entry.isDirectory());
    const folderNames = new Set(folders.map((folder) => folder.name));
    const independentPages = entries.filter(
      (entry) =>
        !entry.isDirectory() &&
        entry.name.endsWith(".json") &&
        !folderNames.has(entry.name.slice(0, -5)),
    );

    await runSequentially(folders, async (folder) => {
      console.log(`Processing folder: ${folder.name}`);
      const fullPath = path.join(dirPath, folder.name);

      // Find for the corresponding index page if it exists
      const isIndexPagePresent = entries.some(
        (entry) => !entry.isDirectory() && entry.name === `${folder.name}.json`,
      );

      if (isIndexPagePresent) {
        console.log(`Found index page for folder ${folder.name}`);
        const indexPagePath = path.join(dirPath, `${folder.name}.json`);
        const content = parsePageJson(indexPagePath);
        const title = getPageTitle(content, getProperTitle(folder.name));
        // Special permalink for index pages
        const permalink = "_index";

        const isCollection = content.layout === "collection";

        if (isCollection) {
          // Create the collection resource
          const folderResourceId = await createResource(client, {
            parentId,
            // Use folder name as permalink
            permalink: folder.name.toLowerCase(),
            siteId,
            title,
            type: "Collection",
          });

          const blobId = await createBlob(client, content);
          const resourceId = await createResource(client, {
            parentId: folderResourceId,
            permalink,
            siteId,
            title,
            type: "IndexPage",
          });
          await createFirstVersion(client, resourceId, blobId);

          await processDirectory(fullPath, folderResourceId, true);
        } else {
          // Create the folder resource
          const folderResourceId = await createResource(client, {
            parentId,
            // Use folder name as permalink
            permalink: folder.name.toLowerCase(),
            siteId,
            title,
            type: "Folder",
          });

          const blobId = await createBlob(client, content);
          const resourceId = await createResource(client, {
            parentId: folderResourceId,
            permalink,
            siteId,
            title,
            type: "IndexPage",
          });
          await createFirstVersion(client, resourceId, blobId);

          await processDirectory(fullPath, folderResourceId);
        }
      } else {
        // Future work: create default index page for collections
        const title = getProperTitle(folder.name);
        // Create the folder resource
        const folderResourceId = await createResource(client, {
          parentId,
          // Use folder name as permalink
          permalink: folder.name.toLowerCase(),
          siteId,
          title,
          type: "Folder",
        });

        const blobId = await createBlob(client, getIndexPageContent(title));
        const resourceId = await createResource(client, {
          parentId: folderResourceId,
          // Special permalink for index pages
          permalink: "_index",
          siteId,
          title,
          type: "IndexPage",
        });
        await createFirstVersion(client, resourceId, blobId);

        await processDirectory(fullPath, folderResourceId);
      }
    });

    await runSequentially(independentPages, async (page) => {
      console.log(`Processing page: ${page.name}`);
      const isRootPage = page.name === "index.json" && parentId === null;

      const fullPath = path.join(dirPath, page.name);
      const content = parsePageJson(fullPath);
      const title = getPageTitle(content, path.basename(page.name, ".json"));
      // Studio is not fully ready for "_index" root permalinks yet
      const permalink = isRootPage
        ? ""
        : path.basename(page.name, ".json").toLowerCase();
      const isCollectionLink =
        content.layout === "link" || content.layout === "file";
      const isPageOrder = page.name === "_meta.json";

      if (content.layout === "file") {
        content.layout = "link";
      }

      const blobId = await createBlob(client, content);
      const resourceId = await createResource(client, {
        parentId,
        permalink,
        siteId,
        title,
        type: getResourceType(
          isRootPage,
          isParentCollection,
          isCollectionLink,
          isPageOrder,
        ),
      });
      await createFirstVersion(client, resourceId, blobId);
    });
  };

  const schemaDir = path.join(moduleDir, "repos", siteName, "schema");
  await processDirectory(schemaDir, null);

  await importSiteConfig(client, siteId, siteName);
  await importNavbar(client, siteId, siteName);
  await importFooter(client, siteId, siteName);
};

const studioifySite = async (client: Client, siteId: number, siteName: string) => {
  const assetsMap = getAssetsMapping(siteId, siteName);
  const resourcesMap = await getResourceMapping(client, siteId);
  const pages = Object.keys(resourcesMap).filter(
    (resourceId) => resourcesMap[resourceId]?.blobId !== null,
  );

  await runSequentially(pages, async (page) => {
    const resource = resourcesMap[page];
    if (resource?.blobId === null || resource?.blobId === undefined) {
      return;
    }

    console.log(`Studioifying page: /${resource.fullPermalink}`);
    const content = await getBlob(client, resource.blobId);
    const updatedContent = studioifyContent(
      content,
      siteId,
      assetsMap,
      resourcesMap,
    );
    await updateBlob(client, resource.blobId, updatedContent);
  });

  console.log("Studioifying navbar, footer, and site config");
  const navbarContent = await getNavbar(client, siteId);
  const updatedNavbar = studioifyContent(
    navbarContent,
    siteId,
    assetsMap,
    resourcesMap,
  );
  await updateNavbar(client, siteId, updatedNavbar);

  const footerContent = await getFooter(client, siteId);
  const updatedFooter = studioifyContent(
    footerContent,
    siteId,
    assetsMap,
    resourcesMap,
  );
  await updateFooter(client, siteId, updatedFooter);

  const siteConfigContent = await getSiteConfig(client, siteId);
  const updatedSiteConfig = studioifyContent(
    siteConfigContent,
    siteId,
    assetsMap,
    resourcesMap,
  );
  await updateSiteConfig(client, siteId, updatedSiteConfig);

  console.log("Saving a mapping of the asset paths");
  const assetsCsvHeaders = "Original Path,Assets Path\n";
  const assetsCsv = Object.entries(assetsMap)
    .map(([original, newAsset]) => `${original},${newAsset}`)
    .join("\n");
  fs.writeFileSync(
    path.join(moduleDir, `asset-mappings-${siteName}.csv`),
    assetsCsvHeaders + assetsCsv,
    "utf-8",
  );
};

export const main = async (repoName: string, siteId: number) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  // Start profiling
  const start = performance.now();

  try {
    await client.connect();

    console.log("Successfully connected to the database");

    console.log("Migrating site:", repoName);

    const siteExists = await ensureSiteExists(client, siteId, repoName);

    if (!siteExists) {
      throw new Error(`Error: Site with ID ${siteId} does not exist.`);
    }

    await seedDatabase(client, siteId, repoName);

    await studioifySite(client, siteId, repoName);

    console.log(`Successfully migrated site ${repoName} with ID ${siteId}`);

    console.log(`All done! Remember to upload the assets to S3.`);
  } catch (error) {
    console.error(error);
  } finally {
    await client.end();
    // End profiling
    const end = performance.now();
    console.log(`Script completed in ${(end - start) / 1000} seconds`);
  }
};

export const cleanup = () => {
  const assetsDir = path.join(moduleDir, "assets");
  fs.rmdirSync(assetsDir);
};
