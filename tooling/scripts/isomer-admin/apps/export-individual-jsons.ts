import fs from "fs";
import { input } from "@inquirer/prompts";
import type { ResourceRow } from "../types";
import { withDbClient } from "../utils/db";

export const exportIndividualJsons = async () => {
  const resourceIdsInput = await input({
    message:
      "Enter the resource IDs to export (comma-separated, e.g. 123,456,789)",
  });
  const resourceIds = resourceIdsInput
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id !== "" && /^\d+$/.test(id));

  if (resourceIds.length === 0) {
    console.error("No valid resource IDs provided");
    return;
  }

  await withDbClient(async (client) => {
    const placeholders = resourceIds.map((_, i) => `$${i + 1}`).join(",");

    const allResources = await client.query<ResourceRow>(
      `SELECT "Resource".id, "Resource".permalink,
              COALESCE("DraftBlob".content, "PublishedBlob".content) AS content
       FROM "Resource"
       LEFT JOIN "Blob" AS "DraftBlob" ON "Resource"."draftBlobId" = "DraftBlob".id
       LEFT JOIN "Version" ON "Resource"."publishedVersionId" = "Version".id
       LEFT JOIN "Blob" AS "PublishedBlob" ON "Version"."blobId" = "PublishedBlob".id
       WHERE "Resource"."id" IN (${placeholders})
       AND "Resource".type NOT IN ('Folder', 'Collection', 'IndexPage')
       AND COALESCE("DraftBlob".content, "PublishedBlob".content) IS NOT NULL`,
      resourceIds
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
