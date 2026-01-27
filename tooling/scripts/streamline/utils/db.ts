import path from "path";
import { Client } from "pg";
import * as dotenv from "dotenv";

dotenv.config({
  path: path.join(__dirname, "..", ".env"),
});

interface GetSiteConfigResult {
  siteName: string;
  brandColor: string;
}

// NOTE: Stub type definition as the other fields are not required
interface SiteRow {
  config: {
    url: string;
    siteName?: string;
    search?: {
      type: "searchSG";
      clientId: string;
    };
  };
  theme: {
    colors?: {
      brand?: {
        canvas?: {
          inverse?: string;
        };
      };
    };
  };
}

export const getSiteConfig = async (
  siteId: number
): Promise<GetSiteConfigResult> => {
  const client = new Client({
    connectionString: process.env.ISOMER_STUDIO_DATABASE_URL,
  });

  try {
    await client.connect();

    const res = await client.query<SiteRow>(
      `SELECT config, theme FROM "Site" WHERE id = $1`,
      [siteId]
    );

    if (res.rows.length !== 1) {
      throw new Error(`Site with ID ${siteId} not found.`);
    }

    const result = res.rows[0];

    if (!result) {
      throw new Error(`Site with ID ${siteId} has no config or theme.`);
    }

    const { config, theme } = result;

    return {
      siteName: config.siteName || "Isomer Site",
      brandColor: theme.colors?.brand?.canvas?.inverse || "#00405f",
    };
  } catch (error) {
    console.error("Error fetching site config:", error);
    throw error;
  } finally {
    await client.end();
  }
};

export const updateSiteConfig = async (
  siteId: number,
  searchSGClientId: string
) => {
  const client = new Client({
    connectionString: process.env.ISOMER_STUDIO_DATABASE_URL,
  });

  try {
    await client.connect();

    const res = await client.query(
      `UPDATE "Site" SET config = jsonb_set(config, '{search}', $1::jsonb) WHERE id = $2`,
      [JSON.stringify({ type: "searchSG", clientId: searchSGClientId }), siteId]
    );

    if (res.rowCount !== 1) {
      throw new Error(`Failed to update site with ID ${siteId}.`);
    }
  } catch (error) {
    console.error("Error updating site config:", error);
    throw error;
  } finally {
    await client.end();
  }
};

// NOTE: Stub type definition as the other fields are not required
interface ReposRow {
  site_id: number;
}

export const removeAllSiteCollaborators = async (repoName: string) => {
  const client = new Client({
    connectionString: process.env.ISOMER_CMS_DATABASE_URL,
  });

  try {
    await client.connect();

    const siteIdRes = await client.query<ReposRow>(
      `SELECT site_id FROM repos WHERE name = $1`,
      [repoName]
    );

    if (siteIdRes.rows.length !== 1) {
      throw new Error(`Repository with name ${repoName} not found.`);
    }

    const siteId = siteIdRes.rows[0]?.site_id;

    if (!siteId) {
      throw new Error(
        `Repository with name ${repoName} has no associated site ID.`
      );
    }

    await client.query(`DELETE FROM site_members WHERE site_id = $1`, [siteId]);
  } catch (error) {
    console.error("Error removing site collaborators:", error);
    throw error;
  } finally {
    await client.end();
  }
};
