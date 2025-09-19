/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import type { Client } from "pg";

import { GET_ALL_RESOURCES_WITH_FULL_PERMALINKS } from "./constants";

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

dotenv.config();

export async function migrate(
  client: Client,
  sourceSiteId: number,
  destinationSiteId: number
) {
  await seedDatabase(client, destinationSiteId);
  await studioifySite(client, sourceSiteId, destinationSiteId);
}

async function seedDatabase(client: Client, siteId: number) {
  async function processDirectory(
    dirPath: string,
    parentId: number | null,
    isParentCollection?: boolean
  ) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const folders = entries.filter((entry) => entry.isDirectory());
    const folderNames = folders.map((folder) => folder.name);
    const independentPages = entries.filter(
      (entry) => !entry.isDirectory() && entry.name.endsWith(".json")
    );

    for (const folder of folders) {
      console.log(`Processing folder: ${folder.name}`);
      const fullPath = path.join(dirPath, folder.name);

      // Find for the corresponding index page if it exists
      // const isIndexPagePresent =
      //   entries.some(
      //     (entry) =>
      //       !entry.isDirectory() && entry.name === `${folder.name}.json`
      //   ) || fs.existsSync(path.join(dirPath, "_index.json"));

      // if (isIndexPagePresent) {
      console.log(`Found index page for folder ${folder.name}`);
      const indexPagePath = path.join(dirPath, folder.name, `_index.json`);
      const content = JSON.parse(fs.readFileSync(indexPagePath, "utf-8"));
      const title = content.page?.title || getProperTitle(folder.name);
      const permalink = "_index"; // Special permalink for index pages

      const isCollection = content.layout === "collection";

      if (isCollection) {
        // Create the collection resource
        const folderResourceId = await createResource(client, {
          title,
          permalink: folder.name.toLowerCase(), // Use folder name as permalink
          parentId,
          type: "Collection",
          siteId,
        });

        // const blobId = await createBlob(client, content);
        // const resourceId = await createResource(client, {
        //   title,
        //   permalink,
        //   parentId: folderResourceId,
        //   type: "IndexPage",
        //   siteId,
        // });
        // await createVersion(client, resourceId, blobId);

        await processDirectory(fullPath, folderResourceId, true);
      } else {
        // Create the folder resource
        const folderResourceId = await createResource(client, {
          title,
          permalink: folder.name.toLowerCase(), // Use folder name as permalink
          parentId,
          type: "Folder",
          siteId,
        });

        // const blobId = await createBlob(client, content);
        // const resourceId = await createResource(client, {
        //   title,
        //   permalink,
        //   parentId: folderResourceId,
        //   type: "IndexPage",
        //   siteId,
        // });
        // await createVersion(client, resourceId, blobId);

        await processDirectory(fullPath, folderResourceId);
      }
      // } else {
      //   const title = getProperTitle(folder.name);
      //   // Create the folder resource
      //   const folderResourceId = await createResource(client, {
      //     title,
      //     permalink: folder.name.toLowerCase(), // Use folder name as permalink
      //     parentId,
      //     type: "Folder",
      //     siteId,
      //   });

      //   const blobId = await createBlob(client, getIndexPageContent(title));
      //   const resourceId = await createResource(client, {
      //     title,
      //     permalink: "_index", // Special permalink for index pages
      //     parentId: folderResourceId,
      //     type: "IndexPage",
      //     siteId,
      //   });
      //   await createVersion(client, resourceId, blobId);

      //   await processDirectory(fullPath, folderResourceId);
      // }
    }

    for (const page of independentPages) {
      console.log(`Processing page: ${page.name}`);
      const isRootPage = page.name === "_index.json" && parentId === null;
      const isIndexPage = page.name === "_index.json";

      const fullPath = path.join(dirPath, page.name);
      const content = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
      const title = content.page?.title || path.basename(page.name, ".json");
      const permalink = isRootPage
        ? "" // FIXME: This should be "_index" but Studio is not fully ready for this yet
        : path.basename(page.name, ".json").toLowerCase(); // Only use the file name without extension
      const isCollectionLink =
        content.layout === "link" || content.layout === "file";
      const isPageOrder = page.name === "_meta.json";

      if (content.layout === "file") {
        content.layout = "link";
      }

      const blobId = await createBlob(client, content);
      const resourceId = await createResource(client, {
        title,
        permalink,
        parentId,
        type: isRootPage
          ? "RootPage"
          : isParentCollection
            ? isCollectionLink
              ? "CollectionLink"
              : isIndexPage
                ? "IndexPage"
                : "CollectionPage"
            : isPageOrder
              ? "FolderMeta"
              : isIndexPage
                ? "IndexPage"
                : "Page",
        siteId,
      });
      await createVersion(client, resourceId, blobId);
    }
  }

  const schemaDir = path.join(process.cwd(), "temp", "schema");
  await processDirectory(schemaDir, null);

  await importSiteConfig(client, siteId);
  await importNavbar(client, siteId);
  await importFooter(client, siteId);
}

