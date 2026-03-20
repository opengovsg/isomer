import fs from "fs";
import { input, confirm } from "@inquirer/prompts";
import { withDbClient } from "../utils/db";

export const importFolderJsons = async () => {
  const publisherEmail = await input({
    message: "Enter your email address (e.g. zhongjun@open.gov.sg)",
  });
  const hasPlacedFiles = await confirm({
    message:
      "Have you placed all the JSON files you need inside the `./input` folder?",
    default: true,
  });

  if (!hasPlacedFiles) {
    console.log(
      "Please place the JSON files in the `./input` folder first, then try again."
    );
    return;
  }

  const shouldPublish = await confirm({
    message: "Should the imported blobs be published immediately?",
    default: false,
  });

  await withDbClient(async (client) => {
    const userResult = await client.query<{ id: string }>(
      `SELECT id FROM "User" WHERE email = $1`,
      [publisherEmail.toLowerCase()]
    );
    const user = userResult.rows[0];
    if (!user) {
      console.error(`User with email ${publisherEmail} not found`);
      return;
    }
    const publisherUserId = user.id;
    const files = fs.readdirSync("./input");
    const filteredFiles = files.filter((item) => item.endsWith(".json"));

    for (const file of filteredFiles) {
      console.log(`Processing file: ${file}`);
      const filePath = `./input/${file}`;
      const fileContent = fs.readFileSync(filePath, "utf-8");

      // NOTE: Change this line if your input files are in a different format.
      // However, you should ensure that the resource ID is obtainable from the
      // filename in some way
      const id = Number(file.split(".")[0]);

      const resource = await client.query<{
        id: number;
        draftBlobId: string | null;
        publishedVersionId: string | null;
      }>(
        `SELECT id, "draftBlobId", "publishedVersionId" FROM "Resource" WHERE "id" = $1`,
        [id]
      );

      const row = resource.rows[0];
      if (!row) {
        console.log(`Resource with ID ${id} does not exist in the database`);
        continue;
      }

      let draftBlobId = row.draftBlobId;

      if (row.draftBlobId) {
        await client.query(`UPDATE "Blob" SET content = $1 WHERE id = $2`, [
          fileContent,
          row.draftBlobId,
        ]);
      } else {
        const newBlob = await client.query<{ id: string }>(
          `INSERT INTO "Blob" (content) VALUES ($1) RETURNING id`,
          [fileContent]
        );
        const newBlobRow = newBlob.rows[0];
        if (!newBlobRow) {
          console.error(`Failed to create blob for ${file}`);
          continue;
        }
        draftBlobId = newBlobRow.id;
      }

      if (!shouldPublish) {
        await client.query(
          `UPDATE "Resource" SET "draftBlobId" = $1 WHERE id = $2`,
          [draftBlobId, id]
        );
        continue;
      }

      const currentVersion = await client.query<{ versionNum: number }>(
        `SELECT "versionNum" FROM "Version" WHERE id = $1`,
        [row.publishedVersionId]
      );
      const latestVersionNumber = currentVersion.rows[0]?.versionNum ?? 0;

      const newVersion = await client.query<{ id: string }>(
        `INSERT INTO "Version" ("blobId", "versionNum", "resourceId", "publishedBy") VALUES ($1, $2, $3, $4) RETURNING id`,
        [draftBlobId, latestVersionNumber + 1, row.id, publisherUserId]
      );

      const newVersionRow = newVersion.rows[0];
      if (!newVersionRow) {
        console.error(`Failed to create version for resource ${id}`);
        continue;
      }
      await client.query(
        `UPDATE "Resource" SET "draftBlobId" = NULL, "publishedVersionId" = $1, state = 'Published' WHERE id = $2`,
        [newVersionRow.id, row.id]
      );
    }

    console.log("All JSON blobs imported successfully");
  });
};
