import { confirm, number, select } from "@inquirer/prompts";
import { exec as base, execFile as baseFile } from "node:child_process";
import { promisify } from "node:util";
import { Client } from "pg";
import { ENVIRONMENT_CHOICES } from "./constants";

import fs from "node:fs";
import path from "node:path";
import { migrate } from "./migrate";

const exec = promisify(base);
const execFile = promisify(baseFile);

const getDbConnectCommand = (env: string) => {
  const lowerEnv = env.toLocaleLowerCase();

  return lowerEnv === "prod" ? "db:connect" : `db:connect:${lowerEnv}`;
};

const getSitemapAsArray = (sitemap: any) => {
  const result: any[] = [];

  const traverse = (node: any) => {
    if (node.permalink) {
      const { children, ...rest } = node;
      result.push(rest);
    }
    if (node.children && node.children.length > 0) {
      node.children.forEach((child: any) => traverse(child));
    }
  };

  traverse(sitemap);
  return result;
};

const getInputs = async () => {
  const sourceEnv = await select({
    message: "Environment you are exporting the site from:",
    choices: ENVIRONMENT_CHOICES,
  });

  const sourceSiteId = await number({
    message: "Site ID of the site you are exporting from:",
    required: true,
  });

  const destEnv = await select({
    message: "Environment you are importing the site to:",
    choices: [
      ...ENVIRONMENT_CHOICES,
      { name: "GitHub repository", value: "GITHUB" },
    ],
  });

  const destSiteId =
    destEnv !== "GITHUB"
      ? await number({
          message:
            "Site ID of the site you are importing to (leave empty to create a new site):",
        })
      : undefined;

  return { sourceEnv, sourceSiteId, destEnv, destSiteId };
};

const unstudioifySite = async (sourceSiteId: number) => {
  // Walk through all the JSON files inside the exported directory, finding all
  // the reference links and replacing them with the actual permalink
  const sitemapPath = path.join(process.cwd(), "temp", "sitemap.json");
  const sitemap = JSON.parse(fs.readFileSync(sitemapPath, "utf-8"));
  const sitemapArray = getSitemapAsArray(sitemap);

  const allJsonFiles = fs
    .readdirSync(path.join(process.cwd(), "temp"), { recursive: true })
    .filter(
      (file) => (file as string).endsWith(".json") && file !== "sitemap.json"
    ) as string[];

  for (const file of allJsonFiles) {
    const filePath = path.join(process.cwd(), "temp", file);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    let jsonContent;
    try {
      jsonContent = JSON.parse(fileContent);
    } catch (err) {
      console.error(`Error parsing JSON file ${file}:`, err);
      continue;
    }

    const updatedContent = JSON.stringify(jsonContent, null, 2).replace(
      new RegExp(`\\[resource:${sourceSiteId}:(\\d+)\\]`, "g"),
      (match, resourceId) => {
        const resource = sitemapArray.find(
          (res) => res.id === resourceId.toString()
        );

        if (!resource) {
          console.warn(
            `Warning: No resource found with ID ${resourceId} for link ${match} in file ${file}`
          );
          return match;
        }

        return resource.permalink;
      }
    );

    fs.writeFileSync(filePath, updatedContent, "utf-8");
  }
};

