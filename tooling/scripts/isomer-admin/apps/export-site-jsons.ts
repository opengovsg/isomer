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
      `SELECT "Resource".id, "Resource".permalink,
              COALESCE("DraftBlob".content, "PublishedBlob".content) AS content
       FROM "Resource"
       LEFT JOIN "Blob" AS "DraftBlob" ON "Resource"."draftBlobId" = "DraftBlob".id
       LEFT JOIN "Version" ON "Resource"."publishedVersionId" = "Version".id
       LEFT JOIN "Blob" AS "PublishedBlob" ON "Version"."blobId" = "PublishedBlob".id
       WHERE "Resource"."siteId" = $1
       AND "Resource".type NOT IN ('Folder', 'Collection')
       AND COALESCE("DraftBlob".content, "PublishedBlob".content) IS NOT NULL`,
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

    console.log(
      `All JSON blobs saved successfully in ${process.cwd()}/output/`
    );
  });
};
