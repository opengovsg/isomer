import type { Client } from "pg";
import { input } from "@inquirer/prompts";
import { createId } from "@paralleldrive/cuid2";
import { withDbClient } from "../utils/db";

import { ISOMER_ADMINS_AND_MIGRATORS_EMAILS } from "../../../../apps/studio/prisma/constants";

const insertUsersForSite = async (client: Client, siteId: number) => {
  console.log(`Processing site ${siteId}...`);

  for (const email of ISOMER_ADMINS_AND_MIGRATORS_EMAILS) {
    let userId: string;
    const userResult = await client.query<{ id: string }>(
      `SELECT id FROM "User" WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      const [localPart] = email.split("@");
      const name = (localPart ?? "").replaceAll("_", " ");
      const insertUserResult = await client.query<{ id: string }>(
        `INSERT INTO "User" (id, name, email, phone) VALUES ($1, $2, $3, '') RETURNING id`,
        [createId(), name, email.toLocaleLowerCase()]
      );
      const insertedRow = insertUserResult.rows[0];
      if (!insertedRow) {
        console.error(`Failed to insert user ${email}`);
        continue;
      }
      userId = insertedRow.id;
      console.log(`Created user ${email} with ID ${userId}`);
    } else {
      const existingRow = userResult.rows[0];
      if (!existingRow) {
        continue;
      }
      userId = existingRow.id;
    }

    const collaboratorCheck = await client.query(
      `SELECT * FROM "ResourcePermission" WHERE "siteId" = $1 AND "userId" = $2`,
      [siteId, userId]
    );

    if (collaboratorCheck.rows.length > 0) {
      continue;
    }

    await client.query(
      `INSERT INTO "ResourcePermission" ("siteId", "userId", role) VALUES ($1, $2, 'Admin')`,
      [siteId, userId]
    );
    console.log(`Added ${email} as an admin to site ${siteId}`);
  }
};

export const addIsomerCollaborators = async () => {
  const mode = await input({
    message:
      'Enter a site ID to add collaborators to a single site, or "all:<minSiteId>" to add to all sites from that ID onwards',
  });

  await withDbClient(async (client) => {
    if (mode.startsWith("all:")) {
      const minSiteId = Number(mode.split(":")[1]);
      if (isNaN(minSiteId)) {
        console.error(
          "Invalid site ID. Please enter a valid number after 'all:'."
        );
        return;
      }
      const siteResult = await client.query(
        `SELECT id FROM "Site" WHERE id >= $1 ORDER BY id`,
        [minSiteId]
      );
      const siteIds: number[] = siteResult.rows.map(
        (row: { id: number }) => row.id
      );

      for (const siteId of siteIds) {
        await insertUsersForSite(client, siteId);
      }
    } else {
      const siteId = Number(mode);
      if (isNaN(siteId)) {
        console.error("Invalid site ID. Please enter a valid number.");
        return;
      }
      await insertUsersForSite(client, siteId);
    }

    console.log("All users inserted");
  });
};
