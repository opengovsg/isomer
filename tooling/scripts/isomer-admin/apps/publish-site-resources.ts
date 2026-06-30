import { input, confirm } from "@inquirer/prompts";
import { withDbClient } from "../utils/db";

export const publishSiteResources = async () => {
  const publisherEmail = await input({
    message: "Enter your email address (e.g. adriangoh@open.gov.sg)",
  });

  const siteId = Number(await input({ message: "Enter the site ID to publish" }));

  if (isNaN(siteId)) {
    console.error("Invalid site ID provided");
    return;
  }

  await withDbClient(async (client) => {
    const userResult = await client.query<{ id: string }>(
      `SELECT id FROM "User" WHERE email = $1`,
      [publisherEmail.toLowerCase()],
    );
    const user = userResult.rows[0];
    if (!user) {
      console.error(`User with email ${publisherEmail} not found`);
      return;
    }
    const publisherUserId = user.id;

    const draftResources = await client.query<{
      id: string;
      type: string;
      title: string;
      draftBlobId: string;
      publishedVersionId: string | null;
    }>(
      `SELECT id, type, title, "draftBlobId", "publishedVersionId"
       FROM "Resource"
       WHERE "siteId" = $1
         AND "draftBlobId" IS NOT NULL
         AND state = 'Draft'`,
      [siteId],
    );

    const resources = draftResources.rows;

    if (resources.length === 0) {
      console.log("No draft resources found for this site.");
      return;
    }

    console.log(
      `Found ${resources.length} draft resource(s) to publish for site ${siteId}:`,
    );
    for (const r of resources) {
      console.log(`  [${r.id}] ${r.type} — ${r.title}`);
    }

    const confirmed = await confirm({
      message: `Publish all ${resources.length} resource(s)?`,
      default: false,
    });

    if (!confirmed) {
      console.log("Aborted.");
      return;
    }

    await client.query("BEGIN");

    try {
      for (const resource of resources) {
        const currentVersion = await client.query<{ versionNum: number }>(
          `SELECT "versionNum" FROM "Version" WHERE id = $1`,
          [resource.publishedVersionId],
        );
        const latestVersionNumber = currentVersion.rows[0]?.versionNum ?? 0;

        const newVersion = await client.query<{ id: string }>(
          `INSERT INTO "Version" ("blobId", "versionNum", "resourceId", "publishedBy")
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [
            resource.draftBlobId,
            latestVersionNumber + 1,
            resource.id,
            publisherUserId,
          ],
        );

        const newVersionRow = newVersion.rows[0];
        if (!newVersionRow) {
          throw new Error(
            `Failed to create version for resource ${resource.id}`,
          );
        }

        await client.query(
          `UPDATE "Resource"
           SET "draftBlobId" = NULL, "publishedVersionId" = $1, state = 'Published', "updatedAt" = NOW()
           WHERE id = $2`,
          [newVersionRow.id, resource.id],
        );

      }

      await client.query("COMMIT");
      for (const resource of resources) {
        console.log(`Published resource ${resource.id} (${resource.title})`);
      }
      console.log(`\nDone. ${resources.length} resource(s) published.`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Transaction rolled back. No resources were published.", err);
    }
  });
};
