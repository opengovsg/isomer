import Ajv from "ajv";
import fs from "fs";
import path from "path";
import { select, input } from "@inquirer/prompts";
import type { ResourceRowWithSiteAndTitle } from "../types";
import { withDbClient } from "../utils/db";

const SCHEMA_URL = "https://schema.isomer.gov.sg";

const ajv = new Ajv({ strict: false, logger: false });

let cachedValidate: ReturnType<typeof ajv.compile> | null = null;

const isSchemaValid = (
  content: unknown,
  jsonSchema: Record<string, unknown>
): boolean => {
  cachedValidate ??= ajv.compile(jsonSchema);
  return cachedValidate(content) as boolean;
};

const checkDBBlobs = async (jsonSchema: Record<string, unknown>) => {
  const invalidEntries: string[] = [];

  await withDbClient(async (client) => {
    const allResources = await client.query<ResourceRowWithSiteAndTitle>(
      `SELECT "Resource".id, "Resource".title, "Resource"."siteId",
              COALESCE("DraftBlob".content, "PublishedBlob".content) AS content
       FROM "Resource"
       LEFT JOIN "Blob" AS "DraftBlob" ON "Resource"."draftBlobId" = "DraftBlob".id
       LEFT JOIN "Version" ON "Resource"."publishedVersionId" = "Version".id
       LEFT JOIN "Blob" AS "PublishedBlob" ON "Version"."blobId" = "PublishedBlob".id
       WHERE COALESCE("DraftBlob".content, "PublishedBlob".content) IS NOT NULL`
    );

    for (const resource of allResources.rows) {
      const isValid = isSchemaValid(resource.content, jsonSchema);

      if (!isValid) {
        invalidEntries.push(
          `Schema not valid for resource ID ${resource.id} ("${resource.title}") from site ID ${resource.siteId}: https://studio.isomer.gov.sg/sites/${resource.siteId}/pages/${resource.id}`
        );
      }
    }
  });

  const outputPath = "invalid-schema.txt";
  fs.writeFileSync(outputPath, invalidEntries.join("\n"), "utf-8");
  console.log(
    `Validation complete. Found ${invalidEntries.length} invalid resource(s). Results written to ${outputPath}`
  );
};

const checkLocalDirectory = (
  localDirectory: string,
  jsonSchema: Record<string, unknown>
) => {
  const invalidEntries: string[] = [];
  const files = fs.readdirSync(localDirectory, { recursive: true });
  const jsonFiles = (files as string[]).filter(
    (file) => path.extname(file) === ".json"
  );

  for (const file of jsonFiles) {
    const filePath = path.join(localDirectory, file);
    try {
      const fileContents = fs.readFileSync(filePath, "utf-8");
      const content: unknown = JSON.parse(fileContents);
      const isValid = isSchemaValid(content, jsonSchema);

      if (!isValid) {
        invalidEntries.push(`Schema not valid for file: ${filePath}`);
      }
    } catch {
      invalidEntries.push(`Failed to read or parse JSON for file: ${filePath}`);
    }
  }

  const outputPath = "invalid-schema.txt";
  fs.writeFileSync(outputPath, invalidEntries.join("\n"), "utf-8");
  console.log(
    `Validation complete. Found ${invalidEntries.length} invalid file(s). Results written to ${outputPath}`
  );
};

const fetchSchema = async (): Promise<Record<string, unknown>> => {
  console.log(`Downloading schema from ${SCHEMA_URL}...`);
  const response = await fetch(SCHEMA_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to download schema: ${response.status} ${response.statusText}`
    );
  }
  const schema = (await response.json()) as Record<string, unknown>;
  console.log("Schema downloaded successfully");
  return schema;
};

export const findInvalidSchema = async () => {
  const jsonSchema = await fetchSchema();

  const mode = await select({
    message: "Select the validation mode",
    choices: [
      {
        name: "Check database blobs",
        description: "Validate all live resources in the database.",
        value: "db" as const,
      },
      {
        name: "Check local directory",
        description: "Validate JSON files in a local directory.",
        value: "local" as const,
      },
    ],
  });

  switch (mode) {
    case "db":
      await checkDBBlobs(jsonSchema);
      break;
    case "local": {
      const localDirectory = await input({
        message: "Enter the path to the local directory to validate",
      });
      checkLocalDirectory(localDirectory, jsonSchema);
      break;
    }
  }
};