const main = async () => {
  let siteName = "Default site name";
  const { sourceEnv, sourceSiteId, destEnv, destSiteId } = await getInputs();

  if (sourceEnv !== "LOCAL") {
    await confirm({
      message: `Have you opened your connection to the database using npm run ${getDbConnectCommand(sourceEnv)}?`,
    });
  }

  const isDraftIncluded = await select({
    message: "Do you wish to include the draft content?",
    choices: [
      {
        name: "Yes",
        value: true,
        description:
          "The draft content is taken if available, otherwise the published content",
      },
      {
        name: "No",
        value: false,
        description: "Only the published content is taken",
      },
    ],
  });

  // Step 1: Export the site from the source environment
  console.log(`Exporting site ${sourceSiteId} from ${sourceEnv}...`);
  const exportDir = path.join(process.cwd(), "../build/scripts/publishing");
  const queryFilePath = path.join(
    process.cwd(),
    "../build/scripts/publishing/queries.ts"
  );
  const originalQueryFile = fs.readFileSync(queryFilePath, "utf-8");

  if (isDraftIncluded) {
    // Perform a text replacement of the query file to include draft content
    const modifiedQueryFile = originalQueryFile
      .replaceAll(
        `WHEN r.type IN ('Page', 'CollectionPage', 'CollectionLink', 'IndexPage', 'RootPage', 'FolderMeta', 'CollectionMeta') THEN b."content"`,
        `WHEN r.type IN ('Page', 'CollectionPage', 'CollectionLink', 'IndexPage', 'RootPage', 'FolderMeta', 'CollectionMeta') THEN COALESCE(draftBlob."content", b."content")`
      )
      .replaceAll(
        `LEFT JOIN public."Blob" b ON v."blobId" = b.id`,
        `LEFT JOIN public."Blob" b ON v."blobId" = b.id LEFT JOIN public."Blob" draftBlob ON r."draftBlobId" = draftBlob.id`
      );
    fs.writeFileSync(queryFilePath, modifiedQueryFile, "utf-8");
  }

  await exec(`npm run start`, {
    cwd: exportDir,
    env: {
      ...process.env,
      SITE_ID: sourceSiteId.toString(),
      DB_USERNAME: process.env[`${sourceEnv}_DB_USERNAME`],
      DB_PASSWORD: process.env[`${sourceEnv}_DB_PASSWORD`],
      DB_HOST: process.env[`${sourceEnv}_DB_HOST`],
      DB_PORT: process.env[`${sourceEnv}_DB_PORT`],
      DB_NAME: process.env[`${sourceEnv}_DB_NAME`],
    },
  });

  if (isDraftIncluded) {
    // Revert the query file back to the original
    fs.writeFileSync(queryFilePath, originalQueryFile, "utf-8");
  }

  const sourceClient = new Client({
    user: process.env[`${sourceEnv}_DB_USERNAME`],
    host: process.env[`${sourceEnv}_DB_HOST`],
    database: process.env[`${sourceEnv}_DB_NAME`],
    password: decodeURIComponent(process.env[`${sourceEnv}_DB_PASSWORD`] ?? ""),
    port: Number(process.env[`${sourceEnv}_DB_PORT`]),
  });

  try {
    await sourceClient.connect();

    const res = await sourceClient.query(
      `SELECT name FROM "Site" WHERE id = $1`,
      [sourceSiteId]
    );

    if (res.rows.length === 0) {
      console.error(`No site found with ID ${sourceSiteId} in ${sourceEnv}`);
      process.exit(1);
    }

    siteName = res.rows[0].name;
  } catch (err) {
    console.error("Error connecting to source database:", err);
    process.exit(1);
  } finally {
    await sourceClient.end();
  }

  // Move the exported files to a temporary directory
  const tempDir = path.join(process.cwd(), "temp");
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir);

  await execFile("mv", [
    path.join(exportDir, "data"),
    path.join(tempDir, "data"),
  ]);
  await execFile("mv", [
    path.join(exportDir, "schema"),
    path.join(tempDir, "schema"),
  ]);
  await execFile("mv", [
    path.join(exportDir, "sitemap.json"),
    path.join(tempDir, "sitemap.json"),
  ]);

  // Step 2: Export the assets from the S3 bucket
  if (sourceEnv !== "LOCAL") {
    console.log(`Exporting assets for site ${sourceSiteId}...`);
    const bucketName = process.env[`${sourceEnv}_AWS_S3_ASSETS_BUCKET_NAME`];
    await execFile(
      "aws",
      [
        "s3",
        "sync",
        `s3://${bucketName}/${sourceSiteId}`,
        `${tempDir}/public/${sourceSiteId}`,
      ],
      {
        cwd: exportDir,
        env: {
          ...process.env,
          AWS_PROFILE: process.env[`${sourceEnv}_AWS_PROFILE`],
        },
      }
    );
  }

  // Step 3: Unstudioify the exported site
  console.log("Unstudioifying the exported site...");
  await unstudioifySite(sourceSiteId);

  // Step 4: Prompt user to connect to the destination database
  if (destEnv !== "LOCAL" && destEnv !== "GITHUB") {
    await confirm({
      message: `Have you opened your connection to the database using npm run ${getDbConnectCommand(destEnv)}?`,
    });
  }

  // Step 5: Create the new site in the destination environment if no site ID is provided
  let finalDestSiteId = destSiteId;

  if (destEnv !== "GITHUB") {
    const destClient = new Client({
      user: process.env[`${destEnv}_DB_USERNAME`],
      host: process.env[`${destEnv}_DB_HOST`],
      database: process.env[`${destEnv}_DB_NAME`],
      password: decodeURIComponent(process.env[`${destEnv}_DB_PASSWORD`] ?? ""),
      port: Number(process.env[`${destEnv}_DB_PORT`]),
    });

    try {
      await destClient.connect();

      if (!destSiteId) {
        console.log(`Creating new site in ${destEnv}...`);
        const res = await destClient.query(
          `INSERT INTO "Site" (name, config, theme) VALUES ($1, '{}', '{}') RETURNING id`,
          [siteName]
        );
        finalDestSiteId = res.rows[0].id;
        console.log(`Created new site with ID ${finalDestSiteId}`);
      }

      // Step 6: Import the data into the destination environment
      console.log(
        `Importing data into site ${finalDestSiteId} in ${destEnv}...`
      );
      process.env.PUBLISHER_USER_ID =
        process.env[`${destEnv}_PUBLISHER_USER_ID`];
      await migrate(destClient, sourceSiteId, Number(finalDestSiteId));
    } catch (err) {
      console.error("Error creating new site:", err);
      process.exit(1);
    } finally {
      await destClient.end();
    }
  }

  // Step 7: Import the assets into the destination S3 bucket
  if (destEnv !== "LOCAL" && destEnv !== "GITHUB") {
    console.log(
      `Importing assets into site ${finalDestSiteId} in ${destEnv}...`
    );
    const bucketName = process.env[`${destEnv}_AWS_S3_ASSETS_BUCKET_NAME`];
    await execFile(
      "aws",
      [
        "s3",
        "sync",
        `public/${sourceSiteId}`,
        `s3://${bucketName}/${finalDestSiteId}`,
      ],
      {
        cwd: tempDir,
        env: {
          ...process.env,
          AWS_PROFILE: process.env[`${destEnv}_AWS_PROFILE`],
        },
      }
    );
  }

  // Step 8: If destination is GitHub, adjust the index pages such that
  // /about/_index.json becomes /about.json
  if (destEnv === "GITHUB") {
    console.log("Adjusting index pages for GitHub...");
    const allIndexFiles = fs
      .readdirSync(path.join(tempDir, "schema"), { recursive: true })
      .filter(
        (file) =>
          (file as string).endsWith("_index.json") && file !== "_index.json"
      ) as string[];

    for (const file of allIndexFiles) {
      const filePath = path.join(tempDir, "schema", file);
      const newFilePath = filePath.replace("/_index.json", ".json");
      fs.renameSync(filePath, newFilePath);
    }

    // Rename the top-level _index.json file to index.json
    const topLevelIndexPath = path.join(tempDir, "schema", "_index.json");
    if (fs.existsSync(topLevelIndexPath)) {
      const newTopLevelIndexPath = path.join(tempDir, "schema", "index.json");
      fs.renameSync(topLevelIndexPath, newTopLevelIndexPath);
    }
  }

  // Step 9: Clean up the temporary directory
  if (destEnv !== "GITHUB") {
    console.log("Cleaning up temporary files...");
    fs.rmSync(tempDir, { recursive: true, force: true });
  } else {
    console.log(
      `Exported site is available in the 'temp' directory. Feel free to import directly to a GitHub repository.`
    );
  }
};

main().catch((err) => console.error(err));