async function createBlob(client: Client, content: any): Promise<number> {
  if (!content.page) {
    // For _meta.json
    const result = await client.query(
      `INSERT INTO public."Blob" (content) VALUES ($1) RETURNING id`,
      [JSON.stringify(content)]
    );
    return result.rows[0].id;
  }

  const { permalink, lastModified, ...rest } = content.page;
  const newContent = {
    ...content,
    page: rest,
  };

  const result = await client.query(
    `INSERT INTO public."Blob" (content) VALUES ($1) RETURNING id`,
    [JSON.stringify(newContent)]
  );
  return result.rows[0].id;
}

async function createResource(
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
    type:
      | "Page"
      | "Folder"
      | "IndexPage"
      | "RootPage"
      | "Collection"
      | "CollectionPage"
      | "CollectionLink"
      | "FolderMeta";
    siteId: number;
  }
): Promise<number> {
  const result = await client.query(
    `INSERT INTO public."Resource" (title, permalink, "parentId", type, state, "publishedVersionId", "siteId") VALUES ($1, $2, $3, $4, $5, NULL, $6) RETURNING id`,
    [title, permalink, parentId, type, "Published", siteId]
  );
  return result.rows[0].id;
}

async function createVersion(
  client: Client,
  resourceId: number,
  blobId: number
) {
  const result = await client.query(
    `INSERT INTO public."Version" ("resourceId", "blobId", "versionNum", "publishedBy") VALUES ($1, $2, $3, $4) RETURNING id`,
    [resourceId, blobId, 1, process.env.PUBLISHER_USER_ID]
  );
  const versionId = result.rows[0].id;

  // Update the resource with the new publishedVersionId
  await client.query(
    `UPDATE public."Resource" SET "publishedVersionId" = $1 WHERE id = $2`,
    [versionId, resourceId]
  );
}

async function importSiteConfig(client: Client, siteId: number) {
  console.log("Importing site config");
  const siteConfigPath = path.join(
    process.cwd(),
    "temp",
    "data",
    "config.json"
  );

  // Split config and theme
  const config = JSON.parse(fs.readFileSync(siteConfigPath, "utf-8"));
  const theme = {
    colors: {
      brand: config.colors.brand,
    },
  };
  const siteConfig = config.site;

  await client.query(
    `UPDATE public."Site" SET config = $1, theme = $2 WHERE id = $3`,
    [siteConfig, theme, siteId]
  );
}

async function importNavbar(client: Client, siteId: number) {
  console.log("Importing navbar");
  const navbarPath = path.join(process.cwd(), "temp", "data", "navbar.json");
  const navbar = fs.readFileSync(navbarPath, "utf-8");

  await client.query(
    `INSERT INTO public."Navbar" ("siteId", content) VALUES ($1, $2)`,
    [siteId, navbar]
  );
}

async function importFooter(client: Client, siteId: number) {
  console.log("Importing footer");
  const footerPath = path.join(process.cwd(), "temp", "data", "footer.json");
  const footer = fs.readFileSync(footerPath, "utf-8");

  await client.query(
    `INSERT INTO public."Footer" ("siteId", content) VALUES ($1, $2)`,
    [siteId, footer]
  );
}

async function studioifySite(
  client: Client,
  sourceSiteId: number,
  destinationSiteId: number
) {
  const resourcesMap = await getResourceMapping(client, destinationSiteId);
  const pages = Object.keys(resourcesMap).filter((resourceId) => {
    return resourcesMap[resourceId]?.blobId !== null;
  });

  for (const page of pages) {
    const resource = resourcesMap[page]!;
    console.log(`Studioifying page: /${resource.fullPermalink}`);
    const content = await getBlob(client, resource.blobId!);
    const updatedContent = studioifyContent(
      content,
      sourceSiteId,
      destinationSiteId,
      resourcesMap
    );
    await updateBlob(client, resource.blobId!, updatedContent);
  }

  console.log("Studioifying navbar, footer, and site config");
  const navbarContent = await getNavbar(client, destinationSiteId);
  const updatedNavbar = studioifyContent(
    navbarContent,
    sourceSiteId,
    destinationSiteId,
    resourcesMap
  );
  await updateNavbar(client, destinationSiteId, updatedNavbar);

  const footerContent = await getFooter(client, destinationSiteId);
  const updatedFooter = studioifyContent(
    footerContent,
    sourceSiteId,
    destinationSiteId,
    resourcesMap
  );
  await updateFooter(client, destinationSiteId, updatedFooter);

  const siteConfigContent = await getSiteConfig(client, destinationSiteId);
  const updatedSiteConfig = studioifyContent(
    siteConfigContent,
    sourceSiteId,
    destinationSiteId,
    resourcesMap
  );
  await updateSiteConfig(client, destinationSiteId, updatedSiteConfig);
}

