import fs from "fs";
import { input } from "@inquirer/prompts";
import type { ResourceRow } from "../types";
import { withDbClient } from "../utils/db";

export const exportSiteJsons = async () => {
  const siteId = Number(
    await input({ message: "Enter the site ID to export" })
  );

  if (isNaN(siteId)) {
    console.error("Invalid site ID provided");
    return;
  }

  await withDbClient(async (client) => {
    const allResources = await client.query<ResourceRow>(
      `SELECT "Resource".id, "Resource".permalink, "Blob".content
       FROM "Resource"
       JOIN "Blob" ON "Resource"."draftBlobId" = "Blob".id
       WHERE "Resource"."siteId" = $1
       AND "Resource"."draftBlobId" IS NOT NULL
       AND "Resource".type NOT IN ('Folder', 'Collection')
       UNION
       SELECT "Resource".id, "Resource".permalink, "Blob".content
       FROM "Resource"
       JOIN "Version" ON "Resource"."publishedVersionId" = "Version".id
       JOIN "Blob" ON "Version"."blobId" = "Blob".id
       WHERE "Resource"."siteId" = $1
       AND "Resource"."draftBlobId" IS NULL
       AND "Resource".type NOT IN ('Folder', 'Collection')`,
      [siteId]
    );

    if (!fs.existsSync("./output")) {
      fs.mkdirSync("./output");
    }

    for (const resource of allResources.rows) {
      const { id, content } = resource;
      // NOTE: Adjust this line if you want to export with the permalink as the
      // file name instead of the resource ID
      const fileName = `${id}.json`;
      const filePath = `./output/${fileName}`;
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
      console.log(`Saved ${fileName}`);
    }

    console.log("All JSON blobs saved successfully");
  });
};
