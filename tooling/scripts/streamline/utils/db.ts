import path from "path";
import { Signer } from "@aws-sdk/rds-signer";
import { fromSSO } from "@aws-sdk/credential-providers";
import { Client } from "pg";
import * as dotenv from "dotenv";

dotenv.config({
  path: path.join(__dirname, "..", ".env"),
});

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var ${name}`);
  }
  return value;
};

// RDS IAM tokens expire after 15 minutes and are checked only at connect time.
export const createStudioClient = async (): Promise<Client> => {
  const hostname = requireEnv("ISOMER_STUDIO_DB_HOST");
  const username = requireEnv("ISOMER_STUDIO_DB_USER");
  const database = requireEnv("ISOMER_STUDIO_DB_NAME");
  const profile = requireEnv("AWS_NEXT_PROFILE");
  const port = Number(requireEnv("ISOMER_STUDIO_DB_PORT"));
  const region = requireEnv("ISOMER_STUDIO_DB_REGION");
  const tunnelHost = requireEnv("ISOMER_STUDIO_DB_TUNNEL_HOST");
  const tunnelPort = Number(requireEnv("ISOMER_STUDIO_DB_TUNNEL_PORT"));

  const signer = new Signer({
    hostname,
    port,
    username,
    region,
    credentials: fromSSO({ profile }),
  });

  return new Client({
    host: tunnelHost,
    port: tunnelPort,
    user: username,
    password: await signer.getAuthToken(),
    database,
    ssl: {
      // IAM requires TLS. Node does not trust the Amazon RDS CA, and the
      // SSM tunnel presents that cert on localhost, so we encrypt without
      // verifying the issuer.
      rejectUnauthorized: false,
      servername: hostname,
    },
  });
};

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

interface GetSiteConfigResult {
  siteName: string;
  brandColor: string;
  config: SiteRow["config"];
}

export const getSiteConfig = async (
  siteId: number,
): Promise<GetSiteConfigResult> => {
  const client = await createStudioClient();

  try {
    await client.connect();

    const res = await client.query<SiteRow>(
      `SELECT config, theme FROM "Site" WHERE id = $1`,
      [siteId],
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
      config,
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
  searchSGClientId: string,
  url: string,
) => {
  const client = await createStudioClient();

  try {
    await client.connect();

    const res = await client.query(`SELECT config FROM "Site" WHERE id = $1`, [
      siteId,
    ]);

    if (res.rows.length !== 1) {
      throw new Error(`Site with ID ${siteId} not found.`);
    }

    const currentConfig = res.rows[0].config;

    const updatedConfig = {
      ...currentConfig,
      search: {
        type: "searchSG",
        clientId: searchSGClientId,
      },
      url: `https://${url}`,
    };

    const updateRes = await client.query(
      `UPDATE "Site" SET config = $1 WHERE id = $2`,
      [updatedConfig, siteId],
    );

    if (updateRes.rowCount !== 1) {
      throw new Error(`Failed to update site with ID ${siteId}.`);
    }

    console.log(`Successfully updated site with ID ${siteId}.`);
  } catch (error) {
    console.error("Error updating site config:", error);
    throw error;
  } finally {
    await client.end();
  }
};

export const getRemoveAllSiteCollaboratorsQuery = (repoNames: string[]) => {
  return `  DELETE FROM site_members
  WHERE site_members.site_id IN (
    SELECT repos.site_id
    FROM repos
    WHERE repos.name IN (${repoNames.map((name) => `'${name}'`).join(", ")})
  );`;
};
