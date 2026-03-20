import fs from "fs";
import { input } from "@inquirer/prompts";
import type { ResourceRow } from "../types";
import { withDbClient } from "../utils/db";

export const extractFolderJsons = async () => {
  const parentResourceIdInput = await input({
    message:
      "Enter the parent resource ID to extract children from. This should either be a Folder or Collection resource ID.",
  });

  if (!/^\d+$/.test(parentResourceIdInput)) {
    console.error(
      "Invalid parent resource ID. Please enter a numeric ID."
    );
    return;
  }

  await withDbClient(async (client) => {
    const allResources = await client.query<ResourceRow>(
      `SELECT "Resource".id, "Resource".permalink, "Blob".content
       FROM "Resource"
       JOIN "Blob" ON "Resource"."draftBlobId" = "Blob".id
       WHERE "Resource"."draftBlobId" IS NOT NULL
       AND "Resource"."parentId" = $1
       AND "Resource".type NOT IN ('Folder', 'Collection', 'IndexPage')
       UNION
       SELECT "Resource".id, "Resource".permalink, "Blob".content
       FROM "Resource"
       JOIN "Version" ON "Resource"."publishedVersionId" = "Version".id
       JOIN "Blob" ON "Version"."blobId" = "Blob".id
       WHERE "Resource"."parentId" = $1
       AND "Resource"."draftBlobId" IS NULL
       AND "Resource".type NOT IN ('Folder', 'Collection', 'IndexPage')`,
      [parentResourceIdInput]
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
