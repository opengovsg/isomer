import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { performance } from "perf_hooks"; // Importing performance module

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
const SITE_ID = Number(process.env.SITE_ID);

interface Resource {
  id: number;
  title: string;
  permalink: string;
  parentId: number | null;
  type: string;
  content?: any;
  fullPermalink?: string;
}

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  const start = performance.now(); // Start profiling

  try {
    await client.connect();

    // Fetch and write navbar, footer, and config JSONs
    await fetchAndWriteSiteData(client);

    // Fetch all resources and their full permalinks
    const resources = await getAllResourcesWithFullPermalinks(client);

    // Process each resource
    for (const resource of resources) {
      console.log(
        `Processing resource with id ${resource.id}, fullPermalink: ${resource.fullPermalink}`
      );
      if (resource.type === "Page" && resource.content) {
        await writeContentToFile(
          resource.fullPermalink,
          resource.content,
          resource.parentId
        );
      } else {
        console.log(
          `Skipping resource with id ${resource.id} as it is not a Page or has no content.`
        );
      }
    }
  } finally {
    await client.end();
    const end = performance.now(); // End profiling
    console.log(`Program completed in ${(end - start) / 1000} seconds`);
  }
}

async function getAllResourcesWithFullPermalinks(
  client: Client
): Promise<Resource[]> {
  const query = `
      WITH RECURSIVE resource_path (id, title, permalink, parentId, type, content, "fullPermalink") AS (
        SELECT
          r.id,
          r.title,
          r.permalink,
          r."parentId",
          r.type,
          b."content",
          r.permalink AS "fullPermalink"
        FROM
          public."Resource" r
          LEFT JOIN public."Version" v ON v."id" = r."publishedVersionId"
          LEFT JOIN public."Blob" b ON v."blobId" = b.id
        WHERE
          r."parentId" IS NULL AND r."siteId" = $1
  
        UNION ALL
  
        SELECT
          r.id,
          r.title,
          r.permalink,
          r."parentId",
          r.type,
          b."content",
          CONCAT(path."fullPermalink", '/', r.permalink) AS "fullPermalink"
        FROM
          public."Resource" r
          LEFT JOIN public."Version" v ON v."id" = r."publishedVersionId"
          LEFT JOIN public."Blob" b ON v."blobId" = b.id
          INNER JOIN resource_path path ON r."parentId" = path.id
      )
      SELECT * FROM resource_path;
    `;
  const values = [SITE_ID];

  try {
    const res = await client.query(query, values);
    console.log("Fetched resources with full permalinks:", res.rows);
    return res.rows;
  } catch (err) {
    console.error("Error fetching resources:", err);
    return [];
  }
}

async function writeContentToFile(
  fullPermalink: string | undefined,
  content: any,
  parentId: number | null
) {
  try {
    if (!fullPermalink) {
      console.error("Error: fullPermalink is undefined or empty for resource");
      return;
    }

    let directoryPath: string;
    let fileName: string;

    if (parentId === null) {
      // No enclosing folder if parentId is null
      directoryPath = path.join(__dirname, "schema");
      fileName = `${fullPermalink}.json`;
    } else {
      directoryPath = path.join(
        __dirname,
        "schema",
        path.dirname(fullPermalink)
      );
      fileName = `${path.basename(fullPermalink)}.json`;
    }

    if (!directoryPath || !fileName) {
      console.error("Error: directoryPath or fileName is undefined");
      return;
    }

    const filePath = path.join(directoryPath, fileName);

    // Create directories if they don't exist
    fs.mkdirSync(directoryPath, { recursive: true });

    // Write JSON content to file
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf-8");

    console.log(`Successfully wrote file: ${filePath}`);
  } catch (error) {
    console.error("Error writing content to file:", error);
  }
}

async function fetchAndWriteSiteData(client: Client) {
  try {
    // Fetch navbar.json
    const navbarResult = await client.query(
      `SELECT content FROM public."Navbar" WHERE "siteId" = $1`,
      [SITE_ID]
    );
    if (navbarResult.rows.length > 0) {
      await writeJsonToFile(navbarResult.rows[0].content, "navbar.json");
    }

    // Fetch footer.json
    const footerResult = await client.query(
      `SELECT content FROM public."Footer" WHERE "siteId" = $1`,
      [SITE_ID]
    );
    if (footerResult.rows.length > 0) {
      await writeJsonToFile(footerResult.rows[0].content, "footer.json");
    }

    // Fetch config.json
    const configResult = await client.query(
      `SELECT config FROM public."Site" WHERE "id" = $1`,
      [SITE_ID]
    );
    if (configResult.rows.length > 0) {
      await writeJsonToFile(configResult.rows[0].config, "config.json");
    }
  } catch (err) {
    console.error("Error fetching site data:", err);
  }
}

async function writeJsonToFile(content: any, filename: string) {
  const directoryPath = path.join(__dirname, "data");

  try {
    // Create directories if they don't exist
    fs.mkdirSync(directoryPath, { recursive: true });

    const filePath = path.join(directoryPath, filename);
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf-8");

    console.log(`Successfully wrote file: ${filePath}`);
  } catch (error) {
    console.error(`Error writing ${filename} to file:`, error);
  }
}

main().catch((err) => console.error(err));