async function getResourceMapping(client: Client, siteId: number) {
  const sitemapArray = await getSitemapArray(client, siteId);
  const resourcesMap: Record<string, Resource> = {};

  for (const resource of sitemapArray) {
    resourcesMap[path.join("/", resource.fullPermalink)] = resource;
  }

  return resourcesMap;
}

async function getSitemapArray(
  client: Client,
  siteId: number
): Promise<Resource[]> {
  const result = await client.query(GET_ALL_RESOURCES_WITH_FULL_PERMALINKS, [
    siteId,
  ]);
  return result.rows;
}

async function getBlob(client: Client, blobId: number): Promise<string> {
  const result = await client.query(
    `SELECT content FROM public."Blob" WHERE id = $1`,
    [blobId]
  );
  return JSON.stringify(result.rows[0].content);
}

async function updateBlob(client: Client, blobId: number, content: string) {
  try {
    await client.query(`UPDATE public."Blob" SET content = $1 WHERE id = $2`, [
      content,
      blobId,
    ]);
  } catch (err) {
    console.error(content);
    console.error(err);
    throw new Error();
  }
}

async function getNavbar(client: Client, siteId: number): Promise<string> {
  const result = await client.query(
    `SELECT content FROM public."Navbar" WHERE "siteId" = $1`,
    [siteId]
  );
  return JSON.stringify(result.rows[0].content);
}

async function updateNavbar(client: Client, siteId: number, content: string) {
  try {
    await client.query(
      `UPDATE public."Navbar" SET content = $1 WHERE "siteId" = $2`,
      [content, siteId]
    );
  } catch (err) {
    console.error(content);
    console.error(err);
    throw new Error();
  }
}

async function getFooter(client: Client, siteId: number): Promise<string> {
  const result = await client.query(
    `SELECT content FROM public."Footer" WHERE "siteId" = $1`,
    [siteId]
  );
  return JSON.stringify(result.rows[0].content);
}

async function updateFooter(client: Client, siteId: number, content: string) {
  try {
    await client.query(
      `UPDATE public."Footer" SET content = $1 WHERE "siteId" = $2`,
      [content, siteId]
    );
  } catch (err) {
    console.error(content);
    console.error(err);
    throw new Error();
  }
}

async function getSiteConfig(client: Client, siteId: number): Promise<string> {
  const result = await client.query(
    `SELECT config FROM public."Site" WHERE id = $1`,
    [siteId]
  );
  return JSON.stringify(result.rows[0].config);
}

async function updateSiteConfig(
  client: Client,
  siteId: number,
  config: string
) {
  try {
    await client.query(`UPDATE public."Site" SET config = $1 WHERE id = $2`, [
      config,
      siteId,
    ]);
  } catch (err) {
    console.error(config);
    console.error(err);
    throw new Error();
  }
}

function studioifyContent(
  content: string,
  sourceSiteId: number,
  destinationSiteId: number,
  resourcesMap: Record<string, Resource>
): string {
  let newContent = content;

  for (const page of Object.keys(resourcesMap)) {
    newContent = newContent
      .replaceAll(
        `"${page}/"`,
        `"[resource:${String(destinationSiteId)}:${String(resourcesMap[page]!.id)}]"`
      )
      .replaceAll(
        `"${page}"`,
        `"[resource:${String(destinationSiteId)}:${String(resourcesMap[page]!.id)}]"`
      )
      .replaceAll(
        `'${page}/'`,
        `'[resource:${String(destinationSiteId)}:${String(resourcesMap[page]!.id)}]'`
      )
      .replaceAll(
        `'${page}'`,
        `'[resource:${String(destinationSiteId)}:${String(resourcesMap[page]!.id)}]'`
      );
  }

  // Replace any string like /${sourceSiteId}/<uuid4>/ with /${destinationSiteId}/<same-uuid4>/
  const regex = new RegExp(
    `/${sourceSiteId}/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/`,
    "g"
  );
  newContent = newContent.replace(regex, `/${destinationSiteId}/$1/`);

  return newContent;
}

function getProperTitle(slug: string) {
  return slug[0]!.toUpperCase() + slug.slice(1).replace(/-/g, " ");
}
